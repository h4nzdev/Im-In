import { useState, useRef, useEffect } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { LogOut, Edit3, Check, X, Bell, Shield, Moon, Key, Settings as SettingsIcon, Smartphone } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/db';

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const context = useOutletContext();
  const { user: loggedInUser, logout } = useAuthStore();

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
    positionId: user?.positionId || ''
  });

  // Settings toggles
  const [prefs, setPrefs] = useState(() => {
    const p = localStorage.getItem(`imin_prefs_${user.userId}`);
    if (p) return JSON.parse(p);
    return { notifs: true, autoLocation: true, darkMode: false };
  });

  const pageRef = useRef();
  const position = positions.find(p => p.positionId === user?.positionId);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(pageRef.current.querySelectorAll('.card'), {
        y: 28, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out',
      });
    });
    return () => ctx.revert();
  }, []);

  const togglePref = (k) => {
    const next = { ...prefs, [k]: !prefs[k] };
    setPrefs(next);
    localStorage.setItem(`imin_prefs_${user.userId}`, JSON.stringify(next));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    const users = db.getUsers();
    const updated = users.map(u => u.userId === user.userId ? { ...u, ...form } : u);
    localStorage.setItem('imin_users', JSON.stringify(updated));
    
    const updatedUser = { ...user, ...form };
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
  const cardStyle = { background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 24, padding: 28, boxShadow: '0 4px 24px rgba(15,23,42,0.05)' };

  return (
    <div ref={pageRef} style={{ maxWidth: 620, margin: '0 auto', paddingBottom: 40 }}>
      {isInspectingOther && (
        <div style={{ padding: '14px 18px', borderRadius: 16, background: '#1e3a8a', color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 16px rgba(30,58,138,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={18} color="#93c5fd" />
            <span style={{ fontSize: '0.88rem', fontWeight: 800 }}>Admin View: Inspecting {user.name}</span>
          </div>
          <button onClick={() => navigate('/admin/employees')} style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}>
            ← Back to Directory
          </button>
        </div>
      )}
      
      {/* Avatar + name card */}
      <div className="card glass" style={{ ...cardStyle, textAlign: 'center', paddingTop: 40, paddingBottom: 36, marginBottom: 20 }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%', margin: '0 auto 18px',
          background: '#2563eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.2rem', fontWeight: 800, color: 'white',
          boxShadow: '0 8px 32px rgba(37,99,235,0.35)',
        }}>
          {initials}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>{user?.name}</h1>
          <button 
            onClick={() => setEditing(true)} 
            style={{
              background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
              cursor: 'pointer', color: '#2563eb', padding: '6px 12px', borderRadius: 10,
              fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s'
            }}
          >
            <Edit3 size={15} /> Edit Profile
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            padding: '4px 14px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 800,
            background: user?.role === 'Admin' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
            color: user?.role === 'Admin' ? '#b45309' : '#1d4ed8',
          }}>{user?.role}</span>
          {position && (
            <span style={{ color: '#64748b', fontSize: '0.88rem', fontWeight: 600 }}>
              {position.positionName} · {position.department}
            </span>
          )}
        </div>
      </div>

      {/* Edit Profile Form Modal / Expand */}
      {editing && (
        <form onSubmit={handleSaveProfile} className="card glass" style={{ ...cardStyle, marginBottom: 20, border: '2px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Edit Profile Information</h2>
            <button type="button" onClick={() => setEditing(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={{ background: 'white !important' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Corporate Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={{ background: 'white !important' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Assigned Position</label>
              <select value={form.positionId} onChange={e => setForm({ ...form, positionId: e.target.value })} required style={{ background: 'white !important' }}>
                {positions.map(p => <option key={p.positionId} value={p.positionId}>{p.positionName} — {p.department}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Changes</button>
              <button type="button" onClick={() => setEditing(false)} style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid rgba(15,23,42,0.12)', background: 'white', fontWeight: 700, cursor: 'pointer', color: '#64748b' }}>Cancel</button>
            </div>
          </div>
        </form>
      )}

      {/* Account Stats */}
      <div className="card glass" style={{ ...cardStyle, marginBottom: 20 }}>
        <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Personal Attendance Record</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[
            { label: 'Hours Worked', value: `${totalHoursLogged()}h`, color: '#1d4ed8' },
            { label: 'Total Punches', value: logs.length, color: '#2563eb' },
            { label: 'Leave Bookings', value: leaves.length, color: '#d97706' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center', padding: '18px 8px', background: 'rgba(15,23,42,0.03)', borderRadius: 16 }}>
              <p style={{ color, fontSize: '1.6rem', fontWeight: 800, margin: '0 0 4px' }}>{value}</p>
              <p style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences & Settings */}
      <div className="card glass" style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <SettingsIcon size={18} color="#2563eb" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Preferences & System Settings</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Notification Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Bell size={18} color="#64748b" />
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b', display: 'block' }}>Email Shift Reminders</span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Receive notifications prior to shift start</span>
              </div>
            </div>
            <button 
              onClick={() => togglePref('notifs')}
              style={{
                width: 48, height: 26, borderRadius: 20, border: 'none', cursor: 'pointer', position: 'relative',
                background: prefs.notifs ? '#3b82f6' : '#cbd5e1', transition: 'background 0.2s'
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3,
                left: prefs.notifs ? 25 : 3, transition: 'left 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }} />
            </button>
          </div>

          {/* GPS Auto Location */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Shield size={18} color="#64748b" />
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b', display: 'block' }}>Biometric Geolocation Lock</span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Attach GPS coordinates on punch attempts</span>
              </div>
            </div>
            <button 
              onClick={() => togglePref('autoLocation')}
              style={{
                width: 48, height: 26, borderRadius: 20, border: 'none', cursor: 'pointer', position: 'relative',
                background: prefs.autoLocation ? '#3b82f6' : '#cbd5e1', transition: 'background 0.2s'
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3,
                left: prefs.autoLocation ? 25 : 3, transition: 'left 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }} />
            </button>
          </div>

          {/* Password Action */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Key size={18} color="#64748b" />
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b', display: 'block' }}>Security & Credentials</span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Update corporate login password</span>
              </div>
            </div>
            <button 
              onClick={() => alert("Password reset link sent to " + user.email)}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(15,23,42,0.12)', background: 'white', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', color: '#334155' }}
            >
              Reset Password
            </button>
          </div>

          {/* Install App Action */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Smartphone size={18} color="#2563eb" />
              <div>
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a', display: 'block' }}>Install Realynk Enterprise App</span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Add 1-tap check-in app to home screen</span>
              </div>
            </div>
            <button 
              onClick={() => context?.openInstallModal?.()}
              style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#2563eb', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', color: 'white', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}
            >
              Install App
            </button>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={() => { logout(); navigate('/login'); }}
        style={{
          width: '100%', padding: '15px 24px', borderRadius: 16, border: '1px solid rgba(239,68,68,0.25)',
          background: 'rgba(239,68,68,0.08)', color: '#dc2626', fontWeight: 700, fontSize: '0.98rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(239,68,68,0.08)'
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'; }}
      >
        <LogOut size={18} /> Sign Out of Realynk
      </button>
    </div>
  );
}
