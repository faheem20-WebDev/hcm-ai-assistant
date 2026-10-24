import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBox from '../components/ErrorBox';

const Setup = () => {
  const { completeSetup } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    adminName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await completeSetup(formData);
      navigate('/login', { state: { message: 'Setup completed successfully. Please sign in.' } });
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to complete initial system setup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f172a',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '2rem',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.5rem' }}>Initial Setup</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            Initialize HCM Lite company settings and primary administrator account.
          </p>
        </div>

        <ErrorBox error={error} />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
              Company Name
            </label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Acme Corp"
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
              Administrator Name
            </label>
            <input
              type="text"
              required
              value={formData.adminName}
              onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
              placeholder="System Administrator"
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
              Admin Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@company.com"
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
              Admin Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.75rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Initializing System...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Setup;
