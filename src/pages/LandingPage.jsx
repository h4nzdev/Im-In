import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin, Clock, Shield, Activity, ArrowRight, Zap, Users, Terminal, LayoutDashboard, CheckCircle2, ChevronRight, Fingerprint, Database } from 'lucide-react';
import realynkLogo from '../assets/realynk.png';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const heroRef = useRef(null);
  const floatingGroupRef = useRef(null);
  const featureRefs = useRef([]);
  const statsRef = useRef(null);
  const statNumbersRef = useRef([]);
  const roleRef = useRef(null);

  const [activeRole, setActiveRole] = useState('Admin');

  // Soft UI tokens
  const softBg = '#e6eef4';
  const softShadow = '10px 10px 20px rgba(163, 177, 198, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.6)';
  const softInset = 'inset 6px 6px 12px rgba(163, 177, 198, 0.5), inset -6px -6px 12px rgba(255, 255, 255, 0.8)';
  const hoverShadow = '12px 12px 24px rgba(163, 177, 198, 0.7), -12px -12px 24px rgba(255, 255, 255, 0.8)';
  
  const textColor = '#64748b';
  const headingColor = '#0f172a';
  const accentColor = '#054daf';

  useEffect(() => {
    let ctx = gsap.context(() => {
      
      // Hero Entrance
      gsap.fromTo(heroRef.current.children, 
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: 'power4.out', delay: 0.1 }
      );

      // Continuous Float Animation for Mock UI Elements
      gsap.to('.floating-card', {
        y: 'random(-15, 15)',
        x: 'random(-10, 10)',
        rotation: 'random(-2, 2)',
        duration: 'random(3, 5)',
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        stagger: 0.4
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
          { y: 60, opacity: 0 },
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

      // Roles Section Reveal
      gsap.fromTo(roleRef.current,
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1, scale: 1, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: roleRef.current, start: 'top 80%' }
        }
      );
    });
    return () => ctx.revert();
  }, []);

  // Parallax on mouse move for the hero section
  const handleMouseMove = (e) => {
    if (!floatingGroupRef.current) return;
    const { clientX, clientY } = e;
    const xPos = (clientX / window.innerWidth - 0.5) * 30;
    const yPos = (clientY / window.innerHeight - 0.5) * 30;
    
    gsap.to(floatingGroupRef.current.children, {
      x: xPos,
      y: yPos,
      duration: 1.5,
      ease: 'power2.out',
      stagger: 0.05
    });
  };

  const features = [
    { icon: <MapPin size={28} color={accentColor} />, title: "Precision Geofencing", desc: "Enforce location-based check-ins ensuring employees are exactly where they need to be." },
    { icon: <Clock size={28} color={accentColor} />, title: "Automated Tracking", desc: "Seamlessly log hours, manage shifts, and calculate payroll with pinpoint accuracy." },
    { icon: <Activity size={28} color={accentColor} />, title: "Developer Telemetry", desc: "Monitor system health, API latency, and application activity in real-time." },
    { icon: <Shield size={28} color={accentColor} />, title: "Enterprise Security", desc: "Advanced JWT authentication and Supabase RLS policies protect your data." },
  ];

  const stats = [
    { target: 99.9, suffix: '%', label: 'System Uptime' },
    { target: 12, suffix: 'ms', label: 'API Latency' },
    { target: 50, suffix: 'k+', label: 'Shifts Logged' },
    { target: 24, suffix: '/7', label: 'Live Support' }
  ];

  const roles = [
    {
      id: 'Admin',
      icon: <LayoutDashboard size={24} />,
      title: 'Executive Administration',
      desc: 'Get a bird\'s-eye view of your entire organization. Approve leaves, manage complex geofences, and analyze aggregated shift hours in real-time.',
      highlights: ['Live Geofence Map', 'Timesheet Approvals', 'Employee Pre-Registration']
    },
    {
      id: 'Employee',
      icon: <Users size={24} />,
      title: 'Workforce Operations',
      desc: 'Seamlessly clock in with biometric verification. Access your assignments, SOPs, and team schedules instantly on the go.',
      highlights: ['One-Tap Clock In', 'Live Operating Procedures', 'Team Schedules']
    },
    {
      id: 'Developer',
      icon: <Terminal size={24} />,
      title: 'System Engineering',
      desc: 'Monitor live infrastructure metrics, API latencies, and triage user-submitted bug reports connected directly to Supabase.',
      highlights: ['Application Activity Stream', 'Live Cloud Telemetry', 'Real-time Bug Tracker']
    }
  ];

  const activeRoleData = roles.find(r => r.id === activeRole);

  const mobileStyles = `
    @media (max-width: 900px) {
      .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; text-align: center; padding-top: 40px !important; }
      .hero-left { display: flex; flex-direction: column; align-items: center; text-align: center; }
      .hero-left p { margin: 0 auto 32px !important; }
      .roles-grid { grid-template-columns: 1fr !important; }
      .role-tabs { flex-direction: row !important; overflow-x: auto; padding-bottom: 12px; white-space: nowrap; }
      .role-tabs::-webkit-scrollbar { height: 4px; }
      .role-tabs::-webkit-scrollbar-thumb { background: rgba(5, 77, 175, 0.2); border-radius: 4px; }
      .role-tabs button { flex: 0 0 auto; }
      .role-content { padding: 32px 24px !important; min-height: auto !important; }
      .stats-grid { grid-template-columns: 1fr 1fr !important; gap: 30px !important; }
    }
    @media (max-width: 600px) {
      .stats-grid { grid-template-columns: 1fr !important; }
      .hero-title { font-size: 2.2rem !important; }
    }
  `;

  return (
    <div style={{ minHeight: '100vh', background: softBg, fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }} onMouseMove={handleMouseMove}>
      <style>{mobileStyles}</style>
      
      {/* ─── Navigation ──────────────────────────────────────────────────────── */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 5%', maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 8, borderRadius: 16, background: softBg, boxShadow: softShadow }}>
            <img src={realynkLogo} alt="Realynk" style={{ height: 32, width: 'auto' }} />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 900, color: headingColor, letterSpacing: '-0.5px' }}>Realynk</span>
        </div>
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <button style={{ 
            padding: '12px 28px', borderRadius: 20, background: softBg, color: accentColor, 
            fontWeight: 800, border: 'none', cursor: 'pointer', outline: 'none',
            boxShadow: softShadow, transition: 'all 0.25s ease', display: 'flex', alignItems: 'center', gap: 8
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = softInset; e.currentTarget.style.color = '#043e8a'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = softShadow; e.currentTarget.style.color = accentColor; }}>
            Portal Login <ArrowRight size={16} />
          </button>
        </Link>
      </nav>

      {/* ─── Interactive Hero Section ────────────────────────────────────────── */}
      <section className="hero-grid" style={{ padding: '60px 5% 120px', maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', position: 'relative' }}>
        
        {/* Left: Copy */}
        <div ref={heroRef} className="hero-left" style={{ zIndex: 2 }}>
          <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 30, background: softBg, boxShadow: softInset, color: accentColor, fontWeight: 800, fontSize: '0.85rem', marginBottom: 32, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Enterprise Workforce Platform
          </div>
          <h1 className="hero-title" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.2rem)', fontWeight: 900, color: headingColor, margin: '0 0 24px', lineHeight: 1.15, letterSpacing: '-1.5px' }}>
            Manage your teams with <span style={{ color: accentColor, position: 'relative' }}>
              absolute precision.
              <svg style={{ position: 'absolute', bottom: -10, left: 0, width: '100%', height: 12 }} viewBox="0 0 200 12" preserveAspectRatio="none">
                <path d="M0,10 Q100,-5 200,10" fill="none" stroke={accentColor} strokeWidth="4" strokeLinecap="round" opacity="0.3"/>
              </svg>
            </span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: textColor, margin: '0 0 48px', maxWidth: 540, lineHeight: 1.7, fontWeight: 500 }}>
            Realynk combines secure biometric verification, advanced geofencing, and real-time telemetry into a single, beautifully crafted platform.
          </p>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <div style={{ 
                padding: '18px 40px', borderRadius: 30, background: accentColor, color: 'white', 
                fontWeight: 800, fontSize: '1.05rem', cursor: 'pointer',
                boxShadow: '0 20px 40px rgba(5, 77, 175, 0.3), inset 0 2px 0 rgba(255,255,255,0.2)', transition: 'transform 0.2s ease, box-shadow 0.2s ease', display: 'inline-flex', alignItems: 'center', gap: 12
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 25px 45px rgba(5, 77, 175, 0.4), inset 0 2px 0 rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(5, 77, 175, 0.3), inset 0 2px 0 rgba(255,255,255,0.2)'; }}>
                Enter the Portal <ArrowRight size={20} />
              </div>
            </Link>
            <span style={{ color: textColor, fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={18} color="#10b981" /> 256-bit Encrypted
            </span>
          </div>
        </div>

        {/* Right: Floating Interactive UI Mockups */}
        <div ref={floatingGroupRef} style={{ position: 'relative', height: 500, display: 'none', '@media (min-width: 900px)': { display: 'block' } }}>
          
          {/* Mock Component 1: Telemetry */}
          <div className="floating-card" style={{ position: 'absolute', top: 40, right: 20, width: 280, padding: 20, borderRadius: 24, background: softBg, boxShadow: softShadow, border: '1px solid rgba(255,255,255,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 10, borderRadius: 12, background: 'rgba(5, 77, 175, 0.1)', color: accentColor }}><Activity size={20}/></div>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: headingColor }}>System Load</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: textColor }}>Live Cloud Telemetry</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 60, padding: '0 10px' }}>
               {[40, 65, 30, 80, 55, 90, 45].map((h, i) => (
                 <div key={i} style={{ flex: 1, background: i === 5 ? '#ef4444' : accentColor, height: `${h}%`, borderRadius: '4px 4px 0 0', opacity: i === 5 ? 1 : 0.4 }} />
               ))}
            </div>
          </div>

          {/* Mock Component 2: Auth Request */}
          <div className="floating-card" style={{ position: 'absolute', bottom: 60, left: 0, width: 260, padding: 20, borderRadius: 24, background: softBg, boxShadow: softShadow, border: '1px solid rgba(255,255,255,0.5)', zIndex: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 10, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><Fingerprint size={20}/></div>
              <div>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: headingColor }}>Auth Success</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: textColor }}>Biometric Verified</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: softBg, boxShadow: softInset, borderRadius: 12 }}>
               <span style={{ fontSize: '0.75rem', fontWeight: 700, color: textColor }}>J. Doe - Service Delivery</span>
               <CheckCircle2 size={16} color="#10b981" />
            </div>
          </div>

          {/* Mock Component 3: Database Sync */}
          <div className="floating-card" style={{ position: 'absolute', top: 220, right: -40, width: 220, padding: 16, borderRadius: 20, background: '#0f172a', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid #1e293b', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Database size={16} color="#3b82f6"/>
              <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 700 }}>Supabase Sync</span>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ color: '#10b981' }}>[OK] RLS Policies Active</span>
              <span style={{ color: '#3b82f6' }}>[OK] Profiles Updated</span>
              <span style={{ color: '#f59e0b' }}>[WAIT] Syncing Logs...</span>
            </div>
          </div>
          
        </div>
        
      </section>

      {/* ─── Animated Statistics Section ─────────────────────────────────────── */}
      <section ref={statsRef} style={{ padding: '60px 5%', background: 'white', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        <div className="stats-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, textAlign: 'center' }}>
          {stats.map((st, i) => (
            <div key={i}>
              <div style={{ fontSize: '3.5rem', fontWeight: 900, color: headingColor, letterSpacing: '-1px', display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
                <span ref={el => statNumbersRef.current[i] = el} data-target={st.target}>0</span>
                <span style={{ fontSize: '2rem', color: accentColor, marginLeft: 2 }}>{st.suffix}</span>
              </div>
              <p style={{ margin: '4px 0 0', color: textColor, fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{st.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Interactive Role Showcase ───────────────────────────────────────── */}
      <section style={{ padding: '100px 5%', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color: headingColor, margin: '0 0 16px', letterSpacing: '-1px' }}>
            Built for every layer of your business.
          </h2>
          <p style={{ fontSize: '1.1rem', color: textColor, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            Select a role to see how Realynk adapts its powerful toolset to meet their specific daily operational needs.
          </p>
        </div>

        <div ref={roleRef} className="roles-grid" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 40, alignItems: 'center' }}>
          
          {/* Tabs */}
          <div className="role-tabs" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {roles.map((r) => (
              <button 
                key={r.id}
                onClick={() => setActiveRole(r.id)}
                style={{
                  padding: '20px 24px', borderRadius: 24, border: 'none', cursor: 'pointer', outline: 'none',
                  display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
                  background: softBg,
                  boxShadow: activeRole === r.id ? softInset : softShadow,
                  color: activeRole === r.id ? accentColor : textColor,
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ padding: 10, borderRadius: 12, background: activeRole === r.id ? 'white' : softBg, boxShadow: activeRole === r.id ? softShadow : 'none' }}>
                  {r.icon}
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{r.id}</span>
              </button>
            ))}
          </div>

          {/* Active Content */}
          <div className="role-content" style={{ padding: 48, borderRadius: 40, background: softBg, boxShadow: softInset, minHeight: 350, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
             <h3 style={{ fontSize: '2rem', fontWeight: 900, color: headingColor, margin: '0 0 16px' }}>{activeRoleData.title}</h3>
             <p style={{ fontSize: '1.1rem', color: textColor, lineHeight: 1.7, marginBottom: 32, maxWidth: 500 }}>
               {activeRoleData.desc}
             </p>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
               {activeRoleData.highlights.map((hl, idx) => (
                 <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                   <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: softShadow, color: accentColor }}>
                     <CheckCircle2 size={14} />
                   </div>
                   <span style={{ fontWeight: 700, color: headingColor }}>{hl}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </section>

      {/* ─── Standard Features Grid ────────────────────────────────────────── */}
      <section style={{ padding: '40px 5% 100px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 30 }}>
          {features.map((feat, index) => (
            <div 
              key={index} 
              ref={el => featureRefs.current[index] = el}
              style={{ 
                padding: 40, borderRadius: 32, background: softBg, 
                boxShadow: softShadow, display: 'flex', flexDirection: 'column', gap: 20,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = hoverShadow; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = softShadow; }}
            >
              <div style={{ 
                width: 64, height: 64, borderRadius: 20, background: softBg, 
                boxShadow: softInset, display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                {feat.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: headingColor, margin: '0 0 12px' }}>{feat.title}</h3>
                <p style={{ margin: 0, color: textColor, fontSize: '0.95rem', lineHeight: 1.6, fontWeight: 500 }}>
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Footer CTA ────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 5%', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
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
              padding: '16px 40px', borderRadius: 24, background: softBg, color: accentColor, 
              fontWeight: 800, fontSize: '1.1rem', border: 'none', cursor: 'pointer', outline: 'none',
              boxShadow: softShadow, transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 10
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = softInset; e.currentTarget.style.color = '#043e8a'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = softShadow; e.currentTarget.style.color = accentColor; }}>
              Access the Portal <ChevronRight size={18} />
            </button>
          </Link>
        </div>
      </section>

      <footer style={{ padding: '40px 5%', textAlign: 'center', color: textColor, fontSize: '0.85rem', fontWeight: 600 }}>
        © {new Date().getFullYear()} Realynk Enterprise Cloud. All rights reserved.
      </footer>
    </div>
  );
}
