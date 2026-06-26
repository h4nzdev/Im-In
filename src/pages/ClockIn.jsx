import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/db';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function ClockIn() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState(() => db.getUserLogs(user.userId));
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState(null);
  const [punching, setPunching] = useState(false);
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

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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
    const punch = (lat, lng) => {
      db.addLog({
        logId: `LOG-${Date.now()}`,
        userId: user.userId,
        type: isClockedIn ? 'OUT' : 'IN',
        timestamp: new Date().toISOString(),
        latitude: lat, longitude: lng,
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

  const hours = String(time.getHours()).padStart(2, '0');
  const mins = String(time.getMinutes()).padStart(2, '0');
  const secs = String(time.getSeconds()).padStart(2, '0');

  return (
    <div ref={pageRef} style={{ maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div className="fade-in" style={{ textAlign: 'center', marginBottom: 28 }}>
        <p style={{ color: 'rgba(100,116,139,0.75)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
          {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <div style={{
          fontSize: 'clamp(3rem, 16vw, 5rem)', fontWeight: 800, letterSpacing: '-2px',
          fontVariantNumeric: 'tabular-nums', lineHeight: 1,
          background: '#1e3a8a',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {hours}<span style={{ opacity: 0.5, animation: 'blink 1s step-end infinite' }}>:</span>{mins}
          <span style={{ fontSize: '0.45em', opacity: 0.6, marginLeft: 6 }}>{secs}</span>
        </div>
      </div>

      {/* Status badge */}
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px',
          background: isClockedIn ? 'rgba(29,78,216,0.12)' : 'rgba(100,116,139,0.1)',
          border: `1px solid ${isClockedIn ? 'rgba(29,78,216,0.3)' : 'rgba(100,116,139,0.18)'}`,
          borderRadius: 99,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isClockedIn ? '#1d4ed8' : '#64748b',
            boxShadow: isClockedIn ? '0 0 8px #1d4ed8' : 'none',
          }} />
          <span style={{ color: isClockedIn ? '#1d4ed8' : '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>
            {isClockedIn ? 'Currently Clocked In' : 'Not Clocked In'}
          </span>
        </div>
      </div>

      {/* Punch button */}
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div ref={ringRef} style={{
            position: 'absolute', width: 180, height: 180, borderRadius: '50%',
            border: `2px solid ${isClockedIn ? '#022c22' : '#1d4ed8'}`,
            opacity: 0.3,
          }} />
          <button ref={btnRef} onClick={handlePunch} disabled={punching} style={{
            width: 148, height: 148, borderRadius: '50%', border: 'none', cursor: punching ? 'wait' : 'pointer',
            background: isClockedIn
              ? '#1e40af'
              : '#2563eb',
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
          <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Last Punch Location</p>
        </div>
        <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={14} style={{ height: 180 }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='© OpenStreetMap © CARTO' />
          <Marker position={[mapCenter.lat, mapCenter.lng]}><Popup>Last punch location</Popup></Marker>
        </MapContainer>
      </div>

      {/* Today timeline */}
      <div className="fade-in" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 20, padding: 20, boxShadow: '0 4px 24px rgba(15,23,42,0.05)' }}>
        <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today</p>
        {todayLogs.length === 0 ? (
          <p style={{ color: 'rgba(100,116,139,0.55)', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>No punches yet today.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayLogs.map(log => (
              <div key={log.logId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(15,23,42,0.035)', borderRadius: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: log.type === 'IN' ? '#1d4ed8' : '#dc2626', flexShrink: 0 }} />
                <span style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.85rem', flex: 1 }}>Clock {log.type === 'IN' ? 'In' : 'Out'}</span>
                <span style={{ color: 'rgba(100,116,139,0.7)', fontSize: '0.82rem' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes blink { 50% { opacity: 0.15; } }`}</style>
    </div>
  );
}
