import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { Users, Search, Filter, Eye, Shield, User, Mail, Briefcase, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { db } from '../lib/db';

const statusBadge = (status) => {
  const map = {
    Active: ['#10b981', 'rgba(16,185,129,0.12)', 'Active'],
    Pending: ['#f59e0b', 'rgba(245,158,11,0.15)', 'Pending Sync'],
    Inactive: ['#64748b', 'rgba(100,116,139,0.15)', 'Deactivated']
  };
  const [color, bg, label] = map[status] || ['#2563eb', 'rgba(37,99,235,0.12)', status];
  return (
    <span style={{ color, background: bg, border: `1px solid ${color}40`, borderRadius: 20, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      {label}
    </span>
  );
};

export default function AdminEmployees() {
  const navigate = useNavigate();
  const [users] = useState(() => db.getUsers());
  const [positions] = useState(() => db.getPositions());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const containerRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current.querySelectorAll('.card'), {
        y: 24, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out',
      });
    });
    return () => ctx.revert();
  }, []);

  const getPositionInfo = (posId) => {
    const p = positions.find(x => x.positionId === posId);
    return p ? `${p.positionName} (${p.department})` : 'General Staff';
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                          u.email.toLowerCase().includes(search.toLowerCase()) ||
                          u.userId.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || u.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [users, search, statusFilter]);

  const displayedUsers = filteredUsers.slice(0, rowsPerPage);

  const stats = useMemo(() => {
    return [
      { label: 'Total Workforce', value: users.length, color: '#0f172a' },
      { label: 'Active Staff', value: users.filter(u => u.status === 'Active').length, color: '#10b981' },
      { label: 'Pending Approvals', value: users.filter(u => u.status === 'Pending').length, color: '#f59e0b' },
      { label: 'Admin Controllers', value: users.filter(u => u.role === 'Admin').length, color: '#2563eb' }
    ];
  }, [users]);

  return (
    <div ref={containerRef}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            Workforce Directory
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0', fontWeight: 500 }}>
            Manage enterprise personnel records, system roles, and identity profiles
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="card stats-grid" style={{ gap: 10, marginBottom: 16 }}>
        {stats.map((st, i) => (
          <div key={i} className="stat-card" style={{ padding: '14px 16px', borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{st.label}</span>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: st.color }}>{st.value}</span>
          </div>
        ))}
      </div>

      {/* Controls Bar */}
      <div className="card glass controls-bar" style={{ padding: '14px 16px', borderRadius: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employee name, email, or badge ID..."
              style={{ width: '100%', padding: '10px 14px 10px 42px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['All', 'Active', 'Pending', 'Inactive'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '6px 14px', borderRadius: 10, border: 'none',
                    background: statusFilter === st ? '#2563eb' : '#f1f5f9',
                    color: statusFilter === st ? 'white' : '#475569',
                    fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>
              <span>Show:</span>
              <select
                value={rowsPerPage}
                onChange={e => setRowsPerPage(Number(e.target.value))}
                style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 800, color: '#0f172a', outline: 'none' }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Employees Table Card */}
      <div className="card glass table-card" style={{ padding: 0, borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(15,23,42,0.08)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(15,23,42,0.08)', background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="#2563eb" /> Personnel Records
          </p>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b' }}>
            Showing {displayedUsers.length} of {filteredUsers.length}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 700, whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.03)', borderBottom: '1px solid rgba(15,23,42,0.08)' }}>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Employee Profile</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Designation</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Contact Credentials</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Access Level</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>
                    No employee records match your search query.
                  </td>
                </tr>
              ) : (
                displayedUsers.map((u, idx) => (
                  <tr key={u.userId} style={{ borderBottom: idx === displayedUsers.length - 1 ? 'none' : '1px solid rgba(15,23,42,0.06)', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(241,245,249,0.5)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.role === 'Admin' ? '#1e40af' : '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.88rem', flexShrink: 0, boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>
                          {u.name[0]}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>{u.name}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>ID: {u.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#334155', fontSize: '0.86rem' }}>
                      {getPositionInfo(u.positionId)}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#475569', fontSize: '0.86rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Mail size={14} color="#64748b" /> {u.email}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 8, background: u.role === 'Admin' ? '#eff6ff' : '#f1f5f9', color: u.role === 'Admin' ? '#1d4ed8' : '#475569', fontWeight: 800, fontSize: '0.74rem', border: `1px solid ${u.role === 'Admin' ? '#bfdbfe' : '#e2e8f0'}` }}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {statusBadge(u.status || 'Active')}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => navigate(`/profile?userId=${u.userId}`)}
                        style={{
                          padding: '8px 16px', borderRadius: 10, background: '#2563eb', color: 'white',
                          border: 'none', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          boxShadow: '0 4px 12px rgba(37,99,235,0.3)', transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <Eye size={15} /> View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
