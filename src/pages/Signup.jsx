import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ShieldCheck, ArrowRight, Building2, Briefcase, Mail, Key, User, AlertCircle, Sparkles, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/db';
import realynkLogo from '../assets/realynk.png';

const SERVICE_DELIVERY_ACCOUNTS = [
  'FinTech Global Support',
  'Healthcare Billing Operations',
  'E-Commerce Customer Care',
  'Enterprise Cloud Solutions',
  'Telecom Technical Helpdesk'
];

export default function Signup() {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);
  const [form, setForm] = useState({
    name: '',
    employeeId: '',
    department: 'Shared Services',
    assignedAccount: '',
    email: '',
    password: '',
    positionId: ''
  });
  const [positions] = useState(() => db.getPositions());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const cardRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, { y: 40, opacity: 0, duration: 0.7, ease: 'power3.out' });
      if (!submitted) {
        gsap.from(cardRef.current.querySelectorAll('.field'), {
          y: 20, opacity: 0, duration: 0.5, stagger: 0.06, delay: 0.15, ease: 'power3.out',
        });
      }
    });
    return () => ctx.revert();
  }, [submitted]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleDemoFill = () => {
    const randomBadge = `RLK-${Math.floor(1000 + Math.random() * 9000)}`;
    setForm({
      name: 'Johnathan Vance',
      employeeId: randomBadge,
      department: 'Service Delivery',
      assignedAccount: 'FinTech Global Support',
      email: `j.vance.${randomBadge.slice(4)}@realynk.com`,
      password: 'password123',
      positionId: positions[1]?.positionId || positions[0]?.positionId || 'POS-002'
    });
    setError('');
  };

  const validateEmailDomain = (email) => {
    return /^[^@]+@(realynk\.com|realynk\.net)$/i.test(email.trim());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) { setError('Employee Name is required'); return; }
    if (!form.employeeId.trim()) { setError('Employee ID is required'); return; }
    if (!validateEmailDomain(form.email)) {
      setError('Invalid corporate email domain. Must end with @realynk.com or @realynk.net');
      return;
    }
    if (form.department === 'Service Delivery' && !form.assignedAccount) {
      setError('Please select an assigned account/campaign for Service Delivery');
      return;
    }
    if (!form.positionId) { setError('Please select a designation/position'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      signup({
        ...form,
        email: form.email.trim().toLowerCase(),
        employeeId: form.employeeId.trim().toUpperCase()
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', background: '#f8fafc' }}>
      <div ref={cardRef} className="glass" style={{ width: '100%', maxWidth: 500, borderRadius: 28, padding: 40, boxShadow: '0 20px 50px rgba(15,23,42,0.08)' }}>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(16,185,129,0.25)' }}>
              <ShieldCheck size={40} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>
              Registration Submitted!
            </h2>
            <p style={{ color: '#475569', fontSize: '0.94rem', lineHeight: 1.6, margin: '0 0 28px' }}>
              Corporate credentials for <b>{form.email}</b> (Badge: <b>{form.employeeId}</b>) have been registered under <b>{form.department}</b>. An executive administrator will verify your profile before login activation.
            </p>
            <button 
              onClick={() => navigate('/login')}
              style={{
                width: '100%', padding: '15px 24px', background: '#2563eb',
                color: 'white', fontWeight: 800, borderRadius: 16, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: '0.98rem',
                boxShadow: '0 6px 20px rgba(37,99,235,0.35)', transition: 'all 0.2s'
              }}
            >
              Return to Login Portal <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <>
            <div className="field" style={{ textAlign: 'center', marginBottom: 28 }}>
              <img src={realynkLogo} alt="Realynk" style={{ height: 48, width: 'auto', margin: '0 auto 10px', display: 'block' }} />
              <div style={{ fontSize: 32, fontWeight: 800, color: '#2563eb', marginBottom: 4 }}>
                Join Realynk Enterprise
              </div>
              <p style={{ color: '#64748b', fontSize: '0.88rem', fontWeight: 600 }}>Create your corporate biometric onboarding profile</p>
            </div>

            <div className="field" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button
                type="button"
                onClick={handleDemoFill}
                style={{
                  background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe',
                  color: '#1d4ed8', padding: '6px 14px', borderRadius: 12, fontWeight: 800, fontSize: '0.78rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(37,99,235,0.1)'
                }}
              >
                <Sparkles size={14} /> ✨ Auto-Fill Demo Credentials
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div className="field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', color: '#475569', fontSize: '0.75rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee Name</label>
                  <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full Name" required style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600 }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#475569', fontSize: '0.75rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee ID</label>
                  <input type="text" value={form.employeeId} onChange={e => set('employeeId', e.target.value)} placeholder="e.g. RLK-2026" required style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600 }} />
                </div>
              </div>

              <div className="field">
                <label style={{ display: 'block', color: '#475569', fontSize: '0.75rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department / Division</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {['Shared Services', 'Service Delivery'].map(dept => (
                    <button
                      type="button"
                      key={dept}
                      onClick={() => {
                        set('department', dept);
                        if (dept === 'Shared Services') set('assignedAccount', '');
                      }}
                      style={{
                        padding: '12px 14px', borderRadius: 12,
                        border: form.department === dept ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: form.department === dept ? 'rgba(37,99,235,0.08)' : 'white',
                        color: form.department === dept ? '#1d4ed8' : '#64748b',
                        fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s'
                      }}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>

              {form.department === 'Service Delivery' && (
                <div className="field fade-in">
                  <label style={{ display: 'block', color: '#2563eb', fontSize: '0.75rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Account / Campaign</label>
                  <select value={form.assignedAccount} onChange={e => set('assignedAccount', e.target.value)} required style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #93c5fd', background: '#eff6ff', color: '#1e3a8a', fontSize: '0.88rem', fontWeight: 700 }}>
                    <option value="">Select client account...</option>
                    {SERVICE_DELIVERY_ACCOUNTS.map(acc => (
                      <option key={acc} value={acc}>{acc}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="field">
                <label style={{ display: 'block', color: '#475569', fontSize: '0.75rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Corporate Email (@realynk.com or @realynk.net)</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="username@realynk.com" required style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: form.email && !validateEmailDomain(form.email) ? '1px solid #ef4444' : '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600 }} />
                {form.email && !validateEmailDomain(form.email) && (
                  <span style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={12} /> Personal email domains rejected. Use @realynk.com or @realynk.net
                  </span>
                )}
              </div>

              <div className="field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', color: '#475569', fontSize: '0.75rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Designation</label>
                  <select value={form.positionId} onChange={e => set('positionId', e.target.value)} required style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}>
                    <option value="">Select Role</option>
                    {positions.map(p => <option key={p.positionId} value={p.positionId}>{p.positionName}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#475569', fontSize: '0.75rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                  <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" required minLength={6} style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600 }} />
                </div>
              </div>

              {error && (
                <div className="field" style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, color: '#dc2626', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} flexShrink={0} /> {error}
                </div>
              )}

              <button className="field btn-primary" type="submit" disabled={loading || (form.email && !validateEmailDomain(form.email))} style={{ marginTop: 8, padding: '14px', borderRadius: 14, fontWeight: 800, fontSize: '0.98rem' }}>
                {loading ? 'Registering Corporate Identity...' : 'Submit Onboarding Registration'}
              </button>
            </form>

            <div className="field" style={{ marginTop: 24 }}>
              <Link
                to="/login"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '13px', borderRadius: 14,
                  background: 'rgba(37,99,235,0.08)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.25)',
                  fontWeight: 800, fontSize: '0.92rem', textDecoration: 'none', transition: 'all 0.15s'
                }}
              >
                <LogIn size={18} /> Sign In to Existing Portal Account
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
