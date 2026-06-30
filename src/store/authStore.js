import { create } from 'zustand';
import { db } from '../lib/db';

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),

  login: (email, password) => {
    const user = db.getUserByEmail(email);
    if (!user || user.password !== password) throw new Error('Invalid email or password');
    if (user.status === 'Pending') throw new Error('Your account is pending Admin verification');
    if (user.status !== 'Active') throw new Error('Account is not active');
    
    // Set user as active in realtime
    db.updateUser(user.userId, { isActive: true });
    const activeUsers = JSON.parse(localStorage.getItem('realynk_live_online_users')) || {};
    activeUsers[user.userId] = { userId: user.userId, name: user.name, department: user.department, loginTime: Date.now() };
    localStorage.setItem('realynk_live_online_users', JSON.stringify(activeUsers));

    // Push realtime notification to admin header
    const notifs = JSON.parse(localStorage.getItem('realynk_admin_notifications')) || [];
    notifs.unshift({ id: `NTF-${Date.now()}`, type: 'LOGIN', title: 'User Online', desc: `${user.name} logged in to portal.`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), unread: true });
    localStorage.setItem('realynk_admin_notifications', JSON.stringify(notifs.slice(0, 30)));

    // eslint-disable-next-line no-unused-vars
    const { password: _p1, ...pub } = { ...user, isActive: true };
    localStorage.setItem('token', `tok_${Date.now()}`);
    localStorage.setItem('user', JSON.stringify(pub));
    set({ token: localStorage.getItem('token'), user: pub });
    return pub;
  },

  signup: ({ employeeId, name, email, password, department, assignedAccount, positionId }) => {
    if (db.getUserByEmail(email)) throw new Error('Email already in use');
    const userId = employeeId || `RLK-${Date.now().toString().slice(-4)}`;
    if (db.getUserById(userId)) throw new Error('Employee ID already exists');
    const user = {
      userId, name, email, password, positionId: positionId || 'POS-002',
      department: department || 'Shared Services', assignedAccount: assignedAccount || null,
      role: 'User', status: 'Pending', isActive: false, createdAt: new Date().toISOString()
    };
    db.createUser(user);

    // Push notification to admin header
    const notifs = JSON.parse(localStorage.getItem('realynk_admin_notifications')) || [];
    notifs.unshift({ id: `NTF-${Date.now()}`, type: 'SIGNUP', title: 'New Registration', desc: `${name} (${userId}) signed up for ${department || 'Enterprise'}.`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), unread: true });
    localStorage.setItem('realynk_admin_notifications', JSON.stringify(notifs.slice(0, 30)));

    return user;
  },

  logout: () => {
    const cur = get().user;
    if (cur) {
      db.updateUser(cur.userId, { isActive: false });
      const activeUsers = JSON.parse(localStorage.getItem('realynk_live_online_users')) || {};
      delete activeUsers[cur.userId];
      localStorage.setItem('realynk_live_online_users', JSON.stringify(activeUsers));

      const notifs = JSON.parse(localStorage.getItem('realynk_admin_notifications')) || [];
      notifs.unshift({ id: `NTF-${Date.now()}`, type: 'LOGOUT', title: 'User Offline', desc: `${cur.name} logged out.`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), unread: true });
      localStorage.setItem('realynk_admin_notifications', JSON.stringify(notifs.slice(0, 30)));
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));
