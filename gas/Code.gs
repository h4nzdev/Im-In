/**
 * Im'In — Time-In/Time-Out ERP
 * Google Apps Script Web App backend (acts as REST-ish API over Google Sheets).
 *
 * DEPLOYMENT
 * 1. Create a Google Sheet with 4 tabs (exact names, case-sensitive):
 *      Users     -> User ID | Name | Email | Position ID | Role | Status | Created At | Password Hash
 *      Positions -> Position ID | Position Name | Department
 *      Logs      -> Log ID | User ID | Type | Timestamp | Latitude | Longitude | Device Info
 *      Leaves    -> Leave ID | User ID | Leave Type | Start Date | End Date | Reason | Status
 *    (Row 1 of each tab must contain exactly those headers.)
 *
 *    NOTE: "Password Hash" is an addition on top of the spec's Users schema —
 *    authentication requires somewhere to store credentials, so this column
 *    stores "<salt>:<sha256 hex>", never the plaintext password.
 *
 * 2. Extensions > Apps Script. Paste this file in as Code.gs.
 * 3. Set SPREADSHEET_ID below to this sheet's ID (from its URL).
 * 4. Deploy > New deployment > Web app.
 *      Execute as: Me
 *      Who has access: Anyone
 * 5. Copy the /exec URL into the frontend's VITE_GAS_API_URL env var.
 * 6. Sign up once via the app, then manually edit that row's "Role" cell to
 *    "Admin" in the sheet — there is no UI to mint the very first admin.
 *
 * CORS NOTE
 * Apps Script web apps cannot answer custom CORS preflight (OPTIONS) requests.
 * To avoid the browser ever sending a preflight, the frontend must only send
 * "simple" cross-origin requests: GET with query params, or POST with
 * Content-Type "text/plain" (NOT application/json) and no custom headers.
 * This script reads the JSON action payload out of e.postData.contents
 * regardless of the declared content type.
 */

var SPREADSHEET_ID = 'PUT_YOUR_SPREADSHEET_ID_HERE';

var SHEETS = {
  USERS: 'Users',
  POSITIONS: 'Positions',
  LOGS: 'Logs',
  LEAVES: 'Leaves',
};

var SESSION_TTL_SECONDS = 6 * 60 * 60; // 6 hours

// ---------------------------------------------------------------------------
// ENTRY POINTS
// ---------------------------------------------------------------------------

function doGet(e) {
  return withErrorHandling(function () {
    var action = e.parameter.action;
    switch (action) {
      case 'getPositions':
        return ok({ positions: listPositions() });
      case 'getMe':
        return ok({ user: publicUser(requireAuth(e.parameter.token)) });
      case 'getLogs':
        return handleGetLogs(e);
      case 'getLeaves':
        return handleGetLeaves(e);
      case 'getUsers':
        requireAdmin(e.parameter.token);
        return ok({ users: listUsers().map(publicUser) });
      case 'getOverview':
        requireAdmin(e.parameter.token);
        return ok({ overview: buildOverview() });
      default:
        return fail('Unknown action: ' + action);
    }
  });
}

function doPost(e) {
  return withErrorHandling(function () {
    var body = parseBody(e);
    var action = body.action;
    switch (action) {
      case 'signup':
        return handleSignup(body);
      case 'login':
        return handleLogin(body);
      case 'logout':
        return handleLogout(body);
      case 'clockPunch':
        return handleClockPunch(body);
      case 'addPosition':
        return handleAddPosition(body);
      case 'updatePosition':
        return handleUpdatePosition(body);
      case 'deletePosition':
        return handleDeletePosition(body);
      case 'requestLeave':
        return handleRequestLeave(body);
      case 'updateLeaveStatus':
        return handleUpdateLeaveStatus(body);
      default:
        return fail('Unknown action: ' + action);
    }
  });
}

function withErrorHandling(fn) {
  try {
    return fn();
  } catch (err) {
    return fail(err && err.message ? err.message : String(err));
  }
}

function parseBody(e) {
  if (!e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    throw new Error('Malformed JSON body');
  }
}

// ---------------------------------------------------------------------------
// RESPONSE HELPERS
// ---------------------------------------------------------------------------

