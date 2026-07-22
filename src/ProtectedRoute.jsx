import { Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

export const ProtectedRoute = ({ element, requireAdmin, allowSuccessLead, preventAdmin }) => {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'Admin';
  const isSuccessLead = user?.role === 'Success Lead';

  if (!token) return <Navigate to="/login" />;
  if (requireAdmin && !allowSuccessLead && !isAdmin) return <Navigate to="/" />;
  if (requireAdmin && allowSuccessLead && !isAdmin && !isSuccessLead) return <Navigate to="/" />;
  if (preventAdmin && isAdmin) return <Navigate to="/admin" />;
  return element;
};
