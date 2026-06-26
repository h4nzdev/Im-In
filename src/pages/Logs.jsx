import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Search, Filter, Clock, MapPin, Smartphone, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/db';

export default function Logs() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'Admin';

  const [allLogs] = useState(() => db.getLogs());
  const [users] = useState(() => db.getUsers());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, IN, OUT
  
  // Table pagination & limit states
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current.querySelectorAll('.card'), {
        y: 24, opacity: 0, duration: 0.55, stagger: 0.08, ease: 'power3.out',
      });
    });
    return () => ctx.revert();
  }, []);

  const getUserInfo = (uid) => {
    const found = users.find(u => u.userId === uid);
    return found || { name: 'Unknown Employee', email: uid, role: 'User' };
  };

  const baseLogs = isAdmin ? allLogs : allLogs.filter(l => l.userId === user.userId);

  const filteredLogs = baseLogs.filter(log => {
    if (typeFilter !== 'ALL' && log.type !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const u = getUserInfo(log.userId);
      return u.name.toLowerCase().includes(q) || log.logId.toLowerCase().includes(q) || log.deviceInfo?.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Pagination math
  const totalEntries = filteredLogs.length;
  const totalPages = Math.ceil(totalEntries / limit) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * limit;
  const endIdx = Math.min(startIdx + limit, totalEntries);
  const pageLogs = filteredLogs.slice(startIdx, endIdx);

  const handleExportCSV = () => {
    const headers = ['Log ID', 'User Name', 'Role', 'Type', 'Timestamp', 'Latitude', 'Longitude', 'Device'];
    const rows = filteredLogs.map(l => {
      const u = getUserInfo(l.userId);
      return [l.logId, `"${u.name}"`, u.role, l.type, l.timestamp, l.latitude || '', l.longitude || '', `"${l.deviceInfo || ''}"`].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `imin_attendance_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div ref={containerRef}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            Attendance History Table
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '4px 0 0', fontWeight: 500 }}>
            {isAdmin ? 'System-wide audit table of biometric time records' : 'Structured log table of your shift punches'}
          </p>
        </div>

        <button 
          onClick={handleExportCSV}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px',
            borderRadius: 12, background: 'white', border: '1px solid rgba(15,23,42,0.12)',
            color: '#0f172a', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(15,23,42,0.04)', transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#1d4ed8'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(15,23,42,0.12)'; e.currentTarget.style.color = '#0f172a'; }}
        >
          <Download size={16} color="#2563eb" /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="card stats-grid" style={{ gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Total Records', value: totalEntries, color: '#0f172a' },
          { label: 'Time-In', value: filteredLogs.filter(l => l.type === 'IN').length, color: '#1d4ed8' },
          { label: 'Time-Out', value: filteredLogs.filter(l => l.type === 'OUT').length, color: '#dc2626' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card glass" style={{ padding: '14px 10px', borderRadius: 16, textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 4px' }}>{label}</p>
            <p style={{ color, fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Controls Bar: Search + Limit + Filter */}
      <div className="card glass controls-bar" style={{ padding: '14px 16px', borderRadius: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Top row: 100% full width search */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input 
              type="text" 
              placeholder={isAdmin ? "Search employee, ID, or device..." : "Search punch ID or device..."}
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              style={{ paddingLeft: 42, background: 'rgba(255,255,255,0.9) !important', width: '100%', outline: 'none', margin: 0 }}
            />
          </div>

          {/* Bottom row: Filter tabs on left, Rows selector on right */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} color="#64748b" />
              <div style={{ display: 'flex', background: 'rgba(15,23,42,0.06)', padding: 3, borderRadius: 12, gap: 2 }}>
                {['ALL', 'IN', 'OUT'].map(t => (
                  <button
                    key={t}
                    onClick={() => { setTypeFilter(t); setCurrentPage(1); }}
                    style={{
                      border: 'none', background: typeFilter === t ? 'white' : 'transparent',
                      color: typeFilter === t ? (t === 'IN' ? '#2563eb' : t === 'OUT' ? '#dc2626' : '#0f172a') : '#64748b',
                      fontWeight: 800, fontSize: '0.78rem', padding: '6px 12px', borderRadius: 9, cursor: 'pointer',
                      boxShadow: typeFilter === t ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s'
                    }}
                  >
                    {t === 'ALL' ? 'All' : t === 'IN' ? 'Time In' : 'Time Out'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>Show:</span>
              <select
                value={limit}
                onChange={e => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
                style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(15,23,42,0.12)', background: 'white', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', width: 'auto' }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="card glass table-card" style={{ padding: 0, borderRadius: 24, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: isAdmin ? 840 : 660, whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.04)', borderBottom: '1px solid rgba(15,23,42,0.08)' }}>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Log Ref ID</th>
                {isAdmin && <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Employee</th>}
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Punch Type</th>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Date</th>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Exact Time</th>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Biometric Location</th>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Terminal Device</th>
              </tr>
            </thead>
            <tbody>
              {pageLogs.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '0.92rem', fontWeight: 600 }}>
                    No biometric logs match your current query.
                  </td>
                </tr>
              ) : (
                pageLogs.map((log, idx) => {
                  const isIn = log.type === 'IN';
                  const u = getUserInfo(log.userId);
                  const dateStr = new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                  const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  return (
                    <tr key={log.logId} style={{ borderBottom: idx === pageLogs.length - 1 ? 'none' : '1px solid rgba(15,23,42,0.06)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.4)' : 'transparent', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.4)' : 'transparent'}>
                      
                      <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: '#334155', whiteSpace: 'nowrap' }}>
                        {log.logId}
                      </td>

                      {isAdmin && (
                        <td style={{ padding: '16px 20px', fontWeight: 800, fontSize: '0.92rem', color: '#0f172a', whiteSpace: 'nowrap' }}>
                          {u.name}
                        </td>
                      )}

                      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-block', whiteSpace: 'nowrap',
                          padding: '5px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800,
                          background: isIn ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)',
                          color: isIn ? '#2563eb' : '#dc2626'
                        }}>
                          {isIn ? 'TIME IN' : 'TIME OUT'}
                        </span>
                      </td>

                      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', display: 'block', whiteSpace: 'nowrap' }}>{dateStr}</span>
                      </td>

                      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', display: 'block', whiteSpace: 'nowrap' }}>{timeStr}</span>
                      </td>

                      <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: '0.82rem', color: '#475569', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                          <MapPin size={14} color="#2563eb" />
                          {log.latitude ? `${log.latitude.toFixed(4)}, ${log.longitude.toFixed(4)}` : 'GPS N/A'}
                        </div>
                      </td>

                      <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                          <Smartphone size={14} />
                          {log.deviceInfo || 'Web Browser'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Table Footer */}
        <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.6)', borderTop: '1px solid rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
            Showing {totalEntries === 0 ? 0 : startIdx + 1} to {endIdx} of {totalEntries} entries
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{
                padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(15,23,42,0.12)',
                background: safePage === 1 ? 'rgba(15,23,42,0.04)' : 'white',
                color: safePage === 1 ? '#94a3b8' : '#0f172a', fontWeight: 700, fontSize: '0.85rem',
                cursor: safePage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span style={{ padding: '0 8px', fontSize: '0.85rem', fontWeight: 800, color: '#334155' }}>
              Page {safePage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              style={{
                padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(15,23,42,0.12)',
                background: safePage >= totalPages ? 'rgba(15,23,42,0.04)' : 'white',
                color: safePage >= totalPages ? '#94a3b8' : '#0f172a', fontWeight: 700, fontSize: '0.85rem',
                cursor: safePage >= totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
