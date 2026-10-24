import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Loading from './components/Loading';

import Setup from './pages/Setup';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Organization from './pages/Organization';
import HrUsers from './pages/HrUsers';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Leave from './pages/Leave';
import Payroll from './pages/Payroll';
import Payslips from './pages/Payslips';
import Profile from './pages/Profile';
import Announcements from './pages/Announcements';
import Audit from './pages/Audit';
import AIAssistant from './pages/AIAssistant';

const PublicRoute = ({ children }) => {
  const { user, token } = useAuth();
  if (token && user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function AppRoutes() {
  const { loading, needsSetup } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading fullScreen message="Checking system setup..." />;
  }

  if (needsSetup && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  if (!needsSetup && location.pathname === '/setup') {
    return <Navigate to="/login" replace />;
  }
  return (
    <Routes>
      <Route
        path="/setup"
        element={<Setup />}
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/organization"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Organization />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr-users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <HrUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hr']}>
              <Employees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hr', 'employee']}>
              <Attendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leave"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hr', 'employee']}>
              <Leave />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payroll"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hr']}>
              <Payroll />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payslips"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <Payslips />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcements"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hr', 'employee']}>
              <Announcements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Audit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hr', 'employee']}>
              <AIAssistant />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
