import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/db';
import { Save, Moon, Bug, CheckCircle2, X, Bell, Shield, Key, Lock, Smartphone, Settings as SettingsIcon } from 'lucide-react';
import { showSuccess } from '../lib/alert';
import Swal from 'sweetalert2';

export default function UserSettings() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  // Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState(user?.password || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Settings toggles
  const [prefs, setPrefs] = useState(() => {
    const p = localStorage.getItem(`imin_prefs_${user.userId}`);
    if (p) return JSON.parse(p);
    return { notifs: true, autoLocation: true, darkMode: false };
  });

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
      if (updateProfile) {
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

  // Bug Report State
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugDesc, setBugDesc] = useState('');
  const [bugSubmitted, setBugSubmitted] = useState(false);

  const handleUpdateAccount = (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Simulate network delay
    setTimeout(() => {
      updateProfile({ name, email, password });
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  const handleBugSubmit = (e) => {
    e.preventDefault();
    if (!bugDesc.trim()) return;

    db.addBugReport(bugDesc, user);

    setBugSubmitted(true);
    setTimeout(() => {
      setBugSubmitted(false);
      setShowBugModal(false);
      setBugDesc('');
    }, 2500);
  };

  return (
    <div style={{ padding: '24px 16px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>Settings</h1>
        <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>Manage your account credentials and app preferences.</p>
      </div>

      <div style={{ display: 'grid', gap: 24 }}>
        {/* Account Credentials */}
        <div className="card glass" style={{ padding: 24, borderRadius: 20, background: 'white' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 20px', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
            Account Details
          </h2>
          <form onSubmit={handleUpdateAccount} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: '#475569', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.92rem', fontWeight: 600 }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#475569', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.92rem', fontWeight: 600 }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#475569', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.92rem', fontWeight: 600 }}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 12 }}>
              {saveSuccess && (
                <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={16} /> Saved successfully
                </span>
              )}
              <button 
                type="submit" 
                disabled={saving}
                className="btn-primary"
                style={{ 
                  width: '100%', padding: '12px 24px', borderRadius: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
                  fontWeight: 800, cursor: 'pointer', border: 'none', background: '#054daf', color: 'white',
                  opacity: saving ? 0.7 : 1, whiteSpace: 'nowrap', flexShrink: 0
                }}
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Preferences */}
        <div className="card glass" style={{ padding: 24, borderRadius: 20, background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(5, 77, 175,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#054daf', flexShrink: 0 }}>
              <SettingsIcon size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Preferences & System Settings</h2>
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '2px 0 0', fontWeight: 600 }}>Configure notifications, geolocation locks, and app tools</p>
            </div>
          </div>

          {[
            {
              icon: <Bell size={18} />,
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
              icon: <Shield size={18} />,
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
              icon: <Moon size={18} />,
              label: 'Dark Mode',
              sub: 'A darker theme for low-light environments',
              action: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ padding: '4px 8px', borderRadius: 10, background: '#dbeafe', color: '#054daf', fontSize: '0.65rem', fontWeight: 800, whiteSpace: 'nowrap' }}>COMING SOON</span>
                  <div style={{ width: 44, height: 24, borderRadius: 24, background: '#e2e8f0', position: 'relative', opacity: 0.5, cursor: 'not-allowed', flexShrink: 0 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                  </div>
                </div>
              ),
            },
            {
              icon: <Lock size={18} />,
              label: 'Quick Access 4-Digit PIN',
              sub: localStorage.getItem(`realynk_user_pin_${user.userId}`) || user.pin ? 'PIN Active (••••) – Offline Check-In enabled' : 'Set up 4-digit PIN for offline access',
              iconBg: 'rgba(5, 77, 175,0.1)',
              iconColor: '#054daf',
              action: (
                <button
                  onClick={handleSetPin}
                  style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #054daf', background: localStorage.getItem(`realynk_user_pin_${user.userId}`) || user.pin ? 'rgba(5,77,175,0.08)' : '#054daf', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', color: localStorage.getItem(`realynk_user_pin_${user.userId}`) || user.pin ? '#054daf' : 'white', transition: 'all 0.15s', flexShrink: 0, whiteSpace: 'nowrap' }}
                >
                  {localStorage.getItem(`realynk_user_pin_${user.userId}`) || user.pin ? 'Change PIN' : 'Set PIN'}
                </button>
              ),
            },
          ].map(({ icon, label, sub, iconBg = '#f1f5f9', iconColor = '#475569', action }, index, arr) => (
            <div
              key={label}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 14, paddingBottom: index === arr.length - 1 ? 0 : 18,
                marginBottom: index === arr.length - 1 ? 0 : 18,
                borderBottom: index === arr.length - 1 ? 'none' : '1px solid rgba(15,23,42,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 13, flex: 1, minWidth: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flexShrink: 0 }}>
                  {icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b', display: 'block', marginBottom: 1 }}>{label}</span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', lineHeight: 1.3 }}>{sub}</span>
                </div>
              </div>
              {action}
            </div>
          ))}
        </div>

        {/* Support */}
        <div className="card glass" style={{ padding: 24, borderRadius: 20, background: 'white' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 20px', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
            Support
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Help & Feedback</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Encountered an issue? Let us know.</p>
            </div>
            <button 
              onClick={() => setShowBugModal(true)}
              style={{ padding: '12px 18px', borderRadius: 12, border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', whiteSpace: 'nowrap', width: '100%' }}
            >
              <Bug size={16} /> Report a Bug
            </button>
          </div>
        </div>
      </div>

      {/* Report Bug Modal */}
      {showBugModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card glass" style={{ width: '100%', maxWidth: 440, background: 'white', borderRadius: 24, padding: 28, position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <button 
              onClick={() => setShowBugModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={16} />
            </button>

            {bugSubmitted ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Report Submitted</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                  Thank you for your feedback! Our engineering team will review the issue shortly.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                    <Bug size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>Report a Bug</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Describe the issue you're experiencing.</p>
                  </div>
                </div>

                <form onSubmit={handleBugSubmit}>
                  <textarea 
                    value={bugDesc}
                    onChange={e => setBugDesc(e.target.value)}
                    placeholder="Steps to reproduce, what you expected to see vs what happened..."
                    style={{ width: '100%', minHeight: 120, padding: 16, borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit', marginBottom: 16 }}
                    required
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button type="button" onClick={() => setShowBugModal(false)} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'transparent', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#054daf', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(5,77,175,0.3)' }}>Submit Report</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
