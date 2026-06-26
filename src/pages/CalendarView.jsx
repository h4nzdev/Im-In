import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/db';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView() {
  const { user } = useAuthStore();
  const [logs] = useState(() => db.getUserLogs(user.userId));
  const [leaves] = useState(() => db.getUserLeaves(user.userId));

  const [currentDate, setCurrentDate] = useState(new Date());
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
        color: '#047857',
        bg: 'rgba(16,185,129,0.22)'
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            Work Schedule & Roster
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '4px 0 0', fontWeight: 500 }}>
            Monthly attendance roster, shift allocations, and leave bookings
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={goToToday} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(15,23,42,0.15)', background: 'white', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', color: '#0f172a', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            Today
          </button>
          <div style={{ display: 'flex', background: 'white', border: '1px solid rgba(15,23,42,0.15)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <button onClick={prevMonth} style={{ padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer', borderRight: '1px solid rgba(15,23,42,0.1)' }}><ChevronLeft size={18} color="#0f172a" /></button>
            <span style={{ padding: '8px 18px', fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', minWidth: 150, textAlign: 'center' }}>
              {monthNames[month]} {year}
            </span>
            <button onClick={nextMonth} style={{ padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer', borderLeft: '1px solid rgba(15,23,42,0.1)' }}><ChevronRight size={18} color="#0f172a" /></button>
          </div>
        </div>
      </div>

      {/* Calendar Card Grid */}
      <div className="card glass" style={{ padding: 26, borderRadius: 24, boxShadow: '0 8px 32px rgba(15,23,42,0.06)' }}>
        {/* Days Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, marginBottom: 14, textAlign: 'center' }}>
          {DAYS.map(day => (
            <div key={day} style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 0' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Cells Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
          {blanks.map((_, i) => (
            <div key={`b_${i}`} style={{ minHeight: 110, background: 'rgba(241,245,249,0.5)', borderRadius: 18, border: '1px dashed rgba(15,23,42,0.08)' }} />
          ))}

          {monthDays.map(day => {
            const today = isToday(day);
            const events = getDayEvents(day);

            return (
              <div key={day} className="cal-day" style={{
                minHeight: 110, padding: 14, borderRadius: 18,
                background: today ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(255,255,255,0.95))' : '#ffffff',
                border: today ? '2px solid #10b981' : '1px solid rgba(15,23,42,0.14)',
                display: 'flex', flexDirection: 'column', gap: 8,
                boxShadow: today ? '0 8px 24px rgba(16,185,129,0.18)' : '0 2px 10px rgba(15,23,42,0.03)',
                transition: 'all 0.15s', opacity: 1 // explicitly ensure opacity is 1
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(15,23,42,0.08)'; e.currentTarget.style.borderColor = today ? '#10b981' : '#059669'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = today ? '0 8px 24px rgba(16,185,129,0.18)' : '0 2px 10px rgba(15,23,42,0.03)'; e.currentTarget.style.borderColor = today ? '#10b981' : 'rgba(15,23,42,0.14)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: today ? 'white' : '#0f172a',
                    width: today ? 28 : 'auto', height: today ? 28 : 'auto', borderRadius: '50%',
                    background: today ? '#10b981' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {day}
                  </span>
                </div>

                {/* Event badges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
                  {events.map((ev, i) => (
                    <div key={i} style={{
                      padding: '4px 8px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 800,
                      color: ev.color, background: ev.bg,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      letterSpacing: '0.01em'
                    }}>
                      {ev.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 24, marginTop: 22, justifyContent: 'center', flexWrap: 'wrap', fontSize: '0.86rem', fontWeight: 700, color: '#475569' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(16,185,129,0.35)', border: '1px solid #059669' }} /> Recorded Shift</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(37,99,235,0.35)', border: '1px solid #2563eb' }} /> Approved Leave</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(245,158,11,0.35)', border: '1px solid #d97706' }} /> Pending Leave</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(148,163,184,0.35)', border: '1px solid #64748b' }} /> Rest Day</div>
      </div>
    </div>
  );
}
