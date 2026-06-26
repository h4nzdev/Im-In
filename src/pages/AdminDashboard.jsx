import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, UserCheck, Calendar, Clock, ArrowRight, Activity, Users, Briefcase, FileText } from 'lucide-react';
import { db } from '../lib/db';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 12, padding: '10px 14px', boxShadow: '0 4px 16px rgba(15,23,42,0.12)' }}>
      <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#1d4ed8', fontWeight: 700 }}>{payload[0].value} clock-ins</p>
    </div>
  );
}

function buildTrend(logs) {
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    const count = logs.filter(l => l.type === 'IN' && new Date(l.timestamp) >= d && new Date(l.timestamp) < next).length;
    trend.push({ date: d.toLocaleDateString('en-US',{weekday:'short'}), clockIns: count });
  }
  return trend;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users] = useState(() => db.getUsers());
  const [logs] = useState(() => db.getLogs());
  const [leaves] = useState(() => db.getLeaves());

  const containerRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current.querySelectorAll('.card'), {
        y: 30, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out',
      });
    });
    return () => ctx.revert();
  }, []);

  const today = new Date().toDateString();
  const clockedInToday = users.filter(u => {
    const last = [...logs].filter(l => l.userId === u.userId).sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp))[0];
    return last?.type === 'IN' && new Date(last.timestamp).toDateString() === today;
  }).length;

  const pendingLeavesCount = leaves.filter(l => l.status === 'Pending').length;
  const pendingUsersCount = users.filter(u => u.status === 'Pending').length;
  const totalPending = pendingLeavesCount + pendingUsersCount;

  const startOfWeek = new Date(); startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); startOfWeek.setHours(0,0,0,0);
  const weekLogs = logs.filter(l => new Date(l.timestamp) >= startOfWeek).sort((a,b) => new Date(a.timestamp)-new Date(b.timestamp));
  let weekMs = 0, openIn = {};
  weekLogs.forEach(l => {
    if (l.type === 'IN') openIn[l.userId] = l;
    else if (openIn[l.userId]) { weekMs += new Date(l.timestamp) - new Date(openIn[l.userId].timestamp); delete openIn[l.userId]; }
  });
  const weeklyHours = (weekMs / 3600000).toFixed(1);

  const stats = [
    { label: 'Total Employees', value: users.filter(u => u.role === 'User').length, color: '#1d4ed8', bg: 'rgba(29,78,216,0.1)' },
    { label: 'Clocked In Today', value: clockedInToday, color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
    { label: 'Pending Queue', value: totalPending, color: '#d97706', bg: 'rgba(245,158,11,0.14)' },
    { label: 'Weekly Hours', value: `${weeklyHours}h`, color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
  ];

  const shortcuts = [
    { label: 'Review Approvals', desc: `${totalPending} items waiting`, icon: UserCheck, to: '/admin/approvals', color: '#d97706', bg: 'rgba(245,158,11,0.14)' },
    { label: 'Audit Shift Logs', desc: `${logs.length} biometric records`, icon: Clock, to: '/admin/logs', color: '#1d4ed8', bg: 'rgba(59,130,246,0.12)' },
    { label: 'Manage Leaves', desc: `${leaves.length} total bookings`, icon: FileText, to: '/admin/leaves', color: '#2563eb', bg: 'rgba(37,99,235,0.12)' },
    { label: 'Positions & Depts', desc: 'Organizational hierarchy', icon: Briefcase, to: '/admin/positions', color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
  ];

  return (
    <div ref={containerRef}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            Executive Overview
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '4px 0 0', fontWeight: 500 }}>
            High-level company metrics and monitoring dashboard
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', color: '#b45309', fontWeight: 800, fontSize: '0.85rem' }}>
          <Shield size={16} /> Admin Console
        </div>
      </div>

      {/* Action Required Callout Banner */}
      {totalPending > 0 && (
        <div className="card glass" style={{
          padding: '20px 24px', borderRadius: 22, marginBottom: 28,
          background: 'rgba(245,158,11,0.12)',
          border: '2px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16, boxShadow: '0 8px 32px rgba(245,158,11,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserCheck size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Verification Queue Action Required
              </h2>
              <p style={{ margin: '3px 0 0', color: '#475569', fontSize: '0.92rem' }}>
                There are <b>{pendingUsersCount} account signups</b> and <b>{pendingLeavesCount} leave bookings</b> awaiting executive review.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/approvals')}
            style={{
              padding: '12px 22px', borderRadius: 14, border: 'none', background: '#d97706',
              color: 'white', fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(217,119,6,0.3)',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#b45309'}
            onMouseLeave={e => e.currentTarget.style.background = '#d97706'}
          >
            Review Queue <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="card stats-grid" style={{ gap: 16, marginBottom: 28 }}>
        {stats.map(({ label, value, color, bg }) => (
          <div key={label} className="stat-card glass glass-hover" style={{ padding: 22, borderRadius: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</p>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            </div>
            <p style={{ color, fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 800, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Quick Action Shortcuts */}
      <div className="card glass" style={{ padding: 28, borderRadius: 24, marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 20px' }}>
          Management Portals & Quick Actions
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {shortcuts.map(sc => {
            const Icon = sc.icon;
            return (
              <Link key={sc.label} to={sc.to} style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px',
                borderRadius: 18, background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(15,23,42,0.08)',
                textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = sc.color; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(15,23,42,0.08)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)'; }}
              >
                <div style={{ width: 46, height: 46, borderRadius: 14, background: sc.bg, color: sc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={24} />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>{sc.label}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', marginTop: 2 }}>
                    {sc.desc}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Attendance Trend */}
      <div className="card glass" style={{ padding: 28, borderRadius: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.05rem' }}>Company Attendance Volume — Last 7 Days</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1d4ed8', background: 'rgba(59,130,246,0.12)', padding: '4px 12px', borderRadius: 20 }}>
            Biometric activity
          </span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={buildTrend(logs)} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(29,78,216,0.06)' }} />
            <Bar dataKey="clockIns" fill="url(#barGrad)" radius={[6,6,0,0]} />
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1e40af" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
