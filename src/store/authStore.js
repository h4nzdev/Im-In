import { create } from 'zustand';
import { db } from '../lib/db';
import { realtimeBus } from '../lib/realtime';

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),

  login: (email, password) => {
    const user = db.getUserByEmail(email);
    if (!user || user.password !== password) throw new Error('Invalid email or password');
    if (user.status === 'Pending') throw new Error('Your account is pending Admin verification');
    if (user.status !== 'Active') throw new Error('Account is not active');
    
    db.updateUser(user.userId, { isActive: true });

    realtimeBus.broadcast({
      id: `NTF-${Date.now()}`,
      type: 'LOGIN',
      title: 'User Online',
      desc: `${user.name} logged in to portal.`,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      unread: true,
      userId: user.userId,
      userName: user.name,
      department: user.department,
      isActive: true
    });

    // eslint-disable-next-line no-unused-vars
    const { password: _p1, ...pub } = { ...user, isActive: true };
    localStorage.setItem('token', `tok_${Date.now()}`);
    localStorage.setItem('user', JSON.stringify(pub));
    set({ token: localStorage.getItem('token'), user: pub });
    return pub;
  },

  signup: ({ employeeId, name, email, password, department, assignedAccount, positionId, status }) => {
    if (db.getUserByEmail(email)) throw new Error('Email already in use');
    const userId = employeeId || `RLK-${Date.now().toString().slice(-4)}`;
    if (db.getUserById(userId)) throw new Error('Employee ID already exists');
    const user = {
      userId, name, email, password, positionId: positionId || 'POS-002',
      department: department || 'Shared Services', assignedAccount: assignedAccount || null,
      role: 'User', status: status || 'Pending', isActive: false, createdAt: new Date().toISOString()
    };
    db.createUser(user);

    realtimeBus.broadcast({
      id: `NTF-${Date.now()}`,
      type: 'SIGNUP',
      title: 'New Registration',
      desc: `${name} (${userId}) signed up for ${department || 'Enterprise'}.`,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      unread: true,
      userId,
      userName: name,
      department
    });

    return user;
  },

  updateProfile: (updates) => {
    const cur = get().user;
    if (!cur) return;
    const updated = { ...cur, ...updates };
    db.updateUser(cur.userId, updates);
    localStorage.setItem('user', JSON.stringify(updated));
    if (updates.pin !== undefined) {
      localStorage.setItem(`realynk_user_pin_${cur.userId}`, updates.pin);
    }
    set({ user: updated });
    return updated;
  },

  logout: () => {
    const cur = get().user;
    if (cur) {
      db.updateUser(cur.userId, { isActive: false });
      realtimeBus.broadcast({
        id: `NTF-${Date.now()}`,
        type: 'LOGOUT',
        title: 'User Offline',
        desc: `${cur.name} logged out.`,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        unread: true,
        userId: cur.userId,
        userName: cur.name,
        isActive: false
      });
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));
