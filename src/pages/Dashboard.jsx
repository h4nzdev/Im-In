import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Sparkles, Clock, MapPin, Activity, Timer } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/db';
import TodosWidget from '../components/TodosWidget';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function hoursToday(logs, userId) {
  const today = new Date().toDateString();
  const mine = logs.filter(l => l.userId === userId && new Date(l.timestamp).toDateString() === today)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  let ms = 0, openIn = null;
  mine.forEach(l => {
    if (l.type === 'IN') openIn = l;
    else if (openIn) { ms += new Date(l.timestamp) - new Date(openIn.timestamp); openIn = null; }
  });
  if (openIn) ms += Date.now() - new Date(openIn.timestamp);
  return (ms / 3600000).toFixed(1);
}

function hoursWeek(logs, userId) {
  const start = new Date(); start.setDate(start.getDate() - start.getDay()); start.setHours(0,0,0,0);
  const mine = logs.filter(l => l.userId === userId && new Date(l.timestamp) >= start)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  let ms = 0, openIn = null;
  mine.forEach(l => {
    if (l.type === 'IN') openIn = l;
    else if (openIn) { ms += new Date(l.timestamp) - new Date(openIn.timestamp); openIn = null; }
  });
  if (openIn) ms += Date.now() - new Date(openIn.timestamp);
  return (ms / 3600000).toFixed(1);
}

