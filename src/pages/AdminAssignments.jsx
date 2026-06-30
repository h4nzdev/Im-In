import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { BookOpen, Plus, Search, Filter, Trash2, Edit3, ShieldAlert, CheckCircle2, Users, FileText, AlertTriangle, ArrowRight, X, Sparkles } from 'lucide-react';
import { db } from '../lib/db';

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState(() => db.getAssignments());
  const [search, setSearch] = useState('');
  const [targetFilter, setTargetFilter] = useState('All');
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    title: '',
    type: 'SOP Protocol',
    target: 'Service Delivery',
    priority: 'High',
    description: '',
    status: 'Active'
  });

  const containerRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.sop-card'),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power3.out' }
      );
    });
    return () => ctx.revert();
  }, [assignments]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      title: '',
      type: 'SOP Protocol',
      target: 'Service Delivery',
      priority: 'High',
      description: '',
      status: 'Active'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (sop) => {
    setEditingId(sop.id);
    setForm({
      title: sop.title,
      type: sop.type || 'SOP Protocol',
      target: sop.target || 'All Departments',
      priority: sop.priority || 'Medium',
      description: sop.description || '',
      status: sop.status || 'Active'
    });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    if (editingId) {
      db.updateAssignment(editingId, form);
    } else {
      const newId = `SOP-${Math.floor(100 + Math.random() * 900)}`;
      db.addAssignment({
        id: newId,
        ...form,
        createdAt: new Date().toISOString().split('T')[0]
      });
    }

    setAssignments(db.getAssignments());
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to remove this SOP assignment?')) {
      db.deleteAssignment(id);
      setAssignments(db.getAssignments());
    }
  };

  const filtered = assignments.filter((sop) => {
    const matchesSearch = sop.title.toLowerCase().includes(search.toLowerCase()) ||
                          sop.target.toLowerCase().includes(search.toLowerCase()) ||
                          (sop.description && sop.description.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = targetFilter === 'All' || sop.target === targetFilter;
    return matchesSearch && matchesFilter;
  });

  const getPriorityBadge = (p) => {
    if (p === 'High') return { bg: 'rgba(239,68,68,0.12)', color: '#dc2626', label: '🔴 High Priority' };
    if (p === 'Medium') return { bg: 'rgba(245,158,11,0.12)', color: '#d97706', label: '🟡 Medium Priority' };
    return { bg: 'rgba(16,185,129,0.12)', color: '#059669', label: '🟢 Standard' };
  };

  return (
    <div ref={containerRef}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(37,99,235,0.1)', color: '#2563eb', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
              Governance Suite
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            SOP & Task Assignments
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '4px 0 0' }}>
            Manage Standard Operating Procedures, Compliance Protocols, and Department Assignments
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, width: 'auto', padding: '12px 20px', borderRadius: 14 }}>
          <Plus size={18} /> Create SOP Assignment
        </button>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="card glass sop-card" style={{ padding: 20, borderRadius: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(37,99,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Total Protocols</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{assignments.length}</h3>
          </div>
        </div>

        <div className="card glass sop-card" style={{ padding: 20, borderRadius: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>High Priority</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {assignments.filter(a => a.priority === 'High').length}
            </h3>
          </div>
        </div>

        <div className="card glass sop-card" style={{ padding: 20, borderRadius: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Active Status</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {assignments.filter(a => a.status === 'Active').length}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card glass sop-card" style={{ padding: 16, borderRadius: 20, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260, background: 'white', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(15,23,42,0.12)' }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search SOP title, department target, or protocol notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '0.92rem', padding: 0 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} color="#64748b" />
          <select
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            style={{ width: 'auto', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(15,23,42,0.12)', background: 'white', fontWeight: 700, fontSize: '0.88rem' }}
          >
            <option value="All">All Targets / Departments</option>
            <option value="Service Delivery">Service Delivery</option>
            <option value="Shared Services">Shared Services</option>
            <option value="FinTech Global Support">FinTech Global Support</option>
            <option value="Healthcare Billing Operations">Healthcare Billing Operations</option>
          </select>
        </div>
      </div>

      {/* SOP Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {filtered.map((sop) => {
          const pb = getPriorityBadge(sop.priority);
          return (
            <div key={sop.id} className="card glass sop-card" style={{ padding: 24, borderRadius: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'white', border: '1px solid rgba(15,23,42,0.08)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(37,99,235,0.08)', color: '#2563eb', fontWeight: 800, fontSize: '0.72rem' }}>
                    {sop.type || 'SOP Protocol'}
                  </span>
                  <span style={{ padding: '4px 10px', borderRadius: 8, background: pb.bg, color: pb.color, fontWeight: 800, fontSize: '0.72rem' }}>
                    {pb.label}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.3 }}>
                  {sop.title}
                </h3>

                <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 16px', lineHeight: 1.5 }}>
                  {sop.description || 'No detailed procedures provided for this protocol.'}
                </p>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Assigned Target</span>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>{sop.target}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => handleOpenEdit(sop)}
                    style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', transition: 'all 0.15s' }}
                    title="Edit Protocol"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(sop.id)}
                    style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#dc2626', transition: 'all 0.15s' }}
                    title="Delete Protocol"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', background: 'white', borderRadius: 24, border: '1px dashed #cbd5e1' }}>
            <FileText size={40} color="#94a3b8" style={{ margin: '0 auto 12px', display: 'block' }} />
            <h3 style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '1.2rem' }}>No SOPs or Assignments Found</h3>
            <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '6px 0 0' }}>Try adjusting your search query or create a new SOP assignment.</p>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 120, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowModal(false)}>
          <div className="card glass" style={{ width: '100%', maxWidth: 520, borderRadius: 28, padding: 32, background: 'white', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 20, right: 20, background: '#f1f5f9', border: 'none', width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(37,99,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <BookOpen size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {editingId ? 'Edit SOP Protocol' : 'Create New SOP Protocol'}
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0' }}>Assign procedural standards across enterprise teams</p>
              </div>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', color: '#475569', fontSize: '0.78rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase' }}>Protocol Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Daily Biometric Terminal Sanitation SOP"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontWeight: 600 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', color: '#475569', fontSize: '0.78rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase' }}>Category / Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontWeight: 700 }}
                  >
                    <option value="SOP Protocol">SOP Protocol</option>
                    <option value="Checklist">Checklist</option>
                    <option value="Mandatory Training">Mandatory Training</option>
                    <option value="Compliance Audit">Compliance Audit</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#475569', fontSize: '0.78rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase' }}>Priority Level</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontWeight: 700 }}
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Standard">Standard Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#475569', fontSize: '0.78rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase' }}>Target Department / Account</label>
                <select
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontWeight: 700 }}
                >
                  <option value="Service Delivery">Service Delivery</option>
                  <option value="Shared Services">Shared Services</option>
                  <option value="FinTech Global Support">FinTech Global Support</option>
                  <option value="Healthcare Billing Operations">Healthcare Billing Operations</option>
                  <option value="All Departments">All Enterprise Departments</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#475569', fontSize: '0.78rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase' }}>Procedure Summary & Guidelines</label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Outline the steps required for this procedure..."
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontWeight: 600, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 800, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 2, padding: '14px', borderRadius: 14, fontWeight: 800 }}>
                  {editingId ? 'Save Protocol Changes' : 'Deploy SOP Protocol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
