import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Search, Filter, Clock, MapPin, Smartphone, Download, ChevronLeft, ChevronRight, UserCheck, User, Users, Trash2, CheckSquare, Square, AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/db';
import { getRealAddress } from '../lib/geo';
import { showDeleteConfirm, showPurgeConfirm, showSuccess } from '../lib/alert';

function AddressCell({ log }) {
  const [addr, setAddr] = useState(log.address || (log.latitude ? `${log.latitude.toFixed(4)}, ${log.longitude.toFixed(4)}` : 'GPS N/A'));
  
  useEffect(() => {
    if (!log.address && log.latitude && log.longitude) {
      getRealAddress(log.latitude, log.longitude).then(res => {
        if (res) setAddr(res);
      });
    } else if (log.address) {
      setAddr(log.address);
    }
  }, [log.address, log.latitude, log.longitude]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'normal', maxWidth: 260, lineHeight: 1.3, fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>
      <MapPin size={15} color="#054daf" flexShrink={0} />
      <span title={log.latitude ? `Coordinates: ${log.latitude.toFixed(6)}, ${log.longitude.toFixed(6)}` : ''}>{addr}</span>
    </div>
  );
}

export default function Logs() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'Admin';

  const [allLogs, setAllLogs] = useState(() => db.getLogs());
  const [users] = useState(() => db.getUsers());
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, IN, OUT
  
  // Table pagination & limit states
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedLogIds, setSelectedLogIds] = useState(new Set());
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
    if (userFilter !== 'ALL' && log.userId !== userFilter) return false;
    if (typeFilter !== 'ALL' && log.type !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const u = getUserInfo(log.userId);
      return u.name.toLowerCase().includes(q) || 
             log.logId.toLowerCase().includes(q) || 
             log.deviceInfo?.toLowerCase().includes(q) ||
             log.note?.toLowerCase().includes(q) ||
             log.address?.toLowerCase().includes(q) ||
             u.employeeId?.toLowerCase().includes(q);
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
    const headers = ['Log ID', 'User Name', 'Role', 'Type', 'Timestamp', 'Real Address / Location', 'Latitude', 'Longitude', 'Device'];
    const rows = filteredLogs.map(l => {
      const u = getUserInfo(l.userId);
      const addressVal = l.address || (l.latitude ? `${l.latitude.toFixed(4)}, ${l.longitude.toFixed(4)}` : 'GPS N/A');
      return [l.logId, `"${u.name}"`, u.role, l.type, l.timestamp, `"${addressVal}"`, l.latitude || '', l.longitude || '', `"${l.deviceInfo || ''}"`].join(',');
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {isAdmin && !isSelectMode && (
            <button
              type="button"
              onClick={() => setIsSelectMode(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px',
                borderRadius: 12, background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.25)',
                color: '#e11d48', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(225,29,72,0.06)', transition: 'all 0.2s'
              }}
            >
              <Trash2 size={16} /> Delete / Purge Logs
            </button>
          )}

          <button 
            onClick={handleExportCSV}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px',
              borderRadius: 12, background: 'white', border: '1px solid rgba(15,23,42,0.12)',
              color: '#0f172a', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(15,23,42,0.04)', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#054daf'; e.currentTarget.style.color = '#043e8a'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(15,23,42,0.12)'; e.currentTarget.style.color = '#0f172a'; }}
          >
            <Download size={16} color="#054daf" /> Export CSV
          </button>
        </div>
      </div>

      {/* Bulk Delete / Purge Action Banner */}
      {isAdmin && isSelectMode && (
        <div className="card glass fade-in" style={{
          padding: '16px 22px', borderRadius: 20, marginBottom: 18,
          background: 'linear-gradient(135deg, rgba(254,242,242,0.95), rgba(255,241,242,0.88))',
          border: '1.5px solid #fecdd3', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 14, boxShadow: '0 6px 24px rgba(225,29,72,0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 14, background: '#e11d48', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(225,29,72,0.3)' }}>
              <Trash2 size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#be123c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Bulk Purge & Deletion Checklist</span>
                <span style={{ background: '#ffe4e6', color: '#9f1239', padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 800 }}>
                  {selectedLogIds.size} of {filteredLogs.length} Selected
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.88rem', fontWeight: 700, color: '#881337' }}>
                Check records below to delete individually, check all, or purge the entire attendance database.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                if (selectedLogIds.size === filteredLogs.length && filteredLogs.length > 0) {
                  setSelectedLogIds(new Set());
                } else {
                  setSelectedLogIds(new Set(filteredLogs.map(l => l.logId)));
                }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12,
                background: 'white', border: '1px solid #fda4af', color: '#be123c', fontWeight: 800, fontSize: '0.82rem',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {selectedLogIds.size === filteredLogs.length && filteredLogs.length > 0 ? (
                <><CheckSquare size={16} /> Uncheck All</>
              ) : (
                <><Square size={16} /> Check All ({filteredLogs.length})</>
              )}
            </button>

            <button
              type="button"
              disabled={selectedLogIds.size === 0}
              onClick={async () => {
                if (selectedLogIds.size === 0) return;
                const confirmed = await showDeleteConfirm({
                  title: `Delete ${selectedLogIds.size} Log(s)?`,
                  text: 'The selected biometric attendance logs will be permanently removed.',
                  confirmButtonText: `🗑️ Yes, Delete (${selectedLogIds.size})`
                });
                if (confirmed) {
                  selectedLogIds.forEach(id => db.deleteLog(id));
                  const updated = db.getLogs();
                  setAllLogs(updated);
                  setSelectedLogIds(new Set());
                  showSuccess('Records Deleted!', `Successfully removed ${selectedLogIds.size} attendance log(s).`);
                }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12,
                background: selectedLogIds.size > 0 ? '#e11d48' : '#cbd5e1', color: 'white', border: 'none',
                fontWeight: 800, fontSize: '0.82rem', cursor: selectedLogIds.size > 0 ? 'pointer' : 'not-allowed',
                boxShadow: selectedLogIds.size > 0 ? '0 4px 12px rgba(225,29,72,0.3)' : 'none', transition: 'all 0.2s'
              }}
            >
              <Trash2 size={16} /> Delete Selected ({selectedLogIds.size})
            </button>

            <button
              type="button"
              onClick={async () => {
                const confirmed = await showPurgeConfirm({ totalCount: allLogs.length });
                if (confirmed) {
                  db.clearAllLogs();
                  setAllLogs([]);
                  setSelectedLogIds(new Set());
                  showSuccess('Database Purged!', 'All attendance records have been completely wiped.');
                }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12,
                background: '#881337', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.82rem',
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(136,19,55,0.3)', transition: 'all 0.2s'
              }}
            >
              <AlertTriangle size={16} color="#fde047" /> Purge All Database Logs
            </button>

            <button
              type="button"
              onClick={() => { setIsSelectMode(false); setSelectedLogIds(new Set()); }}
              title="Exit selection mode"
              style={{
                background: 'rgba(255,255,255,0.8)', border: '1px solid #fda4af', color: '#881337', width: 34, height: 34,
                borderRadius: 10, fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="card stats-grid" style={{ gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Total Records', value: totalEntries, color: '#0f172a' },
          { label: 'Time-In', value: filteredLogs.filter(l => l.type === 'IN').length, color: '#043e8a' },
          { label: 'Time-Out', value: filteredLogs.filter(l => l.type === 'OUT').length, color: '#dc2626' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card glass" style={{ padding: '14px 10px', borderRadius: 16, textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 4px' }}>{label}</p>
            <p style={{ color, fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Controls Bar: Search + User Dropdown + Filter */}
      <div className="card glass controls-bar" style={{ padding: '16px 18px', borderRadius: 20, marginBottom: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Top row: Search Bar + User Dropdown Filter simultaneously */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input 
                type="text" 
                placeholder={isAdmin ? "Search employee, ID, address, device..." : "Search punch ID, address, or device..."}
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                style={{ paddingLeft: 42, background: 'rgba(255,255,255,0.9) !important', width: '100%', outline: 'none', margin: 0, borderRadius: 14, border: '1px solid #cbd5e1', height: 44, fontSize: '0.9rem', fontWeight: 600 }}
              />
            </div>

            {/* User Dropdown Filter (Visible for Admins or Multi-user view) */}
            {isAdmin && (
              <div style={{ position: 'relative', flex: '0 1 250px', minWidth: 220 }}>
                <Users size={18} color="#054daf" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <select
                  value={userFilter}
                  onChange={e => { setUserFilter(e.target.value); setCurrentPage(1); }}
                  style={{
                    width: '100%', height: 44, padding: '0 16px 0 42px', borderRadius: 14, border: '1px solid #bfdbfe',
                    background: userFilter !== 'ALL' ? '#eff6ff' : 'white',
                    color: userFilter !== 'ALL' ? '#043e8a' : '#0f172a',
                    fontSize: '0.88rem', fontWeight: 700, outline: 'none', cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                >
                  <option value="ALL">👥 All Employees ({users.length})</option>
                  {users.map(u => (
                    <option key={u.userId} value={u.userId}>
                      {u.name} ({u.employeeId || u.userId})
                    </option>
                  ))}
                </select>
              </div>
            )}
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
                      color: typeFilter === t ? (t === 'IN' ? '#054daf' : t === 'OUT' ? '#dc2626' : '#0f172a') : '#64748b',
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
                {isSelectMode && (
                  <th style={{ padding: '16px 14px', width: 44, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={pageLogs.length > 0 && pageLogs.every(l => selectedLogIds.has(l.logId))}
                      onChange={() => {
                        const allPageChecked = pageLogs.every(l => selectedLogIds.has(l.logId));
                        const next = new Set(selectedLogIds);
                        if (allPageChecked) {
                          pageLogs.forEach(l => next.delete(l.logId));
                        } else {
                          pageLogs.forEach(l => next.add(l.logId));
                        }
                        setSelectedLogIds(next);
                      }}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#e11d48' }}
                    />
                  </th>
                )}
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Log Ref ID</th>
                {isAdmin && <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Employee</th>}
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Punch Type</th>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Date</th>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Exact Time</th>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Real Address / Location</th>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Terminal Device</th>
              </tr>
            </thead>
            <tbody>
              {pageLogs.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? (isSelectMode ? 9 : 8) : (isSelectMode ? 8 : 7)} style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '0.92rem', fontWeight: 600 }}>
                    No biometric logs match your current query.
                  </td>
                </tr>
              ) : (
                pageLogs.map((log, idx) => {
                  const isIn = log.type === 'IN';
                  const u = getUserInfo(log.userId);
                  const dateStr = new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                  const timeStr = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

                  return (
                    <tr key={log.logId}
                      onClick={() => {
                        if (!isSelectMode) return;
                        const next = new Set(selectedLogIds);
                        if (next.has(log.logId)) next.delete(log.logId);
                        else next.add(log.logId);
                        setSelectedLogIds(next);
                      }}
                      style={{
                        borderBottom: idx === pageLogs.length - 1 ? 'none' : '1px solid rgba(15,23,42,0.06)',
                        background: selectedLogIds.has(log.logId) ? 'rgba(225,29,72,0.08)' : (idx % 2 === 0 ? 'rgba(255,255,255,0.4)' : 'transparent'),
                        transition: 'background 0.15s',
                        cursor: isSelectMode ? 'pointer' : 'default'
                      }}
                      onMouseEnter={e => { if (!selectedLogIds.has(log.logId)) e.currentTarget.style.background = 'rgba(5, 77, 175,0.06)'; }}
                      onMouseLeave={e => { if (!selectedLogIds.has(log.logId)) e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.4)' : 'transparent'; }}>
                      
                      {isSelectMode && (
                        <td style={{ padding: '16px 14px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedLogIds.has(log.logId)}
                            onChange={() => {
                              const next = new Set(selectedLogIds);
                              if (next.has(log.logId)) next.delete(log.logId);
                              else next.add(log.logId);
                              setSelectedLogIds(next);
                            }}
                            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#e11d48' }}
                          />
                        </td>
                      )}
                      
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
                          background: isIn ? 'rgba(5, 77, 175,0.15)' : 'rgba(239,68,68,0.15)',
                          color: isIn ? '#054daf' : '#dc2626'
                        }}>
                          {isIn ? 'TIME IN' : 'TIME OUT'}
                        </span>
                      </td>

                      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '5px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800,
                          background: log.status === 'LATE' || log.status === 'UNDERTIME' ? '#fef2f2' : '#ecfdf5',
                          color: log.status === 'LATE' || log.status === 'UNDERTIME' ? '#dc2626' : '#10b981',
                          border: `1px solid ${log.status === 'LATE' || log.status === 'UNDERTIME' ? '#fca5a5' : '#a7f3d0'}`,
                          display: 'inline-block'
                        }}>
                          {log.status === 'LATE' ? `⚠️ LATE (+${log.lateMinutes}m)` : log.status === 'UNDERTIME' ? `⚠️ EARLY OUT` : `🟢 ON TIME`}
                        </span>
                      </td>

                      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', display: 'block', whiteSpace: 'nowrap' }}>{dateStr}</span>
                      </td>

                      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', display: 'block', whiteSpace: 'nowrap' }}>{timeStr}</span>
                      </td>

                      <td style={{ padding: '16px 20px', whiteSpace: 'normal' }}>
                        <AddressCell log={log} />
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
