import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Check, X } from 'lucide-react';
import { db } from '../lib/db';

const badge = (status) => {
  const map = { Pending: ['#b45309','rgba(245,158,11,0.15)'], Approved: ['#047857','rgba(4,120,87,0.12)'], Rejected: ['#dc2626','rgba(239,68,68,0.12)'] };
  const [color, bg] = map[status] || ['#64748b','rgba(100,116,139,0.15)'];
  return <span style={{ color, background: bg, border: `1px solid ${color}40`, borderRadius: 20, padding: '3px 12px', fontSize: '0.75rem', fontWeight: 600 }}>{status}</span>;
};

function LeaveRow({ l, showActions, getUserName, onUpdate }) {
  return (
    <div style={{ padding: '16px 20px', background: 'rgba(15,23,42,0.035)', border: '1px solid rgba(15,23,42,0.07)', borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#065f46)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {getUserName(l.userId)[0]}
            </div>
            <span style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.9rem' }}>{getUserName(l.userId)}</span>
            <span style={{ color: 'rgba(100,116,139,0.55)', fontSize: '0.8rem' }}>•</span>
            <span style={{ color: '#047857', fontSize: '0.82rem' }}>{l.leaveType}</span>
          </div>
          <p style={{ color: 'rgba(100,116,139,0.7)', fontSize: '0.8rem', marginLeft: 38 }}>{l.startDate} → {l.endDate}</p>
          {l.reason && <p style={{ color: 'rgba(100,116,139,0.6)', fontSize: '0.78rem', marginLeft: 38, marginTop: 4, fontStyle: 'italic' }}>"{l.reason}"</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16, flexShrink: 0 }}>
          {showActions ? (
            <>
              <button onClick={() => onUpdate(l.leaveId, 'Approved')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: 'rgba(4,120,87,0.12)', border: '1px solid rgba(4,120,87,0.3)', borderRadius: 8, color: '#047857', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                <Check size={13} /> Approve
              </button>
              <button onClick={() => onUpdate(l.leaveId, 'Rejected')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                <X size={13} /> Reject
              </button>
            </>
          ) : badge(l.status)}
        </div>
      </div>
    </div>
  );
}

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

  const cardStyle = { background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 20, padding: 28, marginBottom: 20, boxShadow: '0 4px 24px rgba(15,23,42,0.05)' };

  return (
    <div ref={containerRef}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Leave Management</h1>

      <div className="card" style={cardStyle}>
        <p style={{ color: '#334155', fontWeight: 600, fontSize: '1rem', marginBottom: 16 }}>
          Pending Requests <span style={{ marginLeft: 8, background: 'rgba(245,158,11,0.18)', color: '#b45309', borderRadius: 20, padding: '2px 10px', fontSize: '0.78rem' }}>{pending.length}</span>
        </p>
        {pending.length === 0 ? (
          <p style={{ color: 'rgba(100,116,139,0.55)', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>All caught up — no pending requests.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.map(l => <LeaveRow key={l.leaveId} l={l} showActions getUserName={getUserName} onUpdate={updateStatus} />)}
          </div>
        )}
      </div>

      <div className="card" style={cardStyle}>
        <p style={{ color: '#334155', fontWeight: 600, fontSize: '1rem', marginBottom: 16 }}>Processed</p>
        {processed.length === 0 ? (
          <p style={{ color: 'rgba(100,116,139,0.55)', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>Nothing processed yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {processed.map(l => <LeaveRow key={l.leaveId} l={l} showActions={false} getUserName={getUserName} onUpdate={updateStatus} />)}
          </div>
        )}
      </div>
    </div>
  );
}
