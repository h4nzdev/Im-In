import { create } from 'zustand';
import { db } from '../lib/db';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),

  login: (email, password) => {
    const user = db.getUserByEmail(email);
    if (!user || user.password !== password) throw new Error('Invalid email or password');
    if (user.status === 'Pending') throw new Error('Your account is pending Admin verification');
    if (user.status !== 'Active') throw new Error('Account is not active');
    // eslint-disable-next-line no-unused-vars
    const { password: _p1, ...pub } = user;
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
      role: 'User', status: 'Pending', createdAt: new Date().toISOString()
    };
    db.createUser(user);
    return user;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));
