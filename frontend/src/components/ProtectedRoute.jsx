import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading, needsSetup } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading fullScreen message="Authenticating session..." />;
  }

  if (needsSetup) {
    return <Navigate to="/setup" replace />;
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
