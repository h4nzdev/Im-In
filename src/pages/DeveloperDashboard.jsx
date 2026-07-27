import { useState, useRef, useEffect, useMemo } from 'react';
import { gsap } from 'gsap';
import { RefreshCw, Server, Database, Activity, Users, CheckCircle, Wifi, AlertTriangle, ShieldAlert, Cpu, HardDrive, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell } from 'recharts';
import { db } from '../lib/db';

export default function DeveloperDashboard() {
  const containerRef = useRef();

  // Simulated Telemetry State
  const [cpu, setCpu] = useState(0.5);
  const [ram, setRam] = useState(19066);
  const maxRam = 31387; // Example max RAM in MB
  const [latency, setLatency] = useState(174);
  const [uptime] = useState('v1.0.1'); // Could be a version string as in image
  const [apiRequests, setApiRequests] = useState(5);
  const [apiTime, setApiTime] = useState(547);
  const [activeSocketConns, setActiveSocketConns] = useState(0);

  const [activeSessionsData, setActiveSessionsData] = useState([
    { role: 'Associates', count: 0 },
    { role: 'Managers', count: 0 },
    { role: 'Success Leads', count: 0 },
    { role: 'Admins', count: 0 },
    { role: 'Developers', count: 0 }
  ]);

  const [errorLogs, setErrorLogs] = useState([
    { id: 1, source: 'API Monitor', time: '64d ago', message: 'API error rate critical: 5.26%' },
    { id: 2, source: 'API Monitor', time: '64d ago', message: 'API error rate critical: 5.26%' }
  ]);

  useEffect(() => {
    // 1. Initial GSAP animation
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current.children, {
        y: 20, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out',
      });
    });

    // 2. Fetch real user session data
    const users = db.getUsers();
    const active = users.filter(u => u.isActive);
    const sessionCount = {
      'Associates': active.filter(u => u.role === 'Associate' || !u.role).length,
      'Managers': active.filter(u => u.role === 'Manager').length,
      'Success Leads': active.filter(u => u.role === 'Success Lead').length,
      'Admins': active.filter(u => u.role === 'Admin').length,
      'Developers': active.filter(u => u.role === 'Developer').length,
    };
    setActiveSessionsData([
      { role: 'Associates', count: sessionCount['Associates'] },
      { role: 'Managers', count: sessionCount['Managers'] },
      { role: 'Success Leads', count: sessionCount['Success Leads'] },
      { role: 'Admins', count: sessionCount['Admins'] },
      { role: 'Developers', count: sessionCount['Developers'] }
    ]);
    setActiveSocketConns(active.length);

    // 3. Telemetry simulator interval
    const interval = setInterval(() => {
      setCpu(prev => Math.max(0.1, Math.min(100, prev + (Math.random() * 2 - 1))));
      setRam(prev => Math.max(15000, Math.min(maxRam, prev + (Math.random() * 500 - 250))));
      setLatency(prev => Math.max(50, Math.min(300, prev + (Math.random() * 40 - 20))));
      setApiTime(prev => Math.max(100, Math.min(800, prev + (Math.random() * 60 - 30))));
      if (Math.random() > 0.7) setApiRequests(prev => prev + 1);
    }, 2500);

    return () => {
      clearInterval(interval);
      ctx.revert();
    };
  }, []);

  const totalSessions = activeSessionsData.reduce((acc, curr) => acc + curr.count, 0);

  // Pie Chart Colors
  const memPercent = (ram / maxRam) * 100;
  const memColor = memPercent > 85 ? '#ef4444' : memPercent > 60 ? '#f59e0b' : '#f59e0b'; // matching screenshot yellow

  const cpuColor = cpu > 85 ? '#ef4444' : cpu > 60 ? '#f59e0b' : '#10b981';

  return (
    <div ref={containerRef} style={{ padding: '0 0 40px', maxWidth: 1400, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      
      {/* ─── Page Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>System Health</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0', fontWeight: 500 }}>
            Real-time platform monitoring - Last updated just now
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1, padding: '4px 10px', borderRadius: 20, background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
            System Online
          </span>
          <button style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ─── Row 1: Metric Cards ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* Server */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <Server size={14} /> Server
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 8px', borderRadius: 10 }}>online</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>0m</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 8, fontWeight: 500 }}>Uptime - {uptime}</div>
        </div>

        {/* Database */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <Database size={14} /> Database
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 8px', borderRadius: 10 }}>connected</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{Math.round(latency)}ms</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 8, fontWeight: 500 }}>Latency - Supabase PG</div>
        </div>

        {/* API */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <Activity size={14} /> API
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 8px', borderRadius: 10 }}>0% errors</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{Math.round(apiTime)}ms</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 8, fontWeight: 500 }}>{apiRequests} requests / 24h</div>
        </div>

        {/* Sessions */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <Users size={14} /> Sessions
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 8px', borderRadius: 10 }}>Live</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{activeSocketConns}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 8, fontWeight: 500 }}>Active socket connections</div>
        </div>
      </div>

      {/* ─── Row 2: Resources and Sessions ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* System Resources */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <Cpu size={14} /> System Resources
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Updates every sec</div>
          </div>
          
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-around' }}>
            {/* Memory Gauge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <PieChart width={140} height={140}>
                <Pie data={[{value: memPercent}, {value: 100 - memPercent}]} cx="50%" cy="50%" innerRadius={50} outerRadius={60} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  <Cell fill={memColor} />
                  <Cell fill="#f1f5f9" />
                </Pie>
              </PieChart>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', marginTop: -5 }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>{memPercent.toFixed(1)}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>%</span>
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginTop: -10, letterSpacing: 0.5 }}>MEMORY</div>
            </div>

            {/* Memory Text */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', letterSpacing: 0.5, marginBottom: 8 }}>MEMORY</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{Math.round(ram)} MB / {maxRam} MB</div>
              <div style={{ width: 40, height: 4, background: '#f59e0b', margin: '8px auto 0', borderRadius: 2 }} />
            </div>

            {/* CPU Gauge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <PieChart width={140} height={140}>
                <Pie data={[{value: cpu}, {value: 100 - cpu}]} cx="50%" cy="50%" innerRadius={50} outerRadius={60} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  <Cell fill={cpuColor} />
                  <Cell fill="#f1f5f9" />
                </Pie>
              </PieChart>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', marginTop: -5 }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>{cpu.toFixed(1)}</span>
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginTop: -10, letterSpacing: 0.5 }}>CPU</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30, padding: '0 20px' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /> Safe (0-60%)</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} /> Warning (60-85%)</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} /> Critical (85-100%)</div>
          </div>
        </div>

        {/* Active Sessions */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 20 }}>
            <Users size={14} /> Active Sessions
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeSessionsData.map(s => (
              <div key={s.role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, background: '#cbd5e1', borderRadius: '50%' }} /> {s.role}
                </span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{s.count}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 16, marginTop: 16 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Total</span>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#10b981' }}>{totalSessions}</span>
          </div>
        </div>
      </div>

      {/* ─── Row 3: External Services ──────────────────────────────── */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 20 }}>
          <Activity size={14} /> External Services
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { name: 'Supabase DB', status: 'connected - 282ms', icon: <Database size={16} color="#3b82f6" /> },
            { name: 'Realtime Bus', status: 'connected - 43ms', icon: <Wifi size={16} color="#8b5cf6" /> },
            { name: 'Leaflet Maps', status: 'connected - 35ms', icon: <Activity size={16} color="#f59e0b" /> },
            { name: 'Auth Server', status: 'connected - 2 cores', icon: <Server size={16} color="#ef4444" /> },
          ].map(svc => (
            <div key={svc.name} style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  {svc.icon} <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>{svc.name}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>{svc.status}</div>
              </div>
              <CheckCircle2 size={16} color="#10b981" />
            </div>
          ))}
        </div>
      </div>

      {/* ─── Row 4: API Performance ────────────────────────────────── */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            <Activity size={14} /> API Performance (24H)
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Click column to sort</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '12px 0', color: '#64748b', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>Endpoint</th>
              <th style={{ textAlign: 'left', padding: '12px 0', color: '#64748b', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>Requests</th>
              <th style={{ textAlign: 'left', padding: '12px 0', color: '#64748b', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>Avg Time</th>
              <th style={{ textAlign: 'left', padding: '12px 0', color: '#64748b', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>Errors</th>
              <th style={{ textAlign: 'left', padding: '12px 0', color: '#64748b', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>Error Rate</th>
            </tr>
          </thead>
          <tbody>
            {[
              { ep: 'POST /api/auth/login', req: 1, time: '768ms' },
              { ep: 'GET /api/reports', req: 1, time: '710ms' },
              { ep: 'GET /api/admin/stats', req: 1, time: '1071ms' },
              { ep: 'GET /api/admin/active-sessions', req: 1, time: '2ms' },
              { ep: 'GET /api/admin/error-logs', req: 1, time: '190ms' },
            ].map(row => (
              <tr key={row.ep} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 0', color: '#0f172a', fontWeight: 700 }}>
                  <span style={{ color: '#054daf', fontSize: '0.7rem', marginRight: 8, fontWeight: 800 }}>{row.ep.split(' ')[0]}</span>
                  {row.ep.split(' ')[1]}
                </td>
                <td style={{ padding: '12px 0', color: '#475569', fontWeight: 600 }}>{row.req}</td>
                <td style={{ padding: '12px 0', color: '#475569', fontWeight: 600 }}>{row.time}</td>
                <td style={{ padding: '12px 0', color: '#475569', fontWeight: 600 }}>0</td>
                <td style={{ padding: '12px 0' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 6px', borderRadius: 10 }}>0%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── Row 5: Error Logs ─────────────────────────────────────── */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            <AlertTriangle size={14} /> Error Logs <span style={{ color: '#94a3b8', fontWeight: 600, textTransform: 'none' }}>524 total</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 600, color: '#475569', outline: 'none' }}>
              <option>All Services</option>
            </select>
            <select style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 600, color: '#475569', outline: 'none' }}>
              <option>All States</option>
            </select>
            <button style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontSize: '0.75rem', fontWeight: 600, color: '#475569', outline: 'none', cursor: 'pointer' }}>
              + Send Test Logs
            </button>
          </div>
        </div>
        
        <div>
          {errorLogs.map(log => (
            <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: 12 }}>error</span>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>{log.source}</span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>· {log.time}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>{log.message}</div>
                </div>
              </div>
              <button style={{ padding: '6px 16px', borderRadius: 8, background: '#10b981', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                Resolve
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
