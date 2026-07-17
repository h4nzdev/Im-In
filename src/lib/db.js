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

export async function initSupabaseSync() {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
    if (!pErr && profiles && profiles.length > 0) {
      const currentUsers = get('users') || [];
      const onlineUsersMap = JSON.parse(localStorage.getItem('realynk_live_online_users')) || {};
      const users = profiles.map(p => {
        const exist = currentUsers.find(u => u.userId === p.user_id);
        const isOnline = Boolean(p.is_active !== undefined ? p.is_active : (exist?.isActive || onlineUsersMap[p.user_id]));
        return {
          userId: p.user_id,
          name: p.name,
          email: p.email,
          password: p.password || 'user123',
          department: p.department,
          assignedAccount: p.assigned_account,
          role: p.role,
          status: p.status,
          positionId: p.position_id,
          deadlineDate: p.deadline_date || null,
          deadlineTitle: p.deadline_title || null,
          managedTeam: p.managed_team || exist?.managedTeam || [],
          isActive: isOnline,
          createdAt: p.created_at || new Date().toISOString()
        };
      });
      save('users', users);
    } else if (!pErr && profiles && profiles.length === 0) {
      // Seed default admin into Supabase if empty
      const adminAcc = {
        user_id: 'ADM-001', name: 'Executive Admin', email: 'admin@realynk.com', password: 'admin123',
        department: 'Management', role: 'Admin', status: 'Active', position_id: 'POS-001'
      };
      await supabase.from('profiles').insert([adminAcc]);
    }

    const { data: pos } = await supabase.from('positions').select('*');
    if (pos && pos.length > 0) {
      save('positions', pos.map(p => ({ positionId: p.position_id, positionName: p.position_name, department: p.department })));
    } else if (pos && pos.length === 0) {
      const defaultPos = [
        { position_id: 'POS-001', position_name: 'Executive Administrator', department: 'Management' },
        { position_id: 'POS-002', position_name: 'Service Delivery Specialist', department: 'Service Delivery' },
        { position_id: 'POS-003', position_name: 'Shared Services Analyst', department: 'Shared Services' }
      ];
      await supabase.from('positions').insert(defaultPos);
    }

    const { data: logs } = await supabase.from('attendance_logs').select('*');
    if (logs) {
      if (logs.length > 0 && logs[0]) {
        knownLogColumns = new Set(Object.keys(logs[0]));
      }
      save('logs', logs.map(l => ({
        logId: l.log_id, userId: l.user_id, type: l.type, timestamp: l.timestamp,
        latitude: l.latitude, longitude: l.longitude, address: l.address, deviceInfo: l.device_info,
        status: l.status, lateMinutes: l.late_minutes
      })));
    }

    const { data: leaves } = await supabase.from('leaves').select('*');
    if (leaves) {
      save('leaves', leaves.map(l => ({
        leaveId: l.leave_id, userId: l.user_id, leaveType: l.leave_type,
        startDate: l.start_date, endDate: l.end_date, reason: l.reason, status: l.status
      })));
    }
  } catch (err) {
    console.error('Supabase sync error:', err);
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
    const newUser = { ...user, managedTeam: user.managedTeam || [] };
    const u = get('users'); u.push(newUser); save('users', u);
    if (isSupabaseConfigured && supabase) {
      supabase.from('profiles').insert([{
        user_id: newUser.userId, name: newUser.name, email: newUser.email, password: newUser.password,
        department: newUser.department || 'General', assigned_account: newUser.assignedAccount || null,
        role: newUser.role || 'Associate', status: newUser.status || 'Pending', position_id: newUser.positionId,
        managed_team: []
      }]).then(({ error }) => error && console.error('Supabase profile sync error:', error));
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
      supabase.from('profiles').update({ managed_team: teamIds }).eq('user_id', leadId).then();
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
};
