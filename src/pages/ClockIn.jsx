import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, CheckCircle2, Clock, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/db';
import { realtimeBus } from '../lib/realtime';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
};

const getPunchValidation = (punchType, punchDateObj, userId) => {
  try {
    const saved = localStorage.getItem(`realynk_roster_${userId}`);
    const roster = saved ? JSON.parse(saved) : {};
    const day = punchDateObj.getDate();
    const shiftObj = roster[day] || { shift: 'Default Morning Shift', time: '08:00 AM - 05:00 PM' };
    
    const times = shiftObj.time ? shiftObj.time.split('-') : ['08:00 AM', '05:00 PM'];
    const startTimeStr = times[0] ? times[0].trim() : '08:00 AM';
    const endTimeStr = times[1] ? times[1].trim() : '05:00 PM';

    const currentMins = punchDateObj.getHours() * 60 + punchDateObj.getMinutes();

    if (punchType === 'IN') {
      const scheduledStart = parseTimeToMinutes(startTimeStr);
      if (scheduledStart !== null && currentMins > scheduledStart + 5) {
        const lateMins = currentMins - scheduledStart;
        return { status: 'LATE', lateMinutes: lateMins, shiftTitle: shiftObj.shift || 'Scheduled Shift', scheduledTime: startTimeStr };
      }
      return { status: 'ON TIME', lateMinutes: 0, shiftTitle: shiftObj.shift || 'Scheduled Shift', scheduledTime: startTimeStr };
    } else {
      const scheduledEnd = parseTimeToMinutes(endTimeStr);
      if (scheduledEnd !== null && currentMins < scheduledEnd - 5) {
        const earlyMins = scheduledEnd - currentMins;
        return { status: 'UNDERTIME', lateMinutes: earlyMins, shiftTitle: shiftObj.shift || 'Scheduled Shift', scheduledTime: endTimeStr };
      }
      return { status: 'ON TIME', lateMinutes: 0, shiftTitle: shiftObj.shift || 'Scheduled Shift', scheduledTime: endTimeStr };
    }
  } catch {
    return { status: 'ON TIME', lateMinutes: 0, shiftTitle: 'Regular Shift', scheduledTime: '08:00 AM' };
  }
};

