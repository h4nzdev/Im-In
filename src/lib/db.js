import { supabase, isSupabaseConfigured } from './supabaseClient';

const KEY = (k) => `imin_${k}`;
const get = (k) => JSON.parse(localStorage.getItem(KEY(k))) || [];
const save = (k, v) => localStorage.setItem(KEY(k), JSON.stringify(v));
let knownLogColumns = null;

function cleanInitialSetup() {
  // If Supabase is connected, or if not yet seeded, ensure we have clean positions & default admin
  const u = get('users');
  if (u.length === 0) {
    save('users', [
      { userId: 'ADM-001', name: 'Executive Admin', email: 'admin@realynk.com', password: 'admin123', positionId: 'POS-001', department: 'Management', role: 'Admin', status: 'Active', createdAt: new Date().toISOString() },
      { userId: 'USR-001', name: 'Legacy Admin', email: 'admin@imin.com', password: 'admin123', positionId: 'POS-001', department: 'Management', role: 'Admin', status: 'Active', createdAt: new Date().toISOString() }
    ]);
  }
  const p = get('positions');
  if (p.length === 0) {
    save('positions', [
      { positionId: 'POS-001', positionName: 'Executive Administrator', department: 'Management' },
      { positionId: 'POS-002', positionName: 'Service Delivery Specialist', department: 'Service Delivery' },
      { positionId: 'POS-003', positionName: 'Shared Services Analyst', department: 'Shared Services' },
      { positionId: 'POS-004', positionName: 'Full-Stack Engineer', department: 'Engineering' }
    ]);
  }
  const a = get('assignments');
  if (a.length === 0) {
    save('assignments', [
      { id: 'SOP-001', title: 'Biometric Terminal Audit Protocol v2.4', type: 'SOP Protocol', target: 'Service Delivery', priority: 'High', status: 'Active', description: 'Mandatory daily terminal sanitation and calibration check before start of operations.', createdAt: '2026-06-25' },
      { id: 'SOP-002', title: 'Q3 Shared Services Compliance Roadmap', type: 'Checklist', target: 'Shared Services', priority: 'Medium', status: 'Active', description: 'Complete quarterly internal security review and update asset ledger.', createdAt: '2026-06-26' },
      { id: 'SOP-003', title: 'FinTech Global Account Escalation Procedure', type: 'SOP Protocol', target: 'FinTech Global Support', priority: 'High', status: 'Active', description: 'Severity 1 ticket response guidelines and stakeholder notification matrix.', createdAt: '2026-06-27' },
      { id: 'SOP-004', title: 'Healthcare Billing HIPAA Data Security Guidelines', type: 'Mandatory Training', target: 'Healthcare Billing Operations', priority: 'High', status: 'Active', description: 'Required annual privacy compliance review for billing operations personnel.', createdAt: '2026-06-28' }
    ]);
  }
  const g = get('geofence');
  if (!g) {
    save('geofence', {
      enabled: false,
      lat: 14.5995,
      lng: 120.9842,
      radius: 300,
      addressName: 'Main Headquarters Terminal #1'
    });
  }
}

cleanInitialSetup();

// Sync status: 'idle' | 'loading' | 'done' | 'error'
// Components can import this to show loading/error states
export let syncStatus = isSupabaseConfigured ? 'loading' : 'idle';
export const syncListeners = new Set();
function setSyncStatus(s) {
  syncStatus = s;
  syncListeners.forEach(fn => fn(s));
}

