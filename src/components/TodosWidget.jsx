import { useState } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, CheckSquare } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function TodosWidget() {
  const { user } = useAuthStore();
  const STORAGE_KEY = `imin_todos_${user.userId}`;

  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return [
      { id: 't1', text: 'Review biometric shift logs', completed: true, priority: 'High' },
      { id: 't2', text: 'Submit project leave request', completed: false, priority: 'Med' },
      { id: 't3', text: 'Prepare sprint timesheet summary', completed: false, priority: 'Low' },
    ];
  });

  const [newText, setNewText] = useState('');
  const [priority, setPriority] = useState('Med');

  const saveTodos = (items) => {
    setTodos(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const next = [
      { id: `todo_${Date.now()}`, text: newText.trim(), completed: false, priority },
      ...todos
    ];
    saveTodos(next);
    setNewText('');
  };

  const toggleComplete = (id) => {
    const next = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTodos(next);
  };

  const handleDelete = (id) => {
    const next = todos.filter(t => t.id !== id);
    saveTodos(next);
  };

  const priorityColor = (p) => {
    if (p === 'High') return ['#dc2626', 'rgba(239,68,68,0.12)'];
    if (p === 'Med') return ['#d97706', 'rgba(245,158,11,0.14)'];
    return ['#2563eb', 'rgba(59,130,246,0.14)'];
  };

  return (
    <div className="card glass" style={{ padding: 28, borderRadius: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ padding: 8, borderRadius: 10, background: 'rgba(59,130,246,0.12)', color: '#1d4ed8', display: 'flex' }}>
            <CheckSquare size={20} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Personal Shift Todos
          </h2>
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', background: 'rgba(15,23,42,0.05)', padding: '4px 12px', borderRadius: 20 }}>
          {todos.filter(t => t.completed).length} / {todos.length} done
        </span>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input 
          type="text" 
          placeholder="Add a new shift task..." 
          value={newText} 
          onChange={e => setNewText(e.target.value)}
          style={{ flex: 1, background: 'rgba(255,255,255,0.85) !important' }}
        />
        <select 
          value={priority} 
          onChange={e => setPriority(e.target.value)}
          style={{ width: 100, background: 'rgba(255,255,255,0.85) !important', fontWeight: 600 }}
        >
          <option value="High">High</option>
          <option value="Med">Med</option>
          <option value="Low">Low</option>
        </select>
        <button type="submit" style={{
          padding: '0 18px', borderRadius: 12, border: 'none', background: '#2563eb',
          color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s'
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
          onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
        >
          <Plus size={20} />
        </button>
      </form>

      {/* Todo Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
        {todos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            No tasks yet. Add something you need to accomplish today!
          </div>
        ) : (
          todos.map(t => {
            const [c, bg] = priorityColor(t.priority);
            return (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: 14,
                background: t.completed ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(15,23,42,0.06)', transition: 'all 0.15s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, overflow: 'hidden', cursor: 'pointer' }} onClick={() => toggleComplete(t.id)}>
                  {t.completed ? (
                    <CheckCircle2 size={20} color="#3b82f6" flexShrink={0} />
                  ) : (
                    <Circle size={20} color="#94a3b8" flexShrink={0} />
                  )}
                  <span style={{
                    fontSize: '0.92rem', fontWeight: 600, color: t.completed ? '#94a3b8' : '#1e293b',
                    textDecoration: t.completed ? 'line-through' : 'none',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {t.text}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 12, flexShrink: 0 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800, color: c, background: bg }}>
                    {t.priority}
                  </span>
                  <button 
                    onClick={() => handleDelete(t.id)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#cbd5e1', padding: 4, display: 'flex', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
