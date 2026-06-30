import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Clock, Calendar, BarChart2, Briefcase, FileText, UserCheck, Users, BookOpen } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function BottomNav() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'Admin';

  const userLinks = [
    { to: '/',          icon: LayoutDashboard, label: 'Home'      },
    { to: '/assignments', icon: BookOpen,      label: 'Tasks'     },
    { to: '/logs',      icon: Clock,           label: 'Logs'      },
    { to: '/calendar',  icon: Calendar,        label: 'Schedule'  },
  ];

  const adminLinks = [
    { to: '/admin',             icon: LayoutDashboard, label: 'Admin' },
    { to: '/admin/employees',   icon: Users,           label: 'Staff' },
    { to: '/admin/assignments', icon: BookOpen,        label: 'SOPs'  },
    { to: '/admin/approvals',   icon: UserCheck,       label: 'Approvals' },
  ];

  const links = isAdmin ? adminLinks : userLinks;
  const isActive = (to) => to === '/' ? location.pathname === '/' : location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <nav className="bottom-nav" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(15,23,42,0.08)',
      boxShadow: '0 -4px 20px rgba(15,23,42,0.04)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      <div style={{ display: 'flex', width: '100%', height: 64 }}>
        {links.map(({ to, icon: Icon, label }) => {
          const active = isActive(to);
          return (
            <Link key={to} to={to} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 3, textDecoration: 'none',
              color: active ? '#2563eb' : '#64748b',
              transition: 'all 0.2s', position: 'relative'
            }}>
              <div style={{
                padding: '4px 16px', borderRadius: 16,
                background: active ? 'rgba(37,99,235,0.12)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}>
                <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: active ? 800 : 500, letterSpacing: '0.01em' }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
