import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin, Clock, Shield, Activity, ArrowRight } from 'lucide-react';
import realynkLogo from '../assets/realynk.png';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const clockRef = useRef(null);
  const glowRef = useRef(null);
  const featureRefs = useRef([]);
  const statsRef = useRef(null);
  const statNumbersRef = useRef([]);

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Hero Entrance
      gsap.fromTo('.hero-content', 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.5, ease: 'power3.out', delay: 0.2 }
      );

      // Glow pulse
      gsap.to(glowRef.current, {
        opacity: 0.85,
        scale: 1.05,
        duration: 4,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });

      // Stats Scroll Animation
      ScrollTrigger.create({
        trigger: statsRef.current,
        start: 'top 85%',
        onEnter: () => {
          statNumbersRef.current.forEach(el => {
            if (!el) return;
            const target = parseFloat(el.getAttribute('data-target'));
            const isDecimal = target % 1 !== 0;
            const obj = { val: 0 };
            
            gsap.to(obj, {
              val: target,
              duration: 2,
              ease: 'power3.out',
              onUpdate: () => {
                el.innerText = isDecimal ? obj.val.toFixed(1) : Math.floor(obj.val);
              }
            });
          });
        },
        once: true
      });

      // Features Stagger Reveal
      featureRefs.current.forEach((el, index) => {
        gsap.fromTo(el,
          { y: 40, opacity: 0 },
          { 
            y: 0, opacity: 1, 
            duration: 0.8, 
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      });
    });
    return () => ctx.revert();
  }, []);

  const formatTime = (date) => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const features = [
    { icon: <MapPin size={24} color="#054daf" />, title: "Precision Geofencing", desc: "Enforce location-based check-ins ensuring employees are exactly where they need to be." },
    { icon: <Clock size={24} color="#054daf" />, title: "Automated Tracking", desc: "Seamlessly log hours, manage shifts, and calculate payroll with pinpoint accuracy." },
    { icon: <Activity size={24} color="#054daf" />, title: "Developer Telemetry", desc: "Monitor system health, API latency, and application activity in real-time." },
    { icon: <Shield size={24} color="#054daf" />, title: "Enterprise Security", desc: "Advanced JWT authentication and Supabase RLS policies protect your data." },
  ];

  const stats = [
    { target: 99.9, suffix: '%', label: 'System Uptime' },
    { target: 12, suffix: 'ms', label: 'API Latency' },
    { target: 50, suffix: 'k+', label: 'Shifts Logged' },
    { target: 24, suffix: '/7', label: 'Live Support' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#e2e4e6', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>
      
      {/* ─── Hero Section (Full Height) ────────────────────────────────────────── */}
      <section style={{ height: '100vh', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Top Navbar */}
        <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '30px 40px', zIndex: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={realynkLogo} alt="Realynk" style={{ height: 28, width: 'auto' }} />
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1a1a1a', letterSpacing: '-0.5px' }}>Realynk</span>
            <div style={{ width: 4, height: 4, background: '#1a1a1a', borderRadius: '50%', margin: '0 8px' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', color: '#64748b', textTransform: 'uppercase' }}>
              Time Processor App
            </span>
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px' }}>
            <Link to="/login" style={{ textDecoration: 'none', color: '#1a1a1a' }}>LOGIN</Link>
            <span style={{ color: '#999' }}>/</span>
            <a href="#about" style={{ textDecoration: 'none', color: '#1a1a1a' }}>ABOUT</a>
          </div>
        </nav>

        {/* Centerpiece: Clock & Lines */}
        <div className="hero-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, marginTop: '-5vh' }}>
          
          <h1 ref={clockRef} style={{ fontSize: 'clamp(5rem, 15vw, 11rem)', fontWeight: 400, color: '#111', margin: 0, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(time)}
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px', marginTop: '2vh', width: '100%', maxWidth: '600px', padding: '0 20px' }}>
            <div style={{ flex: 1, borderBottom: '1.5px solid #111', paddingBottom: '8px', fontSize: '0.6rem', fontWeight: 700, color: '#666', letterSpacing: '1px' }}>LINE 1</div>
            <div style={{ flex: 1, borderBottom: '1.5px solid #111', paddingBottom: '8px', fontSize: '0.6rem', fontWeight: 700, color: '#666', letterSpacing: '1px', textAlign: 'center' }}>LINE 2</div>
            <div style={{ flex: 1, borderBottom: '1.5px solid #111', paddingBottom: '8px', fontSize: '0.6rem', fontWeight: 700, color: '#666', letterSpacing: '1px', textAlign: 'right' }}>LINE 3</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#111', paddingBottom: '2px', marginLeft: '10px' }}>82</div>
          </div>
        </div>

        {/* Bottom Text */}
        <div style={{ position: 'absolute', bottom: '30px', width: '100%', textAlign: 'center', zIndex: 10 }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1.5px', color: '#111', textTransform: 'uppercase' }}>
            Thermal Generation Bar
          </span>
        </div>

        {/* The Glow Gradient */}
        <div ref={glowRef} style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '45vh',
          background: 'linear-gradient(to top, rgba(5,77,175,0.7) 0%, rgba(16,185,129,0.4) 40%, rgba(226,228,230,0) 100%)',
          filter: 'blur(40px)',
          zIndex: 1,
          opacity: 0.7,
          transformOrigin: 'bottom center'
        }} />
      </section>

      {/* ─── Application App-Like UI Sections ─────────────────────────────────── */}
      <section id="about" style={{ padding: '120px 5%', maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 16px', letterSpacing: '-1px' }}>
            Enterprise Workforce Platform
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            Im'In combines secure biometric verification, advanced geofencing, and real-time telemetry into a single, beautifully crafted platform.
          </p>
        </div>

        {/* Features Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 80 }}>
          {features.map((f, i) => (
            <div key={i} ref={el => featureRefs.current[i] = el} style={{
              background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>{f.title}</h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats Grid */}
        <div ref={statsRef} style={{
          background: '#0f172a', padding: '60px 40px', borderRadius: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, textAlign: 'center'
        }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'white', lineHeight: 1, marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>
                <span ref={el => statNumbersRef.current[i] = el} data-target={s.target}>0</span>
                <span style={{ color: '#3b82f6' }}>{s.suffix}</span>
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Roles CTA */}
        <div style={{ marginTop: 100, display: 'grid', gridTemplateColumns: '1fr', gap: 40, alignItems: 'center', marginBottom: 60 }}>
          <div style={{ textAlign: 'center' }}>
             <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 24px', letterSpacing: '-1px' }}>
              Ready to synchronize your team?
            </h2>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <button style={{
                background: '#054daf', color: 'white', padding: '16px 40px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 12, boxShadow: '0 10px 25px rgba(5,77,175,0.3)', transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                Login to Portal <ArrowRight size={20} />
              </button>
            </Link>
          </div>
        </div>
        
      </section>
      
    </div>
  );
}
