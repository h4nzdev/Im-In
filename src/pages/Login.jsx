import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { LogIn, Sparkles, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import realynkLogo from '../assets/realynk.png';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const cardRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(cardRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' });
    });
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = login(email, password);
      const targetRoute = user.role === 'Admin' ? '/admin' : user.role === 'Developer' ? '/developer' : '/';
      navigate(targetRoute);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    const targetRoute = user.role === 'Admin' ? '/admin' : user.role === 'Developer' ? '/developer' : '/';
    return <Navigate to={targetRoute} replace />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div ref={cardRef} className="glass" style={{ width: '100%', maxWidth: 440, borderRadius: 28, padding: 40, boxShadow: '0 16px 48px rgba(15,23,42,0.1)' }}>
        
        <div className="field" style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src={realynkLogo} alt="Realynk Enterprise" style={{ height: 48, width: 'auto', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Enterprise Portal
          </div>
          <p style={{ color: '#64748b', fontSize: '0.88rem', fontWeight: 600, marginTop: 4 }}>
            Biometric & Schedule Management Suite
          </p>
        </div>

        <div className="field" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => { setEmail('admin@realynk.com'); setPassword('admin123'); setError(''); }}
            style={{
              background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe',
              color: '#043e8a', padding: '6px 12px', borderRadius: 10, fontWeight: 800, fontSize: '0.75rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 2px 6px rgba(5, 77, 175,0.1)'
            }}
          >
            <Sparkles size={14} /> Fill Demo Credentials
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label style={{ display: 'block', color: '#475569', fontSize: '0.78rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Corporate Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@realynk.com"
              required
              style={{ width: '100%', padding: '13px 16px', borderRadius: 14, border: '1px solid #cbd5e1', background: 'white', fontSize: '0.92rem', fontWeight: 600 }}
            />
          </div>

          <div className="field">
            <label style={{ display: 'block', color: '#475569', fontSize: '0.78rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', padding: '13px 44px 13px 16px', borderRadius: 14, border: '1px solid #cbd5e1', background: 'white', fontSize: '0.92rem', fontWeight: 600 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: 'absolute', right: 12, background: 'transparent', border: 'none',
                  cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 6, borderRadius: 8, transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#054daf'}
                onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="field" style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, color: '#dc2626', fontSize: '0.88rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '1rem', padding: '14px', background: '#054daf', color: '#ffffff', border: 'none', borderRadius: 14, fontWeight: 800, boxShadow: '0 4px 16px rgba(5, 77, 175,0.3)', cursor: 'pointer', width: '100%', opacity: 1 }}>
            <LogIn size={18} /> {loading ? 'Logging in...' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="field" style={{ marginTop: 24 }}>
          <Link
            to="/signup"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '13px', borderRadius: 14,
              background: 'rgba(5, 77, 175,0.08)', color: '#054daf', border: '1px solid rgba(5, 77, 175,0.25)',
              fontWeight: 800, fontSize: '0.92rem', textDecoration: 'none', transition: 'all 0.15s'
            }}
          >
            <UserPlus size={18} /> Register New Enterprise Profile
          </Link>
        </div>

      </div>
    </div>
  );
}
