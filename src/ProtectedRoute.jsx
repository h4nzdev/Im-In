import { Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

export const ProtectedRoute = ({ element, requireAdmin }) => {
  const token = useAuthStore((s) => s.token);
  const isAdmin = useAuthStore((s) => s.user?.role === 'Admin');

  if (!token) return <Navigate to="/login" />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" />;
  return element;
};
