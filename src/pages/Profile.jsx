import { useState, useRef, useEffect } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { LogOut, Edit3, Check, X, Bell, Shield, Moon, Key, Settings as SettingsIcon, Smartphone, Clock, Calendar, Briefcase, Mail, Award, MapPin, UserCheck, Activity, Lock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/db';
import { showSuccess } from '../lib/alert';
import Swal from 'sweetalert2';

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const context = useOutletContext();
  const { user: loggedInUser, logout, updateProfile } = useAuthStore();

  const targetId = searchParams.get('userId');
  const targetUser = targetId ? db.getUserById(targetId) : null;
  const user = targetUser || loggedInUser;
  const isInspectingOther = Boolean(targetUser && targetUser.userId !== loggedInUser?.userId);

  const [positions] = useState(() => db.getPositions());
  const [logs] = useState(() => db.getUserLogs(user.userId));
  const [leaves] = useState(() => db.getUserLeaves(user.userId));

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    positionId: user?.positionId || '',
    department: user?.department || 'Shared Services',
    assignedAccount: user?.assignedAccount || ''
  });

  // Settings toggles
  const [prefs, setPrefs] = useState(() => {
    const p = localStorage.getItem(`imin_prefs_${user.userId}`);
    if (p) return JSON.parse(p);
    return { notifs: true, autoLocation: true, darkMode: false };
  });

  const pageRef = useRef();
  const position = positions.find(p => p.positionId === user?.positionId);

  // Reactive window width for true responsiveness
  const [winW, setWinW] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWinW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(pageRef.current.querySelectorAll('.card'), {
        y: 28, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out',
      });
    });
    return () => ctx.revert();
  }, [user]);

  const togglePref = (k) => {
    const next = { ...prefs, [k]: !prefs[k] };
    setPrefs(next);
    localStorage.setItem(`imin_prefs_${user.userId}`, JSON.stringify(next));
  };

  const handleSetPin = async () => {
    const currentPin = localStorage.getItem(`realynk_user_pin_${user.userId}`) || user.pin || '';
    const { value: newPin } = await Swal.fire({
      title: '🔒 Quick Access 4-Digit PIN',
      text: 'Set up or update your 4-digit numeric PIN for offline check-in & terminal validation.',
      input: 'password',
      inputAttributes: {
        maxlength: 4,
        autocapitalize: 'off',
        autocorrect: 'off',
        inputmode: 'numeric',
        pattern: '[0-9]*',
        placeholder: '• • • •'
      },
      inputValue: currentPin,
      showCancelButton: true,
      confirmButtonText: '💾 Save PIN',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'swal-custom-popup',
        title: 'swal-custom-title',
        confirmButton: 'swal-custom-btn swal-btn-primary',
        cancelButton: 'swal-custom-btn swal-btn-cancel'
      },
      inputValidator: (value) => {
        if (!value) {
          return 'Please enter a 4-digit numeric PIN!';
        }
        if (!/^\d{4}$/.test(value)) {
          return 'PIN must be exactly 4 digits (e.g. 1234)';
        }
        return null;
      }
    });

    if (newPin) {
      if (!isInspectingOther && updateProfile) {
        updateProfile({ pin: newPin });
      } else {
        db.updateUser(user.userId, { pin: newPin });
        localStorage.setItem(`realynk_user_pin_${user.userId}`, newPin);
        const stored = JSON.parse(localStorage.getItem('user') || 'null');
        if (stored && stored.userId === user.userId) {
          localStorage.setItem('user', JSON.stringify({ ...stored, pin: newPin }));
        }
      }
      showSuccess('PIN Saved!', `4-Digit Security PIN configured (` + newPin.replace(/./g, '•') + `) and saved to async storage.`);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    const selectedPos = positions.find(p => p.positionId === form.positionId);
    const newDept = selectedPos ? selectedPos.department : form.department;
    const finalForm = {
      ...form,
      department: newDept,
      assignedAccount: newDept === 'Service Delivery' ? form.assignedAccount : ''
    };

    const users = db.getUsers();
    const updated = users.map(u => u.userId === user.userId ? { ...u, ...finalForm } : u);
    localStorage.setItem('imin_users', JSON.stringify(updated));
    
    const updatedUser = { ...user, ...finalForm };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setEditing(false);
    window.location.reload();
  };

  const totalHoursLogged = () => {
    const sorted = [...logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    let ms = 0, openIn = null;
    sorted.forEach(l => {
      if (l.type === 'IN') openIn = l;
      else if (openIn) { ms += new Date(l.timestamp) - new Date(openIn.timestamp); openIn = null; }
    });
    return (ms / 3600000).toFixed(1);
  };

  const initials = (user?.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const isMobile = winW < 768;
  const isTablet = winW >= 768 && winW < 1024;
  const cardPad = isMobile ? 14 : 22;
  const cardStyle = {
    background: 'rgba(255,255,255,0.85)',
    border: '1px solid rgba(15,23,42,0.08)',
    borderRadius: isMobile ? 14 : 20,
    padding: cardPad,
    boxShadow: '0 4px 24px rgba(15,23,42,0.05)',
    overflow: 'hidden',
    minWidth: 0,
    maxWidth: '100%',
    width: '100%',
    boxSizing: 'border-box',
  };
  // Inline grid replaces CSS class — avoids Tailwind/specificity conflicts
  const outerGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? 'minmax(0,1fr)' : isTablet ? 'minmax(0,1fr)' : '320px minmax(0,1fr)',
    gap: isMobile ? 14 : 22,
    alignItems: 'start',
    width: '100%',
  };

  return (
    <div ref={pageRef} style={{ width: '100%', paddingBottom: 32 }}>
      {isInspectingOther && (
        <div style={{ padding: '16px 20px', borderRadius: 18, background: '#1e3a8a', color: 'white', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 16px rgba(30,58,138,0.25)', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Shield size={20} color="#93c5fd" />
            <div>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, display: 'block' }}>Admin Inspection Mode: {user.name}</span>
              <span style={{ fontSize: '0.78rem', color: '#bfdbfe' }}>Viewing employee credentials, attendance logs, and system preferences</span>
            </div>
          </div>
          <button onClick={() => navigate('/admin/employees')} style={{ padding: '8px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}>
            ← Back to Employee Directory
          </button>
        </div>
      )}
      {/* Page Header — matches Dashboard/Logs scale */}
      {!isInspectingOther && (
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            My Profile & Settings
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '4px 0 0', fontWeight: 500 }}>
            Manage your identity, attendance records, and account preferences
          </p>
        </div>
      )}

      <div style={outerGridStyle}>
        {/* LEFT COLUMN: IDENTITY & ACCOUNT PILLAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card glass profile-card" style={{ ...cardStyle, textAlign: 'center', paddingTop: 36, paddingBottom: 32 }}>
            <div style={{
              width: 108, height: 108, borderRadius: '50%', margin: '0 auto 18px',
              background: 'linear-gradient(135deg, #054daf, #043e8a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', fontWeight: 800, color: 'white',
              boxShadow: '0 10px 32px rgba(5, 77, 175,0.4)',
              border: '4px solid white'
            }}>
              {initials}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>{user?.name}</h1>
              <button 
                onClick={() => setEditing(!editing)} 
                style={{
                  background: editing ? '#054daf' : 'rgba(5, 77, 175,0.12)', border: '1px solid rgba(5, 77, 175,0.3)',
                  cursor: 'pointer', color: editing ? 'white' : '#054daf', padding: '6px 12px', borderRadius: 12,
                  fontWeight: 800, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s'
                }}
              >
                {editing ? <X size={14} /> : <Edit3 size={14} />} {editing ? 'Close Edit' : 'Edit Profile'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              <span style={{
                padding: '4px 14px', borderRadius: 99, fontSize: '0.76rem', fontWeight: 800,
                background: user?.role === 'Admin' ? 'rgba(245,158,11,0.15)' : 'rgba(5, 77, 175,0.15)',
                color: user?.role === 'Admin' ? '#b45309' : '#043e8a',
              }}>{user?.role}</span>
              {position && (
                <span style={{ color: '#64748b', fontSize: '0.84rem', fontWeight: 700 }}>
                  {position.positionName} · {position.department}
                </span>
              )}
            </div>

            <div style={{ borderTop: '1px solid rgba(15,23,42,0.08)', paddingTop: 20, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Mail size={16} color="#64748b" />
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Corporate Email</span>
                  <span style={{ fontSize: '0.88rem', color: '#1e293b', fontWeight: 700 }}>{user?.email}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Briefcase size={16} color="#64748b" />
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Department</span>
                  <span style={{ fontSize: '0.88rem', color: '#1e293b', fontWeight: 700 }}>{user?.department || 'Service Delivery'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Award size={16} color="#64748b" />
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Assigned Client Account</span>
                  <span style={{ fontSize: '0.88rem', color: '#1e293b', fontWeight: 700 }}>{user?.assignedAccount || 'Enterprise Core'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <UserCheck size={16} color="#64748b" />
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Account Status</span>
                  <span style={{ fontSize: '0.82rem', color: '#047857', fontWeight: 800, background: '#ecfdf5', padding: '2px 8px', borderRadius: 6, display: 'inline-block', border: '1px solid #a7f3d0' }}>
                    🟢 {user?.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Form Modal / Expand */}
          {editing && (
            <form onSubmit={handleSaveProfile} className="card glass profile-card fade-in" style={{ ...cardStyle, border: '2px solid #054daf' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Edit Identity Info</h2>
                <button type="button" onClick={() => setEditing(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Full Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={{ background: 'white !important', width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #cbd5e1' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Corporate Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={{ background: 'white !important', width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #cbd5e1' }} />
                </div>

                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                    <span>Assigned Position & Department</span>
                    <span style={{ fontSize: '0.68rem', color: '#054daf', fontWeight: 700 }}>Role Guide</span>
                  </label>
                  <select
                    value={form.positionId}
                    onChange={e => {
                      const pos = positions.find(p => p.positionId === e.target.value);
                      setForm({
                        ...form,
                        positionId: e.target.value,
                        department: pos ? pos.department : form.department
                      });
                    }}
                    required
                    style={{ background: 'white !important', width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontWeight: 600 }}
                  >
                    {positions.map(p => <option key={p.positionId} value={p.positionId}>{p.positionName} — {p.department}</option>)}
                  </select>
                  <div style={{ marginTop: 6, padding: '8px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.72rem', color: '#475569', lineHeight: 1.3 }}>
                    ℹ️ <strong>Service Delivery:</strong> Operations & direct client campaigns.<br />
                    ℹ️ <strong>Shared Services:</strong> Non-Operations corporate support team.
                  </div>
                </div>

                {((positions.find(p => p.positionId === form.positionId)?.department === 'Service Delivery') || form.department === 'Service Delivery') && (
                  <div className="fade-in">
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#054daf', textTransform: 'uppercase', marginBottom: 6 }}>Assigned Client Account / Campaign</label>
                    <select value={form.assignedAccount} onChange={e => setForm({ ...form, assignedAccount: e.target.value })} required style={{ background: '#eff6ff', color: '#1e3a8a', width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #93c5fd', fontWeight: 700 }}>
                      <option value="">Select client account...</option>
                      {db.getAccounts().map(acc => (
                        <option key={acc} value={acc}>{acc}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1, padding: '11px 16px', borderRadius: 12, fontWeight: 800 }}>Save Changes</button>
                  <button type="button" onClick={() => setEditing(false)} style={{ padding: '11px 16px', borderRadius: 12, border: '1px solid rgba(15,23,42,0.12)', background: 'white', fontWeight: 700, cursor: 'pointer', color: '#64748b' }}>Cancel</button>
                </div>
              </div>
            </form>
          )}

          {/* Logout Button */}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{
              width: '100%', padding: '15px 24px', borderRadius: 18, border: '1px solid rgba(239,68,68,0.25)',
              background: 'rgba(239,68,68,0.08)', color: '#dc2626', fontWeight: 700, fontSize: '0.95rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(239,68,68,0.08)'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'; }}
          >
            <LogOut size={18} /> Sign Out of Realynk
          </button>
        </div>

        {/* RIGHT COLUMN: STATS & PREFERENCES PILLAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Account Stats */}
          <div className="card glass profile-card" style={{ ...cardStyle }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Personal Attendance Summary</h2>
                <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '2px 0 0', fontWeight: 600 }}>Accumulated work hours & biometric event history</p>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(5, 77, 175,0.1)', color: '#054daf', fontWeight: 800, fontSize: '0.75rem' }}>
                Verified Records
              </span>
            </div>

            <div className="profile-stats-grid">
              {[
                { label: 'Hours Worked', value: `${totalHoursLogged()}h`, color: '#043e8a', icon: <Clock size={20} color="#054daf" />, bg: 'rgba(5, 77, 175,0.08)' },
                { label: 'Total Punches', value: logs.length, color: '#054daf', icon: <Activity size={20} color="#054daf" />, bg: 'rgba(5, 77, 175,0.08)' },
                { label: 'Leave Bookings', value: leaves.length, color: '#d97706', icon: <Calendar size={20} color="#d97706" />, bg: 'rgba(245,158,11,0.08)' },
              ].map(({ label, value, color, icon, bg }) => (
                <div key={label} style={{ textAlign: 'center', padding: '20px 12px', background: 'white', borderRadius: 18, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 2px 12px rgba(15,23,42,0.03)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    {icon}
                  </div>
                  <p style={{ color, fontSize: '1.7rem', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.5px' }}>{value}</p>
                  <p style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(15,23,42,0.03)', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981', flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Biometric Terminal Status</span>
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#047857', background: '#ecfdf5', padding: '5px 14px', borderRadius: 10, border: '1px solid #6ee7b7', flexShrink: 0, whiteSpace: 'nowrap' }}>
                🟢 Online & Calibrated
              </span>
            </div>
          </div>

          {/* Preferences & Settings */}
          <div className="card glass profile-card" style={{ ...cardStyle }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 12, marginBottom: isMobile ? 18 : 24 }}>
              <div style={{ width: isMobile ? 36 : 42, height: isMobile ? 36 : 42, borderRadius: 12, background: 'rgba(5, 77, 175,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#054daf', flexShrink: 0 }}>
                <SettingsIcon size={isMobile ? 18 : 22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontSize: isMobile ? '0.98rem' : '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Preferences & System Settings</h2>
                {!isMobile && <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '2px 0 0', fontWeight: 600 }}>Configure notifications, geolocation locks, and app tools</p>}
              </div>
            </div>

            {/* Shared row style helper */}
            {[
              {
                icon: <Bell size={isMobile ? 16 : 18} />,
                label: 'Email Shift Reminders',
                sub: 'Receive notifications prior to shift start',
                action: (
                  <button
                    onClick={() => togglePref('notifs')}
                    style={{ width: 44, height: 24, borderRadius: 20, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, background: prefs.notifs ? '#054daf' : '#cbd5e1', transition: 'background 0.2s' }}
                  >
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: prefs.notifs ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }} />
                  </button>
                ),
              },
              {
                icon: <Shield size={isMobile ? 16 : 18} />,
                label: 'Biometric Geolocation Lock',
                sub: 'Attach GPS coordinates on punch attempts',
                action: (
                  <button
                    onClick={() => togglePref('autoLocation')}
                    style={{ width: 44, height: 24, borderRadius: 20, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, background: prefs.autoLocation ? '#054daf' : '#cbd5e1', transition: 'background 0.2s' }}
                  >
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: prefs.autoLocation ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }} />
                  </button>
                ),
              },
              {
                icon: <Key size={isMobile ? 16 : 18} />,
                label: 'Security & Credentials',
                sub: 'Update corporate login password',
                iconBg: '#f1f5f9',
                action: (
                  <button
                    onClick={() => showSuccess('Reset Link Sent', 'Password reset instructions sent to ' + user.email)}
                    style={{ padding: isMobile ? '7px 12px' : '8px 16px', borderRadius: 10, border: '1px solid rgba(15,23,42,0.15)', background: 'white', fontWeight: 800, fontSize: isMobile ? '0.74rem' : '0.82rem', cursor: 'pointer', color: '#334155', transition: 'all 0.15s', flexShrink: 0, whiteSpace: 'nowrap' }}
                  >
                    Reset Password
                  </button>
                ),
              },
              {
                icon: <Lock size={isMobile ? 16 : 18} />,
                label: 'Quick Access 4-Digit PIN',
                sub: localStorage.getItem(`realynk_user_pin_${user.userId}`) || user.pin ? 'PIN Active (••••) – Offline Check-In enabled' : 'Set up 4-digit PIN for offline & terminal access',
                iconBg: 'rgba(5, 77, 175,0.1)',
                iconColor: '#054daf',
                action: (
                  <button
                    onClick={handleSetPin}
                    style={{ padding: isMobile ? '7px 12px' : '8px 16px', borderRadius: 10, border: '1px solid #054daf', background: localStorage.getItem(`realynk_user_pin_${user.userId}`) || user.pin ? 'rgba(5,77,175,0.08)' : '#054daf', fontWeight: 800, fontSize: isMobile ? '0.74rem' : '0.82rem', cursor: 'pointer', color: localStorage.getItem(`realynk_user_pin_${user.userId}`) || user.pin ? '#054daf' : 'white', transition: 'all 0.15s', flexShrink: 0, whiteSpace: 'nowrap' }}
                  >
                    {localStorage.getItem(`realynk_user_pin_${user.userId}`) || user.pin ? 'Change PIN' : 'Set PIN'}
                  </button>
                ),
              },
              {
                icon: <Smartphone size={isMobile ? 16 : 18} />,
                label: 'Install Realynk Enterprise App',
                sub: 'Add 1-tap check-in app to home screen',
                iconBg: 'rgba(5, 77, 175,0.12)',
                iconColor: '#054daf',
                isLast: true,
                action: (
                  <button
                    onClick={() => context?.openInstallModal?.()}
                    style={{ padding: isMobile ? '7px 12px' : '8px 16px', borderRadius: 10, border: 'none', background: '#054daf', fontWeight: 800, fontSize: isMobile ? '0.74rem' : '0.84rem', cursor: 'pointer', color: 'white', boxShadow: '0 4px 12px rgba(5,77,175,0.3)', transition: 'all 0.15s', flexShrink: 0, whiteSpace: 'nowrap' }}
                  >
                    Install App
                  </button>
                ),
              },
            ].map(({ icon, label, sub, iconBg = '#f1f5f9', iconColor = '#475569', action, isLast }) => (
              <div
                key={label}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: isMobile ? 10 : 14,
                  paddingBottom: isLast ? 0 : (isMobile ? 14 : 18),
                  marginBottom: isLast ? 0 : (isMobile ? 14 : 18),
                  borderBottom: isLast ? 'none' : '1px solid rgba(15,23,42,0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 13, flex: 1, minWidth: 0 }}>
                  <div style={{ width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flexShrink: 0 }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: isMobile ? '0.82rem' : '0.92rem', color: '#1e293b', display: 'block', marginBottom: 1 }}>{label}</span>
                    <span style={{ fontSize: isMobile ? '0.72rem' : '0.78rem', color: '#64748b', display: 'block', lineHeight: 1.3 }}>{sub}</span>
                  </div>
                </div>
                {action}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
