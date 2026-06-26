import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, X, MapPin, Info, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/db';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView() {
  const { user } = useAuthStore();
  const [logs] = useState(() => db.getUserLogs(user.userId));
  const [leaves] = useState(() => db.getUserLeaves(user.userId));

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const containerRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Use fromTo to prevent React StrictMode GSAP opacity trap
      gsap.fromTo(
        containerRef.current.querySelectorAll('.cal-day'),
        { scale: 0.94, opacity: 0, y: 10 },
        { scale: 1, opacity: 1, y: 0, duration: 0.35, stagger: 0.01, ease: 'power2.out' }
      );
    });
    return () => ctx.revert();
  }, [currentDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getDayEvents = (dayNum) => {
    const targetDate = new Date(year, month, dayNum);
    const dateStr = targetDate.toLocaleDateString('en-US');
    const events = [];

    // Weekend check
    const dayOfWeek = targetDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      events.push({ type: 'weekend', title: 'Rest Day', color: '#64748b', bg: 'rgba(148,163,184,0.18)' });
    }

    // Shift check
    const dayLogs = logs.filter(l => new Date(l.timestamp).toLocaleDateString('en-US') === dateStr);
    if (dayLogs.length > 0) {
      const isIn = dayLogs.some(l => l.type === 'IN');
      events.push({
        type: 'shift',
        title: isIn ? 'Shift Recorded' : 'Punched',
        color: '#1d4ed8',
        bg: 'rgba(59,130,246,0.22)'
      });
    }

    // Leave check
    leaves.forEach(lv => {
      const s = new Date(lv.startDate);
      const e = new Date(lv.endDate);
      s.setHours(0,0,0,0); e.setHours(23,59,59,999);
      if (targetDate >= s && targetDate <= e) {
        events.push({
          type: 'leave',
          title: lv.leaveType,
          color: lv.status === 'Approved' ? '#1d4ed8' : '#b45309',
          bg: lv.status === 'Approved' ? 'rgba(37,99,235,0.18)' : 'rgba(245,158,11,0.18)'
        });
      }
    });

    return events;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const blanks = Array.from({ length: firstDayIndex });
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isToday = (d) => {
    const today = new Date();
    return d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  return (
    <div ref={containerRef}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            Work Schedule & Roster
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '4px 0 0', fontWeight: 500 }}>
            Monthly attendance roster, shift allocations, and leave bookings
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={goToToday} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(15,23,42,0.15)', background: 'white', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', color: '#0f172a', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            Today
          </button>
          <div style={{ display: 'flex', background: 'white', border: '1px solid rgba(15,23,42,0.15)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <button onClick={prevMonth} style={{ padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer', borderRight: '1px solid rgba(15,23,42,0.1)' }}><ChevronLeft size={18} color="#0f172a" /></button>
            <span style={{ padding: '8px 16px', fontWeight: 800, fontSize: '0.92rem', color: '#0f172a', minWidth: 130, textAlign: 'center' }}>
              {monthNames[month]} {year}
            </span>
            <button onClick={nextMonth} style={{ padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer', borderLeft: '1px solid rgba(15,23,42,0.1)' }}><ChevronRight size={18} color="#0f172a" /></button>
          </div>
        </div>
      </div>

      {/* Calendar Card Grid */}
      <div className="card glass cal-card" style={{ width: '100%', maxWidth: '100%', boxShadow: 'none' }}>
        <div style={{ width: '100%' }}>
          {/* Days Header */}
          <div className="cal-grid" style={{ marginBottom: 14, textAlign: 'center' }}>
            {DAYS.map(day => (
              <div key={day} style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 0' }}>
                {day.slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Cells Grid */}
          <div className="cal-grid">
            {blanks.map((_, i) => (
              <div key={`b_${i}`} className="cal-day" style={{ background: 'rgba(241,245,249,0.5)', border: '1px dashed rgba(15,23,42,0.08)' }} />
            ))}

            {monthDays.map(day => {
              const today = isToday(day);
              const events = getDayEvents(day);

              return (
                <div key={day} className="cal-day" onClick={() => setSelectedDay(day)} style={{
                  cursor: 'pointer',
                  background: today ? 'rgba(37,99,235,0.08)' : '#ffffff',
                  border: today ? '2px solid #2563eb' : '1px solid rgba(15,23,42,0.14)',
                  display: 'flex', flexDirection: 'column',
                  boxShadow: 'none', transition: 'all 0.15s', opacity: 1
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#2563eb'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = today ? '#2563eb' : 'rgba(15,23,42,0.14)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      color: today ? '#2563eb' : '#0f172a',
                      display: 'block'
                    }}>
                      {day}
                    </span>
                  </div>

                  {/* Event badges */}
                  <div className="cal-badges-area" style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, marginTop: 4 }}>
                    {events.map((ev, i) => (
                      <div key={i}>
                        <div className="cal-badge desktop-badge" style={{
                          color: ev.color, background: ev.bg, padding: '4px 8px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>
                          {ev.title}
                        </div>
                        <div className="mobile-dot" style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: ev.color === '#64748b' ? '#94a3b8' : ev.color,
                          margin: '0 auto'
                        }} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 24, marginTop: 22, justifyContent: 'center', flexWrap: 'wrap', fontSize: '0.86rem', fontWeight: 700, color: '#475569' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(59,130,246,0.35)', border: '1px solid #2563eb' }} /> Recorded Shift</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(37,99,235,0.35)', border: '1px solid #2563eb' }} /> Approved Leave</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(245,158,11,0.35)', border: '1px solid #d97706' }} /> Pending Leave</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(148,163,184,0.35)', border: '1px solid #64748b' }} /> Rest Day</div>
      </div>

      {/* Calendar Day Info Modal */}
      {selectedDay !== null && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
          background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}
        onClick={() => setSelectedDay(null)}
        >
          <div className="card glass" style={{
            width: '100%', maxWidth: 500, borderRadius: 28, padding: 28, background: 'white',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative',
            maxHeight: '90vh', overflowY: 'auto'
          }}
          onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setSelectedDay(null)} style={{
              position: 'absolute', top: 20, right: 20, background: '#f1f5f9', border: 'none',
              width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748b'
            }}>
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <CalIcon size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schedule Overview</span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {new Date(year, month, selectedDay).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </h2>
              </div>
            </div>

            {/* Events List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {getDayEvents(selectedDay).length === 0 && (
                <div style={{ padding: 20, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <Info size={28} color="#94a3b8" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <p style={{ margin: 0, fontWeight: 700, color: '#475569', fontSize: '0.95rem' }}>Standard Working Day</p>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.82rem' }}>No biometric attendance logs or leave requests recorded for this date.</p>
                </div>
              )}

              {/* Weekend */}
              {getDayEvents(selectedDay).some(ev => ev.type === 'weekend') && (
                <div style={{ padding: 16, borderRadius: 16, background: 'rgba(148,163,184,0.12)', border: '1px solid rgba(148,163,184,0.25)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Sparkles size={20} color="#64748b" />
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, color: '#334155', fontSize: '0.95rem' }}>Rest Day / Weekend</p>
                    <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.8rem' }}>No scheduled shift requirements.</p>
                  </div>
                </div>
              )}

              {/* Shift / Punches */}
              {logs.filter(l => new Date(l.timestamp).toLocaleDateString('en-US') === new Date(year, month, selectedDay).toLocaleDateString('en-US')).map((log) => (
                <div key={log.logId} style={{ padding: 16, borderRadius: 16, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 8, background: log.type === 'IN' ? '#2563eb' : '#dc2626', color: 'white', fontWeight: 800, fontSize: '0.72rem' }}>
                      BIOMETRIC {log.type}
                    </span>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#475569', fontFamily: 'monospace' }}>
                    <MapPin size={14} color="#2563eb" /> {log.latitude ? `${log.latitude.toFixed(4)}, ${log.longitude.toFixed(4)}` : 'GPS N/A'}
                  </div>
                </div>
              ))}

              {/* Leaves */}
              {leaves.filter(lv => {
                const s = new Date(lv.startDate); const e = new Date(lv.endDate);
                s.setHours(0,0,0,0); e.setHours(23,59,59,999);
                const cur = new Date(year, month, selectedDay);
                return cur >= s && cur <= e;
              }).map(lv => (
                <div key={lv.leaveId} style={{ padding: 16, borderRadius: 16, background: lv.status === 'Approved' ? 'rgba(37,99,235,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${lv.status === 'Approved' ? 'rgba(37,99,235,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, color: lv.status === 'Approved' ? '#1d4ed8' : '#b45309', fontSize: '0.92rem' }}>{lv.leaveType}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: lv.status === 'Approved' ? '#2563eb' : '#f59e0b', color: 'white' }}>{lv.status}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569' }}>Reason: {lv.reason || 'No details provided'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
