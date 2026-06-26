import { useEffect, useRef, useState } from 'react';
import { Outlet, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { LogOut, LayoutDashboard, Calendar, Shield, Briefcase, FileText, Clock, BarChart2, UserCheck, Smartphone, Download, X, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import BottomNav from './BottomNav';
import realynkLogo from '../assets/realynk.png';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, logout } = useAuthStore();
  const sidebarRef = useRef();
  const [showBanner, setShowBanner] = useState(() => !localStorage.getItem('realynk_app_installed'));
  const [showModal, setShowModal] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(sidebarRef.current, { x: -20, opacity: 0, duration: 0.5, ease: 'power3.out' });
    });
    return () => ctx.revert();
  }, []);

  if (!token) return <Navigate to="/login" replace />;

  const isAdmin = user?.role === 'Admin';

  const userLinks = [
    { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/logs',      icon: Clock,           label: 'Logs'      },
    { to: '/calendar',  icon: Calendar,        label: 'Schedule'  },
    { to: '/leaves',    icon: Briefcase,       label: 'Leaves'    },
    { to: '/analytics', icon: BarChart2,       label: 'Analytics' },
  ];
  const adminLinks = [
    { to: '/admin',           icon: Shield,    label: 'Overview'  },
    { to: '/admin/approvals', icon: UserCheck, label: 'Approvals' },
    { to: '/calendar',        icon: Calendar,  label: 'Schedule'  },
    { to: '/admin/logs',      icon: Clock,     label: 'Logs'      },
    { to: '/admin/leaves',    icon: FileText,  label: 'Leaves'    },
  ];
  const links = isAdmin ? adminLinks : userLinks;

  const isActive = (to) => to === '/' ? location.pathname === '/' : location.pathname === to || location.pathname.startsWith(to + '/');

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* Desktop left sidebar */}
      <aside ref={sidebarRef} className="sidebar glass" style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 240, zIndex: 50,
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(15,23,42,0.08)', borderLeft: 'none', borderTop: 'none', borderBottom: 'none',
        flexDirection: 'column', padding: '24px 16px', borderRadius: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, paddingLeft: 8 }}>
          <img src={realynkLogo} alt="Realynk Logo" style={{ height: 34, width: 'auto' }} />
          <span style={{ fontSize: 24, fontWeight: 800, color: '#2563eb', letterSpacing: '-0.5px' }}>
            Realynk
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {links.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12,
              color: isActive(to) ? '#2563eb' : '#64748b',
              background: isActive(to) ? 'rgba(59,130,246,0.12)' : 'transparent',
              textDecoration: 'none', fontSize: '0.92rem', fontWeight: isActive(to) ? 700 : 500, transition: 'all 0.2s',
              boxShadow: isActive(to) ? '0 2px 12px rgba(59,130,246,0.08)' : 'none'
            }}>
              <Icon size={18} color={isActive(to) ? '#2563eb' : '#64748b'} /> {label}
            </Link>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid rgba(15,23,42,0.08)', paddingTop: 16, marginTop: 16 }}>
          <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', padding: 8, borderRadius: 12, marginBottom: 6, transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,23,42,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 }}>
              {user?.name?.[0] || '?'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ color: '#0f172a', fontSize: '0.88rem', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
              <p style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, margin: 0 }}>{user?.role}</p>
            </div>
          </Link>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none',
            cursor: 'pointer', color: '#dc2626', padding: '10px 12px', borderRadius: 12, fontSize: '0.88rem', fontWeight: 600,
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top header */}
      <nav className="glass top-header" style={{ position: 'sticky', top: 0, zIndex: 50, borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
        <div style={{ padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={realynkLogo} alt="Realynk Logo" style={{ height: 28, width: 'auto' }} />
            <span style={{ fontSize: 22, fontWeight: 800, color: '#2563eb', flexShrink: 0 }}>
              Realynk
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Employee'}
              </span>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.88rem', fontWeight: 800, color: 'white', cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                {user?.name?.[0] || '?'}
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Center Main Content */}
      <div className="layout-content-area" style={{ minHeight: '100vh' }}>
        <main className="main-content" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 28px', minHeight: 'calc(100vh - 60px)', width: '100%' }}>
          <Outlet context={{ openInstallModal: () => setShowModal(true) }} />
        </main>
      </div>

      {/* Global Floating App Install Popup Banner */}
      {showBanner && (
        <div className="card glass" style={{
          position: 'fixed', bottom: 76, left: 16, right: 16, zIndex: 90, maxWidth: 460, margin: '0 auto',
          background: '#0f172a', color: 'white', padding: '14px 18px', borderRadius: 20,
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Smartphone size={22} color="white" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '0.88rem' }}>Install Realynk App</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>1-tap instant check-ins & offline roster</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setShowModal(true)} style={{
              padding: '8px 16px', borderRadius: 10, background: '#2563eb', color: 'white', border: 'none',
              fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(37,99,235,0.4)'
            }}>
              Install
            </button>
            <button onClick={() => setShowBanner(false)} style={{
              background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4
            }}>
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Global Install App Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 110,
          background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}
        onClick={() => setShowModal(false)}
        >
          <div className="card glass" style={{
            width: '100%', maxWidth: 420, borderRadius: 28, padding: 32, background: 'white',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', textAlign: 'center', position: 'relative'
          }}
          onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setShowModal(false)} style={{
              position: 'absolute', top: 20, right: 20, background: '#f1f5f9', border: 'none',
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748b'
            }}>
              <X size={16} />
            </button>

            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(37,99,235,0.35)' }}>
              <Smartphone size={32} />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
              Install Realynk App
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 24px', lineHeight: 1.5 }}>
              Add Realynk Enterprise Roster to your home screen for instant 1-tap biometric punches and real-time offline schedule access.
            </p>

            {installed ? (
              <div style={{ padding: 16, borderRadius: 16, background: 'rgba(59,130,246,0.12)', color: '#2563eb', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <CheckCircle2 size={20} /> App Successfully Installed!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => {
                    setInstalled(true);
                    localStorage.setItem('realynk_app_installed', 'true');
                    setShowBanner(false);
                    setTimeout(() => setShowModal(false), 2000);
                  }}
                  style={{
                    width: '100%', padding: '14px 24px', borderRadius: 16, background: '#2563eb',
                    color: 'white', fontWeight: 800, fontSize: '0.95rem', border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(37,99,235,0.3)', transition: 'all 0.2s'
                  }}
                >
                  Add to Home Screen
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    width: '100%', padding: '12px 24px', borderRadius: 16, background: 'transparent',
                    color: '#64748b', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer'
                  }}
                >
                  Maybe Later
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
