import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/db';

export default function Signup() {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);
  const [form, setForm] = useState({ name: '', email: '', password: '', positionId: '' });
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
          y: 20, opacity: 0, duration: 0.5, stagger: 0.08, delay: 0.25, ease: 'power3.out',
        });
      }
    });
    return () => ctx.revert();
  }, [submitted]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.positionId) { setError('Please select a position'); return; }
    setLoading(true);
    try {
      signup(form);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div ref={cardRef} className="glass" style={{ width: '100%', maxWidth: 440, borderRadius: 24, padding: 40 }}>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <ShieldCheck size={36} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>
              Verification Pending
            </h2>
            <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 28px' }}>
              Your account registration for <b>{form.email}</b> has been received! An Administrator must review and approve your corporate credentials before you can sign in.
            </p>
            <button 
              onClick={() => navigate('/login')}
              style={{
                width: '100%', padding: '14px 24px', background: 'linear-gradient(135deg,#10b981,#059669)',
                color: 'white', fontWeight: 700, borderRadius: 14, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: '0.95rem',
                boxShadow: '0 4px 16px rgba(16,185,129,0.3)', transition: 'all 0.2s'
              }}
            >
              Return to Login <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <>
            <div className="field" style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 36, fontWeight: 800, background: 'linear-gradient(135deg,#059669,#065f46)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>
                Join Im'In
              </div>
              <p style={{ color: 'rgba(100,116,139,0.85)', fontSize: '0.9rem' }}>Create your corporate account</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['Name','text','name','Your full name'], ['Email','email','email','your@email.com'], ['Password','password','password','At least 6 characters']].map(([label, type, key, ph]) => (
                <div key={key} className="field">
                  <label style={{ display: 'block', color: 'rgba(51,65,85,0.85)', fontSize: '0.78rem', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={ph} required />
                </div>
              ))}

              <div className="field">
                <label style={{ display: 'block', color: 'rgba(51,65,85,0.85)', fontSize: '0.78rem', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Position</label>
                <select value={form.positionId} onChange={e => set('positionId', e.target.value)} required>
                  <option value="">Select your position</option>
                  {positions.map(p => <option key={p.positionId} value={p.positionId}>{p.positionName} — {p.department}</option>)}
                </select>
              </div>

              {error && (
                <div className="field" style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, color: '#dc2626', fontSize: '0.85rem' }}>
                  {error}
                </div>
              )}

              <button className="field btn-primary" type="submit" disabled={loading} style={{ marginTop: 6 }}>
                {loading ? 'Submitting registration...' : 'Register Account'}
              </button>
            </form>

            <p className="field" style={{ textAlign: 'center', marginTop: 24, color: 'rgba(100,116,139,0.8)', fontSize: '0.85rem' }}>
              Already have an account? <Link to="/login" style={{ color: '#047857', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
