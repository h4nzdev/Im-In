import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { Users, Search, Eye, Mail, Calendar, X, CheckCircle2, Clock, Briefcase, Star, UserCheck, Shield, Building2, ChevronDown } from 'lucide-react';
import { db } from '../lib/db';

const roleBadge = (role) => {
  const map = {
    Admin:        ['#1e3a8a', 'rgba(30,58,138,0.12)', '⚙ Admin'],
    'Success Lead': ['#7c3aed', 'rgba(124,58,237,0.12)', '★ Success Lead'],
    Associate:    ['#054daf', 'rgba(5,77,175,0.1)',  '● Associate'],
  };
  const [color, bg, label] = map[role] || ['#64748b', 'rgba(100,116,139,0.1)', role];
  return (
    <span style={{ color, background: bg, border: `1px solid ${color}30`, borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 800 }}>
      {label}
    </span>
  );
};

const statusBadge = (status) => {
  const map = {
    Active:   ['#10b981', 'rgba(16,185,129,0.12)', 'Active'],
    Pending:  ['#f59e0b', 'rgba(245,158,11,0.15)',  'Pending Sync'],
    Inactive: ['#64748b', 'rgba(100,116,139,0.15)', 'Deactivated']
  };
  const [color, bg, label] = map[status] || ['#054daf', 'rgba(5, 77, 175,0.12)', status];
  return (
    <span style={{ color, background: bg, border: `1px solid ${color}40`, borderRadius: 20, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      {label}
    </span>
  );
};

export default function AdminEmployees() {
  const navigate = useNavigate();
  const [users, setUsers] = useState(() => db.getUsers());
  const [positions] = useState(() => db.getPositions());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [toast, setToast] = useState('');

  // ERP Client Assignment modal
  const [allClients] = useState(() => db.getClients());
  const [clientModalUser, setClientModalUser] = useState(null);
  const [selectedClients, setSelectedClients] = useState([]);

  // Deadline modal
  const [deadlineModalUser, setDeadlineModalUser] = useState(null);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTitle, setDeadlineTitle] = useState('');

  // Assign Team modal (for Success Leads)
  const [teamModalLead, setTeamModalLead] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState([]);

  // Role modal (promote / demote)
  const [roleModalUser, setRoleModalUser] = useState(null);

  // Actions Dropdown state
  const [openActionDropdown, setOpenActionDropdown] = useState(null);

  const containerRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current.querySelectorAll('.card'), {
        y: 24, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out',
      });
    });
    return () => ctx.revert();
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const getPositionInfo = (posId) => {
    const p = positions.find(x => x.positionId === posId);
    return p ? `${p.positionName} (${p.department})` : 'General Staff';
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                          u.email.toLowerCase().includes(search.toLowerCase()) ||
                          u.userId.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' ? u.status !== 'Pending' : u.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [users, search, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const displayedUsers = filteredUsers.slice(startIdx, endIdx);

  // If page is out of bounds, reset to 1
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [filteredUsers.length, totalPages, currentPage]);

  const stats = useMemo(() => [
    { label: 'Total Workforce',    value: users.length,                                                color: '#0f172a' },
    { label: 'Active Staff',       value: users.filter(u => u.status === 'Active').length,             color: '#10b981' },
    { label: 'Success Leads',      value: users.filter(u => u.role === 'Success Lead').length,         color: '#7c3aed' },
    { label: 'Assigned Deadlines', value: users.filter(u => !!u.deadlineDate).length,                  color: '#6366f1' },
  ], [users]);

  // ─── Deadline ───────────────────────────────────────────────
  const handleSaveDeadline = (e) => {
    e.preventDefault();
    if (!deadlineModalUser || !deadlineDate) return;
    const upd = db.updateUserDeadline(deadlineModalUser.userId, deadlineDate, deadlineTitle || 'Complete Assigned Task');
    setUsers(upd);
    showToast(`Deadline assigned to ${deadlineModalUser.name}`);
    setDeadlineModalUser(null); setDeadlineDate(''); setDeadlineTitle('');
  };

  // ─── Assign Team ─────────────────────────────────────────────
  const openTeamModal = (lead) => {
    setTeamModalLead(lead);
    setSelectedTeam(lead.managedTeam || []);
  };
  const toggleMember = (uid) => {
    setSelectedTeam(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };
  const handleSaveTeam = () => {
    const upd = db.updateManagedTeam(teamModalLead.userId, selectedTeam);
    setUsers(upd);
    showToast(`Team updated for ${teamModalLead.name} — ${selectedTeam.length} member(s)`);
    setTeamModalLead(null);
  };

  // ─── Client Assignment ──────────────────────────────────────
  const openClientModal = (u) => {
    setClientModalUser(u);
    setSelectedClients(u.assignedClientIds || []);
  };

  const toggleClientSelection = (clientId) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(selectedClients.filter(id => id !== clientId));
    } else {
      setSelectedClients([...selectedClients, clientId]);
    }
  };

  const handleClientSave = () => {
    db.updateUser(clientModalUser.userId, { assignedClientIds: selectedClients });
    setUsers(db.getUsers());
    setClientModalUser(null);
    showToast(`Updated client assignments for ${clientModalUser.name}`);
  };

  // ─── Role Change ─────────────────────────────────────────────
  const handleRoleChange = (newRole) => {
    const upd = db.updateUserRole(roleModalUser.userId, newRole);
    setUsers(upd);
    showToast(`${roleModalUser.name} is now ${newRole}`);
    setRoleModalUser(null);
  };

  // Candidates available to be assigned to any team (non-admin)
  const candidates = users.filter(u => u.role !== 'Admin' && u.userId !== teamModalLead?.userId);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: '#065f46', color: 'white', padding: '12px 20px', borderRadius: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: '0.88rem', border: '2px solid rgba(255,255,255,0.2)' }}>
          <CheckCircle2 size={18} color="#6ee7b7" /> {toast}
        </div>
      )}

      {/* ─── Deadline Modal ──────────────────────────────────────── */}
      {deadlineModalUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="glass" style={{ width: '100%', maxWidth: 440, borderRadius: 24, padding: 28, background: 'white', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={20} color="#054daf" /> Assign Employee Deadline
              </h3>
              <button onClick={() => setDeadlineModalUser(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: '#475569', fontWeight: 600 }}>
              Set a target deadline for <strong>{deadlineModalUser.name}</strong>.
            </p>
            <form onSubmit={handleSaveDeadline} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>Target Deadline Date</label>
                <input type="date" value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)} required style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.92rem', fontWeight: 700, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>Task / Description</label>
                <input type="text" value={deadlineTitle} onChange={e => setDeadlineTitle(e.target.value)} placeholder="e.g. Submit Biometric Verification" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.92rem', fontWeight: 600, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setDeadlineModalUser(null)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: '#054daf', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(5, 77, 175,0.3)' }}>Save Deadline</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Assign Team Modal (Success Lead) ───────────────────── */}
      {teamModalLead && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="glass" style={{ width: '100%', maxWidth: 480, borderRadius: 24, padding: 28, background: 'white', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserCheck size={20} color="#7c3aed" /> Assign Team to {teamModalLead.name}
              </h3>
              <button onClick={() => setTeamModalLead(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
              Check the employees that belong to this Success Lead's team. A VA can be in multiple teams.
            </p>

            {/* Select All */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>{selectedTeam.length} selected</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setSelectedTeam(candidates.map(u => u.userId))} style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7c3aed', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', padding: '4px 12px', borderRadius: 8, cursor: 'pointer' }}>Select All</button>
                <button onClick={() => setSelectedTeam([])} style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '4px 12px', borderRadius: 8, cursor: 'pointer' }}>Clear</button>
              </div>
            </div>

            {/* Employee list */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {candidates.map(u => {
                const checked = selectedTeam.includes(u.userId);
                return (
                  <label key={u.userId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, border: `1px solid ${checked ? 'rgba(124,58,237,0.35)' : '#e2e8f0'}`, background: checked ? 'rgba(124,58,237,0.06)' : '#fafafa', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleMember(u.userId)} style={{ width: 16, height: 16, accentColor: '#7c3aed', flexShrink: 0 }} />
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#054daf', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 800, flexShrink: 0 }}>{u.name[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{u.name}</p>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>{u.role} · {u.department}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setTeamModalLead(null)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveTeam} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: '#7c3aed', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>Save Team</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Role Change Modal ───────────────────────────────────── */}
      {roleModalUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="glass" style={{ width: '100%', maxWidth: 380, borderRadius: 24, padding: 28, background: 'white', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={20} color="#054daf" /> Change Role
              </h3>
              <button onClick={() => setRoleModalUser(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <p style={{ margin: '0 0 18px', fontSize: '0.88rem', color: '#475569', fontWeight: 600 }}>
              Select a new role for <strong>{roleModalUser.name}</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { role: 'Associate',    desc: 'Regular employee — sees only their own data', color: '#054daf', bg: 'rgba(5,77,175,0.08)' },
                { role: 'Success Lead', desc: 'Team lead — sees and manages their assigned VAs', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
              ].map(({ role, desc, color, bg }) => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  disabled={roleModalUser.role === role}
                  style={{ padding: '14px 16px', borderRadius: 14, border: `1px solid ${color}40`, background: roleModalUser.role === role ? bg : 'white', cursor: roleModalUser.role === role ? 'default' : 'pointer', textAlign: 'left', opacity: roleModalUser.role === role ? 0.7 : 1, transition: 'all 0.15s' }}
                >
                  <p style={{ margin: '0 0 2px', fontWeight: 800, fontSize: '0.9rem', color }}>{role} {roleModalUser.role === role && '(current)'}</p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>{desc}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setRoleModalUser(null)} style={{ width: '100%', marginTop: 16, padding: '12px', borderRadius: 12, border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Assign Clients Modal */}
      {clientModalUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="fade-in card glass" style={{ background: 'white', padding: 24, borderRadius: 24, width: '100%', maxWidth: 460, margin: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={22} color="#054daf" /> Assign Clients
                </h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>For {clientModalUser.name}</p>
              </div>
              <button onClick={() => setClientModalUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 12, padding: 8 }}>
              {allClients.filter(c => c.status === 'Active').length === 0 ? (
                <p style={{ padding: 16, textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>No active clients found in the system.</p>
              ) : (
                allClients.filter(c => c.status === 'Active').map(client => (
                  <label key={client.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: selectedClients.includes(client.id) ? '#f8fafc' : 'transparent' }}>
                    <input type="checkbox" checked={selectedClients.includes(client.id)} onChange={() => toggleClientSelection(client.id)} style={{ width: 18, height: 18, accentColor: '#054daf' }} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{client.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{client.code || 'No Code'}</div>
                    </div>
                  </label>
                ))
              )}
            </div>

            <button onClick={handleClientSave} style={{ width: '100%', marginTop: 20, padding: '12px', borderRadius: 12, background: '#054daf', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Save Assignments <CheckCircle2 size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Page Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Workforce Directory</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0', fontWeight: 500 }}>
            Manage personnel, assign Success Leads, build teams, and set deadlines
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="card stats-grid" style={{ gap: 10, marginBottom: 16 }}>
        {stats.map((st, i) => (
          <div key={i} className="stat-card" style={{ padding: '14px 16px', borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{st.label}</span>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: st.color }}>{st.value}</span>
          </div>
        ))}
      </div>

      {/* Controls Bar */}
      <div className="card glass" style={{ padding: '14px 16px', borderRadius: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, or badge ID..." style={{ width: '100%', padding: '10px 14px 10px 42px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['All', 'Active', 'Inactive'].map(st => (
                <button key={st} onClick={() => setStatusFilter(st)} style={{ padding: '6px 14px', borderRadius: 10, border: 'none', background: statusFilter === st ? '#054daf' : '#f1f5f9', color: statusFilter === st ? 'white' : '#475569', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s' }}>{st}</button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>
              <span>Show:</span>
              <select value={rowsPerPage} onChange={e => setRowsPerPage(Number(e.target.value))} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 800, color: '#0f172a', outline: 'none' }}>
                {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card glass table-card" style={{ padding: 0, borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(15,23,42,0.08)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(15,23,42,0.08)', background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="#054daf" /> Personnel Records
          </p>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b' }}>Showing {displayedUsers.length} of {filteredUsers.length}</span>
        </div>
        <div style={{ overflowX: 'auto', minHeight: 300, paddingBottom: 20 }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 900, whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.03)', borderBottom: '1px solid rgba(15,23,42,0.08)' }}>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Employee Profile</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Designation & Role</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Contact</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Team / Deadline</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>No employee records match your search.</td></tr>
              ) : (
                displayedUsers.map((u, idx) => (
                  <tr key={u.userId} style={{ borderBottom: idx === displayedUsers.length - 1 ? 'none' : '1px solid rgba(15,23,42,0.06)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(241,245,249,0.5)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                    {/* Name */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.role === 'Admin' ? '#033373' : u.role === 'Success Lead' ? '#7c3aed' : '#054daf', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.88rem', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                          {u.name[0]}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>{u.name}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>ID: {u.userId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role + Designation */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {roleBadge(u.role || 'Associate')}
                        <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.82rem' }}>{getPositionInfo(u.positionId)}</span>
                        {u.assignedAccount && (
                          <span style={{ fontSize: '0.72rem', color: '#054daf', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Briefcase size={11} /> {u.assignedAccount}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Contact */}
                    <td style={{ padding: '14px 20px', color: '#475569', fontSize: '0.86rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={14} color="#64748b" /> {u.email}</div>
                    </td>

                    {/* Team count / Deadline */}
                    <td style={{ padding: '14px 20px' }}>
                      {u.role === 'Success Lead' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.25)', padding: '4px 10px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 800 }}>
                          <Star size={12} /> {(u.managedTeam || []).length} team member(s)
                        </span>
                      ) : u.deadlineDate ? (
                        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', padding: '4px 10px', borderRadius: 10 }}>
                          <span style={{ color: '#054daf', fontWeight: 800, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {u.deadlineDate}</span>
                          {u.deadlineTitle && <span style={{ fontSize: '0.68rem', color: '#64748b', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.deadlineTitle}</span>}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 20px' }}>{statusBadge(u.status || 'Active')}</td>

                    {/* Actions */}
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div 
                        style={{ position: 'relative', display: 'inline-block', textAlign: 'left' }}
                        tabIndex={-1}
                        onBlur={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget)) {
                            setOpenActionDropdown(null);
                          }
                        }}
                      >
                        <button 
                          onClick={() => setOpenActionDropdown(openActionDropdown === u.userId ? null : u.userId)}
                          style={{ padding: '8px 14px', borderRadius: 10, background: openActionDropdown === u.userId ? '#e2e8f0' : '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'background 0.2s', outline: 'none' }}
                        >
                          Actions <ChevronDown size={14} style={{ transform: openActionDropdown === u.userId ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>

                        {openActionDropdown === u.userId && (
                          <div className="fade-in" style={{ position: 'absolute', ...(idx >= Math.max(1, displayedUsers.length - 2) ? { bottom: 'calc(100% + 8px)' } : { top: 'calc(100% + 8px)' }), right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 8, minWidth: 160, zIndex: 50, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            
                            <button onClick={() => navigate(`/profile?userId=${u.userId}`)} style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', color: '#0f172a', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', width: '100%', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <Eye size={14} color="#64748b" /> View Profile
                            </button>

                            {u.role !== 'Admin' && (
                              <button onClick={() => { setRoleModalUser(u); setOpenActionDropdown(null); }} style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', color: '#0f172a', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', width: '100%', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <Shield size={14} color="#64748b" /> Manage Role
                              </button>
                            )}

                            {u.role !== 'Admin' && (
                              <button onClick={() => { openClientModal(u); setOpenActionDropdown(null); }} style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', color: '#0f172a', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', width: '100%', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <Building2 size={14} color="#64748b" /> Assign Clients
                              </button>
                            )}

                            {u.role === 'Success Lead' && (
                              <button onClick={() => { openTeamModal(u); setOpenActionDropdown(null); }} style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', color: '#0f172a', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', width: '100%', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <UserCheck size={14} color="#64748b" /> Manage Team
                              </button>
                            )}

                            {u.role !== 'Admin' && (
                              <button onClick={() => { setDeadlineModalUser(u); setDeadlineDate(u.deadlineDate || ''); setDeadlineTitle(u.deadlineTitle || ''); setOpenActionDropdown(null); }} style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', color: '#0f172a', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', width: '100%', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <Calendar size={14} color="#64748b" /> Set Deadline
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>Rows per page:</span>
            <select 
              value={rowsPerPage} 
              onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.1)', outline: 'none', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}
            >
              {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>
              Showing {startIdx + 1}-{Math.min(endIdx, filteredUsers.length)} of {filteredUsers.length}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.1)', background: safePage === 1 ? '#f8fafc' : 'white', color: safePage === 1 ? '#94a3b8' : '#0f172a', fontWeight: 700, fontSize: '0.8rem', cursor: safePage === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 700, minWidth: 60, textAlign: 'center' }}>
              {safePage} / {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.1)', background: safePage === totalPages ? '#f8fafc' : 'white', color: safePage === totalPages ? '#94a3b8' : '#0f172a', fontWeight: 700, fontSize: '0.8rem', cursor: safePage === totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
