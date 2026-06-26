import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Check, X, Briefcase, Calendar } from 'lucide-react';
import { db } from '../lib/db';

const badge = (status) => {
  const map = { Pending: ['#b45309','rgba(245,158,11,0.15)'], Approved: ['#1d4ed8','rgba(29,78,216,0.12)'], Rejected: ['#dc2626','rgba(239,68,68,0.12)'] };
  const [color, bg] = map[status] || ['#64748b','rgba(100,116,139,0.15)'];
  return <span style={{ color, background: bg, border: `1px solid ${color}40`, borderRadius: 20, padding: '3px 12px', fontSize: '0.75rem', fontWeight: 600 }}>{status}</span>;
};

export default function AdminLeaves() {
  const [leaves, setLeaves] = useState(() => db.getLeaves());
  const [users] = useState(() => db.getUsers());
  const containerRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current.querySelectorAll('.card'), {
        y: 24, opacity: 0, duration: 0.55, stagger: 0.1, ease: 'power3.out',
      });
    });
    return () => ctx.revert();
  }, []);

  const updateStatus = (id, status) => {
    setLeaves(db.updateLeaveStatus(id, status));
  };

  const getUserName = (uid) => users.find(u => u.userId === uid)?.name || uid;
  const pending = leaves.filter(l => l.status === 'Pending');
  const processed = leaves.filter(l => l.status !== 'Pending');

  return (
    <div ref={containerRef}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Leave Management</h1>

      {/* Pending Table Card */}
      <div className="card glass" style={{ padding: 0, borderRadius: 24, overflow: 'hidden', marginBottom: 28 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(15,23,42,0.08)', background: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ color: '#0f172a', fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>
            Pending Leave Requests
          </p>
          <span style={{ background: 'rgba(245,158,11,0.18)', color: '#b45309', borderRadius: 20, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>
            {pending.length} Action Required
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 680, whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.04)', borderBottom: '1px solid rgba(15,23,42,0.08)' }}>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Employee</th>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Leave Type</th>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Duration</th>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Reason</th>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Executive Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px 20px', color: '#94a3b8', fontSize: '0.88rem' }}>All caught up — no pending requests.</td>
                </tr>
              ) : (
                pending.map((l, idx) => (
                  <tr key={l.leaveId} style={{ borderBottom: idx === pending.length - 1 ? 'none' : '1px solid rgba(15,23,42,0.06)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 700, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>
                          {getUserName(l.userId)[0]}
                        </div>
                        {getUserName(l.userId)}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: '#1d4ed8' }}>{l.leaveType}</td>
                    <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '0.85rem' }}>{l.startDate} → {l.endDate}</td>
                    <td style={{ padding: '16px 20px', color: '#475569', fontSize: '0.85rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.reason || '—'}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button onClick={() => updateStatus(l.leaveId, 'Approved')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: 'rgba(29,78,216,0.12)', border: '1px solid rgba(29,78,216,0.3)', borderRadius: 8, color: '#1d4ed8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                          <Check size={13} /> Approve
                        </button>
                        <button onClick={() => updateStatus(l.leaveId, 'Rejected')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                          <X size={13} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Processed Table Card */}
      <div className="card glass" style={{ padding: 0, borderRadius: 24, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(15,23,42,0.08)', background: 'rgba(255,255,255,0.4)' }}>
          <p style={{ color: '#0f172a', fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>Processed Requests Archive</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 680, whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.04)', borderBottom: '1px solid rgba(15,23,42,0.08)' }}>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Employee</th>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Leave Type</th>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Duration</th>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Reason</th>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Final Status</th>
              </tr>
            </thead>
            <tbody>
              {processed.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px 20px', color: '#94a3b8', fontSize: '0.88rem' }}>No processed leaves found.</td>
                </tr>
              ) : (
                processed.map((l, idx) => (
                  <tr key={l.leaveId} style={{ borderBottom: idx === processed.length - 1 ? 'none' : '1px solid rgba(15,23,42,0.06)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 700, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>
                          {getUserName(l.userId)[0]}
                        </div>
                        {getUserName(l.userId)}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: '#334155' }}>{l.leaveType}</td>
                    <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '0.85rem' }}>{l.startDate} → {l.endDate}</td>
                    <td style={{ padding: '16px 20px', color: '#475569', fontSize: '0.85rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.reason || '—'}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>{badge(l.status)}</td>
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
