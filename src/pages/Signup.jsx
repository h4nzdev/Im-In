import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ShieldCheck, ArrowRight, Building2, Briefcase, Mail, Key, User, AlertCircle, Sparkles, LogIn, Eye, EyeOff, Info, CheckCircle2, ChevronRight, ChevronLeft, Layers } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db, SERVICE_DELIVERY_ACCOUNTS } from '../lib/db';
import realynkLogo from '../assets/realynk.png';

export default function Signup() {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);
  const [activeTab, setActiveTab] = useState('IDENTITY'); // 'IDENTITY' | 'CREDENTIALS'
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
  const [showPassword, setShowPassword] = useState(false);
  const cardRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(cardRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' });
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

  const handleNextTab = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Employee Name is required'); return; }
    if (!form.employeeId.trim()) { setError('Employee ID is required'); return; }
    if (form.department === 'Service Delivery' && !form.assignedAccount) {
      setError('Please select an assigned account/campaign for Service Delivery');
      return;
    }
    setActiveTab('CREDENTIALS');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) { setError('Employee Name is required'); setActiveTab('IDENTITY'); return; }
    if (!form.employeeId.trim()) { setError('Employee ID is required'); setActiveTab('IDENTITY'); return; }
    if (!validateEmailDomain(form.email)) {
      setError('Invalid corporate email domain. Must end with @realynk.com or @realynk.net');
      return;
    }
    if (form.department === 'Service Delivery' && !form.assignedAccount) {
      setError('Please select an assigned account/campaign for Service Delivery');
      setActiveTab('IDENTITY');
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', background: '#f8fafc' }}>
      <div ref={cardRef} className="glass" style={{ width: '100%', maxWidth: 510, borderRadius: 28, padding: '34px 36px', boxShadow: '0 20px 50px rgba(15,23,42,0.08)' }}>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 8px 24px rgba(16,185,129,0.25)' }}>
              <ShieldCheck size={38} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
              Registration Submitted!
            </h2>
            <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: 1.55, margin: '0 0 24px' }}>
              Corporate credentials for <b>{form.email}</b> (Badge: <b>{form.employeeId}</b>) have been registered under <b>{form.department}</b>. An executive administrator will verify your profile before login activation.
            </p>
            <button 
              onClick={() => navigate('/login')}
              style={{
                width: '100%', padding: '14px 22px', background: '#054daf',
                color: 'white', fontWeight: 800, borderRadius: 16, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: '0.96rem',
                boxShadow: '0 6px 20px rgba(5, 77, 175,0.35)', transition: 'all 0.2s'
              }}
            >
              Return to Login Portal <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <>
            <div className="field" style={{ textAlign: 'center', marginBottom: 20 }}>
              <img src={realynkLogo} alt="Realynk" style={{ height: 44, width: 'auto', margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontSize: 26, fontWeight: 800, color: '#054daf', marginBottom: 2 }}>
                Join Realynk Enterprise
              </div>
              <p style={{ color: '#64748b', fontSize: '0.84rem', fontWeight: 600, margin: 0 }}>Create your corporate biometric onboarding profile</p>
            </div>

            <div className="field" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
              <button
                type="button"
                onClick={handleDemoFill}
                style={{
                  background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe',
                  color: '#043e8a', padding: '6px 14px', borderRadius: 12, fontWeight: 800, fontSize: '0.76rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(5, 77, 175,0.1)'
                }}
              >
                <Sparkles size={14} /> Auto-Fill Demo Credentials
              </button>
            </div>

            {/* Tab Header Navigation */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 4, background: '#f1f5f9', borderRadius: 14, marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => setActiveTab('IDENTITY')}
                style={{
                  padding: '10px 12px', borderRadius: 11, border: 'none', cursor: 'pointer',
                  background: activeTab === 'IDENTITY' ? 'white' : 'transparent',
                  color: activeTab === 'IDENTITY' ? '#054daf' : '#64748b',
                  fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: activeTab === 'IDENTITY' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <User size={15} /> 1. Identity & Division
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!form.name.trim() || !form.employeeId.trim()) {
                    setError('Please complete identity fields first');
                    return;
                  }
                  setError('');
                  setActiveTab('CREDENTIALS');
                }}
                style={{
                  padding: '10px 12px', borderRadius: 11, border: 'none', cursor: 'pointer',
                  background: activeTab === 'CREDENTIALS' ? 'white' : 'transparent',
                  color: activeTab === 'CREDENTIALS' ? '#054daf' : '#64748b',
                  fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: activeTab === 'CREDENTIALS' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <Key size={15} /> 2. Role & Credentials
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Tab 1: Identity & Division */}
              {activeTab === 'IDENTITY' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', fontSize: '0.75rem', fontWeight: 800, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee Name</label>
                      <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full Name" required style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#475569', fontSize: '0.75rem', fontWeight: 800, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee ID</label>
                      <input type="text" value={form.employeeId} onChange={e => set('employeeId', e.target.value)} placeholder="e.g. RLK-2026" required style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#475569', fontSize: '0.75rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department / Division Designation</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { id: 'Shared Services', label: 'Shared Services', sub: 'Non-Ops & Support Team', icon: Building2 },
                        { id: 'Service Delivery', label: 'Service Delivery', sub: 'Operations & Campaigns', icon: Briefcase }
                      ].map(item => {
                        const Icon = item.icon;
                        const isSelected = form.department === item.id;
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => {
                              set('department', item.id);
                              if (item.id === 'Shared Services') set('assignedAccount', '');
                            }}
                            style={{
                              padding: '12px 14px', borderRadius: 14,
                              border: isSelected ? '2px solid #054daf' : '1px solid #cbd5e1',
                              background: isSelected ? 'rgba(5, 77, 175,0.08)' : 'white',
                              color: isSelected ? '#043e8a' : '#64748b',
                              fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer', transition: 'all 0.15s',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Icon size={16} /> {item.label}
                            </span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: isSelected ? '#033373' : '#64748b', opacity: 0.9 }}>
                              {item.sub}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 12, background: form.department === 'Service Delivery' ? '#eff6ff' : '#f8fafc', border: form.department === 'Service Delivery' ? '1px solid #bfdbfe' : '1px solid #e2e8f0', fontSize: '0.75rem', color: '#334155', lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <Info size={16} color="#054daf" flexShrink={0} style={{ marginTop: 1 }} />
                      {form.department === 'Service Delivery' ? (
                        <span><strong>Service Delivery (Operations):</strong> Select this if you are working directly on client accounts and billable customer campaigns.</span>
                      ) : (
                        <span><strong>Shared Services (Non-Operations):</strong> Select this if you are internal corporate staff (HR, IT, Accounting, Recruitment, Internal Ops).</span>
                      )}
                    </div>
                  </div>

                  {form.department === 'Service Delivery' && (
                    <div className="fade-in">
                      <label style={{ display: 'block', color: '#054daf', fontSize: '0.75rem', fontWeight: 800, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Client Account / Campaign</label>
                      <select value={form.assignedAccount} onChange={e => set('assignedAccount', e.target.value)} required style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid #93c5fd', background: '#eff6ff', color: '#1e3a8a', fontSize: '0.88rem', fontWeight: 700, outline: 'none' }}>
                        <option value="">Select client account / campaign...</option>
                        {db.getAccounts().map(acc => (
                          <option key={acc} value={acc}>{acc}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleNextTab}
                    className="btn-primary"
                    style={{ marginTop: 6, padding: '13px', borderRadius: 14, fontWeight: 800, fontSize: '0.94rem', background: '#054daf', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(5, 77, 175,0.25)' }}
                  >
                    Continue to Role & Credentials <ChevronRight size={18} />
                  </button>
                </div>
              )}

              {/* Tab 2: Role & Credentials */}
              {activeTab === 'CREDENTIALS' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', color: '#475569', fontSize: '0.75rem', fontWeight: 800, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Corporate Email (@realynk.com or @realynk.net)</label>
                    <div style={{ position: 'relative' }}>
                      <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="username@realynk.com" required style={{ width: '100%', padding: '11px 14px 11px 36px', borderRadius: 12, border: form.email && !validateEmailDomain(form.email) ? '1px solid #ef4444' : '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }} />
                      <Mail size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 13 }} />
                    </div>
                    {form.email && !validateEmailDomain(form.email) && (
                      <span style={{ color: '#dc2626', fontSize: '0.74rem', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={12} /> Personal domains rejected. Use @realynk.com or @realynk.net
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#475569', fontSize: '0.75rem', fontWeight: 800, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <span>Designation Role</span>
                        <span style={{ fontSize: '0.65rem', color: '#054daf', fontWeight: 700 }}>Associate vs Admin</span>
                      </label>
                      <select value={form.positionId} onChange={e => set('positionId', e.target.value)} required style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }}>
                        <option value="">Select Role...</option>
                        {positions.map(p => <option key={p.positionId} value={p.positionId}>{p.positionName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#475569', fontSize: '0.75rem', fontWeight: 800, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" required minLength={6} style={{ width: '100%', padding: '11px 38px 11px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }} />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          title={showPassword ? "Hide password" : "Show password"}
                          style={{
                            position: 'absolute', right: 10, background: 'transparent', border: 'none',
                            cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 4, borderRadius: 6, transition: 'color 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#054daf'}
                          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '9px 12px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <Info size={15} color="#64748b" flexShrink={0} style={{ marginTop: 1 }} />
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569', fontWeight: 600, lineHeight: 1.35 }}>
                      <strong>Role Note:</strong> Associates track daily attendance & tasks; Admins/Team Leads manage shift rosters and payroll reports.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('IDENTITY')}
                      style={{ padding: '13px 16px', borderRadius: 14, background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <ChevronLeft size={18} /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || (form.email && !validateEmailDomain(form.email))}
                      className="btn-primary"
                      style={{ flex: 1, padding: '13px', borderRadius: 14, fontWeight: 800, fontSize: '0.94rem', background: '#054daf', color: 'white', border: 'none', boxShadow: '0 4px 16px rgba(5, 77, 175,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 1 }}
                    >
                      {loading ? 'Registering Identity...' : <>Submit Registration <CheckCircle2 size={18} /></>}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="field fade-in" style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, color: '#dc2626', fontSize: '0.84rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} flexShrink={0} /> {error}
                </div>
              )}

            </form>

            <div className="field" style={{ marginTop: 20 }}>
              <Link
                to="/login"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '12px', borderRadius: 14,
                  background: 'rgba(5, 77, 175,0.08)', color: '#054daf', border: '1px solid rgba(5, 77, 175,0.25)',
                  fontWeight: 800, fontSize: '0.88rem', textDecoration: 'none', transition: 'all 0.15s'
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
