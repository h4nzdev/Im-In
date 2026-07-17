import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/db';

function msToHours(ms) { return (ms / 3600000).toFixed(1); }

function buildDailyHours(logs, userId, daysBack = 7) {
  const data = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    const dayLogs = logs
      .filter(l => l.userId === userId && new Date(l.timestamp) >= d && new Date(l.timestamp) < next)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    let ms = 0, openIn = null;
    dayLogs.forEach(l => {
      if (l.type === 'IN') openIn = l;
      else if (openIn) { ms += new Date(l.timestamp) - new Date(openIn.timestamp); openIn = null; }
    });
    data.push({
      date: daysBack > 14 ? `${d.getMonth()+1}/${d.getDate()}` : d.toLocaleDateString('en-US', { weekday: 'short' }),
      hours: parseFloat((ms / 3600000).toFixed(2)),
    });
  }
  return data;
}

function calcPeriodHours(logs, userId, daysBack) {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - daysBack); cutoff.setHours(0, 0, 0, 0);
  const filtered = logs.filter(l => l.userId === userId && new Date(l.timestamp) >= cutoff)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  let ms = 0, openIn = null;
  filtered.forEach(l => {
    if (l.type === 'IN') openIn = l;
    else if (openIn) { ms += new Date(l.timestamp) - new Date(openIn.timestamp); openIn = null; }
  });
  return msToHours(ms);
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 10, padding: '8px 14px', boxShadow: '0 4px 16px rgba(15,23,42,0.12)' }}>
      <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: 2 }}>{label}</p>
      <p style={{ color: '#043e8a', fontWeight: 700, fontSize: '0.9rem' }}>{payload[0].value}h</p>
    </div>
  );
}