export async function initSupabaseSync() {
  if (!isSupabaseConfigured || !supabase) { setSyncStatus('idle'); return; }
  setSyncStatus('loading');
  let hasError = false;
  try {

    // ── STEP 1: POSITIONS (must be first — profiles.position_id FK depends on it) ──
    const { data: pos, error: posErr } = await supabase.from('positions').select('*');
    if (posErr) {
      console.error('[Sync] positions fetch error:', posErr.message);
    } else if (pos) {
      if (pos.length > 0) {
        save('positions', pos.map(p => ({ positionId: p.position_id, positionName: p.position_name, department: p.department })));
      } else {
        const localPos = get('positions') || [];
        const posRows = localPos.length > 0
          ? localPos.map(p => ({ position_id: p.positionId, position_name: p.positionName, department: p.department }))
          : [
              { position_id: 'POS-001', position_name: 'Executive Administrator', department: 'Management' },
              { position_id: 'POS-002', position_name: 'Service Delivery Specialist', department: 'Service Delivery' },
              { position_id: 'POS-003', position_name: 'Shared Services Analyst', department: 'Shared Services' },
              { position_id: 'POS-004', position_name: 'Full-Stack Engineer', department: 'Engineering' }
            ];
        const { error: posInsErr } = await supabase.from('positions').insert(posRows);
        if (posInsErr) console.error('[Sync] positions insert error:', posInsErr.message);
        else {
          console.log('[Sync] Migrated', posRows.length, 'positions');
          save('positions', posRows.map(p => ({ positionId: p.position_id, positionName: p.position_name, department: p.department })));
        }
      }
    }

    // ── STEP 2: PROFILES (users) ───────────────────────────────────────────────
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
    if (pErr) {
      console.error('[Sync] profiles fetch error:', pErr.message);
      hasError = true;
    } else if (profiles) {
      if (profiles.length > 0) {
        const currentUsers = get('users') || [];
        const onlineUsersMap = JSON.parse(localStorage.getItem('realynk_live_online_users')) || {};
        const users = profiles.map(p => {
          const exist = currentUsers.find(u => u.userId === p.user_id);
          return {
            userId: p.user_id, name: p.name, email: p.email,
            password: p.password || 'user123', department: p.department,
            assignedAccount: p.assigned_account, role: p.role, status: p.status,
            positionId: p.position_id, deadlineDate: p.deadline_date || null,
            deadlineTitle: p.deadline_title || null,
            managedTeam: exist?.managedTeam || [],
            isActive: Boolean(p.is_active ?? exist?.isActive ?? onlineUsersMap[p.user_id]),
            createdAt: p.created_at || new Date().toISOString()
          };
        });
        save('users', users);
      } else {
        // AUTO-MIGRATE: push local users up
        const localUsers = get('users') || [];
        const usersToInsert = localUsers.length > 0 ? localUsers : [{
          userId: 'ADM-001', name: 'Executive Admin', email: 'admin@realynk.com',
          password: 'admin123', department: 'Management', role: 'Admin',
          status: 'Active', positionId: 'POS-001'
        }];
        const userRows = usersToInsert.map(u => ({
          user_id: u.userId, name: u.name, email: u.email,
          password: u.password || 'user123', department: u.department || 'Management',
          assigned_account: u.assignedAccount || null, role: u.role || 'Associate',
          status: u.status || 'Active', position_id: u.positionId || 'POS-001'
        }));
        const { error: usrErr } = await supabase.from('profiles').insert(userRows);
        if (usrErr) { console.error('[Sync] users insert error:', usrErr.message); hasError = true; }
        else console.log('[Sync] Migrated', userRows.length, 'users');
      }
    }

    // ── STEP 2b: INVITE CODES (dedicated table) ───────────────────────────────
    const { data: inviteCodes, error: icErr } = await supabase.from('invite_codes').select('*');
    if (icErr) {
      if (!icErr.message.includes('schema cache')) { console.error('[Sync] invite_codes fetch error:', icErr.message); hasError = true; }
    } else if (inviteCodes) {
      if (inviteCodes.length > 0) {
        // Cloud is source of truth — overwrite local
        save('inviteCodes', inviteCodes.map(r => ({
          code: r.code, status: r.status,
          generatedAt: r.generated_at, usedBy: r.used_by
        })));
      } else {
        // Auto-migrate local invite codes up to the cloud
        const localCodes = get('inviteCodes') || [];
        if (localCodes.length > 0) {
          const codeRows = localCodes.map(c => ({
            code: c.code, status: c.status,
            generated_at: c.generatedAt || new Date().toISOString(),
            used_by: c.usedBy || null
          }));
          const { error: icInsErr } = await supabase.from('invite_codes').insert(codeRows);
          if (icInsErr) { console.error('[Sync] invite_codes insert error:', icInsErr.message); hasError = true; }
          else console.log('[Sync] Migrated', codeRows.length, 'invite codes');
        }
      }
    }

    // ── STEP 3: ATTENDANCE LOGS ──────────────────────────────────────────────
    const { data: logs, error: logsErr } = await supabase.from('attendance_logs').select('*');
    if (logsErr) {
      console.error('[Sync] attendance_logs fetch error:', logsErr.message);
    } else if (logs) {
      if (logs.length > 0) {
        if (logs[0]) knownLogColumns = new Set(Object.keys(logs[0]));
        save('logs', logs.map(l => ({
          logId: l.log_id, userId: l.user_id, type: l.type, timestamp: l.timestamp,
          latitude: l.latitude, longitude: l.longitude, address: l.address,
          deviceInfo: l.device_info, status: l.status, lateMinutes: l.late_minutes
        })));
      } else {
        const localLogs = get('logs') || [];
        if (localLogs.length > 0) {
          const logRows = localLogs.map(l => ({
            log_id: l.logId, user_id: l.userId, type: l.type, timestamp: l.timestamp,
            latitude: l.latitude || null, longitude: l.longitude || null,
            address: l.address || null, device_info: l.deviceInfo || null,
            status: l.status || null, late_minutes: l.lateMinutes || null
          }));
          const { error: logInsErr } = await supabase.from('attendance_logs').insert(logRows);
          if (logInsErr) console.error('[Sync] logs insert error:', logInsErr.message);
          else console.log('[Sync] Migrated', logRows.length, 'attendance logs');
        }
      }
    }

    // ── STEP 4: LEAVES ────────────────────────────────────────────────────────
    const { data: leaves, error: lvErr } = await supabase.from('leaves').select('*');
    if (lvErr) {
      console.error('[Sync] leaves fetch error:', lvErr.message);
    } else if (leaves) {
      if (leaves.length > 0) {
        save('leaves', leaves.map(l => ({
          leaveId: l.leave_id, userId: l.user_id, leaveType: l.leave_type,
          startDate: l.start_date, endDate: l.end_date, reason: l.reason, status: l.status
        })));
      } else {
        const localLeaves = get('leaves') || [];
        if (localLeaves.length > 0) {
          const leaveRows = localLeaves.map(l => ({
            leave_id: l.leaveId, user_id: l.userId, leave_type: l.leaveType,
            start_date: l.startDate, end_date: l.endDate,
            reason: l.reason || null, status: l.status || 'Pending'
          }));
          const { error: lvInsErr } = await supabase.from('leaves').insert(leaveRows);
          if (lvInsErr) console.error('[Sync] leaves insert error:', lvInsErr.message);
          else console.log('[Sync] Migrated', leaveRows.length, 'leaves');
        }
      }
    }

    // ── STEP 5: AGGREGATED HOURS ─────────────────────────────────────────────
    const { data: aggHours, error: aggErr } = await supabase.from('aggregated_hours').select('*');
    if (aggErr) {
      if (!aggErr.message.includes('schema cache')) console.error('[Sync] aggregated_hours fetch error:', aggErr.message);
      // Table may not exist yet — skip silently
    } else if (aggHours) {
      if (aggHours.length > 0) {
        save('aggregated_hours', aggHours.map(a => ({
          id: a.id, userId: a.user_id, date: a.date,
          hours: a.hours, clientId: a.client_id, timestamp: a.timestamp
        })));
      } else {
        const localAgg = get('aggregated_hours') || [];
        if (localAgg.length > 0) {
          const aggRows = localAgg.map(a => ({
            id: a.id, user_id: a.userId, date: a.date,
            hours: a.hours, client_id: a.clientId || null,
            timestamp: a.timestamp || new Date().toISOString()
          }));
          const { error: aggInsErr } = await supabase.from('aggregated_hours').insert(aggRows);
          if (aggInsErr) console.error('[Sync] aggregated_hours insert error:', aggInsErr.message);
          else console.log('[Sync] Migrated', aggRows.length, 'aggregated hour records');
        }
      }
    }

    // ── STEP 6: CLIENTS ──────────────────────────────────────────────────────
    const { data: clients, error: cliErr } = await supabase.from('clients').select('*');
    if (cliErr) {
      if (!cliErr.message.includes('schema cache')) console.error('[Sync] clients fetch error:', cliErr.message);
      // Table may not exist yet — skip silently
    } else if (clients) {
      if (clients.length > 0) {
        save('clients', clients.map(c => ({
          id: c.id, code: c.code, name: c.name,
          description: c.description || '', status: c.status,
          createdAt: c.created_at, updatedAt: c.updated_at
        })));
      } else {
        const localClients = get('clients') || [];
        if (localClients.length > 0) {
          const cliRows = localClients.map(c => ({
            id: c.id, code: c.code, name: c.name,
            description: c.description || null, status: c.status || 'Active',
            created_at: c.createdAt || new Date().toISOString(),
            updated_at: c.updatedAt || null
          }));
          const { error: cliInsErr } = await supabase.from('clients').insert(cliRows);
          if (cliInsErr) console.error('[Sync] clients insert error:', cliInsErr.message);
          else console.log('[Sync] Migrated', cliRows.length, 'clients');
        }
      }
    }

    console.log('[Sync] Supabase sync complete');
    setSyncStatus(hasError ? 'error' : 'done');
  } catch (err) {
    console.error('[Sync] Fatal error:', err);
    setSyncStatus('error');
  }
}

