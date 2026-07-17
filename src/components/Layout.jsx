import { useEffect, useRef, useState } from 'react';
import { Outlet, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { LogOut, LayoutDashboard, Calendar, Shield, Briefcase, FileText, Clock, BarChart2, UserCheck, Smartphone, Download, X, CheckCircle2, Users, BookOpen, Bell, MapPin } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import BottomNav from './BottomNav';
import realynkLogo from '../assets/realynk.png';
import { realtimeBus } from '../lib/realtime';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

function AdminNotificationHeader() {
  const [notifications, setNotifications] = useState(() => JSON.parse(localStorage.getItem('realynk_admin_notifications')) || []);
  const [showDropdown, setShowDropdown] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(() => JSON.parse(localStorage.getItem('realynk_live_online_users')) || {});

  useEffect(() => {
    const pollLogs = async () => {
      if (!isSupabaseConfigured || !supabase) return;
      try {
        const { data: logs } = await supabase.from('attendance_logs').select('*').order('timestamp', { ascending: false }).limit(20);
        if (logs && logs.length > 0) {
          const notifs = JSON.parse(localStorage.getItem('realynk_admin_notifications')) || [];
          let changed = false;
          logs.forEach(l => {
            const nId = `LOGNTF-${l.log_id}`;
            if (!notifs.some(x => x.id === nId)) {
              notifs.unshift({
                id: nId,
                type: l.type === 'IN' ? 'CLOCK_IN' : 'CLOCK_OUT',
                title: l.type === 'IN' ? 'Biometric Clock-In' : 'Biometric Clock-Out',
                desc: `User (${l.user_id}) punched ${l.type} (${l.status || 'ON TIME'}).`,
                time: new Date(l.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                unread: true,
                userId: l.user_id,
                isActive: l.type === 'IN'
              });
              changed = true;
            }
          });
          if (changed) {
            const trimmed = notifs.slice(0, 30);
            localStorage.setItem('realynk_admin_notifications', JSON.stringify(trimmed));
            setNotifications(trimmed);
          }
        }
      } catch (err) {}
    };

    pollLogs();
    const pollInterval = setInterval(pollLogs, 3000);

    const unsub = realtimeBus.subscribe(() => {
      setNotifications(JSON.parse(localStorage.getItem('realynk_admin_notifications')) || []);
    });

    const pollOnlineInterval = setInterval(() => {
      const now = Date.now();
      const activeMap = JSON.parse(localStorage.getItem('realynk_live_online_users')) || {};
      const updatedMap = { ...activeMap };
      let changed = false;
      Object.keys(updatedMap).forEach(key => {
        if (now - updatedMap[key].lastSeen > 35000) {
          delete updatedMap[key];
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('realynk_live_online_users', JSON.stringify(updatedMap));
        setOnlineUsers(updatedMap);
      }
    }, 4000);

    return () => {
      unsub();
      clearInterval(pollInterval);
      clearInterval(pollOnlineInterval);
    };
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, unread: false }));
    setNotifications(updated);
    localStorage.setItem('realynk_admin_notifications', JSON.stringify(updated));
  };

  const deleteNotification = (e, id) => {
    e.stopPropagation();
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem('realynk_admin_notifications', JSON.stringify(updated));
  };

  const clearAllNotifications = (e) => {
    if (e) e.stopPropagation();
    setNotifications([]);
    localStorage.setItem('realynk_admin_notifications', JSON.stringify([]));
  };

  return (
    <header className="card glass" style={{
      position: 'relative',
      zIndex: 40,
      padding: '14px 22px',
      borderRadius: 20,
      marginBottom: 24,
      border: '1px solid rgba(15,23,42,0.08)',
      background: 'rgba(255,255,255,0.92)',
      boxShadow: '0 4px 20px rgba(15,23,42,0.05)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, flexWrap: 'wrap', width: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', display: 'inline-block' }} />
        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>Realtime Command Center</span>
        <span style={{ padding: '3px 10px', borderRadius: 12, background: 'rgba(16,185,129,0.12)', color: '#047857', fontWeight: 800, fontSize: '0.78rem' }}>
          {Object.keys(onlineUsers).length} Personnel Active Online
        </span>
      </div>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            position: 'relative', background: showDropdown ? '#eff6ff' : 'white',
            border: '1px solid rgba(15,23,42,0.12)', borderRadius: 12, padding: '8px 14px',
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s',
            fontWeight: 800, color: '#0f172a', fontSize: '0.85rem'
          }}
        >
          <Bell size={18} color="#054daf" />
          Realtime Alerts
          {unreadCount > 0 && (
            <span style={{
              padding: '2px 7px', borderRadius: 10, background: '#ef4444', color: 'white',
              fontSize: '0.72rem', fontWeight: 800, boxShadow: '0 2px 6px rgba(239,68,68,0.4)'
            }}>
              {unreadCount}
            </span>
          )}
        </button>

        {showDropdown && (
          <div className="card glass" style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 370,
            borderRadius: 20, background: 'white', boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
            border: '1px solid rgba(15,23,42,0.1)', overflow: 'hidden', zIndex: 200
          }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>Realtime Notifications</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#054daf', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}>
                    Mark Read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearAllNotifications} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Trash2 size={13} /> Clear All
                  </button>
                )}
              </div>
            </div>

            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: 28, textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                  No notifications recorded yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} style={{
                    padding: '12px 18px', borderBottom: '1px solid #f1f5f9',
                    background: n.unread ? 'rgba(5, 77, 175,0.06)' : 'white',
                    transition: 'background 0.15s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 8 }}>
                        {n.isActive ? <CheckCircle2 size={15} color="#059669" /> : <LogOut size={15} color="#dc2626" />}
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>{typeof n.title === 'string' ? n.title.replace(/[🟢🛑]\s*/g, '') : n.title}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap' }}>{n.time}</span>
                        <button
                          onClick={(e) => deleteNotification(e, n.id)}
                          title="Delete notification"
                          style={{
                            background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6,
                            color: '#dc2626', width: 24, height: 24, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s',
                            flexShrink: 0
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>{n.desc}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, logout } = useAuthStore();
  const sidebarRef = useRef();
  const [showBanner, setShowBanner] = useState(() => !localStorage.getItem('realynk_app_installed'));
  const [showModal, setShowModal] = useState(false);
  const [installed, setInstalled] = useState(false);

  // 4-Digit Quick Access PIN Lock State
  const [pinEntry, setPinEntry] = useState('');
  const [pinError, setPinError] = useState('');
  const pinDotsRef = useRef(null);
  const pinInputRef = useRef(null);

  const [isPinLocked, setIsPinLocked] = useState(() => {
    if (!user) return false;
    const hasPin = Boolean(localStorage.getItem(`realynk_user_pin_${user.userId}`) || user.pin);
    const isUnlocked = sessionStorage.getItem(`realynk_pin_unlocked_${user.userId}`) === 'true';
    return hasPin && !isUnlocked;
  });

  useEffect(() => {
    if (!user) return;
    const checkPinLock = () => {
      const hasPin = Boolean(localStorage.getItem(`realynk_user_pin_${user.userId}`) || user.pin);
      const isUnlocked = sessionStorage.getItem(`realynk_pin_unlocked_${user.userId}`) === 'true';
      if (hasPin && !isUnlocked) {
        setIsPinLocked(true);
      }
    };
    checkPinLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        sessionStorage.setItem('realynk_hidden_timestamp', Date.now().toString());
      } else if (document.visibilityState === 'visible') {
        const hiddenTime = Number(sessionStorage.getItem('realynk_hidden_timestamp') || 0);
        const hasPin = Boolean(localStorage.getItem(`realynk_user_pin_${user.userId}`) || user.pin);
        if (hasPin && hiddenTime > 0 && Date.now() - hiddenTime > 2000) {
          sessionStorage.removeItem(`realynk_pin_unlocked_${user.userId}`);
          setIsPinLocked(true);
          setPinEntry('');
          setPinError('');
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user]);

  const handlePinDigit = (digit) => {
    if (pinEntry.length >= 4) return;
    const nextPin = pinEntry + digit;
    setPinEntry(nextPin);
    setPinError('');

    if (nextPin.length === 4) {
      const savedPin = localStorage.getItem(`realynk_user_pin_${user.userId}`) || user.pin;
      if (nextPin === savedPin) {
        sessionStorage.setItem(`realynk_pin_unlocked_${user.userId}`, 'true');
        setTimeout(() => {
          setIsPinLocked(false);
          setPinEntry('');
        }, 120);
      } else {
        setPinError('Incorrect PIN. Please try again.');
        if (pinDotsRef.current) {
          gsap.fromTo(pinDotsRef.current, { x: -10 }, { x: 10, duration: 0.08, repeat: 5, yoyo: true, ease: 'power1.inOut', onComplete: () => {
            gsap.set(pinDotsRef.current, { x: 0 });
          }});
        }
        setTimeout(() => setPinEntry(''), 400);
      }
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (sidebarRef.current) {
        gsap.from(sidebarRef.current, { x: -20, opacity: 0, duration: 0.5, ease: 'power3.out' });
      }
    });
    return () => ctx.revert();
  }, []);

  if (!token) return <Navigate to="/login" replace />;

  const isAdmin = user?.role === 'Admin';

  const userLinks = [
    { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/assignments', icon: BookOpen,      label: 'SOP & Tasks' },
    { to: '/logs',      icon: Clock,           label: 'Logs'      },
    { to: '/calendar',  icon: Calendar,        label: 'Schedule'  },
    { to: '/leaves',    icon: Briefcase,       label: 'Leaves'    },
    { to: '/analytics', icon: BarChart2,       label: 'Analytics' },
  ];
  const adminLinks = [
    { to: '/admin',           icon: Shield,    label: 'Overview'  },
    { to: '/admin/employees', icon: Users,     label: 'Employees' },
    { to: '/admin/geofence',  icon: MapPin,    label: 'Geofence Map' },
    { to: '/admin/assignments', icon: BookOpen, label: 'SOP & Tasks' },
    { to: '/admin/approvals', icon: UserCheck, label: 'Approvals' },
    { to: '/calendar',        icon: Calendar,  label: 'Schedule'  },
    { to: '/admin/logs',      icon: Clock,     label: 'Logs'      },
    { to: '/admin/leaves',    icon: FileText,  label: 'Leaves'    },
  ];
  const links = isAdmin ? adminLinks : userLinks;

  const isActive = (to) => to === '/' ? location.pathname === '/' : location.pathname === to || location.pathname.startsWith(to + '/');

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* 4-Digit Quick Access PIN Lock Screen */}
      {isPinLocked && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2147483647,
          background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, flexDirection: 'column'
        }}>
          <div className="card glass fade-in" style={{
            background: 'white', borderRadius: 28, padding: '36px 28px', maxWidth: 360, width: '100%',
            textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
              <img src={realynkLogo} alt="Realynk" style={{ height: 32, width: 'auto' }} />
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#054daf', letterSpacing: '-0.5px' }}>Realynk</span>
            </div>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>Security Verification</h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 28px', lineHeight: 1.4, fontWeight: 600 }}>
              Please enter your 4-digit security PIN to unlock Realynk
            </p>

            <input
              ref={pinInputRef}
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinEntry}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                if (val.length > pinEntry.length) {
                  const addedDigit = val[val.length - 1];
                  handlePinDigit(addedDigit);
                } else {
                  setPinEntry(val);
                  setPinError('');
                }
              }}
              style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: 1, height: 1, pointerEvents: 'none' }}
              autoFocus
            />

            {/* 4 Circle Dots UI */}
            <div
              ref={pinDotsRef}
              onClick={() => pinInputRef.current?.focus()}
              style={{ display: 'flex', justifyContent: 'center', gap: 18, marginBottom: 26, cursor: 'pointer' }}
            >
              {[0, 1, 2, 3].map((i) => {
                const isFilled = i < pinEntry.length;
                return (
                  <div
                    key={i}
                    style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: isFilled ? (pinError ? '#ef4444' : '#054daf') : 'transparent',
                      border: `2.5px solid ${isFilled ? (pinError ? '#ef4444' : '#054daf') : '#cbd5e1'}`,
                      transition: 'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      transform: isFilled ? 'scale(1.15)' : 'scale(1)',
                      boxShadow: isFilled ? (pinError ? '0 0 12px rgba(239,68,68,0.5)' : '0 0 12px rgba(5, 77, 175,0.4)') : 'none'
                    }}
                  />
                );
              })}
            </div>

            {pinError && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 700, margin: '-14px 0 20px', animation: 'fadeIn 0.2s' }}>
                {pinError}
              </p>
            )}

            {/* Numeric Keypad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((btn) => (
                <button
                  key={btn}
                  type="button"
                  onClick={() => {
                    pinInputRef.current?.focus();
                    if (btn === 'C') { setPinEntry(''); setPinError(''); }
                    else if (btn === '⌫') { setPinEntry(prev => prev.slice(0, -1)); setPinError(''); }
                    else { handlePinDigit(btn); }
                  }}
                  style={{
                    height: 52, borderRadius: 16, border: '1px solid rgba(15,23,42,0.08)',
                    background: btn === 'C' || btn === '⌫' ? '#f8fafc' : '#ffffff',
                    color: btn === 'C' ? '#ef4444' : btn === '⌫' ? '#64748b' : '#0f172a',
                    fontSize: btn === '⌫' ? '1.2rem' : '1.25rem', fontWeight: 800,
                    cursor: 'pointer', transition: 'all 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(15,23,42,0.03)'
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {btn}
                </button>
              ))}
            </div>

            <div style={{ borderTop: '1px solid rgba(15,23,42,0.08)', paddingTop: 16 }}>
              <button
                type="button"
                onClick={handleLogout}
                style={{ border: 'none', background: 'transparent', color: '#64748b', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                Forgot PIN? <span style={{ color: '#054daf', textDecoration: 'underline' }}>Sign Out & Login</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop left sidebar */}
      <aside ref={sidebarRef} className="sidebar glass" style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 240, zIndex: 50,
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(15,23,42,0.08)', borderLeft: 'none', borderTop: 'none', borderBottom: 'none',
        flexDirection: 'column', padding: '24px 16px', borderRadius: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, paddingLeft: 8 }}>
          <img src={realynkLogo} alt="Realynk Logo" style={{ height: 34, width: 'auto' }} />
          <span style={{ fontSize: 24, fontWeight: 800, color: '#054daf', letterSpacing: '-0.5px' }}>
            Realynk
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {links.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className={`sidebar-nav-link ${isActive(to) ? 'active' : ''}`}>
              <Icon size={18} className="nav-icon" /> {label}
            </Link>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid rgba(15,23,42,0.08)', paddingTop: 16, marginTop: 16 }}>
          <Link to="/profile" className="sidebar-profile-link">
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#054daf', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0, boxShadow: '0 2px 8px rgba(5, 77, 175,0.3)' }}>
              {user?.name?.[0] || '?'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ color: '#0f172a', fontSize: '0.88rem', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
              <p style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, margin: 0 }}>{user?.role}</p>
            </div>
          </Link>
          <button onClick={handleLogout} className="sidebar-logout-btn">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top header */}
      <nav className="top-header" style={{ position: 'sticky', top: 0, zIndex: 50, borderRadius: 0, borderBottom: '1px solid rgba(15,23,42,0.08)', background: '#ffffff', boxShadow: '0 2px 10px rgba(15,23,42,0.04)' }}>
        <div style={{ padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={realynkLogo} alt="Realynk Logo" style={{ height: 26, width: 'auto' }} />
            <span style={{ fontSize: 21, fontWeight: 800, color: '#054daf', flexShrink: 0 }}>
              Realynk
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link to="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name?.split(' ')[0] || 'Employee'}
              </span>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#054daf', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.88rem', fontWeight: 800, color: 'white', cursor: 'pointer', boxShadow: '0 2px 8px rgba(5, 77, 175,0.3)' }}>
                {user?.name?.[0] || '?'}
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Center Main Content */}
      <div className="layout-content-area" style={{ minHeight: '100vh', position: 'relative' }}>
        <main className="main-content" style={{ maxWidth: 1100, margin: '0 auto', minHeight: 'calc(100vh - 60px)', width: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'relative', zIndex: 30, width: '100%' }}>
            {isAdmin && <AdminNotificationHeader />}
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Outlet context={{ openInstallModal: () => setShowModal(true) }} />
          </div>
        </main>
      </div>

      {/* Global Floating App Install Popup Banner */}
      {showBanner && (
        <div className="card glass" style={{
          position: 'fixed', bottom: 76, left: 16, right: 16, zIndex: 90, maxWidth: 460, margin: '0 auto',
          background: '#0f172a', color: 'white', padding: '14px 18px', borderRadius: 20,
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#054daf', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Smartphone size={22} color="white" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '0.88rem' }}>Install Realynk App</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>1-tap instant check-ins & offline roster</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setShowModal(true)} style={{
              padding: '8px 16px', borderRadius: 10, background: '#054daf', color: 'white', border: 'none',
              fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(5, 77, 175,0.4)'
            }}>
              Install
            </button>
            <button onClick={() => setShowBanner(false)} style={{
              background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4
            }}>
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Global Install App Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 110,
          background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}
        onClick={() => setShowModal(false)}
        >
          <div className="card glass" style={{
            width: '100%', maxWidth: 420, borderRadius: 28, padding: 32, background: 'white',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', textAlign: 'center', position: 'relative'
          }}
          onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setShowModal(false)} style={{
              position: 'absolute', top: 20, right: 20, background: '#f1f5f9', border: 'none',
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748b'
            }}>
              <X size={16} />
            </button>

            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#054daf', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(5, 77, 175,0.35)' }}>
              <Smartphone size={32} />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
              Install Realynk App
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 24px', lineHeight: 1.5 }}>
              Add Realynk Enterprise Roster to your home screen for instant 1-tap biometric punches and real-time offline schedule access.
            </p>

            {installed ? (
              <div style={{ padding: 16, borderRadius: 16, background: 'rgba(5, 77, 175,0.12)', color: '#054daf', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <CheckCircle2 size={20} /> App Successfully Installed!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => {
                    setInstalled(true);
                    localStorage.setItem('realynk_app_installed', 'true');
                    setShowBanner(false);
                    setTimeout(() => setShowModal(false), 2000);
                  }}
                  style={{
                    width: '100%', padding: '14px 24px', borderRadius: 16, background: '#054daf',
                    color: 'white', fontWeight: 800, fontSize: '0.95rem', border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(5, 77, 175,0.3)', transition: 'all 0.2s'
                  }}
                >
                  Add to Home Screen
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    width: '100%', padding: '12px 24px', borderRadius: 16, background: 'transparent',
                    color: '#64748b', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer'
                  }}
                >
                  Maybe Later
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