export default function ClockIn() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState(() => db.getUserLogs(user.userId));
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState(null);
  const [punching, setPunching] = useState(false);
  const [punchResultModal, setPunchResultModal] = useState(null);
  const btnRef = useRef();
  const ringRef = useRef();
  const pulseAnim = useRef(null);
  const pageRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(pageRef.current.querySelectorAll('.fade-in'), {
        y: 24, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out',
      });
    });
    return () => ctx.revert();
  }, []);

  const [activeElapsed, setActiveElapsed] = useState(null);

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date());
      const activeSaved = localStorage.getItem(`realynk_active_shift_${user.userId}`);
      if (activeSaved) {
        try {
          const parsed = JSON.parse(activeSaved);
          const diffMs = Date.now() - parsed.startTime;
          const totalSecs = Math.max(0, Math.floor(diffMs / 1000));
          const h = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
          const m = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
          const s = String(totalSecs % 60).padStart(2, '0');
          setActiveElapsed(`${h}:${m}:${s}`);
        } catch {
          setActiveElapsed(null);
        }
      } else {
        setActiveElapsed(null);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [user.userId]);

  const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const lastLog = sortedLogs[0];
  const isClockedIn = lastLog?.type === 'IN';

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
    setPunching(true);
    gsap.to(btnRef.current, { scale: 0.92, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.inOut' });
    const nextType = isClockedIn ? 'OUT' : 'IN';
    const nowObj = new Date();
    const validation = getPunchValidation(nextType, nowObj, user.userId);

    const punch = (lat, lng) => {
      const addedLog = db.addLog({
        logId: `LOG-${Date.now()}`,
        userId: user.userId,
        type: nextType,
        timestamp: nowObj.toISOString(),
        latitude: lat, longitude: lng,
        deviceInfo: navigator.userAgent.slice(0, 80),
        status: validation.status,
        lateMinutes: validation.lateMinutes
      });

      // Realtime Active Shift Management
      if (nextType === 'IN') {
        const sessionObj = {
          startTime: nowObj.getTime(),
          userName: user.name || user.email,
          userId: user.userId,
          department: user.department || 'General'
        };
        localStorage.setItem(`realynk_active_shift_${user.userId}`, JSON.stringify(sessionObj));
        const activeAll = JSON.parse(localStorage.getItem('realynk_live_active_shifts')) || {};
        activeAll[user.userId] = sessionObj;
        localStorage.setItem('realynk_live_active_shifts', JSON.stringify(activeAll));
      } else {
        localStorage.removeItem(`realynk_active_shift_${user.userId}`);
        const activeAll = JSON.parse(localStorage.getItem('realynk_live_active_shifts')) || {};
        delete activeAll[user.userId];
        localStorage.setItem('realynk_live_active_shifts', JSON.stringify(activeAll));
        setActiveElapsed(null);
      }

      // Push Realtime Broadcast Notification across windows/tabs/devices
      realtimeBus.broadcast({
        id: `NTF-${Date.now()}`,
        type: nextType === 'IN' ? 'CLOCK_IN' : 'CLOCK_OUT',
        title: nextType === 'IN' ? '🟢 Biometric Clock-In' : '🛑 Biometric Clock-Out',
        desc: `${user.name || user.email} punched ${nextType} (${validation.status}).`,
        time: nowObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        unread: true,
        userId: user.userId,
        userName: user.name || user.email,
        department: user.department || 'Shared Services',
        isActive: nextType === 'IN'
      });

      if (lat && lng) setLocation({ lat, lng });
      setLogs(db.getUserLogs(user.userId));
      setPunching(false);
      setPunchResultModal({ ...validation, type: nextType, timestamp: nowObj });
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

  const hours = String(time.getHours()).padStart(2, '0');
  const mins = String(time.getMinutes()).padStart(2, '0');
  const secs = String(time.getSeconds()).padStart(2, '0');

  return (
    <div ref={pageRef} style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      
      {/* Validation Result Modal / Toast */}
      {punchResultModal && (
        <div className="fade-in" style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          width: '90%', maxWidth: 420, padding: 20, borderRadius: 20,
          background: punchResultModal.status === 'ON TIME' ? '#065f46' : '#991b1b',
          color: 'white', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {punchResultModal.status === 'ON TIME' ? <CheckCircle2 size={32} color="#6ee7b7" /> : <AlertTriangle size={32} color="#fca5a5" />}
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                  Clock {punchResultModal.type}: {punchResultModal.status}
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>
                  {punchResultModal.shiftTitle} (Scheduled: {punchResultModal.scheduledTime})
                </p>
                {punchResultModal.lateMinutes > 0 && (
                  <span style={{ display: 'inline-block', marginTop: 6, padding: '3px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', fontWeight: 800, fontSize: '0.78rem' }}>
                    {punchResultModal.status === 'LATE' ? `⚠️ +${punchResultModal.lateMinutes} mins Late` : `⚠️ Early Out by ${punchResultModal.lateMinutes} mins`}
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => setPunchResultModal(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}>
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="fade-in" style={{ textAlign: 'center', marginBottom: 28 }}>
        <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
          {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <div style={{
          fontSize: 'clamp(3rem, 16vw, 5rem)', fontWeight: 800, letterSpacing: '-2px',
          fontVariantNumeric: 'tabular-nums', lineHeight: 1,
          color: '#0f172a',
          textShadow: '0 2px 20px rgba(15,23,42,0.1)',
        }}>
          {hours}:{mins}<span style={{ fontSize: '0.45em', verticalAlign: 'super', marginLeft: 4, opacity: 0.6 }}>{secs}</span>
        </div>

        {activeElapsed && (
          <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.2))', border: '1px solid rgba(16,185,129,0.35)', color: '#047857', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(16,185,129,0.1)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            Active Realtime Shift: {activeElapsed}
          </div>
        )}
      </div>

      {/* Big Clock Button */}
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div ref={ringRef} style={{
            position: 'absolute', width: 180, height: 180, borderRadius: '50%',
            border: `2px solid ${isClockedIn ? '#022c22' : '#1d4ed8'}`,
            opacity: 0.3,
          }} />
          <button ref={btnRef} onClick={handlePunch} disabled={punching} style={{
            width: 148, height: 148, borderRadius: '50%', border: 'none', cursor: punching ? 'wait' : 'pointer',
            background: isClockedIn ? '#1e40af' : '#2563eb',
            color: 'white', fontSize: '1rem', fontWeight: 800, letterSpacing: '0.05em',
            boxShadow: isClockedIn
              ? '0 0 60px rgba(6,95,70,0.4), 0 8px 32px rgba(15,23,42,0.25)'
              : '0 0 60px rgba(29,78,216,0.4), 0 8px 32px rgba(15,23,42,0.25)',
            transition: 'box-shadow 0.4s',
          }}>
            {punching ? '...' : isClockedIn ? 'CLOCK\nOUT' : 'CLOCK\nIN'}
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="fade-in" style={{
        borderRadius: 20, overflow: 'hidden',
        border: '1px solid rgba(15,23,42,0.08)', marginBottom: 20,
      }}>
        <div style={{ padding: '12px 16px', background: 'rgba(15,23,42,0.03)', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
          <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>Last Punch Biometric Geolocation</p>
        </div>
        <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={14} style={{ height: 180 }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='© OpenStreetMap © CARTO' />
          <Marker position={[mapCenter.lat, mapCenter.lng]}><Popup>Last punch location</Popup></Marker>
        </MapContainer>
      </div>

      {/* Today timeline */}
      <div className="fade-in" style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 20, padding: 20, boxShadow: '0 4px 24px rgba(15,23,42,0.05)' }}>
        <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px' }}>Today's Biometric Log</p>
        {todayLogs.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0', margin: 0 }}>No attendance records punched today.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {todayLogs.map(log => (
              <div key={log.logId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: log.type === 'IN' ? '#2563eb' : '#dc2626', flexShrink: 0 }} />
                  <div>
                    <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.88rem', display: 'block' }}>Clock {log.type === 'IN' ? 'In' : 'Out'}</span>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>{new Date(log.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                  </div>
                </div>
                <div>
                  <span style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 800,
                    background: log.status === 'LATE' || log.status === 'UNDERTIME' ? '#fef2f2' : '#ecfdf5',
                    color: log.status === 'LATE' || log.status === 'UNDERTIME' ? '#dc2626' : '#10b981',
                    border: `1px solid ${log.status === 'LATE' || log.status === 'UNDERTIME' ? '#fca5a5' : '#a7f3d0'}`
                  }}>
                    {log.status === 'LATE' ? `⚠️ LATE (+${log.lateMinutes}m)` : log.status === 'UNDERTIME' ? `⚠️ EARLY OUT` : `🟢 ON TIME`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