export default function Dashboard() {
  const { user: authUser } = useAuthStore();
  const user = db.getUserById(authUser.userId) || authUser;
  const [logs, setLogs] = useState(() => db.getUserLogs(user.userId));
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [punching, setPunching] = useState(false);
  const [shiftMs, setShiftMs] = useState(0);
  const [attendanceMode, setAttendanceMode] = useState('TAP');

  const containerRef = useRef();
  const btnRef = useRef();
  const ringRef = useRef();
  const pulseAnim = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current.querySelectorAll('.card'), {
        y: 28, opacity: 0, duration: 0.65, stagger: 0.08, ease: 'power3.out',
      });
    });
    return () => ctx.revert();
  }, [user.userId]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const lastLog = sortedLogs[0];
  const isClockedIn = lastLog?.type === 'IN';

  // Shift Timer calculation interval
  useEffect(() => {
    if (!isClockedIn || !lastLog) {
      setShiftMs(0);
      return;
    }
    const calc = () => setShiftMs(Date.now() - new Date(lastLog.timestamp).getTime());
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [isClockedIn, lastLog]);

  const formatElapsed = (ms) => {
    if (ms <= 0) return "00:00:00";
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
  };

  useEffect(() => {
    if (!ringRef.current) return;
    if (pulseAnim.current) { pulseAnim.current.kill(); pulseAnim.current = null; }
    if (isClockedIn) {
      pulseAnim.current = gsap.to(ringRef.current, {
        scale: 1.6, opacity: 0, duration: 1.5, repeat: -1, ease: 'power1.out',
        transformOrigin: '50% 50%',
      });
    } else {
      gsap.set(ringRef.current, { scale: 1, opacity: 0.3 });
    }
  }, [isClockedIn]);

  const handlePunch = () => {
    setError('');
    setPunching(true);
    gsap.to(btnRef.current, { scale: 0.93, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.inOut' });

    const punch = (lat, lng) => {
      db.addLog({
        logId: `LOG-${Date.now()}`,
        userId: user.userId,
        type: isClockedIn ? 'OUT' : 'IN',
        timestamp: new Date().toISOString(),
        latitude: lat,
        longitude: lng,
        deviceInfo: navigator.userAgent.slice(0, 80),
      });
      if (lat && lng) setLocation({ lat, lng });
      setLogs(db.getUserLogs(user.userId));
      setPunching(false);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => punch(p.coords.latitude, p.coords.longitude),
        () => punch(14.5995, 120.9842),
        { timeout: 6000 }
      );
    } else {
      punch(14.5995, 120.9842);
    }
  };

  const todayLogs = sortedLogs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString());
  const mapCenter = location || (lastLog?.latitude ? { lat: lastLog.latitude, lng: lastLog.longitude } : { lat: 14.5995, lng: 120.9842 });

  return (
    <div ref={containerRef}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            Good {time.getHours() < 12 ? 'morning' : time.getHours() < 18 ? 'afternoon' : 'evening'}, {user.name.split(' ')[0]} 👋
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '4px 0 0', fontWeight: 500 }}>
            Here is your daily attendance overview
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 20, background: 'white', border: '1px solid rgba(15,23,42,0.1)', color: '#0f172a', fontSize: '0.92rem', fontWeight: 800, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Clock size={16} color="#2563eb" /> {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 20, background: 'rgba(59,130,246,0.12)', color: '#2563eb', fontSize: '0.88rem', fontWeight: 700 }}>
            <Sparkles size={16} /> Ready to work
          </div>
        </div>
      </div>

      {/* Assigned Deadline Banner */}
      {user.deadlineDate && (
        <div className="card glass" style={{
          padding: '16px 20px', borderRadius: 20, marginBottom: 24,
          background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', border: '1px solid #c7d2fe',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}>
              <Timer size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Target Employee Deadline</span>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e1b4b' }}>{user.deadlineTitle || 'Assigned Enterprise Milestone'}</h4>
            </div>
          </div>
          <div style={{ background: 'white', padding: '8px 16px', borderRadius: 14, border: '1px solid #c7d2fe', color: '#4f46e5', fontWeight: 800, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(79,70,229,0.1)' }}>
            📅 Due Date: {user.deadlineDate}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="card stats-grid" style={{ gap: 20, marginBottom: 24 }}>
        {[
          { label: 'Today Worked', value: `${hoursToday(logs, user.userId)}h`, color: '#1d4ed8', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Weekly Total', value: `${hoursWeek(logs, user.userId)}h`, color: '#2563eb', bg: 'rgba(59,130,246,0.08)' },
          { label: 'Punch Status', value: isClockedIn ? 'Clocked In' : 'Clocked Out', color: isClockedIn ? '#2563eb' : '#64748b', bg: isClockedIn ? 'rgba(59,130,246,0.15)' : 'rgba(100,116,139,0.1)', wide: true },
        ].map(({ label, value, color, bg, wide }) => (
          <div key={label} className={`stat-card glass glass-hover${wide ? ' stat-status' : ''}`} style={{ padding: 22, borderRadius: 20, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</p>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            </div>
            <p style={{ color, fontSize: 'clamp(1.25rem, 4vw, 1.8rem)', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="dashboard-grid" style={{ gap: 24, marginBottom: 24 }}>

        {/* Shift Timer / Clock card */}
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '44px 28px', borderRadius: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: isClockedIn ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.05)', filter: 'blur(30px)', zIndex: 0 }} />
          
          <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              <Timer size={16} color={isClockedIn ? "#2563eb" : "#64748b"} /> Active Shift Elapsed
            </span>
            <p style={{ fontSize: 'clamp(2.4rem, 8vw, 3.5rem)', fontWeight: 800, color: isClockedIn ? '#1d4ed8' : '#94a3b8', fontVariantNumeric: 'tabular-nums', letterSpacing: '-1.5px', margin: '0 0 36px', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
              {formatElapsed(shiftMs)}
            </p>

            {/* Attendance Mode Switcher */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'rgba(15,23,42,0.06)', padding: 5, borderRadius: 18, width: '100%', maxWidth: 320 }}>
              <button
                type="button"
                onClick={() => setAttendanceMode('TAP')}
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: attendanceMode === 'TAP' ? 'white' : 'transparent',
                  color: attendanceMode === 'TAP' ? '#0f172a' : '#64748b',
                  fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: attendanceMode === 'TAP' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.2s'
                }}
              >
                📍 GPS Tap
              </button>
              <button
                type="button"
                onClick={() => setAttendanceMode('FACE')}
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: attendanceMode === 'FACE' ? 'white' : 'transparent',
                  color: attendanceMode === 'FACE' ? '#2563eb' : '#64748b',
                  fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: attendanceMode === 'FACE' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.2s'
                }}
              >
                👤 Face AI <span style={{ padding: '2px 6px', borderRadius: 8, background: '#dbeafe', color: '#1d4ed8', fontSize: '0.65rem' }}>SOON</span>
              </button>
            </div>

            {attendanceMode === 'FACE' ? (
              <div style={{ padding: '24px 18px', borderRadius: 20, textAlign: 'center', marginBottom: 24, border: '1.5px dashed #93c5fd', background: 'linear-gradient(180deg, rgba(239,246,255,0.9), rgba(255,255,255,0.95))', width: '100%', maxWidth: 340, boxShadow: '0 8px 24px rgba(37,99,235,0.06)' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '2rem', boxShadow: '0 6px 18px rgba(37,99,235,0.15)' }}>
                  🧑‍💻
                </div>
                <span style={{ padding: '4px 10px', borderRadius: 20, background: '#1d4ed8', color: 'white', fontWeight: 800, fontSize: '0.72rem', display: 'inline-block', marginBottom: 10 }}>
                  ⚡ COMING SOON
                </span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                  AI Facial Verification
                </h4>
                <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0 0 16px', lineHeight: 1.45 }}>
                  Frictionless hands-free attendance check-in via 3D facial neural recognition is finalizing security audits.
                </p>
                <div style={{ padding: '8px 12px', borderRadius: 12, background: 'white', border: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#334155', fontWeight: 700, display: 'inline-block' }}>
                  🔒 Neural Biometric Template Engine v2.4
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative', marginBottom: 32 }}>
                <div ref={ringRef} style={{
                  position: 'absolute', inset: -20, borderRadius: '50%',
                  border: `3px solid ${isClockedIn ? '#3b82f6' : '#2563eb'}`,
                  opacity: 0.3, pointerEvents: 'none'
                }} />
                <button ref={btnRef} onClick={handlePunch} disabled={punching} style={{
                  width: 136, height: 136, borderRadius: '50%', border: 'none', cursor: punching ? 'not-allowed' : 'pointer',
                  background: isClockedIn
                    ? '#1d4ed8'
                    : '#2563eb',
                  color: 'white', fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.5px',
                  boxShadow: isClockedIn ? '0 12px 36px rgba(29,78,216,0.45)' : '0 12px 36px rgba(59,130,246,0.45)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  {punching ? '...' : isClockedIn ? 'CLOCK OUT' : 'CLOCK IN'}
                </button>
              </div>
            )}

            {lastLog && (
              <div style={{ background: 'rgba(15,23,42,0.04)', borderRadius: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={15} color="#64748b" />
                <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0, fontWeight: 600 }}>
                  Last punched <strong style={{ color: '#0f172a' }}>{lastLog.type}</strong> at {new Date(lastLog.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </p>
              </div>
            )}
            {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: 12, fontWeight: 600 }}>{error}</p>}
          </div>
        </div>

        {/* Map */}
        <div className="card glass" style={{ padding: 0, overflow: 'hidden', borderRadius: 24, minHeight: 340, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.4)' }}>
            <MapPin size={18} color="#2563eb" />
            <p style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>Live Geolocation</p>
          </div>
          <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={14} style={{ flex: 1, minHeight: 280, width: '100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='© OpenStreetMap © CARTO'
            />
            <Marker position={[mapCenter.lat, mapCenter.lng]}>
              <Popup>Last punch location</Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>

      {/* Today's activity stream */}
      <div className="card glass" style={{ padding: 28, borderRadius: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.1rem' }}>Today's Activity Stream</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', background: 'rgba(15,23,42,0.05)', padding: '4px 12px', borderRadius: 20 }}>
            {todayLogs.length} events
          </span>
        </div>
        
        {todayLogs.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '36px 0', background: 'rgba(15,23,42,0.02)', borderRadius: 16 }}>
            No punches recorded today. Click the button above to begin your shift.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {todayLogs.map(log => (
              <div key={log.logId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 14, transition: 'transform 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: log.type === 'IN' ? 'rgba(59,130,246,0.12)' : 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: log.type === 'IN' ? '#3b82f6' : '#ef4444' }} />
                  </div>
                  <div>
                    <span style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.92rem', display: 'block' }}>Clock {log.type === 'IN' ? 'In' : 'Out'}</span>
                    <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Captured via Browser Geolocation</span>
                  </div>
                </div>
                <span style={{ color: '#334155', fontWeight: 700, fontSize: '0.9rem', fontVariantNumeric: 'tabular-nums' }}>{new Date(log.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Todo List Feature */}
      <TodosWidget />
    </div>
  );
}
