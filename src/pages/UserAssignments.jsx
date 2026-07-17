import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { CheckSquare, Square, Plus, Trash2, BookOpen, AlertCircle, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/db';

export default function UserAssignments() {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState(() => db.getAssignments());
  const [todoList, setTodoList] = useState(() => {
    return JSON.parse(localStorage.getItem(`realynk_todos_${user?.userId}`)) || [];
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const containerRef = useRef();

  // Auto-sync Admin SOP/Assignments to personal interactive To-Do list
  useEffect(() => {
    if (!user) return;
    const currentTodos = JSON.parse(localStorage.getItem(`realynk_todos_${user.userId}`)) || [];
    const dept = user.department || 'Shared Services';
    
    // Filter SOP assignments matching user's department or global
    const relevantSOPs = assignments.filter(a => 
      a.status === 'Active' && (a.target === dept || a.target === 'All Departments' || !a.target)
    );

    let updated = false;
    const merged = [...currentTodos];

    relevantSOPs.forEach(sop => {
      const exists = merged.some(t => t.sopId === sop.id || t.title.toLowerCase() === sop.title.toLowerCase());
      if (!exists) {
        merged.push({
          id: `TODO-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sopId: sop.id,
          title: `[SOP Task] ${sop.title}`,
          description: sop.description || 'Mandatory protocol assignment',
          priority: sop.priority || 'Medium',
          completed: false,
          addedAt: new Date().toISOString()
        });
        updated = true;
      }
    });

    if (updated || currentTodos.length === 0) {
      localStorage.setItem(`realynk_todos_${user.userId}`, JSON.stringify(merged));
      setTodoList(merged);
    }
  }, [user, assignments]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current.querySelectorAll('.fade-item'), {
        y: 24, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out'
      });
    });
    return () => ctx.revert();
  }, []);

  const saveTodos = (newTodos) => {
    setTodoList(newTodos);
    if (user) {
      localStorage.setItem(`realynk_todos_${user.userId}`, JSON.stringify(newTodos));
    }
  };

  const toggleTodo = (id) => {
    const updated = todoList.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTodos(updated);
  };

  const deleteTodo = (id) => {
    saveTodos(todoList.filter(t => t.id !== id));
  };

  const addTodo = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: `TODO-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: 'Personal shift goal',
      priority: 'Normal',
      completed: false,
      addedAt: new Date().toISOString()
    };
    saveTodos([newTask, ...todoList]);
    setNewTaskTitle('');
  };

  const completedCount = todoList.filter(t => t.completed).length;
  const progressPercent = todoList.length > 0 ? Math.round((completedCount / todoList.length) * 100) : 0;

  return (
    <div ref={containerRef}>
      {/* Header */}
      <div className="fade-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            My Assignments & Daily To-Do Checklist
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '4px 0 0', fontWeight: 500 }}>
            Mandatory department protocols auto-synced to your interactive checklist
          </p>
        </div>
        <div style={{ padding: '8px 16px', borderRadius: 20, background: 'rgba(5, 77, 175,0.12)', color: '#054daf', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} /> Auto-Sync Enabled
        </div>
      </div>

      {/* Progress Card */}
      <div className="fade-item card glass" style={{ padding: 24, borderRadius: 24, marginBottom: 28, background: 'linear-gradient(135deg, #033373, #054daf)', color: 'white', boxShadow: '0 12px 32px rgba(5, 77, 175,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.9 }}>
              Daily Shift Progress
            </span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '4px 0 0' }}>
              {completedCount} of {todoList.length} Tasks Completed
            </h2>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>
            {progressPercent}%
          </div>
        </div>
        <div style={{ width: '100%', height: 12, background: 'rgba(255,255,255,0.2)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: '#6ee7b7', borderRadius: 10, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
        </div>
      </div>

      {/* Add Task Input */}
      <form onSubmit={addTodo} className="fade-item card glass" style={{ padding: 20, borderRadius: 20, marginBottom: 28, display: 'flex', gap: 12, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Add a custom personal shift task or reminder..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          style={{
            flex: 1, padding: '14px 18px', borderRadius: 14, border: '1px solid #cbd5e1',
            fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', outline: 'none'
          }}
        />
        <button
          type="submit"
          style={{
            padding: '14px 24px', borderRadius: 14, background: '#054daf', color: 'white',
            border: 'none', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(5, 77, 175,0.3)'
          }}
        >
          <Plus size={18} /> Add Task
        </button>
      </form>

      {/* To-Do List Items */}
      <div className="fade-item card glass" style={{ padding: 28, borderRadius: 24 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckSquare color="#054daf" /> Interactive Shift Checklist
        </h2>

        {todoList.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            <p style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>No tasks in your checklist yet.</p>
            <p style={{ fontSize: '0.85rem', margin: '4px 0 0' }}>SOP protocols assigned by your administrator will automatically populate here!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {todoList.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleTodo(item.id)}
                style={{
                  padding: '16px 20px', borderRadius: 16, cursor: 'pointer',
                  background: item.completed ? '#f8fafc' : 'white',
                  border: item.completed ? '1px solid #e2e8f0' : '1.5px solid #bfdbfe',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleTodo(item.id); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}
                  >
                    {item.completed ? <CheckSquare size={22} color="#10b981" /> : <Square size={22} color="#94a3b8" />}
                  </button>
                  <div>
                    <span style={{
                      fontWeight: 800, fontSize: '0.98rem',
                      color: item.completed ? '#94a3b8' : '#0f172a',
                      textDecoration: item.completed ? 'line-through' : 'none',
                      display: 'block'
                    }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'block', marginTop: 3 }}>
                      {item.description}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {item.sopId && (
                    <span style={{ padding: '4px 10px', borderRadius: 10, background: 'rgba(5, 77, 175,0.1)', color: '#054daf', fontWeight: 800, fontSize: '0.72rem' }}>
                      SOP Protocol
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteTodo(item.id); }}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 6, opacity: 0.6, transition: 'opacity 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
