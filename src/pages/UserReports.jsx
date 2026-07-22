import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { ArrowLeft, Clock, MapPin, FileText, Calendar, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { db } from '../lib/db';
import { useAuthStore } from '../store/authStore';

export default function UserReports() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('userId');
  const { user: loggedInUser } = useAuthStore();
  const userId = targetId || loggedInUser?.userId;
  
  const user = db.getUserById(userId);
  const [logs] = useState(() => db.getUserLogs(userId).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
  const [leaves] = useState(() => db.getUserLeaves(userId).sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
  const [reports] = useState(() => (db.getReports ? db.getReports() : []).filter(r => r.userId === userId).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));

  const containerRef = useRef();

  useEffect(() => {
    if (!user) return;
    const ctx = gsap.context(() => {
      gsap.from('.stagger-card', {
        y: 20, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out'
      });
    }, containerRef);
    return () => ctx.revert();
  }, [user]);

  if (!user) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        <h2>User not found.</h2>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#054daf', color: 'white', cursor: 'pointer' }}>Go Back</button>
      </div>
    );
  }

  // --- Stats Calculation ---
  const totalPunches = logs.length;
  const lateLogs = logs.filter(l => l.status === 'LATE' || l.lateMinutes > 0);
  const totalLateMins = lateLogs.reduce((acc, l) => acc + (l.lateMinutes || 0), 0);
  const approvedLeaves = leaves.filter(l => l.status === 'Approved').length;

  const aggregatedHours = db.getAggregatedHours(user.userId) || [];
  let totalHours = aggregatedHours.reduce((acc, curr) => acc + (curr.hours || 0), 0);

  return (
    <div ref={containerRef}>
      
      {/* Header */}
      <div className="stagger-card glass card" style={{ padding: '12px 20px', borderRadius: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(15,23,42,0.05)', border: 'none', padding: 8, borderRadius: '50%', color: '#0f172a', cursor: 'pointer', display: 'flex' }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Comprehensive Report Dossier</h1>
          <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Detailed activity & records for <strong>{user.name}</strong></p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stagger-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Hours Worked', value: totalHours.toFixed(1) + 'h', icon: <Clock size={20} color="#054daf" />, bg: 'rgba(5,77,175,0.1)' },
          { label: 'Total Punches', value: totalPunches, icon: <Activity size={20} color="#10b981" />, bg: 'rgba(16,185,129,0.1)' },
          { label: 'Total Late Minutes', value: totalLateMins + 'm', icon: <XCircle size={20} color="#ef4444" />, bg: 'rgba(239,68,68,0.1)' },
          { label: 'Approved Leaves', value: approvedLeaves, icon: <Calendar size={20} color="#d97706" />, bg: 'rgba(217,119,6,0.1)' }
        ].map(stat => (
          <div key={stat.label} className="glass card" style={{ padding: 16, borderRadius: 14, textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
              {stat.icon}
            </div>
            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{stat.value}</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        
        {/* Left Column: Logs & Location */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="stagger-card glass card" style={{ padding: 16, borderRadius: 16 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={20} color="#054daf" /> Clock In / Where History
            </h2>
            <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
              {logs.length === 0 ? <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No punch records found.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {logs.map(log => (
                    <div key={log.logId} style={{ background: '#f8fafc', padding: 16, borderRadius: 16, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: log.type === 'IN' ? '#054daf' : '#dc2626', background: log.type === 'IN' ? '#e0e7ff' : '#fee2e2', padding: '2px 8px', borderRadius: 12 }}>
                            {log.type}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} /> {log.address || `${log.latitude?.toFixed(4)}, ${log.longitude?.toFixed(4)}`}
                        </p>
                      </div>
                      {log.status === 'LATE' && <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', background: '#fef2f2', padding: '4px 8px', borderRadius: 10 }}>LATE</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: EOD Reports & Requests */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* EOD Reports */}
          <div className="stagger-card glass card" style={{ padding: 16, borderRadius: 16 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={20} color="#7c3aed" /> End-of-Day Shift Reports
            </h2>
            <div style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 8 }}>
              {reports.length === 0 ? <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No EOD reports submitted yet.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {reports.map(rep => (
                    <div key={rep.reportId} style={{ background: 'rgba(124,58,237,0.04)', padding: 16, borderRadius: 16, border: '1px solid rgba(124,58,237,0.15)' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>{new Date(rep.timestamp).toLocaleString()}</p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>{rep.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Requests (Leaves) */}
          <div className="stagger-card glass card" style={{ padding: 16, borderRadius: 16 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={20} color="#d97706" /> Leave & Exception Requests
            </h2>
            <div style={{ maxHeight: 250, overflowY: 'auto', paddingRight: 8 }}>
              {leaves.length === 0 ? <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No requests found.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {leaves.map(l => (
                    <div key={l.leaveId} style={{ background: '#f8fafc', padding: 14, borderRadius: 14, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{l.type}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{l.startDate} to {l.endDate}</p>
                      </div>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: 800, padding: '4px 10px', borderRadius: 12,
                        color: l.status === 'Approved' ? '#10b981' : l.status === 'Rejected' ? '#ef4444' : '#f59e0b',
                        background: l.status === 'Approved' ? '#ecfdf5' : l.status === 'Rejected' ? '#fef2f2' : '#fffbeb'
                      }}>
                        {l.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