// Trigger initial async background sync
initSupabaseSync();

export const SERVICE_DELIVERY_ACCOUNTS = [
  'FinTech Global Support & Operations',
  'Healthcare Medical Billing & Claims',
  'E-Commerce Customer Care & Dispatch',
  'Enterprise Cloud & IT Solutions Helpdesk',
  'Telecom Technical Helpdesk & Network Ops',
  'Real Estate Virtual Assistant & Lead Gen',
  'Digital Marketing & SEO Content Team',
  'Executive Virtual Staffing & Admin Management',
  'Inbound Sales & Retention Campaign',
  'Logistics & Supply Chain Coordination'
];

export const db = {
  getAccounts: () => {
    const cached = get('accounts');
    if (cached && cached.length > 0) return cached;
    save('accounts', SERVICE_DELIVERY_ACCOUNTS);
    return SERVICE_DELIVERY_ACCOUNTS;
  },
  // Geofence Settings
  getGeofence: () => {
    const saved = get('geofence') || {};
    const lat = Number(saved.lat);
    const lng = Number(saved.lng);
    const radius = Number(saved.radius);
    return {
      enabled: Boolean(saved.enabled),
      lat: !isNaN(lat) && lat !== 0 ? lat : 14.5995,
      lng: !isNaN(lng) && lng !== 0 ? lng : 120.9842,
      radius: !isNaN(radius) && radius > 0 ? radius : 300,
      addressName: saved.addressName || 'Main Headquarters Terminal #1'
    };
  },
  updateGeofence:  (upd)      => {
    const current = db.getGeofence();
    const next = { ...current, ...upd };
    save('geofence', next);
    return next;
  },

  // Users
  getUsers:        ()         => get('users'),
  getUserByEmail:  (email)    => db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()),
  getUserById:     (id)       => db.getUsers().find(u => u.userId === id),
  createUser:      (user)     => {
    const newUser = { ...user, managedTeam: user.managedTeam || [], assignedClientIds: user.assignedClientIds || [] };
    const u = get('users'); u.push(newUser); save('users', u);
    if (isSupabaseConfigured && supabase) {
      supabase.from('profiles').insert([{
        user_id: newUser.userId, name: newUser.name, email: newUser.email, password: newUser.password,
        department: newUser.department || 'General', assigned_account: newUser.assignedAccount || null,
        role: newUser.role || 'Associate', status: newUser.status || 'Pending', position_id: newUser.positionId
      }]).then(({ error }) => error && console.error('[DB] createUser error:', error.message));
    }
    return newUser;
  },
  updateUserStatus:(id, stat) => {
    const u = get('users').map(x => x.userId === id ? { ...x, status: stat } : x); save('users', u);
    if (isSupabaseConfigured && supabase) {
      supabase.from('profiles').update({ status: stat }).eq('user_id', id).then();
    }
    return u;
  },
  updateUserDeadline:(id, deadlineDate, deadlineTitle) => {
    const u = get('users').map(x => x.userId === id ? { ...x, deadlineDate, deadlineTitle } : x); save('users', u);
    if (isSupabaseConfigured && supabase) {
      supabase.from('profiles').update({ deadline_date: deadlineDate, deadline_title: deadlineTitle }).eq('user_id', id).then();
    }
    return u;
  },
  updateUser:(id, updates) => {
    const u = get('users').map(x => x.userId === id ? { ...x, ...updates } : x); save('users', u);
    if (isSupabaseConfigured && supabase) {
      const su = {};
      if (updates.isActive !== undefined) su.is_active = updates.isActive;
      if (updates.status !== undefined) su.status = updates.status;
      if (updates.assignedClientIds !== undefined) su.assigned_client_ids = updates.assignedClientIds;
      if (Object.keys(su).length > 0) supabase.from('profiles').update(su).eq('user_id', id).then();
    }
    return u;
  },

  // Positions
  getPositions:    ()         => get('positions'),
  addPosition:     (pos)      => {
    const p = get('positions'); p.push(pos); save('positions', p);
    if (isSupabaseConfigured && supabase) {
      supabase.from('positions').insert([{ position_id: pos.positionId, position_name: pos.positionName, department: pos.department }]).then();
    }
    return p;
  },
  updatePosition:  (id, upd)  => {
    const p = get('positions').map(x => x.positionId === id ? { ...x, ...upd } : x); save('positions', p);
    if (isSupabaseConfigured && supabase) {
      supabase.from('positions').update({ position_name: upd.positionName, department: upd.department }).eq('position_id', id).then();
    }
    return p;
  },
  deletePosition:  (id)       => {
    const p = get('positions').filter(x => x.positionId !== id); save('positions', p);
    if (isSupabaseConfigured && supabase) {
      supabase.from('positions').delete().eq('position_id', id).then();
    }
    return p;
  },

  // Logs
  getLogs:         ()         => get('logs'),
  getUserLogs:     (uid)      => get('logs').filter(l => l.userId === uid),
  addLog:          (log)      => {
    const l = get('logs'); l.push(log); save('logs', l);
    if (isSupabaseConfigured && supabase) {
      let rowToInsert = {
        log_id: log.logId, user_id: log.userId, type: log.type, timestamp: log.timestamp,
        latitude: log.latitude || 14.5995, longitude: log.longitude || 120.9842
      };
      if (knownLogColumns) {
        if (knownLogColumns.has('address')) rowToInsert.address = log.address || null;
        if (knownLogColumns.has('device_info')) rowToInsert.device_info = log.deviceInfo || null;
        if (knownLogColumns.has('status')) rowToInsert.status = log.status || 'ON TIME';
        if (knownLogColumns.has('late_minutes')) rowToInsert.late_minutes = log.lateMinutes || 0;
        if (knownLogColumns.has('client_id')) rowToInsert.client_id = log.clientId || null;
        if (knownLogColumns.has('campaign_id')) rowToInsert.campaign_id = log.campaignId || null;
        if (knownLogColumns.has('task_name')) rowToInsert.task_name = log.taskName || null;
      } else {
        rowToInsert.address = log.address || null;
      }
      supabase.from('attendance_logs').insert([rowToInsert]).then(({ error }) => {
        if (error) {
          const minimalRow = {
            log_id: log.logId, user_id: log.userId, type: log.type, timestamp: log.timestamp,
            latitude: log.latitude || 14.5995, longitude: log.longitude || 120.9842
          };
          supabase.from('attendance_logs').insert([minimalRow]).then();
        }
      });
    }
    return log;
  },
  clearAllLogs:    ()         => {
    save('logs', []);
    if (isSupabaseConfigured && supabase) {
      supabase.from('attendance_logs').delete().neq('log_id', 'CLEAR_ALL').then();
    }
    return [];
  },
  deleteLog:       (id)       => {
    const updated = get('logs').filter(l => l.logId !== id);
    save('logs', updated);
    if (isSupabaseConfigured && supabase) {
      supabase.from('attendance_logs').delete().eq('log_id', id).then();
    }
    return updated;
  },

  archiveLogs: (logIds) => {
    const l = get('logs').map(x => logIds.includes(x.logId) ? { ...x, isArchived: true } : x);
    save('logs', l);
    if (isSupabaseConfigured && supabase) {
      supabase.from('attendance_logs').update({ is_archived: true }).in('log_id', logIds).then();
    }
    return l;
  },
  deleteArchivedLogs: (logIds) => {
    const l = get('logs').filter(x => !logIds.includes(x.logId));
    save('logs', l);
    if (isSupabaseConfigured && supabase) {
      supabase.from('attendance_logs').delete().in('log_id', logIds).then();
    }
    return l;
  },

  // Aggregated Hours
  getAggregatedHours: (userId) => {
    const agg = get('aggregated_hours') || [];
    return userId ? agg.filter(a => a.userId === userId) : agg;
  },
  addAggregatedHour: (userId, date, hours, clientId = null) => {
    const agg = get('aggregated_hours') || [];
    const newRecord = {
      id: `AGG-${Date.now()}`,
      userId,
      date,
      hours,
      clientId,
      timestamp: new Date().toISOString()
    };
    agg.push(newRecord);
    save('aggregated_hours', agg);
    if (isSupabaseConfigured && supabase) {
      supabase.from('aggregated_hours').insert([{
        id: newRecord.id,
        user_id: userId,
        date: date,
        hours: hours,
        client_id: clientId,
        timestamp: newRecord.timestamp
      }]).then();
    }
    return newRecord;
  },

  // EOD Reports
  getReports: () => get('reports'),
  addReport: (report) => {
    const r = get('reports');
    const newReport = { ...report, reportId: `REP-${Date.now()}`, timestamp: new Date().toISOString() };
    r.push(newReport);
    save('reports', r);
    return newReport;
  },

  // Leaves
  getLeaves:       ()         => get('leaves'),
  getUserLeaves:   (uid)      => get('leaves').filter(l => l.userId === uid),
  addLeave:        (leave)    => {
    const l = get('leaves'); l.push(leave); save('leaves', l);
    if (isSupabaseConfigured && supabase) {
      supabase.from('leaves').insert([{
        leave_id: leave.leaveId, user_id: leave.userId, leave_type: leave.leaveType,
        start_date: leave.startDate, end_date: leave.endDate, reason: leave.reason, status: leave.status
      }]).then();
    }
    return leave;
  },
  updateLeaveStatus: (id, status) => {
    const l = get('leaves').map(x => x.leaveId === id ? { ...x, status } : x); save('leaves', l);
    if (isSupabaseConfigured && supabase) {
      supabase.from('leaves').update({ status }).eq('leave_id', id).then();
    }
    return l;
  },

  // Assignments / SOPs
  getAssignments:    ()         => get('assignments'),
  addAssignment:     (item)     => { const a = get('assignments'); a.push(item); save('assignments', a); return item; },
  updateAssignment:  (id, upd)  => { const a = get('assignments').map(x => x.id === id ? { ...x, ...upd } : x); save('assignments', a); return a; },
  deleteAssignment:  (id)       => { const a = get('assignments').filter(x => x.id !== id); save('assignments', a); return a; },

  // Success Lead — Team Management
  // Returns all users managed by a given Success Lead
  getTeamMembers: (leadId) => {
    const lead = db.getUserById(leadId);
    if (!lead || !lead.managedTeam || lead.managedTeam.length === 0) return [];
    return db.getUsers().filter(u => lead.managedTeam.includes(u.userId));
  },

  // Returns all Success Leads that manage a given userId (a VA can be in multiple teams)
  getLeadsForUser: (userId) => {
    return db.getUsers().filter(u => u.role === 'Success Lead' && Array.isArray(u.managedTeam) && u.managedTeam.includes(userId));
  },

  // Update the full managed team list for a Success Lead
  updateManagedTeam: (leadId, teamIds) => {
    const u = get('users').map(x => x.userId === leadId ? { ...x, managedTeam: teamIds } : x);
    save('users', u);
    if (isSupabaseConfigured && supabase) {
      // managed_team not in DB schema — stored locally only
    }
    return u;
  },

  // Promote or demote a user's role (Admin-only action)
  updateUserRole: (id, role) => {
    const u = get('users').map(x => x.userId === id ? { ...x, role, managedTeam: x.managedTeam || [] } : x);
    save('users', u);
    if (isSupabaseConfigured && supabase) {
      supabase.from('profiles').update({ role }).eq('user_id', id).then();
    }
    return u;
  },

  // All users with role = 'Success Lead'
  getSuccessLeads: () => db.getUsers().filter(u => u.role === 'Success Lead'),

  // All non-admin, non-lead users (candidates to be assigned to a team)
  getAssociates: () => db.getUsers().filter(u => u.role !== 'Admin'),

  // Invite Codes (Admin generated QR codes for signup)
  getInviteCodes: () => get('inviteCodes'),
  addInviteCode: (codeRecord) => {
    // codeRecord: { code: string, status: 'Active' | 'Used', generatedAt: string, usedBy: string | null }
    const list = get('inviteCodes');
    list.push(codeRecord);
    save('inviteCodes', list);
    if (isSupabaseConfigured && supabase) {
      supabase.from('invite_codes').insert([{
        code: codeRecord.code,
        status: codeRecord.status,
        generated_at: codeRecord.generatedAt || new Date().toISOString(),
        used_by: codeRecord.usedBy || null
      }]).then(({ error }) => {
        if (error) console.error('[DB] addInviteCode error:', error.message);
        else console.log('[DB] Invite code saved to Supabase:', codeRecord.code);
      });
    }
    return list;
  },
  markInviteCodeUsed: (code, assignedUserId) => {
    const list = get('inviteCodes').map(r => r.code === code ? { ...r, status: 'Used', usedBy: assignedUserId } : r);
    save('inviteCodes', list);
    if (isSupabaseConfigured && supabase) {
      supabase.from('invite_codes').update({ status: 'Used', used_by: assignedUserId }).eq('code', code)
        .then(({ error }) => { if (error) console.error('[DB] markInviteCodeUsed error:', error.message); });
    }
    return list;
  },
  deleteInviteCode: (code) => {
    const list = get('inviteCodes').filter(r => r.code !== code);
    save('inviteCodes', list);
    if (isSupabaseConfigured && supabase) {
      supabase.from('invite_codes').delete().eq('code', code)
        .then(({ error }) => { if (error) console.error('[DB] deleteInviteCode error:', error.message); });
    }
    return list;
  },


  // Client Management (ERP Module)
  getClients: () => get('clients'),
  getClientById: (id) => db.getClients().find(c => c.id === id),
  addClient: (client) => {
    const newClient = { ...client, createdAt: new Date().toISOString() };
    const c = get('clients'); c.push(newClient); save('clients', c);
    if (isSupabaseConfigured && supabase) {
      supabase.from('clients').insert([{
        id: newClient.id, code: newClient.code, name: newClient.name,
        description: newClient.description || null, status: newClient.status || 'Active',
        created_at: newClient.createdAt
      }]).then(({ error }) => { if (error) console.error('[DB] addClient error:', error.message); });
    }
    return newClient;
  },
  updateClient: (id, updates) => {
    const c = get('clients').map(x => x.id === id ? { ...x, ...updates, updatedAt: new Date().toISOString() } : x); save('clients', c);
    if (isSupabaseConfigured && supabase) {
      supabase.from('clients').update({
        name: updates.name, code: updates.code,
        description: updates.description || null, status: updates.status,
        updated_at: new Date().toISOString()
      }).eq('id', id).then(({ error }) => { if (error) console.error('[DB] updateClient error:', error.message); });
    }
    return c;
  },
  deleteClient: (id) => {
    const c = get('clients').filter(x => x.id !== id); save('clients', c);
    if (isSupabaseConfigured && supabase) {
      supabase.from('clients').delete().eq('id', id).then();
    }
    return c;
  }
};

