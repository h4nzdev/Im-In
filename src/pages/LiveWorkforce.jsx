import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { Activity, Clock, LogOut, MessageSquare, Shield, Users, Search, AlertCircle } from 'lucide-react';
import { db } from '../lib/db';
import { realtimeBus } from '../lib/realtime';
import { showToast, showAlert } from '../lib/alert';

export default function LiveWorkforce() {
  const navigate = useNavigate();
  const [users, setUsers] = useState(() => db.getUsers());
  const [logs, setLogs] = useState(() => db.getLogs());
  const [now, setNow] = useState(Date.now());
  const [search, setSearch] = useState('');
  const [livePresence, setLivePresence] = useState({});
  const containerRef = useRef();

  useEffect(() => {
    const unsubPresence = realtimeBus.onPresenceSync(setLivePresence);
    return () => unsubPresence();
  }, []);

  // Re-sync users from localStorage (which is kept fresh by initSupabaseSync)
  // every 10 seconds so is_active changes from Supabase show up without a reload.
  useEffect(() => {
    const refresh = () => setUsers(db.getUsers());
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, []);

  // Pull is_active + status from Supabase profiles every 15 s.
  // This is the main driver for showing Online vs Offline correctly.
  useEffect(() => {
    const poll = async () => {
      await db.syncProfiles();
      setUsers(db.getUsers());
    };
    poll(); // run immediately on mount
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current.querySelectorAll('.stagger-item'), {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power3.out'
      });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const unsub = realtimeBus.subscribe(async (payload) => {
      if (payload && (payload.type === 'CLOCK_IN' || payload.type === 'CLOCK_OUT')) {
        await db.syncLogs();
        setLogs(db.getLogs());
        // Refresh users too so is_active changes are picked up
        setUsers(db.getUsers());
      }
    });
    return () => unsub();
  }, []);

  // Compute active status and shift times
  const activeData = useMemo(() => {
    const map = {};

    users.forEach(u => {
      // Find latest log for user today
      const userLogs = logs.filter(l => l.userId === u.userId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      if (userLogs.length > 0) {
        const latest = userLogs[0];
        if (latest.type === 'IN') {
          map[u.userId] = {
            startTime: new Date(latest.timestamp).getTime(),
            status: 'Active',
            logId: latest.logId || latest.id
          };
        }
      }
    });

    return { map };
  }, [users, logs]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (search.trim()) {
        const q = search.toLowerCase();
        return u.name.toLowerCase().includes(q) || u.userId.toLowerCase().includes(q) || u.department.toLowerCase().includes(q);
      }
      return true;
    });
  }, [users, search]);

  const handleForceClockOut = (userId, name) => {
    showAlert(
      `Force Clock Out ${name}?`,
      `This will immediately clock out ${name} and end their active session.`,
      'warning'
    ).then((confirmed) => {
      if (confirmed) {
        db.updateUser(userId, { activeShift: null });
        db.addLog({
          logId: `LOG-${Date.now()}`,
          userId,
          type: 'OUT',
          timestamp: new Date().toISOString(),
          status: 'Force Logged Out by Admin',
          latitude: 14.5995,
          longitude: 120.9842,
          deviceInfo: 'Admin Force Clock Out'
        });
        realtimeBus.broadcast({ type: 'ADMIN_FORCE_LOGOUT', targetUserId: userId });
        realtimeBus.broadcast({ type: 'CLOCK_OUT', userId: userId, userName: name });
        setLogs(db.getLogs());
        showToast(`Forced Clock Out applied to ${name}`);
      }
    });
  };

  const handleSendMessage = (name) => {
    showToast(`Direct message interface opened for ${name} (Mock)`);
  };

  return (
    <div ref={containerRef} style={{ width: '100%', margin: '0 auto', paddingBottom: 40 }}>
      {/* Header */}
      <div className="stagger-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={28} color="#10b981" /> Live Workforce Supervision
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '6px 0 0', fontWeight: 500 }}>
            Real-time monitoring and administrative actions for currently active personnel
          </p>
        </div>

        <div style={{ position: 'relative', width: 280 }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search active users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', height: 44, paddingLeft: 42, borderRadius: 14, border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600, outline: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="card glass stagger-item" style={{ padding: '20px 24px', borderRadius: 24, marginBottom: 24, display: 'flex', gap: 32, alignItems: 'center', border: '1px solid rgba(16,185,129,0.3)', background: 'linear-gradient(to right, rgba(255,255,255,0.95), rgba(240,253,244,0.4))' }}>
        <div>
          <p style={{ color: '#047857', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', margin: '0 0 4px', letterSpacing: '0.05em' }}>Total Active</p>
          <p style={{ color: '#0f172a', fontSize: '2.2rem', fontWeight: 900, margin: 0, lineHeight: 1 }}>{filteredUsers.length}</p>
        </div>
        <div style={{ width: 1, height: 40, background: 'rgba(16,185,129,0.2)' }} />
        <div>
          <p style={{ color: '#047857', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', margin: '0 0 4px', letterSpacing: '0.05em' }}>System Status</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
            Live Broadcast Active
          </div>
        </div>
      </div>

      {/* Grid of Active Personnel */}
      {filteredUsers.length === 0 ? (
        <div className="stagger-item" style={{ padding: 60, textAlign: 'center', background: 'rgba(255,255,255,0.5)', borderRadius: 24, border: '1px solid rgba(15,23,42,0.08)' }}>
          <Shield size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
          <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>No Active Personnel</h3>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 500 }}>There are currently no users logged in or matching your search.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filteredUsers.map(u => {
            const shiftInfo = activeData.map[u.userId];
            let elapsedStr = '00:00:00';
            let statusLabel = 'Online';
            
            if (shiftInfo) {
              const diffSec = Math.max(0, Math.floor((now - shiftInfo.startTime) / 1000));
              const h = String(Math.floor(diffSec / 3600)).padStart(2, '0');
              const m = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
              const s = String(diffSec % 60).padStart(2, '0');
              elapsedStr = `${h}:${m}:${s}`;
              statusLabel = shiftInfo.status;
            }

            // isOnline: true if the Supabase Presence channel has this user,
            // OR if the DB profile says is_active=true,
            // OR if they have an open shift in logs (most reliable for cross-tab).
            const isOnline = Boolean(
              livePresence[u.userId] ||
              u.isActive ||
              shiftInfo
            );
            const isOnBreak = statusLabel === 'On Break';

            return (
              <div key={u.userId} className="stagger-item glass" style={{
                padding: '20px', borderRadius: 20, background: 'white',
                border: !isOnline ? '1.5px solid #e2e8f0' : isOnBreak ? '1.5px solid #fcd34d' : '1.5px solid #6ee7b7',
                boxShadow: !isOnline ? 'none' : isOnBreak ? '0 8px 24px rgba(245,158,11,0.08)' : '0 8px 24px rgba(16,185,129,0.08)',
                position: 'relative', overflow: 'hidden',
                opacity: isOnline ? 1 : 0.7
              }}>
                {/* Status Indicator Bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: !isOnline ? '#cbd5e1' : isOnBreak ? '#fbbf24' : '#10b981' }} />
                
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 16, background: !isOnline ? '#f1f5f9' : isOnBreak ? '#fffbeb' : '#ecfdf5', color: !isOnline ? '#94a3b8' : isOnBreak ? '#d97706' : '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 900 }}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: !isOnline ? '#64748b' : '#0f172a' }}>{u.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{u.department} · {u.userId}</div>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Current Session</p>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 10,
                      background: !isOnline ? 'rgba(148,163,184,0.1)' : isOnBreak ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                      color: !isOnline ? '#64748b' : isOnBreak ? '#b45309' : '#047857', fontWeight: 800, fontSize: '0.75rem'
                    }}>
                      <Activity size={12} /> {!isOnline ? 'Offline' : statusLabel}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Active Duration</p>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: !isOnline ? '#94a3b8' : '#0f172a', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={14} color="#94a3b8" /> {!isOnline ? '--:--:--' : elapsedStr}
                    </div>
                  </div>
                </div>

                {/* Recommended Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    onClick={() => handleSendMessage(u.name)}
                    style={{
                      padding: '10px', borderRadius: 12, border: '1px solid #bfdbfe', background: '#eff6ff',
                      color: '#054daf', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                    onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
                  >
                    <MessageSquare size={14} /> Message
                  </button>
                  <button
                    onClick={() => handleForceClockOut(u.userId, u.name)}
                    disabled={!isOnline}
                    style={{
                      padding: '10px', borderRadius: 12, border: !isOnline ? '1px solid #f1f5f9' : '1px solid #fecdd3', background: !isOnline ? '#f8fafc' : '#fff1f2',
                      color: !isOnline ? '#94a3b8' : '#e11d48', fontWeight: 700, fontSize: '0.8rem', cursor: !isOnline ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { if (isOnline) e.currentTarget.style.background = '#ffe4e6'; }}
                    onMouseLeave={e => { if (isOnline) e.currentTarget.style.background = '#fff1f2'; }}
                  >
                    <LogOut size={14} /> Force Out
                  </button>
                  <button
                    onClick={() => navigate(`/admin/logs?userId=${u.userId}`)}
                    style={{
                      gridColumn: '1 / -1', padding: '10px', borderRadius: 12, border: '1px solid #e2e8f0', background: 'white',
                      color: '#475569', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    <AlertCircle size={14} /> View Attendance Log
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