function ok(data) {
  var payload = Object.assign({ success: true }, data);
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function fail(message) {
  return ContentService.createTextOutput(
    JSON.stringify({ success: false, message: message })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------------------
// SHEET HELPERS
// ---------------------------------------------------------------------------

function getSheet(name) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Sheet not found: ' + name);
  return sheet;
}

function sheetToObjects(sheet) {
  var range = sheet.getDataRange().getValues();
  var headers = range[0];
  var rows = [];
  for (var i = 1; i < range.length; i++) {
    var row = range[i];
    if (row.join('') === '') continue; // skip fully blank rows
    var obj = { _row: i + 1 };
    for (var c = 0; c < headers.length; c++) {
      obj[headers[c]] = row[c];
    }
    rows.push(obj);
  }
  return rows;
}

function appendRow(sheet, obj) {
  var headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0];
  var row = headers.map(function (h) {
    return obj.hasOwnProperty(h) ? obj[h] : '';
  });
  sheet.appendRow(row);
}

function updateRowByColumns(sheet, rowIndex, updates) {
  var headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0];
  Object.keys(updates).forEach(function (key) {
    var col = headers.indexOf(key);
    if (col !== -1) sheet.getRange(rowIndex, col + 1).setValue(updates[key]);
  });
}

function deleteRow(sheet, rowIndex) {
  sheet.deleteRow(rowIndex);
}

function withLock(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function generateId(prefix) {
  return prefix + '-' + Utilities.getUuid().split('-')[0];
}

// ---------------------------------------------------------------------------
// AUTH HELPERS
// ---------------------------------------------------------------------------

function hashPassword(password, salt) {
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password + salt,
    Utilities.Charset.UTF_8
  );
  return digest
    .map(function (b) {
      var v = (b < 0 ? b + 256 : b).toString(16);
      return v.length === 1 ? '0' + v : v;
    })
    .join('');
}

function makePasswordHash(password) {
  var salt = Utilities.getUuid();
  return salt + ':' + hashPassword(password, salt);
}

function verifyPassword(password, stored) {
  if (!stored || stored.indexOf(':') === -1) return false;
  var parts = stored.split(':');
  var salt = parts[0];
  var hash = parts[1];
  return hashPassword(password, salt) === hash;
}

function createSession(user) {
  var token = Utilities.getUuid();
  CacheService.getScriptCache().put(
    'session_' + token,
    JSON.stringify({ userId: user['User ID'], role: user['Role'] }),
    SESSION_TTL_SECONDS
  );
  return token;
}

function destroySession(token) {
  CacheService.getScriptCache().remove('session_' + token);
}

function requireAuth(token) {
  if (!token) throw new Error('Unauthorized: missing token');
  var raw = CacheService.getScriptCache().get('session_' + token);
  if (!raw) throw new Error('Unauthorized: session expired, please log in again');
  var session = JSON.parse(raw);
  var user = findUserById(session.userId);
  if (!user) throw new Error('Unauthorized: user not found');
  return user;
}

function requireAdmin(token) {
  var user = requireAuth(token);
  if (user['Role'] !== 'Admin') throw new Error('Forbidden: admin access required');
  return user;
}

function publicUser(user) {
  if (!user) return null;
  return {
    userId: user['User ID'],
    name: user['Name'],
    email: user['Email'],
    positionId: user['Position ID'],
    role: user['Role'],
    status: user['Status'],
    createdAt: user['Created At'],
  };
}

// ---------------------------------------------------------------------------
// USERS
// ---------------------------------------------------------------------------

function listUsers() {
  return sheetToObjects(getSheet(SHEETS.USERS));
}

function findUserById(userId) {
  return listUsers().filter(function (u) {
    return u['User ID'] === userId;
  })[0];
}

function findUserByEmail(email) {
  return listUsers().filter(function (u) {
    return String(u['Email']).toLowerCase() === String(email).toLowerCase();
  })[0];
}

function handleSignup(body) {
  var name = (body.name || '').trim();
  var email = (body.email || '').trim();
  var password = body.password || '';
  var positionId = body.positionId || '';

  if (!name || !email || !password || !positionId) {
    throw new Error('name, email, password and positionId are required');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  return withLock(function () {
    if (findUserByEmail(email)) {
      throw new Error('An account with this email already exists');
    }
    var sheet = getSheet(SHEETS.USERS);
    var user = {
      'User ID': generateId('USR'),
      Name: name,
      Email: email,
      'Position ID': positionId,
      Role: 'User',
      Status: 'Active',
      'Created At': new Date().toISOString(),
      'Password Hash': makePasswordHash(password),
    };
    appendRow(sheet, user);
    var token = createSession(user);
    return ok({ token: token, user: publicUser(user) });
  });
}

function handleLogin(body) {
  var email = (body.email || '').trim();
  var password = body.password || '';
  if (!email || !password) throw new Error('email and password are required');

  var user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user['Password Hash'])) {
    throw new Error('Invalid email or password');
  }
  if (user['Status'] !== 'Active') {
    throw new Error('This account is not active. Contact your administrator.');
  }
  var token = createSession(user);
  return ok({ token: token, user: publicUser(user) });
}

