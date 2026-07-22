import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { UserCheck, Check, X, Calendar, Search, ChevronLeft, ChevronRight, Mail, Clock } from 'lucide-react';
import { db } from '../lib/db';
import { useAuthStore } from '../store/authStore';

export default function AdminApprovals() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'Admin';
  const isSuccessLead = user?.role === 'Success Lead';
  const managedTeamIds = Array.isArray(user?.managedTeam) ? user.managedTeam : [];

  const [users, setUsers] = useState(() => db.getUsers());
  const [leaves, setLeaves] = useState(() => db.getLeaves());
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, LEAVES, USERS
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  // Pagination & limit
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current.querySelectorAll('.card'), {
        y: 28, opacity: 0, duration: 0.55, stagger: 0.08, ease: 'power3.out',
      });
    });
    return () => ctx.revert();
  }, [activeTab]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const pendingLeaves = leaves.filter(l => l.status === 'Pending' && (isAdmin || (isSuccessLead && managedTeamIds.includes(l.userId)))).map(l => ({ ...l, itemType: 'LEAVE' }));
  const pendingUsers = isAdmin ? users.filter(u => u.status === 'Pending').map(u => ({ ...u, itemType: 'USER' })) : [];

  const handleApproveLeave = (id, userName) => {
    db.updateLeaveStatus(id, 'Approved');
    setLeaves(db.getLeaves());
    showToast(`Approved leave request for ${userName}`);
  };
  const handleRejectLeave = (id, userName) => {
    db.updateLeaveStatus(id, 'Rejected');
    setLeaves(db.getLeaves());
    showToast(`Rejected leave request for ${userName}`);
  };

  const handleApproveUser = (id, userName) => {
    db.updateUserStatus(id, 'Active');
    setUsers(db.getUsers());
    showToast(`Verified corporate login access for ${userName}`);
  };
  const handleRejectUser = (id, userName) => {
    db.updateUserStatus(id, 'Rejected');
    setUsers(db.getUsers());
    showToast(`Denied account registration for ${userName}`);
  };

  const getUserName = (uid) => users.find(u => u.userId === uid)?.name || 'Unknown Employee';

  // Combine items into queue table
  let rawQueue = [];
  if (activeTab === 'ALL' || activeTab === 'LEAVES') rawQueue = rawQueue.concat(pendingLeaves);
  if (activeTab === 'ALL' || activeTab === 'USERS') rawQueue = rawQueue.concat(pendingUsers);

  const q = search.toLowerCase().trim();
  const filteredQueue = rawQueue.filter(item => {
    if (!q) return true;
    if (item.itemType === 'USER') {
      return item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q) || item.userId.toLowerCase().includes(q);
    } else {
      const uName = getUserName(item.userId).toLowerCase();
      return uName.includes(q) || item.leaveType.toLowerCase().includes(q) || item.reason.toLowerCase().includes(q);
    }
  });

  const totalEntries = filteredQueue.length;
  const totalPages = Math.ceil(totalEntries / limit) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * limit;
  const endIdx = Math.min(startIdx + limit, totalEntries);
  const pageQueue = filteredQueue.slice(startIdx, endIdx);

  const totalPendingCount = pendingLeaves.length + pendingUsers.length;

  return (
    <div ref={containerRef} style={{ width: '100%', margin: '0 auto', paddingBottom: 40 }}>
      
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 999,
          padding: '14px 22px', borderRadius: 16, background: '#033373',
          color: 'white', fontWeight: 700, fontSize: '0.92rem',
          boxShadow: '0 12px 36px rgba(6,95,70,0.35)', display: 'flex', alignItems: 'center', gap: 10,
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <Check size={18} color="#60a5fa" /> {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
              Verification & Approval Queue
            </h1>
            {totalPendingCount > 0 && (
              <span style={{ padding: '4px 12px', borderRadius: 20, background: '#ef4444', color: 'white', fontWeight: 800, fontSize: '0.8rem' }}>
                {totalPendingCount} pending
              </span>
            )}
          </div>
          <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '4px 0 0', fontWeight: 500 }}>
            Structured table verification portal for signups and leave bookings
          </p>
        </div>

        <div style={{ display: 'flex', background: 'rgba(15,23,42,0.06)', padding: 4, borderRadius: 14, gap: 4 }}>
          {[
            { id: 'ALL', label: `All Queue (${totalPendingCount})` },
            { id: 'LEAVES', label: `Leaves (${pendingLeaves.length})` },
            { id: 'USERS', label: `Signups (${pendingUsers.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
              style={{
                border: 'none', background: activeTab === tab.id ? 'white' : 'transparent',
                color: activeTab === tab.id ? '#043e8a' : '#64748b',
                fontWeight: 700, fontSize: '0.82rem', padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                boxShadow: activeTab === tab.id ? '0 2px 10px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="card glass controls-bar" style={{ padding: '14px 16px', borderRadius: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input 
              type="text"
              placeholder="Search queue by name, ID, email, or reason..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              style={{ paddingLeft: 42, background: 'rgba(255,255,255,0.9) !important', width: '100%', outline: 'none', margin: 0 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
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

      {/* Table Card */}
      <div className="card glass" style={{ padding: 0, borderRadius: 24, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 780, whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.04)', borderBottom: '1px solid rgba(15,23,42,0.08)' }}>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Request Type</th>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Employee / Applicant</th>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Details & Timeline</th>
                <th style={{ padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', textAlign: 'right', whiteSpace: 'nowrap' }}>Executive Action</th>
              </tr>
            </thead>
            <tbody>
              {pageQueue.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '54px 20px', color: '#94a3b8' }}>
                    <UserCheck size={38} strokeWidth={1.5} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
                    <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>The approval queue is completely empty</span>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>No pending user logins or leave requests found.</p>
                  </td>
                </tr>
              ) : (
                pageQueue.map((item, idx) => {
                  const isUser = item.itemType === 'USER';
                  const name = isUser ? item.name : getUserName(item.userId);

                  return (
                    <tr key={isUser ? item.userId : item.leaveId} style={{ borderBottom: idx === pageQueue.length - 1 ? 'none' : '1px solid rgba(15,23,42,0.06)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.45)' : 'transparent', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.45)' : 'transparent'}>
                      
                      <td style={{ padding: '18px 20px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-block', whiteSpace: 'nowrap',
                          padding: '5px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800,
                          background: isUser ? 'rgba(5, 77, 175,0.15)' : 'rgba(245,158,11,0.18)',
                          color: isUser ? '#043e8a' : '#b45309'
                        }}>
                          {isUser ? 'NEW SIGNUP' : `${item.leaveType} LEAVE`}
                        </span>
                      </td>

                      <td style={{ padding: '18px 20px' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>{name}</span>
                        <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          {isUser ? <><Mail size={13} /> {item.email}</> : `Employee ID: ${item.userId}`}
                        </span>
                      </td>

                      <td style={{ padding: '18px 20px' }}>
                        {isUser ? (
                          <span style={{ fontSize: '0.88rem', color: '#334155', fontWeight: 500 }}>
                            Account created on {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        ) : (
                          <div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Clock size={14} color="#64748b" /> {item.startDate} &nbsp;to&nbsp; {item.endDate}
                            </span>
                            <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b', fontStyle: 'italic', maxWidth: 360 }}>
                              "{item.reason}"
                            </p>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '18px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => isUser ? handleApproveUser(item.userId, name) : handleApproveLeave(item.leaveId, name)}
                            style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#054daf', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#043e8a'}
                            onMouseLeave={e => e.currentTarget.style.background = '#054daf'}
                          >
                            <Check size={16} /> Approve
                          </button>
                          <button
                            onClick={() => isUser ? handleRejectUser(item.userId, name) : handleRejectLeave(item.leaveId, name)}
                            style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#dc2626', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                          >
                            <X size={16} /> Deny
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.6)', borderTop: '1px solid rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
            Showing {totalEntries === 0 ? 0 : startIdx + 1} to {endIdx} of {totalEntries} queue items
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
