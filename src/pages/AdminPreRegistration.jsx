import { useState, useRef, useEffect, useMemo } from 'react';
import { gsap } from 'gsap';
import { QrCode, Plus, Search, CheckCircle2, AlertCircle, Trash2, Users, Download, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../lib/db';
import { showToast, showDeleteConfirm } from '../lib/alert';

export default function AdminPreRegistration() {
  const [codes, setCodes] = useState(() => db.getInviteCodes());
  const [search, setSearch] = useState('');
  const [activeQr, setActiveQr] = useState(null);
  const containerRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current.querySelectorAll('.stagger-item'), {
        y: 20, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out'
      });
    });
    return () => ctx.revert();
  }, []);

  const filteredCodes = useMemo(() => {
    if (!search.trim()) return codes;
    const q = search.toLowerCase();
    return codes.filter(r => r.code.toLowerCase().includes(q));
  }, [codes, search]);

  const generateCode = () => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    db.addInviteCode({
      code: newCode,
      status: 'Active',
      generatedAt: new Date().toISOString(),
      usedBy: null
    });
    setCodes(db.getInviteCodes());
    setActiveQr(newCode);
    showToast(`Generated new registration code: ${newCode}`);
  };

  const handleDelete = async (code) => {
    const confirm = await showDeleteConfirm({
      title: 'Remove Invite Code?',
      text: `Are you sure you want to revoke ${code}? It will no longer be valid for registration.`
    });
    if (confirm) {
      db.deleteInviteCode(code);
      setCodes(db.getInviteCodes());
      if (activeQr === code) setActiveQr(null);
      showToast('Code revoked successfully');
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', margin: '0 auto', paddingBottom: 40 }}>
      {/* Header */}
      <div className="stagger-item" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <QrCode size={28} color="#054daf" /> Admin Invitations & QR Codes
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '6px 0 0', fontWeight: 500 }}>
          Generate single-use secure QR codes for new employee onboarding.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* Generator */}
        <div className="card glass stagger-item" style={{ padding: 32, borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={generateCode} style={{ padding: '16px 24px', borderRadius: 16, background: '#054daf', color: 'white', fontSize: '1.1rem', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 10px 25px rgba(5,77,175,0.3)' }}>
            <Plus size={24} /> Generate New Invite QR
          </button>
          <p style={{ marginTop: 16, fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
            Codes are strictly single-use and will automatically burn upon successful registration.
          </p>
        </div>

        {/* Display Active QR */}
        <div className="card glass stagger-item" style={{ padding: 24, borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 250 }}>
          {activeQr ? (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ padding: 16, background: 'white', borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <QRCodeSVG value={activeQr} size={150} level="H" includeMargin={false} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: '16px 0 4px', letterSpacing: '0.1em' }}>{activeQr}</h2>
              <p style={{ color: '#059669', fontSize: '0.85rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={16} /> Active & Ready to Scan
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <QrCode size={48} style={{ opacity: 0.5, marginBottom: 12 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No code generated recently.</p>
            </div>
          )}
        </div>
      </div>

      {/* Roster Table */}
      <div className="card glass stagger-item" style={{ padding: 24, borderRadius: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Invite Code Ledger</h2>
          <div style={{ position: 'relative', width: 260 }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input type="text" placeholder="Search codes..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.85rem' }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Invite Code</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Generated On</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                    No invite codes found.
                  </td>
                </tr>
              ) : (
                filteredCodes.sort((a,b) => new Date(b.generatedAt) - new Date(a.generatedAt)).map(row => (
                  <tr key={row.code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.05em' }}>
                      {row.code}
                      {row.status === 'Active' && <button onClick={() => setActiveQr(row.code)} style={{ marginLeft: 10, background: 'none', border: 'none', color: '#054daf', cursor: 'pointer', padding: 0 }} title="Show QR"><QrCode size={16}/></button>}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.85rem' }}>{new Date(row.generatedAt).toLocaleString()}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {row.status === 'Active' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 12, background: '#ecfdf5', color: '#059669', fontSize: '0.75rem', fontWeight: 800 }}>
                          <CheckCircle2 size={14} /> Active
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 12, background: '#f1f5f9', color: '#64748b', fontSize: '0.75rem', fontWeight: 800 }}>
                          <AlertCircle size={14} /> Used by {row.usedBy}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => handleDelete(row.code)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