function handleLogout(body) {
  if (body.token) destroySession(body.token);
  return ok({});
}

// ---------------------------------------------------------------------------
// POSITIONS
// ---------------------------------------------------------------------------

function listPositions() {
  return sheetToObjects(getSheet(SHEETS.POSITIONS)).map(function (p) {
    return {
      positionId: p['Position ID'],
      positionName: p['Position Name'],
      department: p['Department'],
    };
  });
}

function handleAddPosition(body) {
  requireAdmin(body.token);
  var positionName = (body.positionName || '').trim();
  var department = (body.department || '').trim();
  if (!positionName) throw new Error('positionName is required');

  return withLock(function () {
    var sheet = getSheet(SHEETS.POSITIONS);
    var position = {
      'Position ID': generateId('POS'),
      'Position Name': positionName,
      Department: department,
    };
    appendRow(sheet, position);
    return ok({ positions: listPositions() });
  });
}

function handleUpdatePosition(body) {
  requireAdmin(body.token);
  var positionId = body.positionId;
  if (!positionId) throw new Error('positionId is required');

  return withLock(function () {
    var sheet = getSheet(SHEETS.POSITIONS);
    var rows = sheetToObjects(sheet);
    var target = rows.filter(function (r) {
      return r['Position ID'] === positionId;
    })[0];
    if (!target) throw new Error('Position not found');

    var updates = {};
    if (body.positionName !== undefined) updates['Position Name'] = body.positionName;
    if (body.department !== undefined) updates['Department'] = body.department;
    updateRowByColumns(sheet, target._row, updates);
    return ok({ positions: listPositions() });
  });
}

function handleDeletePosition(body) {
  requireAdmin(body.token);
  var positionId = body.positionId;
  if (!positionId) throw new Error('positionId is required');

  return withLock(function () {
    var sheet = getSheet(SHEETS.POSITIONS);
    var rows = sheetToObjects(sheet);
    var target = rows.filter(function (r) {
      return r['Position ID'] === positionId;
    })[0];
    if (!target) throw new Error('Position not found');
    deleteRow(sheet, target._row);
    return ok({ positions: listPositions() });
  });
}

// ---------------------------------------------------------------------------
// LOGS (TIME CLOCK)
// ---------------------------------------------------------------------------

function listLogs() {
  return sheetToObjects(getSheet(SHEETS.LOGS));
}

function publicLog(log) {
  return {
    logId: log['Log ID'],
    userId: log['User ID'],
    type: log['Type'],
    timestamp: log['Timestamp'],
    latitude: log['Latitude'],
    longitude: log['Longitude'],
    deviceInfo: log['Device Info'],
  };
}

function lastLogForUser(userId, logs) {
  var mine = (logs || listLogs())
    .filter(function (l) {
      return l['User ID'] === userId;
    })
    .sort(function (a, b) {
      return new Date(a['Timestamp']) - new Date(b['Timestamp']);
    });
  return mine.length ? mine[mine.length - 1] : null;
}

function handleGetLogs(e) {
  var user = requireAuth(e.parameter.token);
  var scope = e.parameter.scope === 'all' ? 'all' : 'mine';
  if (scope === 'all' && user['Role'] !== 'Admin') {
    throw new Error('Forbidden: admin access required');
  }
  var logs = listLogs();
  if (scope === 'mine') {
    logs = logs.filter(function (l) {
      return l['User ID'] === user['User ID'];
    });
  }
  return ok({ logs: logs.map(publicLog) });
}

function handleClockPunch(body) {
  var user = requireAuth(body.token);
  var latitude = body.latitude;
  var longitude = body.longitude;
  var deviceInfo = body.deviceInfo || '';

  return withLock(function () {
    var logs = listLogs();
    var last = lastLogForUser(user['User ID'], logs);
    // Server decides IN vs OUT — never trust the client's intent, so a
    // duplicate/retried punch can't double-clock someone in or out.
    var nextType = !last || last['Type'] === 'OUT' ? 'IN' : 'OUT';

    var sheet = getSheet(SHEETS.LOGS);
    var log = {
      'Log ID': generateId('LOG'),
      'User ID': user['User ID'],
      Type: nextType,
      Timestamp: new Date().toISOString(),
      Latitude: latitude,
      Longitude: longitude,
      'Device Info': deviceInfo,
    };
    appendRow(sheet, log);
    return ok({ log: publicLog(log) });
  });
}

// ---------------------------------------------------------------------------
// LEAVES
// ---------------------------------------------------------------------------

function listLeaves() {
  return sheetToObjects(getSheet(SHEETS.LEAVES));
}

