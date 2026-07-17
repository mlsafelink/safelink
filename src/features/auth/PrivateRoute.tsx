import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function PrivateRoute() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <p>Cargando sesión...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
