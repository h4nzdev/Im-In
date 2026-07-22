/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Link, useRouteError } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import Layout from './components/Layout';

const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Leaves = lazy(() => import('./pages/Leaves'));
const AdminLeaves = lazy(() => import('./pages/AdminLeaves'));
const AdminPositions = lazy(() => import('./pages/AdminPositions'));
const Profile = lazy(() => import('./pages/Profile'));
const ClockIn = lazy(() => import('./pages/ClockIn'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Logs = lazy(() => import('./pages/Logs'));
const CalendarView = lazy(() => import('./pages/CalendarView'));
const AdminApprovals = lazy(() => import('./pages/AdminApprovals'));
const AdminEmployees = lazy(() => import('./pages/AdminEmployees'));
const AdminAssignments = lazy(() => import('./pages/AdminAssignments'));
const AdminGeofence = lazy(() => import('./pages/AdminGeofence'));
const UserAssignments = lazy(() => import('./pages/UserAssignments'));
const MyTeam = lazy(() => import('./pages/MyTeam'));
const LiveWorkforce = lazy(() => import('./pages/LiveWorkforce'));
const AdminPreRegistration = lazy(() => import('./pages/AdminPreRegistration'));
const AdminClients = lazy(() => import('./pages/AdminClients'));
const UserReports = lazy(() => import('./pages/UserReports'));

const Loading = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <p style={{ color: '#94a3b8', fontWeight: 600 }}>Loading Realynk...</p>
  </div>
);

const ErrorFallback = () => {
  const error = useRouteError();
  console.error("Route error:", error);
  const isNotFound = error?.status === 404 || error?.statusText === 'Not Found';
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', background: '#f1f5f9' }}>
      <div className="glass" style={{ padding: '40px 32px', borderRadius: 24, maxWidth: 520, width: '100%', boxShadow: '0 12px 40px rgba(15,23,42,0.08)' }}>
        <span style={{ fontSize: '3rem', display: 'block', marginBottom: 16 }}>{isNotFound ? '🧭' : '⚠️'}</span>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
          {isNotFound ? 'Page Not Found' : 'Application Error'}
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '0 0 20px', lineHeight: 1.5 }}>
          {isNotFound
            ? "We couldn't find the page you're looking for. It may have been moved or deleted."
            : (error?.message || error?.statusText || "An unexpected error occurred while loading this view.")}
        </p>
        {!isNotFound && error && (
          <pre style={{ textAlign: 'left', background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 10, fontSize: '0.75rem', overflowX: 'auto', maxHeight: 150, marginBottom: 20 }}>
            {error.message || error.toString()}
          </pre>
        )}
        <Link to="/" style={{ display: 'block', width: '100%', padding: '13px 24px', background: '#054daf', color: 'white', fontWeight: 700, borderRadius: 12, textDecoration: 'none', boxShadow: '0 4px 16px rgba(5, 77, 175,0.3)' }}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

const wrap = (element) => <Suspense fallback={<Loading />}>{element}</Suspense>;

export const router = createBrowserRouter([
  {
    path: '/login',
    element: wrap(<Login />),
    errorElement: <ErrorFallback />
  },
  {
    path: '/signup',
    element: wrap(<Signup />),
    errorElement: <ErrorFallback />
  },
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorFallback />,
    children: [
      {
        index: true,
        element: wrap(<ProtectedRoute element={<Dashboard />} />),
      },
      {
        path: 'team',
        element: wrap(<ProtectedRoute element={<MyTeam />} />),
      },
      {
        path: 'logs',
        element: wrap(<ProtectedRoute element={<Logs />} />),
      },
      {
        path: 'calendar',
        element: wrap(<ProtectedRoute element={<CalendarView />} />),
      },
      {
        path: 'leaves',
        element: wrap(<ProtectedRoute element={<Leaves />} />),
      },
      {
        path: 'assignments',
        element: wrap(<ProtectedRoute element={<UserAssignments />} />),
      },
      {
        path: 'admin',
        element: wrap(<ProtectedRoute element={<AdminDashboard />} requireAdmin />),
      },
      {
        path: 'admin/employees',
        element: wrap(<ProtectedRoute element={<AdminEmployees />} requireAdmin />),
      },
      {
        path: 'admin/approvals',
        element: wrap(<ProtectedRoute element={<AdminApprovals />} requireAdmin allowSuccessLead />),
      },
      {
        path: 'admin/live',
        element: wrap(<ProtectedRoute element={<LiveWorkforce />} requireAdmin />),
      },
      {
        path: 'admin/logs',
        element: wrap(<ProtectedRoute element={<Logs />} requireAdmin />),
      },
      {
        path: 'admin/leaves',
        element: wrap(<ProtectedRoute element={<AdminLeaves />} requireAdmin />),
      },
      {
        path: 'admin/positions',
        element: wrap(<ProtectedRoute element={<AdminPositions />} requireAdmin />),
      },
      {
        path: 'admin/assignments',
        element: wrap(<ProtectedRoute element={<AdminAssignments />} requireAdmin />),
      },
      {
        path: 'admin/geofence',
        element: wrap(<ProtectedRoute element={<AdminGeofence />} requireAdmin />),
      },
      {
        path: 'admin/pre-register',
        element: wrap(<ProtectedRoute element={<AdminPreRegistration />} requireAdmin />),
      },
      {
        path: 'admin/clients',
        element: wrap(<ProtectedRoute element={<AdminClients />} requireAdmin />),
      },
      {
        path: 'user-reports',
        element: wrap(<ProtectedRoute element={<UserReports />} />),
      },
      {
        path: 'profile',
        element: wrap(<ProtectedRoute element={<Profile />} />),
      },
      {
        path: 'clock',
        element: wrap(<ProtectedRoute element={<ClockIn />} />),
      },
      {
        path: 'analytics',
        element: wrap(<ProtectedRoute element={<Analytics />} />),
      },
      {
        path: '*',
        element: <ErrorFallback />
      }
    ],
  },
  {
    path: '*',
    element: <ErrorFallback />
  }
]);
