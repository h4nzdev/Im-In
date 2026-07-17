import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Trash2, Plus } from 'lucide-react';
import { db } from '../lib/db';

export default function AdminPositions() {
  const [positions, setPositions] = useState(() => db.getPositions());
  const [name, setName] = useState('');
  const [dept, setDept] = useState('');
  const [error, setError] = useState('');
  const containerRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current.querySelectorAll('.card'), {
        y: 24, opacity: 0, duration: 0.55, stagger: 0.1, ease: 'power3.out',
      });
    });
    return () => ctx.revert();
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Position name is required'); return; }
    const updated = db.addPosition({ positionId: `POS-${Date.now()}`, positionName: name.trim(), department: dept.trim() });
    setPositions(updated);
    setName(''); setDept('');
  };

  const handleDelete = (id) => {
    setPositions(db.deletePosition(id));
  };

  const cardStyle = { background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 20, padding: 28, boxShadow: '0 4px 24px rgba(15,23,42,0.05)' };

  return (
    <div ref={containerRef}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Position Management</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24 }}>

        <div className="card" style={cardStyle}>
          <p style={{ color: '#334155', fontWeight: 600, fontSize: '1rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18} color="#043e8a" /> Add Position
          </p>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', color: 'rgba(51,65,85,0.85)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Position Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Full-Stack Developer" required />
            </div>
            <div>
              <label style={{ display: 'block', color: 'rgba(51,65,85,0.85)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Department</label>
              <input value={dept} onChange={e => setDept(e.target.value)} placeholder="e.g. Engineering" />
            </div>
            {error && <p style={{ color: '#dc2626', fontSize: '0.82rem' }}>{error}</p>}
            <button type="submit" className="btn-primary">Add Position</button>
          </form>
        </div>

        <div className="card" style={cardStyle}>
          <p style={{ color: '#334155', fontWeight: 600, fontSize: '1rem', marginBottom: 20 }}>All Positions <span style={{ color: 'rgba(100,116,139,0.6)', fontWeight: 400, fontSize: '0.85rem' }}>({positions.length})</span></p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {positions.map(p => (
              <div key={p.positionId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(15,23,42,0.035)', border: '1px solid rgba(15,23,42,0.07)', borderRadius: 12 }}>
                <div>
                  <p style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.9rem' }}>{p.positionName}</p>
                  <p style={{ color: 'rgba(100,116,139,0.7)', fontSize: '0.78rem', marginTop: 2 }}>{p.department || 'No department'}</p>
                </div>
                <button onClick={() => handleDelete(p.positionId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(220,38,38,0.55)', padding: 8, borderRadius: 8, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color='#dc2626'} onMouseLeave={e => e.currentTarget.style.color='rgba(220,38,38,0.55)'}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
