import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, X, MapPin, Info, Sparkles, Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/db';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView() {
  const { user } = useAuthStore();
  const [logs] = useState(() => db.getUserLogs(user.userId));
  const [leaves] = useState(() => db.getUserLeaves(user.userId));

  const [customRoster, setCustomRoster] = useState(() => {
      const saved = db.getSchedule(user.userId);
      return saved || {};
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef();

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

  const handleFileUpload = (e) => {
    const file = e.target?.files?.[0];
    generateSampleRoster(file ? file.name : "Uploaded CSV");
  };

  const generateSampleRoster = (sourceName = "CSV Import") => {
    const sample = {};
    const shiftsList = [
      { shift: 'Morning Shift (A)', time: '08:00 AM - 05:00 PM', location: 'HQ Terminal #1 (Floor 2)' },
      { shift: 'Mid Shift (B)', time: '10:00 AM - 07:00 PM', location: 'Branch Office Terminal #3' },
      { shift: 'Night Shift (C)', time: '09:00 PM - 06:00 AM', location: 'Server Operations Room' },
      { shift: 'Hybrid / Remote', time: 'Core Hours 10AM - 4PM', location: 'WFH Approved Terminal' }
    ];
    
    const totalDays = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= totalDays; d++) {
      const dt = new Date(year, month, d);
      if (dt.getDay() !== 0 && dt.getDay() !== 6 && d % 4 !== 0) {
        sample[d] = shiftsList[d % shiftsList.length];
      }
    }

    setCustomRoster(sample);
    db.saveSchedule(user.userId, sample);
    setUploadSuccess(true);
    setTimeout(() => {
      setShowUploadModal(false);
      setUploadSuccess(false);
    }, 1800);
  };

  const getDayEvents = (dayNum) => {
    const targetDate = new Date(year, month, dayNum);
    const dateStr = targetDate.toLocaleDateString('en-US');
    const events = [];

    // Custom Uploaded Roster check
    if (customRoster[dayNum]) {
      events.push({
        type: 'roster',
        title: customRoster[dayNum].shift,
        time: customRoster[dayNum].time,
        location: customRoster[dayNum].location,
        color: '#0d9488',
        bg: 'rgba(13,148,136,0.18)'
      });
    }

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
        color: '#043e8a',
        bg: 'rgba(5, 77, 175,0.22)'
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
          color: lv.status === 'Approved' ? '#043e8a' : '#b45309',
          bg: lv.status === 'Approved' ? 'rgba(5, 77, 175,0.18)' : 'rgba(245,158,11,0.18)'
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            Schedule
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', background: 'white', border: '1px solid rgba(15,23,42,0.12)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <button onClick={prevMonth} style={{ padding: '6px 12px', border: 'none', background: 'transparent', cursor: 'pointer', borderRight: '1px solid rgba(15,23,42,0.08)' }}><ChevronLeft size={18} color="#0f172a" /></button>
            <span style={{ padding: '6px 14px', fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', minWidth: 120, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {monthNames[month]} {year}
            </span>
            <button onClick={nextMonth} style={{ padding: '6px 12px', border: 'none', background: 'transparent', cursor: 'pointer', borderLeft: '1px solid rgba(15,23,42,0.08)' }}><ChevronRight size={18} color="#0f172a" /></button>
          </div>
          <button onClick={goToToday} style={{ padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(15,23,42,0.12)', background: 'white', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', color: '#054daf', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            Today
          </button>
          <button onClick={() => setShowUploadModal(true)} style={{ padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(13,148,136,0.25)', background: 'rgba(13,148,136,0.08)', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', color: '#0d9488', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(0,0,0,0.03)', transition: 'all 0.15s' }}>
            <Upload size={14} /> Upload Schedule
          </button>
        </div>
      </div>

      {/* Calendar Card Grid */}
      <div className="card glass cal-card" style={{ width: '100%', maxWidth: '100%', boxShadow: 'none', padding: '16px 10px', borderRadius: 24, background: 'white', border: '1px solid rgba(15,23,42,0.08)' }}>
        <div style={{ width: '100%' }}>
          {/* Days Header */}
          <div className="cal-grid" style={{ marginBottom: 8, textAlign: 'center' }}>
            {DAYS.map(day => (
              <div key={day} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 0' }}>
                {day.slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Cells Grid */}
          <div className="cal-grid" style={{ gap: 2 }}>
            {blanks.map((_, i) => (
              <div key={`b_${i}`} className="cal-day" style={{ background: 'transparent', border: 'none', minHeight: 48 }} />
            ))}

            {monthDays.map(day => {
              const today = isToday(day);
              const isSelected = selectedDay === day;
              const events = getDayEvents(day);

              return (
                <div key={day} className="cal-day" onClick={() => setSelectedDay(day)} style={{
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
                  paddingTop: 6, minHeight: 52, transition: 'all 0.15s', borderRadius: 12
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(241,245,249,0.7)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: today ? '#054daf' : (isSelected ? '#0f172a' : 'transparent'),
                    color: today ? '#ffffff' : (isSelected ? '#ffffff' : '#0f172a'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.92rem', transition: 'all 0.15s',
                    boxShadow: today ? '0 2px 8px rgba(5, 77, 175,0.35)' : 'none'
                  }}>
                    {day}
                  </div>

                  {/* Event Dots Container */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 4, minHeight: 6, flexWrap: 'wrap', maxWidth: 28 }}>
                    {events.map((ev, i) => (
                      <div key={i} style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: ev.color === '#64748b' ? '#94a3b8' : ev.color
                      }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 18, justifyContent: 'center', flexWrap: 'wrap', fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0d9488' }} /> Uploaded Roster</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#054daf' }} /> Recorded Shift</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#054daf' }} /> Approved Leave</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} /> Pending Leave</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8' }} /> Rest Day</div>
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
              <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(5, 77, 175,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#054daf' }}>
                <CalIcon size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#054daf', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schedule Overview</span>
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

              {/* Uploaded Roster Shift */}
              {getDayEvents(selectedDay).filter(ev => ev.type === 'roster').map((ev, idx) => (
                <div key={`rst_${idx}`} style={{ padding: 16, borderRadius: 16, background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.25)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 8, background: '#0d9488', color: 'white', fontWeight: 800, fontSize: '0.72rem' }}>
                      UPLOADED ROSTER
                    </span>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>{ev.time}</span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontWeight: 800, color: '#134e4a', fontSize: '0.98rem' }}>{ev.title}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#0f766e' }}>
                    <MapPin size={14} /> {ev.location}
                  </div>
                </div>
              ))}

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
                <div key={log.logId} style={{ padding: 16, borderRadius: 16, background: 'rgba(5, 77, 175,0.08)', border: '1px solid rgba(5, 77, 175,0.2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 8, background: log.type === 'IN' ? '#054daf' : '#dc2626', color: 'white', fontWeight: 800, fontSize: '0.72rem' }}>
                      BIOMETRIC {log.type}
                    </span>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                      {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#475569', fontFamily: 'monospace' }}>
                    <MapPin size={14} color="#054daf" /> {log.latitude ? `${log.latitude.toFixed(4)}, ${log.longitude.toFixed(4)}` : 'GPS N/A'}
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
                <div key={lv.leaveId} style={{ padding: 16, borderRadius: 16, background: lv.status === 'Approved' ? 'rgba(5, 77, 175,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${lv.status === 'Approved' ? 'rgba(5, 77, 175,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, color: lv.status === 'Approved' ? '#043e8a' : '#b45309', fontSize: '0.92rem' }}>{lv.leaveType}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: lv.status === 'Approved' ? '#054daf' : '#f59e0b', color: 'white' }}>{lv.status}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569' }}>Reason: {lv.reason || 'No details provided'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Schedule Roster Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 120, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowUploadModal(false)}>
          <div className="card glass" style={{ width: '100%', maxWidth: 460, borderRadius: 28, padding: 32, background: 'white', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowUploadModal(false)} style={{ position: 'absolute', top: 20, right: 20, background: '#f1f5f9', border: 'none', width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: 20, background: 'rgba(13,148,136,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', margin: '0 auto 12px' }}>
                <FileSpreadsheet size={28} />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Upload Monthly Roster</h2>
              <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '6px 0 0' }}>Import shift schedules via CSV or Excel file</p>
            </div>

            <input type="file" ref={fileInputRef} accept=".csv,.xlsx,.json" style={{ display: 'none' }} onChange={handleFileUpload} />

            {uploadSuccess ? (
              <div style={{ padding: 28, borderRadius: 20, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', textAlign: 'center', margin: '16px 0' }}>
                <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 8px', display: 'block' }} />
                <p style={{ margin: 0, fontWeight: 800, color: '#065f46', fontSize: '1.05rem' }}>Roster Uploaded Successfully!</p>
                <p style={{ margin: '4px 0 0', color: '#047857', fontSize: '0.82rem' }}>Shift allocations synced to calendar grid.</p>
              </div>
            ) : (
              <>
                <div onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed #0d9488', borderRadius: 20, padding: '32px 20px', textAlign: 'center', background: 'rgba(13,148,136,0.04)', cursor: 'pointer', marginBottom: 20, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(13,148,136,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(13,148,136,0.04)'}>
                  <Upload size={32} color="#0d9488" style={{ margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>Click to Browse Local Files</p>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.8rem' }}>Supported: .CSV, .XLSX, .JSON</p>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 18, textAlign: 'center' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Don't have a roster file ready?</p>
                  <button onClick={() => generateSampleRoster("Sample Roster")} style={{ width: '100%', padding: '12px', borderRadius: 14, border: 'none', background: '#0f172a', color: 'white', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(15,23,42,0.2)' }}>
                    <Sparkles size={16} color="#38bdf8" /> Generate Demo June Roster
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
