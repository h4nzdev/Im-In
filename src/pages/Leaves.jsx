import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/db';

const badge = (status) => {
  const map = { Pending: ['#b45309','rgba(245,158,11,0.15)'], Approved: ['#047857','rgba(4,120,87,0.12)'], Rejected: ['#dc2626','rgba(239,68,68,0.12)'] };
  const [color, bg] = map[status] || ['#64748b','rgba(100,116,139,0.15)'];
  return <span style={{ color, background: bg, border: `1px solid ${color}40`, borderRadius: 20, padding: '3px 12px', fontSize: '0.75rem', fontWeight: 600 }}>{status}</span>;
};

export default function Leaves() {
  const { user } = useAuthStore();
  const [leaves, setLeaves] = useState(() => db.getUserLeaves(user.userId));
  const [form, setForm] = useState({ leaveType: 'Sick', startDate: '', endDate: '', reason: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const containerRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current.querySelectorAll('.card'), {
        y: 24, opacity: 0, duration: 0.55, stagger: 0.1, ease: 'power3.out',
      });
    });
    return () => ctx.revert();
  }, [user.userId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (new Date(form.endDate) < new Date(form.startDate)) { setError('End date cannot be before start date'); return; }
    db.addLeave({ leaveId: `LV-${Date.now()}`, userId: user.userId, ...form, status: 'Pending' });
    setLeaves(db.getUserLeaves(user.userId));
    setForm({ leaveType: 'Sick', startDate: '', endDate: '', reason: '' });
    setSuccess('Leave request submitted!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const cardStyle = { background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 20, padding: 28, boxShadow: '0 4px 24px rgba(15,23,42,0.05)' };

  return (
    <div ref={containerRef}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Leave Requests</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>

        <div className="card" style={cardStyle}>
          <p style={{ color: '#334155', fontWeight: 600, fontSize: '1rem', marginBottom: 20 }}>New Request</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', color: 'rgba(51,65,85,0.85)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Leave Type</label>
              <select value={form.leaveType} onChange={e => set('leaveType', e.target.value)}>
                <option>Sick</option>
                <option>Vacation</option>
                <option>Emergency</option>
                <option>Personal</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', color: 'rgba(51,65,85,0.85)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Start</label>
                <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', color: 'rgba(51,65,85,0.85)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>End</label>
                <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} required />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', color: 'rgba(51,65,85,0.85)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Reason</label>
              <textarea value={form.reason} onChange={e => set('reason', e.target.value)} rows={3} placeholder="Optional reason..." style={{ resize: 'vertical' }} />
            </div>
            {error && <p style={{ color: '#dc2626', fontSize: '0.82rem' }}>{error}</p>}
            {success && <p style={{ color: '#047857', fontSize: '0.82rem' }}>{success}</p>}
            <button type="submit" className="btn-primary">Submit Request</button>
          </form>
        </div>

        <div className="card" style={cardStyle}>
          <p style={{ color: '#334155', fontWeight: 600, fontSize: '1rem', marginBottom: 20 }}>Your Requests</p>
          {leaves.length === 0 ? (
            <p style={{ color: 'rgba(100,116,139,0.6)', fontSize: '0.85rem', textAlign: 'center', padding: '40px 0' }}>No requests yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...leaves].reverse().map(l => (
                <div key={l.leaveId} style={{ padding: '16px 20px', background: 'rgba(15,23,42,0.035)', borderRadius: 12, border: '1px solid rgba(15,23,42,0.07)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <span style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.9rem' }}>{l.leaveType}</span>
                      <p style={{ color: 'rgba(100,116,139,0.75)', fontSize: '0.8rem', marginTop: 2 }}>{l.startDate} → {l.endDate}</p>
                    </div>
                    {badge(l.status)}
                  </div>
                  {l.reason && <p style={{ color: 'rgba(100,116,139,0.7)', fontSize: '0.8rem', marginTop: 4 }}>{l.reason}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
