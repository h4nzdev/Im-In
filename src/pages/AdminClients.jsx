import { useState, useRef, useEffect, useMemo } from 'react';
import { gsap } from 'gsap';
import { Plus, Search, Building2, Trash2, Edit3, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '../lib/db';
import { showToast, showDeleteConfirm } from '../lib/alert';

export default function AdminClients() {
  const [clients, setClients] = useState(() => db.getClients());
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    status: 'Active'
  });

  const containerRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current.querySelectorAll('.stagger-item'), {
        y: 20, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out'
      });
    });
    return () => ctx.revert();
  }, []);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.code && c.code.toLowerCase().includes(q))
    );
  }, [clients, search]);

  const openModal = (client = null) => {
    if (client) {
      setEditId(client.id);
      setForm({ name: client.name, code: client.code || '', description: client.description || '', status: client.status });
    } else {
      setEditId(null);
      setForm({ name: '', code: '', description: '', status: 'Active' });
    }
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editId) {
      db.updateClient(editId, form);
      showToast(`Client ${form.name} updated successfully.`);
    } else {
      db.addClient({
        id: `CLI-${Date.now()}`,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        status: form.status
      });
      showToast(`Client ${form.name} created successfully.`);
    }
    setClients(db.getClients());
    setShowModal(false);
  };

  const handleDelete = async (id, name) => {
    const confirm = await showDeleteConfirm({
      title: 'Delete Client?',
      text: `Are you sure you want to delete ${name}? This action cannot be undone.`
    });
    if (confirm) {
      db.deleteClient(id);
      setClients(db.getClients());
      showToast('Client deleted.');
    }
  };

  return (
    <div ref={containerRef} style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header */}
      <div className="stagger-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={28} color="#054daf" /> Client Management
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '6px 0 0', fontWeight: 500 }}>
            Manage enterprise clients, campaigns, and assign them to Virtual Assistants for time tracking.
          </p>
        </div>
        <button onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, background: '#054daf', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5,77,175,0.2)' }}>
          <Plus size={18} /> Add New Client
        </button>
      </div>

      {/* Roster Table */}
      <div className="card glass stagger-item" style={{ padding: 24, borderRadius: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Client Directory</h2>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input type="text" placeholder="Search clients or codes..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.85rem' }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Client Code</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Client Name</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Description</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                    No clients found matching your search.
                  </td>
                </tr>
              ) : (
                filteredClients.map(client => (
                  <tr key={client.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0f172a' }}>{client.code || '-'}</td>
                    <td style={{ padding: '14px 16px', color: '#334155', fontWeight: 700 }}>{client.name}</td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.85rem' }}>{client.description || '-'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {client.status === 'Active' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 12, background: '#ecfdf5', color: '#059669', fontSize: '0.75rem', fontWeight: 800 }}>
                          <CheckCircle2 size={14} /> Active
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 12, background: '#f1f5f9', color: '#64748b', fontSize: '0.75rem', fontWeight: 800 }}>
                          <AlertCircle size={14} /> Inactive
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <button onClick={() => openModal(client)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDelete(client.id, client.name)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="fade-in card glass" style={{ background: 'white', padding: 24, borderRadius: 24, width: '100%', maxWidth: 480, margin: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                {editId ? 'Edit Client' : 'Add New Client'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: 6 }}>Client Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="e.g. Acme Corp" style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: 6 }}>Client Code (Optional)</label>
                <input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="e.g. ACM" style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none', textTransform: 'uppercase' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: 6 }}>Description (Optional)</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Brief description of the account..." rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: 6 }}>Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none' }}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive (Archived)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, background: '#f1f5f9', color: '#475569', fontWeight: 800, border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: 12, background: '#054daf', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                  {editId ? 'Save Changes' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