export default function Analytics() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'Admin';
  const isSuccessLead = user?.role === 'Success Lead';
  const managedTeam = Array.isArray(user?.managedTeam) ? user.managedTeam : [];
  const [users] = useState(() => db.getUsers());
  const [selectedUserId, setSelectedUserId] = useState(user.userId);

  const targetUserId = (isAdmin || isSuccessLead) ? selectedUserId : user.userId;
  const targetUser = users.find(u => u.userId === targetUserId) || user;

  const [allLogs] = useState(() => db.getLogs());
  const [allLeaves] = useState(() => db.getLeaves());

  const logs = allLogs.filter(l => l.userId === targetUserId);
  const leaves = allLeaves.filter(l => l.userId === targetUserId);
  const [daysFilter, setDaysFilter] = useState(7);
  const pageRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(pageRef.current.querySelectorAll('.card'), {
        y: 28, opacity: 0, duration: 0.55, stagger: 0.08, ease: 'power3.out',
      });
    });
    return () => ctx.revert();
  }, [daysFilter, selectedUserId]);

  const dailyData = buildDailyHours(logs, targetUserId, daysFilter);
  const todayHours = calcPeriodHours(logs, targetUserId, 1);
  const weekHours = calcPeriodHours(logs, targetUserId, 7);
  const monthHours = calcPeriodHours(logs, targetUserId, 30);

  const leaveStats = {
    total: leaves.length,
    approved: leaves.filter(l => l.status === 'Approved').length,
    pending: leaves.filter(l => l.status === 'Pending').length,
  };

  const cardStyle = { background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 20, boxShadow: '0 4px 24px rgba(15,23,42,0.05)' };

  const statCards = [
    { label: 'Today',      value: `${todayHours}h`,  color: '#043e8a', bg: 'rgba(4, 62, 138,0.1)'  },
    { label: 'This Week',  value: `${weekHours}h`,   color: '#054daf', bg: 'rgba(5, 77, 175,0.1)'  },
    { label: 'This Month', value: `${monthHours}h`,  color: '#054daf', bg: 'rgba(5, 77, 175,0.1)'  },
    { label: 'Leaves',     value: leaveStats.total,  color: '#b45309', bg: 'rgba(245,158,11,0.12)'  },
  ];

  return (
    <div ref={pageRef}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            {targetUserId === user.userId ? 'My Analytics' : `${targetUser.name}'s Analytics`}
          </h1>
          {(isAdmin || isSuccessLead) && (
            <p style={{ color: '#64748b', fontSize: '0.84rem', margin: '4px 0 0', fontWeight: 600 }}>
              Viewing metrics for {targetUser.role || 'Associate'} ({targetUser.employeeId || targetUser.userId})
            </p>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {(isAdmin || isSuccessLead) && (
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              style={{
                height: 40, padding: '0 14px', borderRadius: 12, border: '1px solid #bfdbfe',
                background: selectedUserId !== user.userId ? '#eff6ff' : 'white',
                color: selectedUserId !== user.userId ? '#043e8a' : '#0f172a',
                fontSize: '0.84rem', fontWeight: 700, outline: 'none', cursor: 'pointer'
              }}
            >
              {(() => {
                const availableUsers = isAdmin ? users : users.filter(u => u.userId === user.userId || managedTeam.includes(u.userId));
                return availableUsers.map(u => (
                  <option key={u.userId} value={u.userId}>
                    📊 {u.name} {u.userId === user.userId ? '(Me)' : ''}
                  </option>
                ));
              })()}
            </select>
          )}

          <div style={{ display: 'flex', background: 'rgba(15,23,42,0.06)', padding: 4, borderRadius: 12, gap: 4 }}>
            {[
              { d: 7, l: '7 Days' },
              { d: 14, l: '14 Days' },
              { d: 30, l: '1 Month' },
            ].map(({ d, l }) => (
              <button
                key={d}
                onClick={() => setDaysFilter(d)}
                style={{
                  border: 'none', background: daysFilter === d ? 'white' : 'transparent',
                  color: daysFilter === d ? '#043e8a' : '#64748b',
                  fontWeight: 700, fontSize: '0.8rem', padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                  boxShadow: daysFilter === d ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="card stats-grid" style={{ gap: 16, marginBottom: 24 }}>
        {statCards.map(({ label, value, color, bg }) => (
          <div key={label} className="stat-card glass glass-hover" style={{ padding: 20, borderRadius: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</p>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            </div>
            <p style={{ color, fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: 800, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Hours bar chart */}
      <div className="card glass" style={{ padding: 24, borderRadius: 24, marginBottom: 20 }}>
        <p style={{ color: '#0f172a', fontWeight: 800, fontSize: '1rem', marginBottom: 20 }}>Hours Recorded — Last {daysFilter} Days</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dailyData} barSize={daysFilter > 14 ? 14 : 26} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(4, 62, 138,0.06)' }} />
            <Bar dataKey="hours" fill="url(#userBarGrad)" radius={[6, 6, 0, 0]} />
            <defs>
              <linearGradient id="userBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#054daf" />
                <stop offset="100%" stopColor="#033373" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Area chart (trend line) */}
      <div className="card glass" style={{ padding: 24, borderRadius: 24, marginBottom: 20 }}>
        <p style={{ color: '#0f172a', fontWeight: 800, fontSize: '1rem', marginBottom: 20 }}>Productivity Trend</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#043e8a" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#043e8a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(4, 62, 138,0.3)' }} />
            <Area type="monotone" dataKey="hours" stroke="#043e8a" strokeWidth={2.5} fill="url(#areaGrad)" dot={{ fill: '#043e8a', r: 3.5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Leave summary */}
      <div className="card glass" style={{ padding: 24, borderRadius: 24 }}>
        <p style={{ color: '#0f172a', fontWeight: 800, fontSize: '1rem', marginBottom: 16 }}>Leave Overview</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Requests', value: leaveStats.total, color: '#0f172a', bg: 'rgba(15,23,42,0.05)' },
            { label: 'Approved',       value: leaveStats.approved, color: '#043e8a', bg: 'rgba(5, 77, 175,0.12)' },
            { label: 'Pending',        value: leaveStats.pending, color: '#d97706', bg: 'rgba(245,158,11,0.14)' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ flex: '1 1 120px', textAlign: 'center', padding: '18px 12px', background: bg, borderRadius: 16 }}>
              <p style={{ color, fontSize: '1.6rem', fontWeight: 800, margin: '0 0 4px' }}>{value}</p>
              <p style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
