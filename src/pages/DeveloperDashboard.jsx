import { useState, useRef, useEffect, useMemo } from 'react';
import { gsap } from 'gsap';
import { Activity, Server, Cpu, Database, Terminal, CheckCircle2, Wifi, HardDrive, ShieldAlert, Zap } from 'lucide-react';
import { db } from '../lib/db';

export default function DeveloperDashboard() {
  const containerRef = useRef();
  const logRef = useRef(null);

  // Core Telemetry State
  const [cpu, setCpu] = useState(42);
  const [ram, setRam] = useState(65);
  const [latency, setLatency] = useState(120);
  
  // Advanced Telemetry State
  const [uptime, setUptime] = useState(99.99);
  const [errorRate, setErrorRate] = useState(0.01);
  const [activeSessions, setActiveSessions] = useState(342);
  const [dbSize, setDbSize] = useState(1.4);
  const [networkTraffic, setNetworkTraffic] = useState(45);

  const [events, setEvents] = useState([
    { id: 1, text: 'System initialized. Telemetry online.', time: new Date().toLocaleTimeString(), color: '#10b981' }
  ]);

  useEffect(() => {
    // 1. Initial GSAP animation
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current.querySelectorAll('.card, .stat-card'), {
        y: 24, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out',
      });
    });

    // 2. Realtime bug listener just for stream logging
    const handleBugsUpdate = () => {
      setEvents(prev => [...prev.slice(-49), { id: Date.now(), text: 'New bug report synchronized to Supabase.', time: new Date().toLocaleTimeString(), color: '#f59e0b' }]);
    };
    window.addEventListener('bug_reports_updated', handleBugsUpdate);

    // 3. Telemetry simulator interval
    const interval = setInterval(() => {
      setCpu(prev => Math.max(10, Math.min(95, prev + (Math.random() * 20 - 10))));
      setRam(prev => Math.max(30, Math.min(90, prev + (Math.random() * 10 - 5))));
      setLatency(prev => Math.max(20, Math.min(300, prev + (Math.random() * 40 - 20))));
      setNetworkTraffic(prev => Math.max(10, Math.min(150, prev + (Math.random() * 30 - 15))));
      setActiveSessions(prev => Math.max(300, Math.min(500, prev + (Math.random() * 10 - 5))));
      
      if (Math.random() > 0.6) {
        const msgs = [
          { text: 'User session verified via JWT token', color: '#10b981' },
          { text: 'Supabase Realtime channel [profiles] connected', color: '#3b82f6' },
          { text: 'Geofence boundary computation executed', color: '#cbd5e1' },
          { text: 'Querying [assignments] table...', color: '#cbd5e1' },
          { text: 'Database health check: OK', color: '#10b981' },
          { text: 'Syncing EOD reports...', color: '#3b82f6' }
        ];
        if (Math.random() > 0.9) {
          msgs.push({ text: 'Warning: Slight delay in Auth API', color: '#f59e0b' });
          setErrorRate(prev => Math.min(5.0, prev + 0.05));
        } else {
          setErrorRate(prev => Math.max(0.01, prev - 0.02));
        }
        
        const selected = msgs[Math.floor(Math.random() * msgs.length)];
        setEvents(prev => [...prev.slice(-49), { id: Date.now(), text: selected.text, time: new Date().toLocaleTimeString(), color: selected.color }]);
      }
    }, 2500);

    return () => {
      window.removeEventListener('bug_reports_updated', handleBugsUpdate);
      clearInterval(interval);
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [events]);

  const metrics = [
    { label: 'System Uptime', value: `${uptime.toFixed(2)}%`, icon: <Zap size={18} color="#10b981" /> },
    { label: 'API Error Rate', value: `${errorRate.toFixed(2)}%`, icon: <ShieldAlert size={18} color={errorRate > 1 ? '#ef4444' : '#f59e0b'} /> },
    { label: 'Active Sessions', value: Math.round(activeSessions), icon: <Activity size={18} color="#054daf" /> },
    { label: 'Database Size', value: `${dbSize.toFixed(1)} GB`, icon: <HardDrive size={18} color="#6366f1" /> },
  ];

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      
      {/* ─── Page Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: '#054daf', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(5,77,175,0.3)' }}>
          <Activity size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>System Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0', fontWeight: 500 }}>
            Live Infrastructure Monitoring & Telemetry
          </p>
        </div>
      </div>

      {/* ─── Advanced Metrics Grid ─────────────────────────────────── */}
      <div className="card stats-grid" style={{ gap: 16, marginBottom: 24 }}>
        {metrics.map((m, i) => (
          <div key={i} className="stat-card glass" style={{ padding: '16px 20px', borderRadius: 20, background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(15,23,42,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {m.icon}
            </div>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', margin: '0 0 4px' }}>{m.label}</p>
              <p style={{ color: '#0f172a', fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Main Telemetry Area ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        
        {/* Resource Gauges */}
        <div className="card glass" style={{ padding: 24, borderRadius: 24, background: 'white', border: '1px solid rgba(15,23,42,0.08)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={20} color="#054daf" /> Cloud Infrastructure Load
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* CPU */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Cpu size={16} /> Server CPU Utilization</span>
                <span style={{ color: cpu > 80 ? '#ef4444' : '#0f172a', fontWeight: 800 }}>{Math.round(cpu)}%</span>
              </div>
              <div style={{ height: 10, borderRadius: 5, background: '#f1f5f9', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${cpu}%`, background: cpu > 80 ? '#ef4444' : cpu > 60 ? '#f59e0b' : '#10b981', transition: 'width 0.5s ease-out, background 0.5s' }} />
              </div>
            </div>

            {/* RAM */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Database size={16} /> Memory Allocation</span>
                <span style={{ color: ram > 85 ? '#ef4444' : '#0f172a', fontWeight: 800 }}>{Math.round(ram)}%</span>
              </div>
              <div style={{ height: 10, borderRadius: 5, background: '#f1f5f9', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${ram}%`, background: ram > 85 ? '#ef4444' : ram > 70 ? '#f59e0b' : '#3b82f6', transition: 'width 0.5s ease-out, background 0.5s' }} />
              </div>
            </div>

            {/* Network */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Wifi size={16} /> Network Traffic</span>
                <span style={{ color: networkTraffic > 120 ? '#ef4444' : '#0f172a', fontWeight: 800 }}>{Math.round(networkTraffic)} MB/s</span>
              </div>
              <div style={{ height: 10, borderRadius: 5, background: '#f1f5f9', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(networkTraffic/150)*100}%`, background: networkTraffic > 120 ? '#ef4444' : networkTraffic > 90 ? '#f59e0b' : '#8b5cf6', transition: 'width 0.5s ease-out, background 0.5s' }} />
              </div>
            </div>

            {/* Latency */}
            <div style={{ background: 'rgba(15,23,42,0.03)', padding: 16, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#475569', fontSize: '0.9rem' }}>
                  <Activity size={18} color="#054daf" /> Gateway API Latency
                </span>
                <span style={{ color: latency > 200 ? '#ef4444' : '#10b981', fontWeight: 800, fontSize: '1.2rem' }}>
                  {Math.round(latency)} ms
                </span>
            </div>
          </div>
        </div>

        {/* Activity Stream Terminal */}
        <div className="card glass" style={{ padding: 24, borderRadius: 24, background: '#0f172a', display: 'flex', flexDirection: 'column', minHeight: 400, border: '1px solid #1e293b', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Terminal size={20} color="#10b981" /> Application Activity Stream
            </h2>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
            </div>
          </div>
          
          <div ref={logRef} style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.5)', borderRadius: 16, padding: 16, fontFamily: '"Fira Code", monospace', fontSize: '0.8rem', lineHeight: 1.6 }}>
            {events.map(ev => (
              <div key={ev.id} style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
                <span style={{ color: '#64748b', whiteSpace: 'nowrap', userSelect: 'none' }}>[{ev.time}]</span>
                <span style={{ color: ev.color || '#cbd5e1' }}>{ev.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
