import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/db';
import { Save, Moon, Bug, CheckCircle2, X } from 'lucide-react';

export default function UserSettings() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  // Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState(user?.password || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              {saveSuccess ? (
                <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={16} /> Saved successfully
                </span>
              ) : <span />}
              <button 
                type="submit" 
                disabled={saving}
                className="btn-primary"
                style={{ 
                  padding: '12px 24px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 8,
                  fontWeight: 800, cursor: 'pointer', border: 'none', background: '#054daf', color: 'white',
                  opacity: saving ? 0.7 : 1
                }}
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Preferences */}
        <div className="card glass" style={{ padding: 24, borderRadius: 20, background: 'white' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 20px', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
            App Preferences
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(15,23,42,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Moon size={20} color="#475569" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Dark Mode</p>
                <span style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>- A darker theme for low-light environments</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ padding: '4px 10px', borderRadius: 12, background: '#dbeafe', color: '#054daf', fontSize: '0.72rem', fontWeight: 800 }}>
                COMING SOON
              </span>
              <div style={{ width: 44, height: 24, borderRadius: 24, background: '#e2e8f0', position: 'relative', opacity: 0.5, cursor: 'not-allowed' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="card glass" style={{ padding: 24, borderRadius: 20, background: 'white' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 20px', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
            Support
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Help & Feedback</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Encountered an issue? Let us know.</p>
            </div>
            <button 
              onClick={() => setShowBugModal(true)}
              style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
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
