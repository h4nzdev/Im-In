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
      <p style={{ color: '#1d4ed8', fontWeight: 700, fontSize: '0.9rem' }}>{payload[0].value}h</p>
    </div>
  );
}

export default function Analytics() {
  const { user } = useAuthStore();
  const [logs] = useState(() => db.getUserLogs(user.userId));
  const [leaves] = useState(() => db.getUserLeaves(user.userId));
  const [daysFilter, setDaysFilter] = useState(7);
  const pageRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(pageRef.current.querySelectorAll('.card'), {
        y: 28, opacity: 0, duration: 0.55, stagger: 0.08, ease: 'power3.out',
      });
    });
    return () => ctx.revert();
  }, [daysFilter]);

  const dailyData = buildDailyHours(logs, user.userId, daysFilter);
  const todayHours = calcPeriodHours(logs, user.userId, 1);
  const weekHours = calcPeriodHours(logs, user.userId, 7);
  const monthHours = calcPeriodHours(logs, user.userId, 30);

  const leaveStats = {
    total: leaves.length,
    approved: leaves.filter(l => l.status === 'Approved').length,
    pending: leaves.filter(l => l.status === 'Pending').length,
  };

  const cardStyle = { background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 20, boxShadow: '0 4px 24px rgba(15,23,42,0.05)' };

  const statCards = [
    { label: 'Today',      value: `${todayHours}h`,  color: '#1d4ed8', bg: 'rgba(29,78,216,0.1)'  },
    { label: 'This Week',  value: `${weekHours}h`,   color: '#2563eb', bg: 'rgba(37,99,235,0.1)'  },
    { label: 'This Month', value: `${monthHours}h`,  color: '#2563eb', bg: 'rgba(37,99,235,0.1)'  },
    { label: 'Leaves',     value: leaveStats.total,  color: '#b45309', bg: 'rgba(245,158,11,0.12)'  },
  ];

  return (
    <div ref={pageRef}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>My Analytics</h1>
        
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
                color: daysFilter === d ? '#1d4ed8' : '#64748b',
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(29,78,216,0.06)' }} />
            <Bar dataKey="hours" fill="url(#userBarGrad)" radius={[6, 6, 0, 0]} />
            <defs>
              <linearGradient id="userBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1e40af" />
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
                <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(29,78,216,0.3)' }} />
            <Area type="monotone" dataKey="hours" stroke="#1d4ed8" strokeWidth={2.5} fill="url(#areaGrad)" dot={{ fill: '#1d4ed8', r: 3.5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Leave summary */}
      <div className="card glass" style={{ padding: 24, borderRadius: 24 }}>
        <p style={{ color: '#0f172a', fontWeight: 800, fontSize: '1rem', marginBottom: 16 }}>Leave Overview</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Requests', value: leaveStats.total, color: '#0f172a', bg: 'rgba(15,23,42,0.05)' },
            { label: 'Approved',       value: leaveStats.approved, color: '#1d4ed8', bg: 'rgba(59,130,246,0.12)' },
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
