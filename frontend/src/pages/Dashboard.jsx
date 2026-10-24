import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Loading from '../components/Loading';
import ErrorBox from '../components/ErrorBox';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = user?.role === 'admin' 
        ? '/dashboard/admin' 
        : user?.role === 'hr' 
        ? '/dashboard/hr' 
        : '/dashboard/me';
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user?.role]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            Welcome back, {user?.name}
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            Here is your HCM Lite {user?.role?.toUpperCase()} overview for today.
          </p>
        </div>
      </div>

      {loading && <Loading message="Loading dashboard metrics..." />}
      {error && <ErrorBox error={error} onRetry={fetchDashboard} />}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              Role Scope
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginTop: '0.25rem' }}>
              {user?.role?.toUpperCase()}
            </div>
          </div>

          <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              Timezone
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', marginTop: '0.4rem' }}>
              Asia/Karachi (PKT)
            </div>
          </div>

          <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              Status
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#16a34a', marginTop: '0.4rem' }}>
              Active
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
