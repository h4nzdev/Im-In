import { useState, useRef, useEffect, useMemo } from 'react';
import { gsap } from 'gsap';
import { UploadCloud, Plus, Search, FileText, CheckCircle2, AlertCircle, Trash2, Users, Download } from 'lucide-react';
import { db } from '../lib/db';
import { showToast, showDeleteConfirm, showAlert } from '../lib/alert';

export default function AdminPreRegistration() {
  const [ids, setIds] = useState(() => db.getPreRegisteredIds());
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ employeeId: '', name: '', department: 'Shared Services', email: '' });
  const containerRef = useRef();
  const fileInputRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current.querySelectorAll('.stagger-item'), {
        y: 20, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out'
      });
    });
    return () => ctx.revert();
  }, []);

  const filteredIds = useMemo(() => {
    if (!search.trim()) return ids;
    const q = search.toLowerCase();
    return ids.filter(r => r.employeeId.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.department.toLowerCase().includes(q));
  }, [ids, search]);

  const handleAddSingle = (e) => {
    e.preventDefault();
    if (!form.employeeId.trim() || !form.name.trim()) return;

    db.addPreRegisteredId({
      employeeId: form.employeeId.trim().toUpperCase(),
      name: form.name.trim(),
      department: form.department,
      email: form.email.trim().toLowerCase(),
      status: 'Pending'
    });
    setIds(db.getPreRegisteredIds());
    setForm({ employeeId: '', name: '', department: 'Shared Services', email: '' });
    showToast(`Added ${form.employeeId} to pre-registration whitelist`);
  };

  const handleDelete = async (employeeId) => {
    const confirm = await showDeleteConfirm({
      title: 'Remove Pre-Registered ID?',
      text: `Are you sure you want to remove ${employeeId}? They will not be able to auto-verify during signup.`
    });
    if (confirm) {
      db.deletePreRegisteredId(employeeId);
      setIds(db.getPreRegisteredIds());
      showToast('ID removed successfully');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split('\n').map(row => row.trim()).filter(row => row);
      if (rows.length <= 1) {
        showAlert('Upload Failed', 'No valid rows found or file only contains headers.', 'error');
        return;
      }

      // Assuming CSV format: EmployeeId, Name, Department, Email
      const parsedRecords = [];
      for (let i = 1; i < rows.length; i++) { // Skip header row
        const cols = rows[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length >= 2) {
          parsedRecords.push({
            employeeId: cols[0].toUpperCase(),
            name: cols[1],
            department: cols[2] || 'Shared Services',
            email: (cols[3] || '').toLowerCase(),
            status: 'Pending'
          });
        }
      }

      if (parsedRecords.length > 0) {
        db.bulkAddPreRegisteredIds(parsedRecords);
        setIds(db.getPreRegisteredIds());
        showToast(`Successfully imported ${parsedRecords.length} Employee IDs!`);
      } else {
        showAlert('Parse Error', 'Could not parse any valid records from the CSV.', 'error');
      }
      
      fileInputRef.current.value = ''; // reset input
    };
    reader.readAsText(file);
  };

  const generateTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,EmployeeID,Name,Department,Email\nRLK-1001,Jane Doe,Service Delivery,jane.doe@realynk.com\nRLK-1002,John Smith,Shared Services,john.smith@realynk.com";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "PreRegistration_Template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div ref={containerRef} style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header */}
      <div className="stagger-item" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={28} color="#054daf" /> Employee Directory Pre-Registration
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '6px 0 0', fontWeight: 500 }}>
          Whitelist Employee IDs to allow automatic verification and data auto-fill during employee signup.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* Single Add Form */}
        <div className="card glass stagger-item" style={{ padding: 24, borderRadius: 24 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={20} color="#054daf" /> Add Single Employee ID
          </h2>
          <form onSubmit={handleAddSingle} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Emp ID</label>
                <input type="text" placeholder="RLK-1000" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} required style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Full Name</label>
                <input type="text" placeholder="John Doe" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Department</label>
              <select value={form.department} onChange={e => setForm({...form, department: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none' }}>
                <option value="Shared Services">Shared Services</option>
                <option value="Service Delivery">Service Delivery</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Email (Optional)</label>
              <input type="email" placeholder="john@realynk.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none' }} />
            </div>
            <button type="submit" style={{ padding: '12px', borderRadius: 12, background: '#054daf', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer', marginTop: 8 }}>
              Whitelist ID
            </button>
          </form>
        </div>

        {/* Bulk Upload */}
        <div className="card glass stagger-item" style={{ padding: 24, borderRadius: 24, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={20} color="#054daf" /> Bulk Upload (CSV)
          </h2>
          <div style={{ flex: 1, border: '2px dashed #cbd5e1', borderRadius: 16, background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
            <UploadCloud size={40} color="#94a3b8" />
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 800, color: '#0f172a' }}>Select CSV File</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Columns: EmployeeID, Name, Department, Email</p>
            </div>
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
            <button onClick={() => fileInputRef.current?.click()} style={{ padding: '10px 20px', borderRadius: 12, background: 'white', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              Browse Files
            </button>
          </div>
          <button onClick={generateTemplate} style={{ background: 'none', border: 'none', color: '#054daf', fontWeight: 700, fontSize: '0.8rem', marginTop: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Download size={14} /> Download CSV Template
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="card glass stagger-item" style={{ padding: 24, borderRadius: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Pre-Registered Directory</h2>
          <div style={{ position: 'relative', width: 260 }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input type="text" placeholder="Search IDs or names..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.85rem' }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Employee ID</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Full Name</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Department</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIds.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                    No pre-registered IDs found.
                  </td>
                </tr>
              ) : (
                filteredIds.map(row => (
                  <tr key={row.employeeId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0f172a' }}>{row.employeeId}</td>
                    <td style={{ padding: '14px 16px', color: '#334155', fontWeight: 600 }}>{row.name}</td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.85rem' }}>{row.department}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {row.status === 'Registered' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 12, background: '#ecfdf5', color: '#059669', fontSize: '0.75rem', fontWeight: 800 }}>
                          <CheckCircle2 size={14} /> Registered
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 12, background: '#fffbeb', color: '#d97706', fontSize: '0.75rem', fontWeight: 800 }}>
                          <AlertCircle size={14} /> Pending Signup
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => handleDelete(row.employeeId)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
