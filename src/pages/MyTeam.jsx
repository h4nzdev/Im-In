import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Users, UserPlus, UserMinus, CheckCircle2, XCircle, Clock, Calendar, BarChart2, Briefcase, Mail, Phone, MapPin, Search, Filter, Shield, AlertCircle, Check, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/db';
import { showToast } from '../lib/alert';

export default function MyTeam() {
  const { user, login } = useAuthStore();
  const [allUsers, setAllUsers] = useState(() => db.getUsers());
  const [allLogs, setAllLogs] = useState(() => db.getLogs());
  const [allLeaves, setAllLeaves] = useState(() => db.getLeaves());
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('MEMBERS'); // MEMBERS, LEAVES, PUNCHES
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState(new Set());
  const [toastMsg, setToastMsg] = useState('');

  const containerRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current.querySelectorAll('.card, .team-card'), {
        y: 20, opacity: 0, duration: 0.45, stagger: 0.06, ease: 'power3.out',
      });
    });
    return () => ctx.revert();
  }, [activeTab]);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const managedTeamIds = Array.isArray(user?.managedTeam) ? user.managedTeam : [];
  const myTeamMembers = allUsers.filter(u => managedTeamIds.includes(u.userId));

  // Eligible candidates to add/remove (associates & other non-admin staff, excluding self and admin)
  const candidates = allUsers.filter(u => u.role !== 'Admin' && u.userId !== user.userId);

  const handleOpenManageModal = () => {
    setSelectedCandidateIds(new Set(managedTeamIds));
    setShowManageModal(true);
  };

  const handleSaveTeam = () => {
    const newTeamArray = Array.from(selectedCandidateIds);
    const updatedUser = db.updateManagedTeam(user.userId, newTeamArray);
    if (updatedUser) {
      // update local auth state if this is the logged in user
      useAuthStore.setState({ user: updatedUser });
    }
    setAllUsers(db.getUsers());
    setShowManageModal(false);
    triggerToast(`Team roster updated! (${newTeamArray.length} members assigned)`);
  };

  const handleToggleCandidate = (uid) => {
    const next = new Set(selectedCandidateIds);
    if (next.has(uid)) next.delete(uid);
    else next.add(uid);
    setSelectedCandidateIds(next);
  };

  const handleApproveLeave = (leaveId, userName) => {
    db.updateLeaveStatus(leaveId, 'Approved');
    setAllLeaves(db.getLeaves());
    triggerToast(`Approved leave request for ${userName}`);
  };

  const handleRejectLeave = (leaveId, userName) => {
    db.updateLeaveStatus(leaveId, 'Rejected');
    setAllLeaves(db.getLeaves());
    triggerToast(`Rejected leave request for ${userName}`);
  };

  // Filter leaves for managed team only
  const teamLeaves = allLeaves.filter(l => managedTeamIds.includes(l.userId)).sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
  const pendingTeamLeaves = teamLeaves.filter(l => l.status === 'Pending');

  // Filter recent punches for managed team only
  const teamLogs = allLogs.filter(l => managedTeamIds.includes(l.userId)).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 30);

  // Check who is currently clocked in today
  const todayStr = new Date().toDateString();
  const onlineTeamCount = myTeamMembers.filter(m => {
    const userTodayLogs = allLogs.filter(l => l.userId === m.userId && new Date(l.timestamp).toDateString() === todayStr);
    if (userTodayLogs.length === 0) return false;
    const latest = userTodayLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    return latest.type === 'IN';
  }).length;

  const filteredMembers = myTeamMembers.filter(m => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.department?.toLowerCase().includes(q) || m.employeeId?.toLowerCase().includes(q);
  });

  return (
    <div ref={containerRef} style={{ width: '100%', margin: '0 auto', paddingBottom: 60 }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 999,
          padding: '14px 22px', borderRadius: 16, background: '#033373',
          color: 'white', fontWeight: 700, fontSize: '0.92rem',
          boxShadow: '0 12px 36px rgba(6,95,70,0.35)', display: 'flex', alignItems: 'center', gap: 10,
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <Check size={18} color="#60a5fa" /> {toastMsg}
        </div>
      )}

      {/* Header Banner */}
      <div className="card glass fade-in" style={{
        padding: '28px 32px', borderRadius: 28, marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(5, 77, 175,0.95) 0%, rgba(3, 51, 115,0.92) 100%)',
        color: 'white', boxShadow: '0 16px 40px rgba(5, 77, 175,0.25)', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Success Lead Supervision Portal
              </span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
              My Managed Workforce
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', margin: '6px 0 0', maxWidth: 600, lineHeight: 1.5 }}>
              Monitor live shift attendance, review pending team leave approvals, and supervise your assigned Virtual Assistants and specialists.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenManageModal}
            style={{
              background: 'white', color: '#054daf', border: 'none', padding: '12px 22px', borderRadius: 16,
              fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)', transition: 'transform 0.2s, boxShadow 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <UserPlus size={18} /> Manage Team Roster
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="card stats-grid" style={{ gap: 16, marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="stat-card glass" style={{ padding: 22, borderRadius: 22, background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Assigned Team</span>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: '#eff6ff', color: '#054daf', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={18} /></div>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{myTeamMembers.length}</p>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total active members</span>
        </div>

        <div className="stat-card glass" style={{ padding: 22, borderRadius: 22, background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Live Clocked In</span>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={18} /></div>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 900, color: '#16a34a', margin: 0 }}>{onlineTeamCount}</p>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>● Currently active on shift</span>
        </div>

        <div className="stat-card glass" style={{ padding: 22, borderRadius: 22, background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pending Leaves</span>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: pendingTeamLeaves.length > 0 ? '#fef3c7' : '#f1f5f9', color: pendingTeamLeaves.length > 0 ? '#d97706' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Briefcase size={18} /></div>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 900, color: pendingTeamLeaves.length > 0 ? '#d97706' : '#0f172a', margin: 0 }}>{pendingTeamLeaves.length}</p>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Require supervisor review</span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', background: 'rgba(15,23,42,0.06)', padding: 6, borderRadius: 18, gap: 6, overflowX: 'auto', flexWrap: 'nowrap', width: '100%' }} className="custom-scrollbar">
          {[
            { id: 'MEMBERS', label: `Team Roster (${myTeamMembers.length})`, icon: Users },
            { id: 'LEAVES',  label: `Leave Requests (${pendingTeamLeaves.length} pending)`, icon: Briefcase },
            { id: 'PUNCHES', label: `Recent Punches (${teamLogs.length})`, icon: Clock },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                border: 'none', background: activeTab === tab.id ? 'white' : 'transparent',
                color: activeTab === tab.id ? '#054daf' : '#64748b',
                fontWeight: 800, fontSize: '0.86rem', padding: '10px 18px', borderRadius: 14, cursor: 'pointer',
                boxShadow: activeTab === tab.id ? '0 4px 14px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap'
              }}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'MEMBERS' && (
          <div style={{ position: 'relative', width: 260 }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Filter team members..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', height: 42, paddingLeft: 38, borderRadius: 14, border: '1px solid #cbd5e1', fontSize: '0.86rem', fontWeight: 600, outline: 'none' }}
            />
          </div>
        )}
      </div>

      {/* TAB 1: MEMBERS DIRECTORY */}
      {activeTab === 'MEMBERS' && (
        <div>
          {filteredMembers.length === 0 ? (
            <div className="card glass" style={{ padding: 60, textAlign: 'center', borderRadius: 24 }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: 12 }}>🙌</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>No Team Members Found</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto 20px' }}>
                {myTeamMembers.length === 0 
                  ? "You currently haven't assigned any Virtual Assistants or specialists to your managed team roster." 
                  : "No assigned team members match your search criteria."}
              </p>
              {myTeamMembers.length === 0 && (
                <button
                  onClick={handleOpenManageModal}
                  style={{ background: '#054daf', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 18px rgba(5, 77, 175,0.25)' }}
                >
                  <UserPlus size={16} style={{ marginRight: 6 }} /> Assign Team Members Now
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {filteredMembers.map(m => {
                // Check if currently clocked in
                const userTodayLogs = allLogs.filter(l => l.userId === m.userId && new Date(l.timestamp).toDateString() === todayStr);
                const latestLog = userTodayLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
                const isOnline = latestLog?.type === 'IN';

                return (
                  <div key={m.userId} className="card team-card glass" style={{ padding: 22, borderRadius: 24, background: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(15,23,42,0.06)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg, #054daf, #033373)', color: 'white', fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {m.name ? m.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{m.name}</h3>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{m.role || 'Associate'}</span>
                          </div>
                        </div>

                        <span style={{
                          padding: '4px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 800,
                          background: isOnline ? '#dcfce7' : '#f1f5f9', color: isOnline ? '#16a34a' : '#64748b',
                          display: 'flex', alignItems: 'center', gap: 5
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isOnline ? '#16a34a' : '#94a3b8' }} />
                          {isOnline ? 'On Shift' : 'Offline'}
                        </span>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 16, marginBottom: 16, fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155' }}>
                          <Briefcase size={14} color="#64748b" /> <strong>Department:</strong> {m.department || 'General VA'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155' }}>
                          <Mail size={14} color="#64748b" /> {m.email || 'No email provided'}
                        </div>
                        {m.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155' }}>
                            <Phone size={14} color="#64748b" /> {m.phone}
                          </div>
                        )}
                        {latestLog && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.76rem', borderTop: '1px solid #e2e8f0', paddingTop: 6, marginTop: 2 }}>
                            <Clock size={13} color="#054daf" /> Latest punch: <strong>{latestLog.type}</strong> at {new Date(latestLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <a
                        href={`/logs?user=${m.userId}`}
                        style={{ flex: 1, padding: '10px 12px', borderRadius: 12, background: '#eff6ff', color: '#054daf', fontWeight: 800, fontSize: '0.82rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1px solid #bfdbfe' }}
                      >
                        <Clock size={15} /> Logs
                      </a>
                      <a
                        href={`/analytics?user=${m.userId}`}
                        style={{ flex: 1, padding: '10px 12px', borderRadius: 12, background: '#f8fafc', color: '#0f172a', fontWeight: 800, fontSize: '0.82rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1px solid #e2e8f0' }}
                      >
                        <BarChart2 size={15} /> Metrics
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LEAVE REQUESTS */}
      {activeTab === 'LEAVES' && (
        <div>
          {teamLeaves.length === 0 ? (
            <div className="card glass" style={{ padding: 60, textAlign: 'center', borderRadius: 24 }}>
              <Briefcase size={48} color="#cbd5e1" style={{ display: 'block', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>No Team Leave Requests</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto' }}>
                Your managed team members have not submitted any time-off or leave applications yet.
              </p>
            </div>
          ) : (
            <div className="card glass" style={{ padding: 24, borderRadius: 24, background: 'white', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 650 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 14px' }}>Employee</th>
                    <th style={{ padding: '12px 14px' }}>Leave Type</th>
                    <th style={{ padding: '12px 14px' }}>Dates</th>
                    <th style={{ padding: '12px 14px' }}>Reason</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamLeaves.map(leave => {
                    const member = allUsers.find(u => u.userId === leave.userId) || { name: leave.userId };
                    const isPending = leave.status === 'Pending';

                    return (
                      <tr key={leave.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
                        <td style={{ padding: '14px', fontWeight: 800, color: '#0f172a' }}>{member.name}</td>
                        <td style={{ padding: '14px' }}>
                          <span style={{ background: '#eff6ff', color: '#054daf', padding: '4px 10px', borderRadius: 10, fontWeight: 700, fontSize: '0.8rem' }}>
                            {leave.leaveType || 'Annual Leave'}
                          </span>
                        </td>
                        <td style={{ padding: '14px', color: '#475569', fontWeight: 600 }}>
                          {leave.startDate} → {leave.endDate}
                        </td>
                        <td style={{ padding: '14px', color: '#64748b', maxWidth: 200 }}>
                          {leave.reason || 'No reason specified'}
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{
                            padding: '4px 12px', borderRadius: 12, fontWeight: 800, fontSize: '0.75rem',
                            background: leave.status === 'Approved' ? '#dcfce7' : leave.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                            color: leave.status === 'Approved' ? '#16a34a' : leave.status === 'Rejected' ? '#dc2626' : '#d97706'
                          }}>
                            {leave.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          {isPending ? (
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => handleApproveLeave(leave.id, member.name)}
                                title="Approve Leave"
                                style={{ background: '#16a34a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 10, fontWeight: 800, fontSize: '0.76rem', cursor: 'pointer' }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectLeave(leave.id, member.name)}
                                title="Reject Leave"
                                style={{ background: '#dc2626', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 10, fontWeight: 800, fontSize: '0.76rem', cursor: 'pointer' }}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Reviewed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RECENT PUNCHES */}
      {activeTab === 'PUNCHES' && (
        <div>
          {teamLogs.length === 0 ? (
            <div className="card glass" style={{ padding: 60, textAlign: 'center', borderRadius: 24 }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: 12 }}>⏱️</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>No Recent Team Punches</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto' }}>
                No attendance logs recorded for your assigned team members yet.
              </p>
            </div>
          ) : (
            <div className="card glass" style={{ padding: 24, borderRadius: 24, background: 'white', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 650 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 14px' }}>Employee</th>
                    <th style={{ padding: '12px 14px' }}>Punch Type</th>
                    <th style={{ padding: '12px 14px' }}>Time & Date</th>
                    <th style={{ padding: '12px 14px' }}>Location / GPS</th>
                    <th style={{ padding: '12px 14px' }}>Device / Note</th>
                  </tr>
                </thead>
                <tbody>
                  {teamLogs.map(l => {
                    const member = allUsers.find(u => u.userId === l.userId) || { name: l.userId };
                    const isClockIn = l.type === 'IN';

                    return (
                      <tr key={l.logId} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.86rem' }}>
                        <td style={{ padding: '14px', fontWeight: 800, color: '#0f172a' }}>{member.name}</td>
                        <td style={{ padding: '14px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: 10, fontWeight: 800, fontSize: '0.75rem',
                            background: isClockIn ? '#dcfce7' : '#fee2e2', color: isClockIn ? '#16a34a' : '#dc2626'
                          }}>
                            {isClockIn ? '⏱️ Time-In' : '🛑 Time-Out'}
                          </span>
                        </td>
                        <td style={{ padding: '14px', fontWeight: 600, color: '#334155' }}>
                          {new Date(l.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td style={{ padding: '14px', color: '#475569', fontSize: '0.8rem', maxWidth: 220 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MapPin size={14} color="#054daf" flexShrink={0} />
                            <span>{l.address || (l.latitude ? `${l.latitude.toFixed(4)}, ${l.longitude.toFixed(4)}` : 'GPS N/A')}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px', color: '#64748b', fontSize: '0.8rem' }}>
                          {l.deviceInfo || l.note || 'Web Client'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Roster Assignment Modal */}
      {showManageModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="card glass fade-in" style={{
            background: 'white', borderRadius: 28, padding: '28px 30px',
            maxWidth: 580, width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  Manage Team Roster
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.86rem', margin: '4px 0 0' }}>
                  Select the associates and staff assigned to your Success Lead supervision.
                </p>
              </div>
              <button
                onClick={() => setShowManageModal(false)}
                style={{ background: '#f1f5f9', border: 'none', color: '#64748b', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, background: '#f8fafc', padding: '10px 14px', borderRadius: 14 }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>
                Selected: <strong style={{ color: '#054daf' }}>{selectedCandidateIds.size}</strong> associates
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setSelectedCandidateIds(new Set(candidates.map(c => c.userId)))}
                  style={{ background: 'white', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCandidateIds(new Set())}
                  style={{ background: 'white', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}
                >
                  Clear
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 16, padding: 10, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 380 }}>
              {candidates.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: 30, fontSize: '0.88rem' }}>No eligible employees available to assign.</p>
              ) : (
                candidates.map(candidate => {
                  const isChecked = selectedCandidateIds.has(candidate.userId);
                  return (
                    <div
                      key={candidate.userId}
                      onClick={() => handleToggleCandidate(candidate.userId)}
                      style={{
                        padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                        background: isChecked ? '#eff6ff' : 'white',
                        border: isChecked ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 12,
                          background: isChecked ? '#3b82f6' : '#f1f5f9',
                          color: isChecked ? 'white' : '#64748b',
                          fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem'
                        }}>
                          {candidate.name ? candidate.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{candidate.name}</div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
                            {candidate.role || 'Associate'} — {candidate.department || 'General VA'}
                          </div>
                        </div>
                      </div>

                      <div style={{
                        width: 22, height: 22, borderRadius: 6,
                        border: isChecked ? 'none' : '2px solid #cbd5e1',
                        background: isChecked ? '#3b82f6' : 'transparent',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900
                      }}>
                        {isChecked && '✓'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                style={{ padding: '11px 20px', borderRadius: 14, background: '#f1f5f9', color: '#475569', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '0.88rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTeam}
                style={{ padding: '11px 24px', borderRadius: 14, background: '#054daf', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '0.88rem', boxShadow: '0 4px 14px rgba(5, 77, 175,0.3)' }}
              >
                Save Roster ({selectedCandidateIds.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
