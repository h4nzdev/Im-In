import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, CheckCircle2, Clock, X, Lock, Unlock, MapPin, UserCheck, Shield, Sparkles, Loader2, Navigation, Send, FileText } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/db';
import { realtimeBus } from '../lib/realtime';
import { getRealAddress, calculateDistanceMeters } from '../lib/geo';
import { showToast } from '../lib/alert';

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
  const [attendanceMode, setAttendanceMode] = useState('TAP');
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [showEODModal, setShowEODModal] = useState(false);
  const [eodReportText, setEodReportText] = useState('');
  const [remoteCategory, setRemoteCategory] = useState('Remote Work / Work From Home (WFH)');
  const [remoteNote, setRemoteNote] = useState('');
  const [remoteAttachCheck, setRemoteAttachCheck] = useState(true);
  const [submittingRemote, setSubmittingRemote] = useState(false);
  const [remoteSuccessMessage, setRemoteSuccessMessage] = useState(null);

  // Client Management (ERP)
  const [showClientModal, setShowClientModal] = useState(false);
  const [shiftClient, setShiftClient] = useState('');
  const [shiftCampaign, setShiftCampaign] = useState('');
  const [shiftTask, setShiftTask] = useState('');
  const [allClients] = useState(() => db.getClients());
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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => setLocation({ lat: 14.5995, lng: 120.9842 }),
        { timeout: 8000 }
      );
    }
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

  const geofence = db.getGeofence();
  const currentLat = Number(location?.lat ?? lastLog?.latitude ?? 14.5995) || 14.5995;
  const currentLng = Number(location?.lng ?? lastLog?.longitude ?? 120.9842) || 120.9842;
  const distMeters = calculateDistanceMeters(currentLat, currentLng, geofence.lat, geofence.lng);
  const isOutsideGeofence = geofence.enabled && distMeters > geofence.radius;

  const validClients = (user.assignedClientIds || []).map(id => allClients.find(c => c.id === id)).filter(Boolean);
  const hasNoClients = !isClockedIn && validClients.length === 0;

  useEffect(() => {
    console.log('DEBUG ClockIn - Client Validation:', {
      isClockedIn,
      assignedIds: user.assignedClientIds,
      allClientsCount: allClients.length,
      validClientsCount: validClients.length,
      hasNoClients
    });
  }, [user.assignedClientIds, allClients, isClockedIn, validClients.length, hasNoClients]);

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
    if (punching || isOutsideGeofence || hasNoClients) return;
    const nextType = isClockedIn ? 'OUT' : 'IN';
    
    if (nextType === 'OUT' && lastLog?.timestamp) {
      const diffSecs = Math.floor((Date.now() - new Date(lastLog.timestamp).getTime()) / 1000);
      if (diffSecs < 60) {
        showToast(`Please wait ${60 - diffSecs} seconds before clocking out.`);
        return;
      }
    }

    if (nextType === 'IN') {
      setShiftClient(validClients[0].id);
      setShowClientModal(true);
    } else {
      setShowEODModal(true);
    }
  };

  const tryOpenRemoteModal = () => {
    if (hasNoClients) return;
    setShowRemoteModal(true);
  };

  const executePunch = (nextType, reportText = null) => {
    setPunching(true);
    setShowClientModal(false);
    gsap.to(btnRef.current, { scale: 0.92, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.inOut' });
    const nowObj = new Date();
    const validation = getPunchValidation(nextType, nowObj, user.userId);

    const punch = async (lat, lng) => {
      const address = await getRealAddress(lat, lng);
      
      // If OUT, find the last IN log to keep the client data matching (or backend will pair them)
      let currentClient = shiftClient;
      let currentCamp = shiftCampaign;
      let currentTask = shiftTask;
      
      if (nextType === 'OUT' && lastLog && lastLog.type === 'IN') {
        currentClient = lastLog.clientId || null;
        currentCamp = lastLog.campaignId || null;
        currentTask = lastLog.taskName || null;
      }

      const addedLog = db.addLog({
        logId: `LOG-${Date.now()}`,
        userId: user.userId,
        type: nextType,
        timestamp: nowObj.toISOString(),
        latitude: lat, longitude: lng, address,
        deviceInfo: navigator.userAgent.slice(0, 80),
        status: validation.status,
        lateMinutes: validation.lateMinutes,
        clientId: nextType === 'IN' ? shiftClient : currentClient,
        campaignId: nextType === 'IN' ? shiftCampaign : currentCamp,
        taskName: nextType === 'IN' ? shiftTask : currentTask
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
        db.updateUser(user.userId, { activeShift: sessionObj });
        const activeAll = JSON.parse(localStorage.getItem('realynk_live_active_shifts')) || {};
        activeAll[user.userId] = sessionObj;
        localStorage.setItem('realynk_live_active_shifts', JSON.stringify(activeAll));
      } else {
        localStorage.removeItem(`realynk_active_shift_${user.userId}`);
        db.updateUser(user.userId, { activeShift: null });
        const activeAll = JSON.parse(localStorage.getItem('realynk_live_active_shifts')) || {};
        delete activeAll[user.userId];
        localStorage.setItem('realynk_live_active_shifts', JSON.stringify(activeAll));
        setActiveElapsed(null);
        
        if (lastLog && lastLog.type === 'IN') {
          const start = new Date(lastLog.timestamp);
          const diffMs = nowObj - start;
          const hours = diffMs / (1000 * 60 * 60);
          if (hours > 0) {
            db.addAggregatedHour(user.userId, nowObj.toISOString().split('T')[0], hours, currentClient);
          }
        }
      }

      // Push Realtime Broadcast Notification across windows/tabs/devices
      realtimeBus.broadcast({
        id: `NTF-${Date.now()}`,
        type: nextType === 'IN' ? 'CLOCK_IN' : 'CLOCK_OUT',
        title: nextType === 'IN' ? 'Biometric Clock-In' : 'Biometric Clock-Out',
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

  const submitEODReport = (e) => {
    if (e) e.preventDefault();
    setShowEODModal(false);
    executePunch('OUT', eodReportText);
    setEodReportText('');
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

      // Update active shift local storage
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

      // Push Realtime Notification to Admins
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

  const hours = String(time.getHours()).padStart(2, '0');
  const mins = String(time.getMinutes()).padStart(2, '0');
  const secs = String(time.getSeconds()).padStart(2, '0');

  return (
    <div ref={pageRef} style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      
      {/* Validation Result Modal / Toast */}
      {/* Client Selection Modal */}
      {showClientModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="fade-in card glass" style={{ background: 'white', padding: 24, borderRadius: 24, width: '100%', maxWidth: 420, margin: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Start Timer</h2>
              <button onClick={() => setShowClientModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: 6 }}>Client *</label>
                <select value={shiftClient} onChange={e => setShiftClient(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none' }}>
                  {(user.assignedClientIds || []).map(id => {
                    const c = allClients.find(client => client.id === id);
                    return c ? <option key={id} value={id}>{c.name} {c.code ? `(${c.code})` : ''}</option> : null;
                  })}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: 6 }}>Campaign (Optional)</label>
                <input type="text" value={shiftCampaign} onChange={e => setShiftCampaign(e.target.value)} placeholder="e.g. Q3 Sales Outreach" style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: 6 }}>Task (Optional)</label>
                <input type="text" value={shiftTask} onChange={e => setShiftTask(e.target.value)} placeholder="e.g. Lead Generation" style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>

              <button onClick={() => executePunch('IN')} style={{ width: '100%', marginTop: 12, padding: '14px', borderRadius: 14, background: '#10b981', color: 'white', fontWeight: 900, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <CheckCircle2 size={18} /> Start Timer
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Attendance Mode Switcher */}
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          gap: 4, padding: 5, borderRadius: 50, background: '#f1f5f9', border: '1px solid #cbd5e1',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)'
        }}>
          <button
            type="button"
            onClick={() => setAttendanceMode('TAP')}
            style={{
              padding: '8px 18px', borderRadius: 50, border: 'none', outline: 'none', cursor: 'pointer',
              background: attendanceMode === 'TAP' ? '#054daf' : 'transparent',
              color: attendanceMode === 'TAP' ? '#ffffff' : '#475569',
              fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: attendanceMode === 'TAP' ? '0 4px 12px rgba(5, 77, 175,0.25)' : 'none',
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
              background: attendanceMode === 'FACE' ? '#054daf' : 'transparent',
              color: attendanceMode === 'FACE' ? '#ffffff' : '#475569',
              fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: attendanceMode === 'FACE' ? '0 4px 12px rgba(5, 77, 175,0.25)' : 'none',
              transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            👤 Face AI
            <span style={{
              padding: '2px 7px', borderRadius: 10,
              background: attendanceMode === 'FACE' ? 'rgba(255,255,255,0.25)' : '#dbeafe',
              color: attendanceMode === 'FACE' ? '#ffffff' : '#043e8a',
              fontSize: '0.68rem', fontWeight: 900
            }}>SOON</span>
          </button>
        </div>
      </div>

      {attendanceMode === 'FACE' ? (
        <div className="fade-in card glass" style={{ padding: '28px 20px', borderRadius: 24, textAlign: 'center', marginBottom: 36, border: '1.5px dashed #93c5fd', background: 'linear-gradient(180deg, rgba(239,246,255,0.85), rgba(255,255,255,0.95))', boxShadow: '0 12px 32px rgba(5, 77, 175,0.08)' }}>
          <div style={{ width: 84, height: 84, borderRadius: '50%', background: '#dbeafe', color: '#054daf', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '2.4rem', boxShadow: '0 8px 24px rgba(5, 77, 175,0.15)' }}>
            🧑‍💻
          </div>
          <span style={{ padding: '5px 12px', borderRadius: 20, background: '#043e8a', color: 'white', fontWeight: 800, fontSize: '0.74rem', display: 'inline-block', marginBottom: 12 }}>
            ⚡ COMING SOON TO ALL ENTERPRISE USERS
          </span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
            AI Facial & Liveness Verification
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.86rem', margin: '0 auto 20px', lineHeight: 1.5, maxWidth: 360 }}>
            Our neural 3D facial authentication pipeline is undergoing final device calibration. Soon you can punch in hands-free instantly just by looking at your terminal camera!
          </p>
          <div style={{ padding: '10px 14px', borderRadius: 14, background: 'white', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#334155', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            🔒 Biometric Encrypted Neural Template v2.4
          </div>
        </div>
      ) : (
        /* Big Clock Button */
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 36 }}>
          {isOutsideGeofence && !hasNoClients ? (
            <div className="fade-in" style={{
              width: '100%', maxWidth: 380, padding: '16px 18px', borderRadius: 20,
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
                onClick={tryOpenRemoteModal}
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

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div ref={ringRef} style={{
              position: 'absolute', width: 180, height: 180, borderRadius: '50%',
              border: `2px solid ${hasNoClients ? '#64748b' : isClockedIn ? '#022c22' : '#043e8a'}`,
              opacity: 0.3,
            }} />
            <button ref={btnRef} onClick={hasNoClients ? undefined : (isOutsideGeofence ? tryOpenRemoteModal : handlePunch)} disabled={punching || hasNoClients} style={{
              width: 148, height: 148, borderRadius: '50%', border: 'none',
              cursor: (punching || hasNoClients) ? 'not-allowed' : 'pointer',
              background: hasNoClients ? '#94a3b8' : isOutsideGeofence ? '#64748b' : punching ? '#475569' : isClockedIn ? '#033373' : '#054daf',
              color: 'white', fontSize: '0.92rem', fontWeight: 800, letterSpacing: '0.04em', whiteSpace: 'pre-wrap',
              boxShadow: (hasNoClients || isOutsideGeofence)
                ? '0 6px 20px rgba(100,116,139,0.3)'
                : isClockedIn
                ? '0 0 60px rgba(6,95,70,0.4), 0 8px 32px rgba(15,23,42,0.25)'
                : '0 0 60px rgba(4, 62, 138,0.4), 0 8px 32px rgba(15,23,42,0.25)',
              transition: 'all 0.3s',
              opacity: (punching || hasNoClients) ? 0.85 : 1,
            }}>
              {punching ? (isClockedIn ? '⏳ CLOCKING\nOUT...' : '⏳ CLOCKING\nIN...') : hasNoClients ? 'NO\nCLIENTS' : isOutsideGeofence ? '🔒 PERIMETER\nLOCKED' : isClockedIn ? 'CLOCK\nOUT' : 'CLOCK\nIN'}
            </button>
          </div>

          {/* Subtle Request Button when not outside geofence */}
          {!isOutsideGeofence && !hasNoClients && (
            <button
              type="button"
              onClick={tryOpenRemoteModal}
              style={{
                background: 'rgba(5, 77, 175, 0.08)',
                border: '1px solid rgba(5, 77, 175, 0.22)',
                borderRadius: 50,
                padding: '10px 18px',
                color: '#043e8a',
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
                boxShadow: '0 4px 14px rgba(5, 77, 175,0.08)',
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

          {hasNoClients && (
            <div className="fade-in" style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.22)',
              borderRadius: 50,
              padding: '10px 18px',
              color: '#991b1b',
              fontWeight: 800,
              fontSize: '0.82rem',
              marginTop: 20,
              marginBottom: 10,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.08)',
              maxWidth: '95%',
              textAlign: 'center',
              lineHeight: 1.4
            }}>
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              <span>No active clients assigned. Please contact Admin.</span>
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <div className="fade-in" style={{
        borderRadius: 20, overflow: 'hidden',
        border: '1px solid rgba(15,23,42,0.08)', marginBottom: 20,
      }}>
        <div style={{ padding: '12px 16px', background: 'rgba(15,23,42,0.03)', borderBottom: '1px solid rgba(15,23,42,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>Current Biometric Geolocation</p>
          {geofence.enabled ? (
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isOutsideGeofence ? '#dc2626' : '#10b981', background: isOutsideGeofence ? '#fef2f2' : '#ecfdf5', padding: '3px 8px', borderRadius: 8 }}>
              {isOutsideGeofence ? '⚠️ Outside Perimeter Circle' : '🟢 Inside Perimeter Circle'}
            </span>
          ) : (
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: 8 }}>
              🔓 Geofencing Unrestricted
            </span>
          )}
        </div>
        <MapContainer center={[currentLat, currentLng]} zoom={15} style={{ height: 210 }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='© OpenStreetMap © CARTO' />
          <Marker position={[currentLat, currentLng]}>
            <Popup>Your Current Location ({isOutsideGeofence ? 'Outside Geofence' : 'Inside Geofence'})</Popup>
          </Marker>
          <Circle
            center={[geofence.lat, geofence.lng]}
            radius={geofence.radius}
            pathOptions={{
              color: geofence.enabled ? (isOutsideGeofence ? '#ef4444' : '#10b981') : '#054daf',
              fillColor: geofence.enabled ? (isOutsideGeofence ? '#f87171' : '#34d399') : '#60a5fa',
              fillOpacity: 0.25,
              weight: 2
            }}
          >
            <Popup>{geofence.addressName} Perimeter ({geofence.radius}m)</Popup>
          </Circle>
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
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: log.type === 'IN' ? '#054daf' : '#dc2626', flexShrink: 0 }} />
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
                  <span><strong>Punch Type:</strong> <strong style={{ color: isClockedIn ? '#dc2626' : '#054daf' }}>{isClockedIn ? 'CLOCK OUT' : 'CLOCK IN'}</strong></span>
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
                  style={{ marginTop: 3, accentColor: '#054daf' }}
                />
                <span style={{ fontSize: '0.8rem', color: '#033373', fontWeight: 600, lineHeight: 1.4 }}>
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

      {/* ON-SCREEN DEBUG LOG */}
      <div style={{ marginTop: 40, padding: 20, background: '#1e293b', color: '#10b981', borderRadius: 12, fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        <strong>DEBUG LOG (Please screenshot this):</strong><br/>
        User Role: {user.role}<br/>
        Assigned Client IDs: {JSON.stringify(user.assignedClientIds)}<br/>
        All Clients Count: {allClients.length}<br/>
        Valid Clients Count: {validClients.length}<br/>
        Valid Clients Data: {JSON.stringify(validClients.map(c => c.id))}<br/>
        isClockedIn: {String(isClockedIn)}<br/>
        hasNoClients: {String(hasNoClients)}
      </div>

      {/* EOD Report Modal */}
      {showEODModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)' }} onClick={() => setShowEODModal(false)} />
          <div className="fade-in card glass" style={{ position: 'relative', width: '90%', maxWidth: 500, padding: 32, borderRadius: 28, boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(5, 77, 175, 0.15)', color: '#054daf', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>End of Shift Report</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Please summarize your accomplishments.</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowEODModal(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitEODReport} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: 6, textTransform: 'uppercase' }}>
                  Shift Accomplishments
                </label>
                <textarea
                  value={eodReportText}
                  onChange={e => setEodReportText(e.target.value)}
                  required
                  placeholder="What did you complete today? Any blockers?"
                  style={{ width: '100%', minHeight: 120, padding: '14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#0f172a', outline: 'none', background: 'white', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowEODModal(false)} style={{ flex: 1, padding: '14px', borderRadius: 14, background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                  Cancel
                </button>
                <button type="submit" disabled={punching || submittingRemote} style={{ flex: 2, padding: '14px', borderRadius: 14, background: '#054daf', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.9rem', cursor: (punching || submittingRemote) ? 'not-allowed' : 'pointer', opacity: (punching || submittingRemote) ? 0.7 : 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(5,77,175,0.3)' }}>
                  {(punching || submittingRemote) ? 'Processing...' : 'Submit & Clock Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
