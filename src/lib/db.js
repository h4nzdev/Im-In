const KEY = (k) => `imin_${k}`;
const get = (k) => JSON.parse(localStorage.getItem(KEY(k))) || [];
const save = (k, v) => localStorage.setItem(KEY(k), JSON.stringify(v));

function seed() {
  if (localStorage.getItem('imin_seeded')) return;

  const today = new Date();
  const logs = [];
  let n = 1;

  for (let i = 6; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    ['USR-002', 'USR-003'].forEach((uid) => {
      const inH = uid === 'USR-002' ? 8 : 9;
      const inM = uid === 'USR-002' ? 5 : 15;
      const inT = new Date(d); inT.setHours(inH, inM, 0, 0);
      const outT = new Date(d); outT.setHours(inH + 8, inM + 10, 0, 0);

      logs.push({ logId: `LOG-${String(n++).padStart(3,'0')}`, userId: uid, type: 'IN',  timestamp: inT.toISOString(),  latitude: 14.5995, longitude: 120.9842, deviceInfo: 'Demo' });
      logs.push({ logId: `LOG-${String(n++).padStart(3,'0')}`, userId: uid, type: 'OUT', timestamp: outT.toISOString(), latitude: 14.5995, longitude: 120.9842, deviceInfo: 'Demo' });
    });
  }

  save('users', [
    { userId: 'USR-001', name: 'Admin User',  email: 'admin@imin.com', password: 'admin123', positionId: 'POS-001', role: 'Admin', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
    { userId: 'USR-002', name: 'Jane Smith',  email: 'jane@imin.com',  password: 'user123',  positionId: 'POS-002', role: 'User',  status: 'Active', createdAt: '2026-01-15T00:00:00Z' },
    { userId: 'USR-003', name: 'Mark Torres', email: 'mark@imin.com',  password: 'user123',  positionId: 'POS-003', role: 'User',  status: 'Active', createdAt: '2026-02-01T00:00:00Z' },
  ]);
  save('positions', [
    { positionId: 'POS-001', positionName: 'Administrator',     department: 'Management'  },
    { positionId: 'POS-002', positionName: 'Full-Stack Developer', department: 'Engineering' },
    { positionId: 'POS-003', positionName: 'UI/UX Designer',    department: 'Design'      },
    { positionId: 'POS-004', positionName: 'Project Manager',   department: 'Operations'  },
  ]);
  save('logs', logs);
  save('leaves', [
    { leaveId: 'LV-001', userId: 'USR-002', leaveType: 'Sick',     startDate: '2026-06-20', endDate: '2026-06-21', reason: 'Fever and cold',    status: 'Approved' },
    { leaveId: 'LV-002', userId: 'USR-003', leaveType: 'Vacation',  startDate: '2026-06-27', endDate: '2026-06-30', reason: 'Family vacation',    status: 'Pending'  },
    { leaveId: 'LV-003', userId: 'USR-002', leaveType: 'Vacation',  startDate: '2026-07-01', endDate: '2026-07-05', reason: 'Annual leave',       status: 'Pending'  },
  ]);
  localStorage.setItem('imin_seeded', '1');
}

seed();

export const db = {
  // Users
  getUsers:        ()         => {
    let u = get('users');
    if (u.length > 0 && !u.some(x => x.userId === 'USR-004')) {
      u.push({ userId: 'USR-004', name: 'Alex Rivera', email: 'alex@imin.com', password: 'user123', positionId: 'POS-002', role: 'User', status: 'Pending', createdAt: new Date().toISOString() });
      save('users', u);
    }
    return u;
  },
  getUserByEmail:  (email)    => db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()),
  getUserById:     (id)       => db.getUsers().find(u => u.userId === id),
  createUser:      (user)     => { const u = get('users'); u.push(user); save('users', u); return user; },
  updateUserStatus:(id, stat) => { const u = get('users').map(x => x.userId === id ? { ...x, status: stat } : x); save('users', u); return u; },

  // Positions
  getPositions:    ()         => get('positions'),
  addPosition:     (pos)      => { const p = get('positions'); p.push(pos); save('positions', p); return p; },
  updatePosition:  (id, upd)  => { const p = get('positions').map(x => x.positionId === id ? { ...x, ...upd } : x); save('positions', p); return p; },
  deletePosition:  (id)       => { const p = get('positions').filter(x => x.positionId !== id); save('positions', p); return p; },

  // Logs
  getLogs:         ()         => get('logs'),
  getUserLogs:     (uid)      => get('logs').filter(l => l.userId === uid),
  addLog:          (log)      => { const l = get('logs'); l.push(log); save('logs', l); return log; },

  // Leaves
  getLeaves:       ()         => get('leaves'),
  getUserLeaves:   (uid)      => get('leaves').filter(l => l.userId === uid),
  addLeave:        (leave)    => { const l = get('leaves'); l.push(leave); save('leaves', l); return leave; },
  updateLeaveStatus: (id, status) => { const l = get('leaves').map(x => x.leaveId === id ? { ...x, status } : x); save('leaves', l); return l; },
};
