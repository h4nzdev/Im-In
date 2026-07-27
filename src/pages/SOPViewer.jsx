import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import { ArrowLeft, BookOpen, Clock, ShieldAlert, CheckCircle2, AlertTriangle, Users } from 'lucide-react';

export default function SOPViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sop, setSop] = useState(null);

  useEffect(() => {
    const assignments = db.getAssignments();
    const found = assignments.find(a => a.id === id);
    setSop(found);
  }, [id]);

  if (!sop) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Protocol Not Found</h2>
          <p style={{ color: '#64748b' }}>The SOP you are looking for does not exist or was removed.</p>
          <button onClick={() => navigate(-1)} className="btn-primary" style={{ marginTop: 20 }}>Go Back</button>
        </div>
      </div>
    );
  }

  const getPriorityBadge = (p) => {
    if (p === 'High') return { bg: 'rgba(239,68,68,0.12)', color: '#dc2626', label: 'High Priority', icon: <AlertTriangle size={14} /> };
    if (p === 'Medium') return { bg: 'rgba(245,158,11,0.12)', color: '#d97706', label: 'Medium Priority', icon: <AlertTriangle size={14} /> };
    return { bg: 'rgba(16,185,129,0.12)', color: '#059669', label: 'Standard', icon: <CheckCircle2 size={14} /> };
  };

  const pb = getPriorityBadge(sop.priority);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      {/* Header Bar */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '20px 5%', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 20 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 12, padding: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Protocol Viewer</h1>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>ID: {sop.id}</span>
          </div>
        </div>
      </div>

      {/* Main Document Content */}
      <div style={{ maxWidth: 1000, margin: '40px auto', padding: '0 5%' }}>
        <div className="card glass" style={{ background: 'white', borderRadius: 24, padding: '40px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <span style={{ padding: '6px 14px', borderRadius: 12, background: 'rgba(5, 77, 175,0.08)', color: '#054daf', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookOpen size={16} /> {sop.type || 'SOP Protocol'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 12, background: pb.bg, color: pb.color, fontWeight: 800, fontSize: '0.85rem' }}>
              {pb.icon} {pb.label}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 12, background: '#f1f5f9', color: '#475569', fontWeight: 800, fontSize: '0.85rem' }}>
              <Clock size={16} /> Created: {sop.createdAt}
            </span>
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 24px', lineHeight: 1.2, letterSpacing: '-0.5px' }}>
            {sop.title}
          </h1>

          <div style={{ display: 'flex', gap: 40, borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '24px 0', marginBottom: 32 }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Target Department</span>
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>{sop.target}</span>
            </div>
            
            {sop.assignedUsers && sop.assignedUsers.length > 0 && (
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Assigned Specific Users</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={16} color="#054daf" />
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                    {sop.assignedUsers.join(', ')}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div style={{ fontSize: '1.1rem', color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {sop.description || 'No detailed procedures provided for this protocol. Please contact your manager for more details.'}
          </div>

        </div>
      </div>
    </div>
  );
}
