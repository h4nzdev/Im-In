import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ShieldCheck, ArrowRight, Building2, Briefcase, Mail, Key, User, AlertCircle, Sparkles, LogIn, Eye, EyeOff, Info, CheckCircle2, ChevronRight, ChevronLeft, QrCode } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db, SERVICE_DELIVERY_ACCOUNTS } from '../lib/db';
import realynkLogo from '../assets/realynk.png';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function Signup() {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState('IDENTITY');
  const [form, setForm] = useState({
    inviteCode: '',
    name: '',
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
  const [isIdVerified, setIsIdVerified] = useState(false);
  const [idStatusMsg, setIdStatusMsg] = useState('');
  const [assignedId, setAssignedId] = useState('');
  const cardRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(cardRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' });
    });
    return () => ctx.revert();
  }, [submitted]);

  useEffect(() => {
    if (activeTab !== 'IDENTITY' || isIdVerified || submitted) return;

    const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
    
    scanner.render((decodedText) => {
      const codes = db.getInviteCodes();
      const validCode = codes.find(c => c.code === decodedText.trim().toUpperCase() && c.status === 'Active');
      if (validCode) {
        setForm(f => ({ ...f, inviteCode: validCode.code }));
        setIsIdVerified(true);
        setIdStatusMsg('✓ Secure QR Code Scanned & Verified!');
        scanner.clear();
      } else {
        setIdStatusMsg('! Invalid or Expired QR Code');
      }
    }, (err) => { /* ignore */ });

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [activeTab, isIdVerified, submitted]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validateEmailDomain = (email) => {
    return /^[^@]+@(realynk\.com|realynk\.net)$/i.test(email.trim());
  };

  const handleNextTab = (e) => {
    e.preventDefault();
    setError('');
    if (!isIdVerified) { setError('Please scan a valid registration QR code first'); return; }
    if (!form.name.trim()) { setError('Employee Name is required'); return; }
    if (form.department === 'Service Delivery' && !form.assignedAccount) {
      setError('Please select an assigned account/campaign for Service Delivery');
      return;
    }
    setActiveTab('CREDENTIALS');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!isIdVerified) { setError('Please scan a valid registration QR code first'); setActiveTab('IDENTITY'); return; }
    if (!form.name.trim()) { setError('Employee Name is required'); setActiveTab('IDENTITY'); return; }
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
      const generatedId = `RLK-${Math.floor(1000 + Math.random() * 9000)}`;
      setAssignedId(generatedId);
      
      signup({
        ...form,
        email: form.email.trim().toLowerCase(),
        employeeId: generatedId,
        status: 'Pending'
      });
      
      db.markInviteCodeUsed(form.inviteCode, generatedId);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return <Navigate to={user.role === 'Admin' ? '/admin' : '/'} replace />;
  }

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
              Corporate credentials for <b>{form.email}</b> have been registered under <b>{form.department}</b>.
              <br/><br/>
              Your auto-generated Employee ID is:
            </p>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#054daf', background: '#eff6ff', padding: '12px 24px', borderRadius: 16, border: '2px dashed #93c5fd', margin: '0 auto 24px', display: 'inline-block', letterSpacing: '0.1em' }}>
              {assignedId}
            </div>
            <p style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <AlertCircle size={16}/> Your account is pending Admin verification. You cannot login yet.
            </p>
            <Link to="/login" className="btn-primary" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 14, background: '#0f172a', color: 'white', fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 14px rgba(15,23,42,0.25)' }}>
              Return to Login
            </Link>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <img src={realynkLogo} alt="Realynk" style={{ height: 42, marginBottom: 16 }} />
              <div style={{ fontSize: 24, fontWeight: 900, color: '#054daf', letterSpacing: '-0.5px' }}>
                Join Realynk Enterprise
              </div>
              <p style={{ color: '#64748b', fontSize: '0.88rem', fontWeight: 600, marginTop: 6 }}>
                Create your corporate biometric onboarding profile
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
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
                <User size={15} /> <span style={{ whiteSpace: 'nowrap' }}>1. Identity</span>
              </button>
              <button
                type="button"
                disabled={!isIdVerified}
                onClick={() => {
                  setError('');
                  if (isIdVerified) setActiveTab('CREDENTIALS');
                }}
                style={{
                  padding: '10px 12px', borderRadius: 11, border: 'none', cursor: 'pointer',
                  background: activeTab === 'CREDENTIALS' ? 'white' : 'transparent',
                  color: activeTab === 'CREDENTIALS' ? '#054daf' : '#64748b',
                  fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: activeTab === 'CREDENTIALS' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s',
                  opacity: !isIdVerified ? 0.5 : 1
                }}
              >
                <Key size={15} /> <span style={{ whiteSpace: 'nowrap' }}>2. Credentials</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Tab 1: Identity */}
              {activeTab === 'IDENTITY' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  
                  {!isIdVerified ? (
                    <div style={{ background: '#fff', border: '2px dashed #cbd5e1', borderRadius: 16, padding: '16px', textAlign: 'center' }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <QrCode size={18} color="#054daf"/> Scan Registration QR
                      </h3>
                      <div id="qr-reader" style={{ width: '100%', maxWidth: 400, margin: '0 auto', overflow: 'hidden', borderRadius: 12 }}></div>
                      {idStatusMsg && (
                        <p style={{ margin: '12px 0 0', color: '#ef4444', fontSize: '0.8rem', fontWeight: 700 }}>{idStatusMsg}</p>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '16px', borderRadius: 16, background: '#ecfdf5', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                      <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#065f46', margin: '0 0 4px' }}>QR Verified!</h3>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#047857', fontWeight: 600 }}>Registration Code: {form.inviteCode}</p>
                    </div>
                  )}

                  {isIdVerified && (
                    <>
                      <div>
                        <label style={{ display: 'block', color: '#475569', fontSize: '0.75rem', fontWeight: 800, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
                        <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Jane Doe" required style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }} />
                      </div>

                      <div>
                        <label style={{ display: 'block', color: '#475569', fontSize: '0.75rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department / Division Designation</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
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
                                  background: isSelected ? 'rgba(5, 77, 175,0.04)' : 'white',
                                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                  cursor: 'pointer', transition: 'all 0.2s'
                                }}
                              >
                                <Icon size={22} color={isSelected ? '#054daf' : '#94a3b8'} />
                                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: isSelected ? '#033373' : '#475569' }}>
                                  {item.label}
                                </span>
                                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: isSelected ? '#033373' : '#64748b', opacity: 0.9, textAlign: 'center' }}>
                                  {item.sub}
                                </span>
                              </button>
                            );
                          })}
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
                    </>
                  )}
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

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#475569', fontSize: '0.75rem', fontWeight: 800, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <span>Designation Role</span>
                        <span style={{ fontSize: '0.65rem', color: '#054daf', fontWeight: 700 }}>Associate vs Admin</span>
                      </label>
                      <select value={form.positionId} onChange={e => set('positionId', e.target.value)} required style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }}>
                        <option value="">Select Role...</option>
                        {positions.filter(p => p.positionName !== 'Executive Administrator').map(p => <option key={p.positionId} value={p.positionId}>{p.positionName}</option>)}
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
                      style={{ flex: 1, padding: '13px', borderRadius: 14, fontWeight: 800, fontSize: '0.94rem', background: '#054daf', color: 'white', border: 'none', boxShadow: '0 4px 16px rgba(5, 77, 175,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', opacity: 1 }}
                    >
                      {loading ? 'Registering...' : 'Submit Registration'}
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
