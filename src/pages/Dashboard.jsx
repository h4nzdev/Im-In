import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Sparkles, Clock, MapPin, Activity, Timer, AlertTriangle, Lock, Send, FileText, CheckCircle2, HelpCircle, X, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/db';
import { realtimeBus } from '../lib/realtime';
import { getRealAddress, calculateDistanceMeters } from '../lib/geo';
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
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const [error, setError] = useState('');
  const [punching, setPunching] = useState(false);
  const [shiftMs, setShiftMs] = useState(0);
  const [attendanceMode, setAttendanceMode] = useState('TAP');

  // Remote / Exception Clock-In Request States
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [remoteCategory, setRemoteCategory] = useState('Remote Work / Work From Home (WFH)');
  const [remoteNote, setRemoteNote] = useState('');
  const [remoteAttachCheck, setRemoteAttachCheck] = useState(true);
  const [submittingRemote, setSubmittingRemote] = useState(false);
  const [remoteSuccessMessage, setRemoteSuccessMessage] = useState(null);

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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => setLocation({ lat: 14.5995, lng: 120.9842 }),
        { timeout: 8000 }
      );
    }
  }, []);

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
    if (punching || isOutsideGeofence) return;
    setError('');
    setPunching(true);
    gsap.to(btnRef.current, { scale: 0.93, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.inOut' });

    const punch = async (lat, lng) => {
      const address = await getRealAddress(lat, lng);
      db.addLog({
        logId: `LOG-${Date.now()}`,
        userId: user.userId,
        type: isClockedIn ? 'OUT' : 'IN',
        timestamp: new Date().toISOString(),
        latitude: lat,
        longitude: lng, address,
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

  const handleRemoteSubmit = (e) => {
    if (e) e.preventDefault();
    setSubmittingRemote(true);
    setTimeout(() => {
      const nowObj = new Date();
      const nextType = isClockedIn ? 'OUT' : 'IN';
      const geofence = db.getGeofence();
      const currentLat = Number(location?.lat ?? lastLog?.latitude ?? 14.5995) || 14.5995;
      const currentLng = Number(location?.lng ?? lastLog?.longitude ?? 120.9842) || 120.9842;
      const distMeters = calculateDistanceMeters(currentLat, currentLng, geofence.lat, geofence.lng);

      const newLog = db.addLog({
        logId: `REM-${Date.now()}`,
        userId: user.userId,
        type: nextType,
        timestamp: nowObj.toISOString(),
        latitude: currentLat,
        longitude: currentLng,
        address: `${Math.round(distMeters)}m outside ${geofence.addressName} (Remote Exception)`,
        deviceInfo: navigator.userAgent.slice(0, 80),
        status: 'REMOTE_PENDING',
        note: `[${remoteCategory}] ${remoteNote}`,
        isRemoteRequest: true
      });

      const activeAll = JSON.parse(localStorage.getItem('realynk_live_active_shifts') || '{}');
      if (nextType === 'IN') {
        activeAll[user.userId] = {
          userId: user.userId,
          userName: user.name || user.email,
          department: user.department || 'Shared Services',
          clockInTime: nowObj.toISOString(),
          status: 'REMOTE_PENDING',
        };
        localStorage.setItem('realynk_live_active_shifts', JSON.stringify(activeAll));
      } else {
        delete activeAll[user.userId];
        localStorage.setItem('realynk_live_active_shifts', JSON.stringify(activeAll));
      }

      setLogs(db.getUserLogs(user.userId));

      realtimeBus.broadcast({
        id: `NTF-${Date.now()}`,
        type: 'CLOCK_IN',
        title: 'Remote Exception Request',
        desc: `${user.name || user.email} requested remote ${nextType} (${remoteCategory}).`,
        time: nowObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        unread: true,
        userId: user.userId,
        userName: user.name || user.email,
        department: user.department || 'Shared Services',
        isActive: nextType === 'IN'
      });

      setSubmittingRemote(false);
      setShowRemoteModal(false);
      setRemoteNote('');
      setRemoteSuccessMessage(`Attendance request submitted to supervisor review! You are now logged as active (${nextType}) pending verification.`);
      setTimeout(() => setRemoteSuccessMessage(null), 6000);
    }, 700);
  };

  const todayLogs = sortedLogs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString());
  const mapCenter = location || (lastLog?.latitude ? { lat: lastLog.latitude, lng: lastLog.longitude } : { lat: 14.5995, lng: 120.9842 });

  const geofence = db.getGeofence();
  const currentLat = Number(location?.lat ?? lastLog?.latitude ?? 14.5995) || 14.5995;
  const currentLng = Number(location?.lng ?? lastLog?.longitude ?? 120.9842) || 120.9842;
  const distMeters = calculateDistanceMeters(currentLat, currentLng, geofence.lat, geofence.lng);
  const isOutsideGeofence = false; 

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

      {/* Assigned Deadline Banner / Smart Action Reminder */}
      {user.deadlineDate && !reminderDismissed && (
        <div className="card glass" style={{
          padding: '14px 18px', borderRadius: 18, marginBottom: 20,
          background: 'linear-gradient(135deg, rgba(238,242,255,0.96), rgba(224,231,255,0.88))', border: '1px solid #c7d2fe',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          boxShadow: '0 4px 16px rgba(79,70,229,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 240 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}>
              <Timer size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action Reminder</span>
                <span style={{ fontSize: '0.7rem', background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: 10, fontWeight: 800 }}>
                  Due: {user.deadlineDate}
                </span>
              </div>
              <h4 style={{ margin: '2px 0 0', fontSize: '0.98rem', fontWeight: 800, color: '#1e1b4b', lineHeight: 1.3 }}>
                {user.deadlineTitle || 'Assigned Enterprise Milestone'}
              </h4>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <button
              onClick={() => {
                alert(`Reminder acknowledged! Milestone marked as active focus for today.`);
              }}
              style={{ background: '#4f46e5', color: 'white', padding: '7px 14px', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', transition: 'transform 0.15s', boxShadow: '0 2px 8px rgba(79,70,229,0.25)' }}
            >
              Acknowledge ✓
            </button>
            <button
              onClick={() => setReminderDismissed(true)}
              title="Dismiss reminder"
              style={{ background: 'rgba(79,70,229,0.12)', color: '#4338ca', width: 30, height: 30, borderRadius: 10, border: 'none', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {user.deadlineDate && reminderDismissed && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
          <button
            onClick={() => setReminderDismissed(false)}
            style={{ background: 'rgba(79,70,229,0.08)', border: '1px solid #c7d2fe', color: '#4f46e5', padding: '6px 14px', borderRadius: 16, fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Timer size={14} /> Show Action Reminder ({user.deadlineDate})
          </button>
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
          
          <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {/* Attendance Mode Switcher at Top of Card */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              gap: 4, padding: 5, borderRadius: 50, background: '#f1f5f9', border: '1px solid #cbd5e1',
              marginBottom: 28, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)'
            }}>
              <button
                type="button"
                onClick={() => setAttendanceMode('TAP')}
                style={{
                  padding: '8px 18px', borderRadius: 50, border: 'none', outline: 'none', cursor: 'pointer',
                  background: attendanceMode === 'TAP' ? '#2563eb' : 'transparent',
                  color: attendanceMode === 'TAP' ? '#ffffff' : '#475569',
                  fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: attendanceMode === 'TAP' ? '0 4px 12px rgba(37,99,235,0.25)' : 'none',
                  transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}
              >
                📍 GPS Tap
              </button>
              <button
                type="button"
                onClick={() => setAttendanceMode('FACE')}
                style={{
                  padding: '8px 18px', borderRadius: 50, border: 'none', outline: 'none', cursor: 'pointer',
                  background: attendanceMode === 'FACE' ? '#2563eb' : 'transparent',
                  color: attendanceMode === 'FACE' ? '#ffffff' : '#475569',
                  fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: attendanceMode === 'FACE' ? '0 4px 12px rgba(37,99,235,0.25)' : 'none',
                  transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}
              >
                👤 Face AI
                <span style={{
                  padding: '2px 7px', borderRadius: 10,
                  background: attendanceMode === 'FACE' ? 'rgba(255,255,255,0.25)' : '#dbeafe',
                  color: attendanceMode === 'FACE' ? '#ffffff' : '#1d4ed8',
                  fontSize: '0.68rem', fontWeight: 900
                }}>SOON</span>
              </button>
            </div>

            {attendanceMode === 'FACE' ? (
              <div style={{ padding: '24px 18px', borderRadius: 20, textAlign: 'center', marginBottom: 16, border: '1.5px dashed #93c5fd', background: 'linear-gradient(180deg, rgba(239,246,255,0.9), rgba(255,255,255,0.95))', width: '100%', maxWidth: 360, boxShadow: '0 8px 24px rgba(37,99,235,0.06)' }}>
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
              <>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  <Timer size={16} color={isClockedIn ? "#2563eb" : "#64748b"} /> Active Shift Elapsed
                </span>
                <p style={{ fontSize: 'clamp(2.4rem, 8vw, 3.5rem)', fontWeight: 800, color: isClockedIn ? '#1d4ed8' : '#94a3b8', fontVariantNumeric: 'tabular-nums', letterSpacing: '-1.5px', margin: '0 0 24px', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                  {formatElapsed(shiftMs)}
                </p>

                {isOutsideGeofence ? (
                  <div className="fade-in" style={{
                    width: '100%', maxWidth: 360, padding: '16px 18px', borderRadius: 20,
                    background: '#fffbeb', border: '1.5px solid #fde047', color: '#92400e',
                    marginBottom: 24, textAlign: 'left', boxShadow: '0 6px 20px rgba(245,158,11,0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.86rem', marginBottom: 6, color: '#b45309' }}>
                      <AlertTriangle size={18} color="#d97706" /> Perimeter Boundary Restriction
                    </div>
                    <p style={{ fontSize: '0.8rem', lineHeight: 1.45, color: '#78350f', margin: '0 0 14px' }}>
                      You are currently <strong>{Math.round(distMeters)}m</strong> outside the designated <strong>{geofence.addressName}</strong> boundary (max {geofence.radius}m). Standard GPS tap is restricted.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowRemoteModal(true)}
                      style={{
                        width: '100%', padding: '11px 16px', borderRadius: 14, background: '#d97706',
                        color: 'white', border: 'none', fontWeight: 800, fontSize: '0.84rem',
                        cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(217,119,6,0.3)'
                      }}
                    >
                      <FileText size={16} /> Request Admin Exception / Remote Check-In
                    </button>
                  </div>
                ) : null}

                <div style={{ position: 'relative', marginBottom: 20 }}>
                  <div ref={ringRef} style={{
                    position: 'absolute', inset: -20, borderRadius: '50%',
                    border: `3px solid ${isClockedIn ? '#3b82f6' : '#2563eb'}`,
                    opacity: 0.3, pointerEvents: 'none'
                  }} />
                  <button ref={btnRef} onClick={isOutsideGeofence ? () => setShowRemoteModal(true) : handlePunch} disabled={punching} style={{
                    width: 136, height: 136, borderRadius: '50%', border: 'none', outline: 'none',
                    cursor: punching ? 'wait' : 'pointer',
                    background: isOutsideGeofence ? '#64748b' : punching ? '#475569' : isClockedIn ? '#1d4ed8' : '#2563eb',
                    color: 'white', fontSize: '1rem', fontWeight: 800, letterSpacing: '0.5px', whiteSpace: 'pre-wrap',
                    boxShadow: isOutsideGeofence ? '0 6px 20px rgba(100,116,139,0.3)' : isClockedIn ? '0 12px 36px rgba(29,78,216,0.45)' : '0 12px 36px rgba(59,130,246,0.45)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: punching ? 0.85 : 1,
                  }}>
                    {punching ? (isClockedIn ? '⏳ CLOCK OUT...' : '⏳ CLOCK IN...') : isOutsideGeofence ? '🔒 PERIMETER\nLOCKED' : isClockedIn ? 'CLOCK OUT' : 'CLOCK IN'}
                  </button>
                </div>

                {/* Subtle Request Button when not outside geofence */}
                {!isOutsideGeofence && (
                  <button
                    type="button"
                    onClick={() => setShowRemoteModal(true)}
                    style={{
                      background: 'rgba(37, 99, 235, 0.08)',
                      border: '1px solid rgba(37, 99, 235, 0.22)',
                      borderRadius: 50,
                      padding: '10px 18px',
                      color: '#1d4ed8',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      marginTop: 20,
                      marginBottom: 10,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 14px rgba(37,99,235,0.08)',
                      maxWidth: '95%',
                      textAlign: 'center',
                      lineHeight: 1.4
                    }}
                  >
                    <FileText size={15} style={{ flexShrink: 0 }} />
                    <span>
                      Need remote check-in or exception? <span style={{ textDecoration: 'underline', whiteSpace: 'nowrap', fontWeight: 900 }}>Request here →</span>
                    </span>
                  </button>
                )}
              </>
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
          <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(15,23,42,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={18} color="#2563eb" />
              <p style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>Live Geolocation</p>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10b981', background: '#ecfdf5', padding: '4px 10px', borderRadius: 8, border: '1px solid #a7f3d0' }}>
              🔓 Quick Punch (Unrestricted)
            </span>
          </div>
          <MapContainer center={[currentLat, currentLng]} zoom={15} style={{ flex: 1, minHeight: 280, width: '100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='© OpenStreetMap © CARTO'
            />
            <Marker position={[currentLat, currentLng]}>
              <Popup>Your Current Location ({isOutsideGeofence ? 'Outside Geofence' : 'Inside Geofence'})</Popup>
            </Marker>
            <Circle
              center={[geofence.lat, geofence.lng]}
              radius={geofence.radius}
              pathOptions={{
                color: geofence.enabled ? (isOutsideGeofence ? '#ef4444' : '#10b981') : '#3b82f6',
                fillColor: geofence.enabled ? (isOutsideGeofence ? '#f87171' : '#34d399') : '#60a5fa',
                fillOpacity: 0.25,
                weight: 2
              }}
            >
              <Popup>{geofence.addressName} Perimeter ({geofence.radius}m)</Popup>
            </Circle>
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

      {/* Remote Clock-In Success Message */}
      {remoteSuccessMessage && (
        <div className="fade-in" style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 999999,
          padding: '16px 24px', borderRadius: 20, background: '#ecfdf5', border: '2px solid #10b981',
          color: '#065f46', fontWeight: 800, fontSize: '0.92rem', boxShadow: '0 20px 40px rgba(16,185,129,0.25)',
          display: 'flex', alignItems: 'center', gap: 12, maxWidth: 500, width: '90%'
        }}>
          <CheckCircle2 size={24} color="#10b981" flexShrink={0} />
          <span>{remoteSuccessMessage}</span>
          <button onClick={() => setRemoteSuccessMessage(null)} style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* Remote & Exception Attendance Request Modal */}
      {showRemoteModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: 20 }}>
          <div className="card glass fade-in" style={{ width: '100%', maxWidth: 520, background: 'white', borderRadius: 26, padding: 28, border: '1px solid rgba(15,23,42,0.1)', boxShadow: '0 25px 50px rgba(15,23,42,0.35)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(217,119,6,0.15)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Request Remote Attendance</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Executive exception authorization form</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowRemoteModal(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRemoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569', marginBottom: 4 }}>
                  <span><strong>Employee:</strong> {user.name}</span>
                  <span><strong>Punch Type:</strong> <strong style={{ color: isClockedIn ? '#dc2626' : '#2563eb' }}>{isClockedIn ? 'CLOCK OUT' : 'CLOCK IN'}</strong></span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} color="#d97706" />
                  <span>GPS Offset: <strong>{Math.round(distMeters)}m outside</strong> {geofence.addressName}</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: 6, textTransform: 'uppercase' }}>
                  Exception Category / Reason
                </label>
                <select
                  value={remoteCategory}
                  onChange={e => setRemoteCategory(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', outline: 'none', background: 'white' }}
                >
                  <option value="Remote Work / Work From Home (WFH)">🏠 Remote Work / Work From Home (WFH)</option>
                  <option value="Client Site Visit / Field Operations">🏢 Client Site Visit / Field Operations</option>
                  <option value="Business Travel / Official Delegation">✈️ Business Travel / Official Delegation</option>
                  <option value="GPS Signal Accuracy / Hardware Calibration Issue">📡 GPS Signal Accuracy / Calibration Issue</option>
                  <option value="Emergency / Other Operational Directive">🚨 Emergency / Supervisor Approved Mandate</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: 6, textTransform: 'uppercase' }}>
                  Work Activity & Justification Note
                </label>
                <textarea
                  rows={3}
                  value={remoteNote}
                  onChange={e => setRemoteNote(e.target.value)}
                  placeholder="Provide specific details about your remote work, client visit, or why you cannot clock in at the office terminal..."
                  required
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '10px 12px', background: '#eff6ff', borderRadius: 12, border: '1px solid #bfdbfe' }}>
                <input
                  type="checkbox"
                  checked={remoteAttachCheck}
                  onChange={e => setRemoteAttachCheck(e.target.checked)}
                  required
                  style={{ marginTop: 3, accentColor: '#2563eb' }}
                />
                <span style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 600, lineHeight: 1.4 }}>
                  I certify that my current coordinates and time stamp represent true operational attendance. I consent to executive GPS audit verification.
                </span>
              </label>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowRemoteModal(false)}
                  disabled={submittingRemote}
                  style={{ flex: 1, padding: '13px', borderRadius: 14, background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRemote}
                  style={{ flex: 2, padding: '13px', borderRadius: 14, background: submittingRemote ? '#64748b' : '#d97706', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.92rem', cursor: submittingRemote ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: submittingRemote ? 'none' : '0 6px 20px rgba(217,119,6,0.35)' }}
                >
                  {submittingRemote ? <><Loader2 size={18} className="spin" /> Submitting Request...</> : <><Send size={18} /> Submit Attendance Request</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Todo List Feature */}
      <TodosWidget />
    </div>
  );
}
