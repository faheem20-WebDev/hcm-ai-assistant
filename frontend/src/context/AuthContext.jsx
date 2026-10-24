import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('hcm_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('hcm_token') || null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkSetupStatus = async () => {
    try {
      const res = await api.get('/setup/status');
      setNeedsSetup(Boolean(res.data?.needsSetup));
    } catch {
      setNeedsSetup(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await checkSetupStatus();
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('hcm_user', JSON.stringify(res.data.user));
          }
        } catch {
          // Token invalid or expired, interceptor handles 401
        }
      }
      setLoading(false);
    };
    init();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('hcm_token', receivedToken);
    localStorage.setItem('hcm_user', JSON.stringify(receivedUser));
    return receivedUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hcm_token');
    localStorage.removeItem('hcm_user');
  };

  const changePassword = async (oldPassword, newPassword) => {
    const res = await api.post('/auth/change-password', { oldPassword, newPassword });
    if (user) {
      const updatedUser = { ...user, mustChangePassword: false };
      setUser(updatedUser);
      localStorage.setItem('hcm_user', JSON.stringify(updatedUser));
    }
    return res.data;
  };

  const completeSetup = async (setupData) => {
    const res = await api.post('/setup', setupData);
    setNeedsSetup(false);
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        needsSetup,
        login,
        logout,
        changePassword,
        completeSetup,
        checkSetupStatus,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