function publicLeave(leave) {
  return {
    leaveId: leave['Leave ID'],
    userId: leave['User ID'],
    leaveType: leave['Leave Type'],
    startDate: leave['Start Date'],
    endDate: leave['End Date'],
    reason: leave['Reason'],
    status: leave['Status'],
  };
}

function handleGetLeaves(e) {
  var user = requireAuth(e.parameter.token);
  var scope = e.parameter.scope === 'all' ? 'all' : 'mine';
  if (scope === 'all' && user['Role'] !== 'Admin') {
    throw new Error('Forbidden: admin access required');
  }
  var leaves = listLeaves();
  if (scope === 'mine') {
    leaves = leaves.filter(function (l) {
      return l['User ID'] === user['User ID'];
    });
  }
  return ok({ leaves: leaves.map(publicLeave) });
}

function handleRequestLeave(body) {
  var user = requireAuth(body.token);
  var leaveType = body.leaveType;
  var startDate = body.startDate;
  var endDate = body.endDate;
  var reason = body.reason || '';

  if (!leaveType || !startDate || !endDate) {
    throw new Error('leaveType, startDate and endDate are required');
  }
  if (new Date(endDate) < new Date(startDate)) {
    throw new Error('endDate cannot be before startDate');
  }

  return withLock(function () {
    var sheet = getSheet(SHEETS.LEAVES);
    var leave = {
      'Leave ID': generateId('LV'),
      'User ID': user['User ID'],
      'Leave Type': leaveType,
      'Start Date': startDate,
      'End Date': endDate,
      Reason: reason,
      Status: 'Pending',
    };
    appendRow(sheet, leave);
    return ok({ leave: publicLeave(leave) });
  });
}

function handleUpdateLeaveStatus(body) {
  requireAdmin(body.token);
  var leaveId = body.leaveId;
  var status = body.status;
  if (!leaveId || ['Approved', 'Rejected'].indexOf(status) === -1) {
    throw new Error('leaveId and a valid status (Approved/Rejected) are required');
  }

  return withLock(function () {
    var sheet = getSheet(SHEETS.LEAVES);
    var rows = sheetToObjects(sheet);
    var target = rows.filter(function (r) {
      return r['Leave ID'] === leaveId;
    })[0];
    if (!target) throw new Error('Leave request not found');
    updateRowByColumns(sheet, target._row, { Status: status });
    return ok({ leaves: listLeaves().map(publicLeave) });
  });
}

// ---------------------------------------------------------------------------
// ADMIN OVERVIEW / ANALYTICS
// ---------------------------------------------------------------------------

function pairLogsIntoSessions(userLogs) {
  var sorted = userLogs
    .slice()
    .sort(function (a, b) {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
  var sessions = [];
  var openIn = null;
  sorted.forEach(function (log) {
    if (log.type === 'IN') {
      openIn = log;
    } else if (log.type === 'OUT' && openIn) {
      sessions.push({
        userId: log.userId,
        in: new Date(openIn.timestamp),
        out: new Date(log.timestamp),
      });
      openIn = null;
    }
  });
  return sessions;
}

function buildOverview() {
  var logs = listLogs().map(publicLog);
  var leaves = listLeaves().map(publicLeave);
  var users = listUsers();

  var startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  var clockedInToday = {};
  users.forEach(function (u) {
    var last = lastLogForUser(u['User ID']);
    if (last && last['Type'] === 'IN' && new Date(last['Timestamp']) >= startOfToday) {
      clockedInToday[u['User ID']] = true;
    }
  });

  var pendingLeaves = leaves.filter(function (l) {
    return l.status === 'Pending';
  }).length;

  var startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  var allSessions = pairLogsIntoSessions(logs);
  var weeklyHours = allSessions
    .filter(function (s) {
      return s.in >= startOfWeek;
    })
    .reduce(function (sum, s) {
      return sum + (s.out - s.in) / 3600000;
    }, 0);

  // Attendance trend: clock-IN count per day for the last 7 days.
  var trend = [];
  for (var i = 6; i >= 0; i--) {
    var day = new Date();
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);
    var nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    var count = logs.filter(function (l) {
      var t = new Date(l.timestamp);
      return l.type === 'IN' && t >= day && t < nextDay;
    }).length;
    trend.push({
      date: Utilities.formatDate(day, Session.getScriptTimeZone(), 'MMM dd'),
      clockIns: count,
    });
  }

  return {
    totalEmployees: users.length,
    clockedInToday: Object.keys(clockedInToday).length,
    pendingLeaves: pendingLeaves,
    weeklyHours: Math.round(weeklyHours * 100) / 100,
    attendanceTrend: trend,
  };
}
