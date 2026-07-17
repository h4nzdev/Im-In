import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, UserCheck, Calendar, Clock, ArrowRight, Activity, Users, Briefcase, FileText, MapPin, CheckCircle2, Lock, Unlock, Search, Building2, Layers, AlertTriangle } from 'lucide-react';
import { db } from '../lib/db';
import { realtimeBus } from '../lib/realtime';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 12, padding: '10px 14px', boxShadow: '0 4px 16px rgba(15,23,42,0.12)' }}>
      <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#043e8a', fontWeight: 700 }}>{payload[0].value} clock-ins</p>
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

  const [onlineMap, setOnlineMap] = useState(() => JSON.parse(localStorage.getItem('realynk_live_online_users')) || {});
  const [activeShiftsMap, setActiveShiftsMap] = useState(() => JSON.parse(localStorage.getItem('realynk_live_active_shifts')) || {});
  const [now, setNow] = useState(Date.now());

  const [geofence] = useState(() => db.getGeofence());
  const containerRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current.querySelectorAll('.card'), {
        y: 30, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out',
      });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const unsub = realtimeBus.subscribe(() => {
      setOnlineMap(JSON.parse(localStorage.getItem('realynk_live_online_users')) || {});
      setActiveShiftsMap(JSON.parse(localStorage.getItem('realynk_live_active_shifts')) || {});
    });

    const t = setInterval(() => {
      setOnlineMap(JSON.parse(localStorage.getItem('realynk_live_online_users')) || {});
      setActiveShiftsMap(JSON.parse(localStorage.getItem('realynk_live_active_shifts')) || {});
      setNow(Date.now());
    }, 1000);

    return () => {
      unsub();
      clearInterval(t);
    };
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
    { label: 'Total Employees', value: users.filter(u => u.role === 'User').length, color: '#043e8a', bg: 'rgba(4, 62, 138,0.1)' },
    { label: 'Clocked In Today', value: clockedInToday, color: '#054daf', bg: 'rgba(5, 77, 175,0.1)' },
    { label: 'Pending Queue', value: totalPending, color: '#d97706', bg: 'rgba(245,158,11,0.14)' },
    { label: 'Weekly Hours', value: `${weeklyHours}h`, color: '#054daf', bg: 'rgba(5, 77, 175,0.1)' },
  ];

  const shortcuts = [
    { label: 'Review Approvals', desc: `${totalPending} items waiting`, icon: UserCheck, to: '/admin/approvals', color: '#d97706', bg: 'rgba(245,158,11,0.14)' },
    { label: 'Audit Shift Logs', desc: `${logs.length} biometric records`, icon: Clock, to: '/admin/logs', color: '#043e8a', bg: 'rgba(5, 77, 175,0.12)' },
    { label: 'Manage Leaves', desc: `${leaves.length} total bookings`, icon: FileText, to: '/admin/leaves', color: '#054daf', bg: 'rgba(5, 77, 175,0.12)' },
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

      {/* Realtime Active Personnel Monitor */}
      <div className="card glass" style={{ padding: 28, borderRadius: 24, marginBottom: 28, border: '1px solid rgba(16,185,129,0.3)', background: 'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(240,253,244,0.35))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <Activity size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Realtime Active Personnel Monitor
              </h2>
              <p style={{ color: '#047857', fontSize: '0.82rem', margin: '2px 0 0', fontWeight: 600 }}>
                Live active sessions ('Online') & biometric clock timers
              </p>
            </div>
          </div>
          <span style={{ padding: '6px 14px', borderRadius: 20, background: '#10b981', color: 'white', fontWeight: 800, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'white', display: 'inline-block' }} /> Live Broadcast Active
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {users.map(u => {
            const isOnline = onlineMap[u.userId] || u.isActive;
            const activeShift = activeShiftsMap[u.userId];
            let elapsedStr = null;
            if (activeShift) {
              const diffSec = Math.max(0, Math.floor((now - activeShift.startTime) / 1000));
              const h = String(Math.floor(diffSec / 3600)).padStart(2, '0');
              const m = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
              const s = String(diffSec % 60).padStart(2, '0');
              elapsedStr = `${h}:${m}:${s}`;
            }

            return (
              <div key={u.userId} style={{
                padding: '12px 16px', borderRadius: 16, background: isOnline ? '#ecfdf5' : 'white',
                border: isOnline ? '1.5px solid #6ee7b7' : '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                boxShadow: isOnline ? '0 4px 12px rgba(16,185,129,0.15)' : 'none',
                transition: 'all 0.3s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: isOnline ? '#10b981' : '#cbd5e1',
                    boxShadow: isOnline ? '0 0 8px #10b981' : 'none',
                    display: 'inline-block'
                  }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.department} ({u.userId})</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 8,
                    background: isOnline ? 'rgba(16,185,129,0.12)' : '#f1f5f9',
                    color: isOnline ? '#047857' : '#64748b', fontWeight: 800, fontSize: '0.72rem'
                  }}>
                    <Activity size={12} color={isOnline ? '#059669' : '#64748b'} /> {isOnline ? 'Online' : 'Offline'}
                  </span>
                  {elapsedStr && (
                    <div style={{ marginTop: 4, fontSize: '0.78rem', fontWeight: 800, color: '#054daf', fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <Clock size={12} /> {elapsedStr}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Executive Quick Action & Navigation Portal */}
      <div className="card glass" style={{ padding: 28, borderRadius: 24, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, borderBottom: '1px solid rgba(15,23,42,0.06)', paddingBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={22} color="#054daf" /> Executive Action Center & Terminal Shortcuts
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '3px 0 0', fontWeight: 600 }}>
              Quick access to administrative approval queues, security maps, and workforce roster management
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
          {/* Card 1: Approvals Desk */}
          <div style={{ padding: 24, borderRadius: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(5, 77, 175,0.18)', background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(239,246,255,0.6))', boxShadow: '0 4px 18px rgba(15,23,42,0.04)', height: '100%' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(217,119,6,0.15)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={22} />
                </div>
                {(logs.filter(l => l.status === 'REMOTE_PENDING').length + leaves.filter(l => l.status === 'Pending').length) > 0 && (
                  <span style={{ padding: '4px 10px', borderRadius: 20, background: '#fef3c7', color: '#d97706', fontSize: '0.74rem', fontWeight: 800, border: '1px solid #fde68a' }}>
                    Requires Review
                  </span>
                )}
              </div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Pending Approvals</h3>
              <p style={{ color: '#64748b', fontSize: '0.84rem', lineHeight: 1.5, margin: '0 0 20px', fontWeight: 600 }}>
                Review <strong>{logs.filter(l => l.status === 'REMOTE_PENDING').length} remote attendance</strong> exceptions & <strong>{leaves.filter(l => l.status === 'Pending').length} leave</strong> requests.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/approvals')}
              style={{ width: '100%', padding: '12px', borderRadius: 14, background: '#d97706', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.86rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(217,119,6,0.25)', transition: 'transform 0.15s' }}
            >
              Open Approvals Desk <ArrowRight size={16} />
            </button>
          </div>

          {/* Card 2: Geofence Map Terminal */}
          <div style={{ padding: 24, borderRadius: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(5, 77, 175,0.18)', background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(239,246,255,0.6))', boxShadow: '0 4px 18px rgba(15,23,42,0.04)', height: '100%' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(5, 77, 175,0.15)', color: '#054daf', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={22} />
                </div>
                <span style={{ padding: '4px 10px', borderRadius: 20, background: geofence?.enabled ? '#ecfdf5' : '#f1f5f9', color: geofence?.enabled ? '#059669' : '#64748b', fontSize: '0.74rem', fontWeight: 800, border: geofence?.enabled ? '1px solid #a7f3d0' : '1px solid #e2e8f0' }}>
                  {geofence?.enabled ? 'Strict Geofence ON' : 'Geofence Unrestricted'}
                </span>
              </div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Terminal Geofence Map</h3>
              <p style={{ color: '#64748b', fontSize: '0.84rem', lineHeight: 1.5, margin: '0 0 20px', fontWeight: 600 }}>
                Active center: <strong>{geofence?.addressName || 'Wilson Street, Cebu City'}</strong> ({geofence?.radius || 300}m radius). Configure interactive map pin.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/geofence')}
              style={{ width: '100%', padding: '12px', borderRadius: 14, background: '#054daf', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.86rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(5, 77, 175,0.25)', transition: 'transform 0.15s' }}
            >
              Open Geofence Terminal <ArrowRight size={16} />
            </button>
          </div>

          {/* Card 3: Employee Roster */}
          <div style={{ padding: 24, borderRadius: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(5, 77, 175,0.18)', background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(239,246,255,0.6))', boxShadow: '0 4px 18px rgba(15,23,42,0.04)', height: '100%' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(16,185,129,0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={22} />
                </div>
                <span style={{ padding: '4px 10px', borderRadius: 20, background: '#eff6ff', color: '#043e8a', fontSize: '0.74rem', fontWeight: 800, border: '1px solid #bfdbfe' }}>
                  {users.length} Profiles
                </span>
              </div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Staff & Designations</h3>
              <p style={{ color: '#64748b', fontSize: '0.84rem', lineHeight: 1.5, margin: '0 0 20px', fontWeight: 600 }}>
                Manage corporate profiles, roles, IDs, and shift schedules for all operations and shared services personnel.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/employees')}
              style={{ width: '100%', padding: '12px', borderRadius: 14, background: '#0f172a', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.86rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(15,23,42,0.2)', transition: 'transform 0.15s' }}
            >
              Manage Staff Roster <ArrowRight size={16} />
            </button>
          </div>

          {/* Card 4: Biometric Audit Logs Table */}
          <div style={{ padding: 24, borderRadius: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(5, 77, 175,0.18)', background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(239,246,255,0.6))', boxShadow: '0 4px 18px rgba(15,23,42,0.04)', height: '100%' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={22} />
                </div>
                <span style={{ padding: '4px 10px', borderRadius: 20, background: '#f5f3ff', color: '#7c3aed', fontSize: '0.74rem', fontWeight: 800, border: '1px solid #ddd6fe' }}>
                  {logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length} Today
                </span>
              </div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Attendance Audit Table</h3>
              <p style={{ color: '#64748b', fontSize: '0.84rem', lineHeight: 1.5, margin: '0 0 20px', fontWeight: 600 }}>
                Filter across all employee punches simultaneously with user dropdown and text search capabilities. Export CSV.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/logs')}
              style={{ width: '100%', padding: '12px', borderRadius: 14, background: '#7c3aed', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.86rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(124,58,237,0.25)', transition: 'transform 0.15s' }}
            >
              Open Audit Table <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Division & Campaign Intelligence Panel */}
      <div className="card glass" style={{ padding: 28, borderRadius: 24, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, borderBottom: '1px solid rgba(15,23,42,0.06)', paddingBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={22} color="#054daf" /> Division & Client Campaign Overview
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '3px 0 0', fontWeight: 600 }}>
              Workforce distribution across Operations (Service Delivery) and Corporate Support (Shared Services)
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/assignments')}
            style={{ padding: '10px 16px', borderRadius: 14, background: 'rgba(5, 77, 175,0.08)', color: '#054daf', border: '1px solid rgba(5, 77, 175,0.25)', fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Briefcase size={16} /> Campaign Assignments Desk →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
          {/* Division 1: Service Delivery */}
          <div style={{ padding: '22px', borderRadius: 20, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 180 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#043e8a', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Briefcase size={16} /> Service Delivery (Operations)
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e3a8a' }}>
                  {users.filter(u => u.department === 'Service Delivery').length} Staff
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#054daf', margin: '0 0 16px', fontWeight: 600, lineHeight: 1.45 }}>
                Virtual Assistants and Operations team members working directly on client accounts and billable customer campaigns.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {db.getAccounts().slice(0, 4).map(acc => (
                  <span key={acc} style={{ padding: '6px 12px', borderRadius: 20, background: 'white', color: '#043e8a', fontWeight: 800, fontSize: '0.74rem', border: '1px solid #93c5fd', boxShadow: '0 2px 6px rgba(5, 77, 175,0.06)' }}>
                    🎯 {acc}
                  </span>
                ))}
                {db.getAccounts().length > 4 && (
                  <span style={{ padding: '6px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.6)', color: '#043e8a', fontWeight: 800, fontSize: '0.74rem' }}>
                    +{db.getAccounts().length - 4} more campaigns
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Division 2: Shared Services */}
          <div style={{ padding: '22px', borderRadius: 20, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 180 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 size={16} /> Shared Services (Corporate)
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                  {users.filter(u => u.department === 'Shared Services').length} Staff
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px', fontWeight: 600, lineHeight: 1.45 }}>
                Internal enterprise support departments including HR, IT, Accounting, Recruitment, and Internal Operations.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['HR & People Operations', 'IT Infrastructure & Dev', 'Corporate Finance', 'Recruitment Specialist'].map(dept => (
                  <span key={dept} style={{ padding: '6px 12px', borderRadius: 20, background: 'white', color: '#334155', fontWeight: 800, fontSize: '0.74rem', border: '1px solid #cbd5e1', boxShadow: '0 2px 6px rgba(15,23,42,0.03)' }}>
                    🏢 {dept}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Trend */}
      <div className="card glass" style={{ padding: 28, borderRadius: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.05rem' }}>Company Attendance Volume — Last 7 Days</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#043e8a', background: 'rgba(5, 77, 175,0.12)', padding: '4px 12px', borderRadius: 20 }}>
            Biometric activity
          </span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={buildTrend(logs)} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(4, 62, 138,0.06)' }} />
            <Bar dataKey="clockIns" fill="url(#barGrad)" radius={[6,6,0,0]} />
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#054daf" />
                <stop offset="100%" stopColor="#033373" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
