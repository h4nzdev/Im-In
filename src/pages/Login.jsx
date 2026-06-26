import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { LogIn, Shield, User, Zap } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

import realynkLogo from '../assets/realynk.png';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const cardRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, { y: 40, opacity: 0, duration: 0.7, ease: 'power3.out' });
      gsap.from(cardRef.current.querySelectorAll('.field'), {
        y: 20, opacity: 0, duration: 0.5, stagger: 0.08, delay: 0.2, ease: 'power3.out',
      });
    });
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = login(email, password);
      navigate(user.role === 'Admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPwd) => {
    setError('');
    setLoading(true);
    setEmail(demoEmail);
    setPassword(demoPwd);
    setTimeout(() => {
      try {
        const u = login(demoEmail, demoPwd);
        navigate(u.role === 'Admin' ? '/admin' : '/');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div ref={cardRef} className="glass" style={{ width: '100%', maxWidth: 440, borderRadius: 28, padding: 40, boxShadow: '0 16px 48px rgba(15,23,42,0.1)' }}>

        <div className="field" style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={realynkLogo} alt="Realynk" style={{ height: 56, width: 'auto', margin: '0 auto 10px', display: 'block' }} />
          <div style={{ fontSize: 42, fontWeight: 800, color: '#2563eb', marginBottom: 4, letterSpacing: '-1px' }}>
            Realynk
          </div>
          <p style={{ color: '#64748b', fontSize: '0.92rem', fontWeight: 500, margin: 0 }}>Enterprise Attendance Portal</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label style={{ display: 'block', color: '#475569', fontSize: '0.8rem', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Corporate Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required style={{ background: 'white !important' }} />
          </div>

          <div className="field">
            <label style={{ display: 'block', color: '#475569', fontSize: '0.8rem', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ background: 'white !important' }} />
          </div>

          {error && (
            <div className="field" style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, color: '#dc2626', fontSize: '0.88rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <button className="field btn-primary" type="submit" disabled={loading} style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '1rem', padding: '14px' }}>
            <LogIn size={18} /> {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Quick One-Click Login Shortcuts */}
        <div className="field" style={{ marginTop: 28, padding: '18px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1d4ed8', fontSize: '0.8rem', fontWeight: 800, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Zap size={15} /> Instant Demo Access
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@imin.com', 'admin123')}
              style={{
                padding: '10px 12px', borderRadius: 12, border: '1px solid #2563eb',
                background: 'white', color: '#1d4ed8', fontWeight: 800, fontSize: '0.84rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: '0 2px 8px rgba(37,99,235,0.15)', transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#1d4ed8'; }}
            >
              <Shield size={15} /> Login Admin
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('jane@imin.com', 'user123')}
              style={{
                padding: '10px 12px', borderRadius: 12, border: '1px solid #2563eb',
                background: 'white', color: '#2563eb', fontWeight: 800, fontSize: '0.84rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: '0 2px 8px rgba(37,99,235,0.15)', transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#2563eb'; }}
            >
              <User size={15} /> Login User
            </button>
          </div>
        </div>

        <p className="field" style={{ textAlign: 'center', marginTop: 24, color: '#64748b', fontSize: '0.88rem', fontWeight: 500 }}>
          No corporate account? <Link to="/signup" style={{ color: '#1d4ed8', textDecoration: 'none', fontWeight: 800 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
