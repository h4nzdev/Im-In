import { useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { LogOut, LayoutDashboard, Calendar, Shield, Briefcase, FileText, Clock, BarChart2, UserCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import BottomNav from './BottomNav';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, logout } = useAuthStore();
  const sidebarRef = useRef();

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
        <span style={{ fontSize: 24, fontWeight: 800, background: 'linear-gradient(135deg,#10b981,#059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 32, paddingLeft: 8, letterSpacing: '-0.5px' }}>
          Im'In
        </span>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {links.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12,
              color: isActive(to) ? '#047857' : '#64748b',
              background: isActive(to) ? 'rgba(16,185,129,0.12)' : 'transparent',
              textDecoration: 'none', fontSize: '0.92rem', fontWeight: isActive(to) ? 700 : 500, transition: 'all 0.2s',
              boxShadow: isActive(to) ? '0 2px 12px rgba(16,185,129,0.08)' : 'none'
            }}>
              <Icon size={18} color={isActive(to) ? '#059669' : '#64748b'} /> {label}
            </Link>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid rgba(15,23,42,0.08)', paddingTop: 16, marginTop: 16 }}>
          <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', padding: 8, borderRadius: 12, marginBottom: 6, transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,23,42,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700, color: 'white', flexShrink: 0, boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}>
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
          <span style={{ fontSize: 22, fontWeight: 800, background: 'linear-gradient(135deg,#10b981,#059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', flexShrink: 0 }}>
            Im'In
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/profile" style={{ textDecoration: 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'white', cursor: 'pointer' }}>
                {user?.name?.[0] || '?'}
              </div>
            </Link>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 6, borderRadius: 8, transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color='#0f172a'} onMouseLeave={e => e.target.style.color='#64748b'}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Center Main Content */}
      <div className="layout-content-area" style={{ minHeight: '100vh' }}>
        <main className="main-content" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 28px', minHeight: 'calc(100vh - 60px)', width: '100%' }}>
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
