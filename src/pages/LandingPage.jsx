import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin, Clock, Shield, Activity, ArrowRight, Zap, Users } from 'lucide-react';
import realynkLogo from '../assets/realynk.png';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const heroRef = useRef(null);
  const featureRefs = useRef([]);
  const ctaRef = useRef(null);

  // Soft UI design tokens
  const softBg = '#e6eef4';
  const softShadow = '9px 9px 16px rgba(163, 177, 198, 0.5), -9px -9px 16px rgba(255, 255, 255, 0.8)';
  const softInset = 'inset 6px 6px 12px rgba(163, 177, 198, 0.5), inset -6px -6px 12px rgba(255, 255, 255, 0.8)';
  const textColor = '#64748b';
  const headingColor = '#0f172a';
  const accentColor = '#054daf';

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Hero Animation
      gsap.fromTo(heroRef.current.children, 
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power3.out' }
      );

      // Features Scroll Animation
      featureRefs.current.forEach((el, index) => {
        gsap.fromTo(el,
          { y: 80, opacity: 0, scale: 0.95 },
          { 
            y: 0, opacity: 1, scale: 1, 
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

      // CTA Scroll Animation
      gsap.fromTo(ctaRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: {
            trigger: ctaRef.current,
            start: 'top 90%'
          }
        }
      );
    });

    return () => ctx.revert();
  }, []);

  const features = [
    { icon: <MapPin size={32} color={accentColor} />, title: "Precision Geofencing", desc: "Enforce location-based check-ins ensuring employees are exactly where they need to be." },
    { icon: <Clock size={32} color={accentColor} />, title: "Automated Time Tracking", desc: "Seamlessly log hours, manage shifts, and calculate payroll with pinpoint accuracy." },
    { icon: <Activity size={32} color={accentColor} />, title: "Live Developer Telemetry", desc: "Monitor system health, API latency, and application activity in real-time." },
    { icon: <Shield size={32} color={accentColor} />, title: "Enterprise Grade Security", desc: "Advanced JWT authentication and Supabase RLS policies protect your sensitive data." },
    { icon: <Users size={32} color={accentColor} />, title: "Workforce Assignments", desc: "Deploy team assignments, schedules, and Standard Operating Procedures instantly." },
    { icon: <Zap size={32} color={accentColor} />, title: "Real-time Bug Syncing", desc: "Live issue tracking connected directly to the cloud for rapid developer response." },
  ];

  return (
    <div style={{ minHeight: '100vh', background: softBg, fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>
      
      {/* Navigation */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 5%', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 8, borderRadius: 16, background: softBg, boxShadow: softShadow }}>
            <img src={realynkLogo} alt="Realynk" style={{ height: 32, width: 'auto' }} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: headingColor, letterSpacing: '-0.5px' }}>Realynk</span>
        </div>
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <button style={{ 
            padding: '12px 28px', borderRadius: 20, background: softBg, color: accentColor, 
            fontWeight: 800, border: 'none', cursor: 'pointer', outline: 'none',
            boxShadow: softShadow, transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 8
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = softInset; e.currentTarget.style.color = '#043e8a'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = softShadow; e.currentTarget.style.color = accentColor; }}>
            Sign In <ArrowRight size={16} />
          </button>
        </Link>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} style={{ padding: '80px 5% 120px', maxWidth: 1400, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 30, background: softBg, boxShadow: softInset, color: accentColor, fontWeight: 800, fontSize: '0.85rem', marginBottom: 32, letterSpacing: '1px', textTransform: 'uppercase' }}>
          Next-Generation Enterprise Management
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, color: headingColor, margin: '0 0 24px', lineHeight: 1.1, letterSpacing: '-1.5px', maxWidth: 900 }}>
          Manage your workforce with <span style={{ color: accentColor }}>absolute precision.</span>
        </h1>
        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: textColor, margin: '0 0 48px', maxWidth: 650, lineHeight: 1.6, fontWeight: 500 }}>
          Realynk combines secure biometric verification, advanced geofencing, and real-time telemetry into a single, beautifully crafted platform.
        </p>
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <div style={{ 
            padding: '20px 48px', borderRadius: 30, background: accentColor, color: 'white', 
            fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer',
            boxShadow: '0 20px 40px rgba(5, 77, 175, 0.3), inset 0 2px 0 rgba(255,255,255,0.2)', transition: 'transform 0.2s ease', display: 'inline-flex', alignItems: 'center', gap: 12
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            Get Started <ArrowRight size={20} />
          </div>
        </Link>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 5%', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: headingColor, margin: '0 0 16px', letterSpacing: '-1px' }}>
            Powerful features. <br/>Soft, intuitive design.
          </h2>
          <p style={{ fontSize: '1.1rem', color: textColor, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            Everything you need to run enterprise operations smoothly, wrapped in a comfortable Neumorphic aesthetic.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40 }}>
          {features.map((feat, index) => (
            <div 
              key={index} 
              ref={el => featureRefs.current[index] = el}
              style={{ 
                padding: 40, borderRadius: 32, background: softBg, 
                boxShadow: softShadow, display: 'flex', flexDirection: 'column', gap: 20,
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ 
                width: 72, height: 72, borderRadius: 24, background: softBg, 
                boxShadow: softInset, display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                {feat.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: headingColor, margin: '0 0 12px' }}>{feat.title}</h3>
                <p style={{ margin: 0, color: textColor, fontSize: '0.95rem', lineHeight: 1.6, fontWeight: 500 }}>
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section ref={ctaRef} style={{ padding: '120px 5%', maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ 
          padding: '60px 40px', borderRadius: 40, background: softBg, 
          boxShadow: softInset, display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 900, color: headingColor, margin: '0 0 20px', letterSpacing: '-1px' }}>
            Ready to upgrade your workflow?
          </h2>
          <p style={{ fontSize: '1.1rem', color: textColor, maxWidth: 500, margin: '0 0 40px', lineHeight: 1.6 }}>
            Join thousands of enterprises already using Realynk to manage their distributed teams.
          </p>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button style={{ 
              padding: '16px 40px', borderRadius: 24, background: softBg, color: headingColor, 
              fontWeight: 800, fontSize: '1.1rem', border: 'none', cursor: 'pointer', outline: 'none',
              boxShadow: softShadow, transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = softInset}
            onMouseLeave={e => e.currentTarget.style.boxShadow = softShadow}>
              Open Portal
            </button>
          </Link>
        </div>
      </section>

      <footer style={{ padding: '40px 5%', textAlign: 'center', color: textColor, fontSize: '0.85rem', fontWeight: 500 }}>
        © {new Date().getFullYear()} Realynk Enterprise. All rights reserved.
      </footer>
    </div>
  );
}
