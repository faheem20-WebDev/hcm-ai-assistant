import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import ErrorBox from '../components/ErrorBox';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data?.user) {
          setUser(res.data.user);
          setPhone(res.data.user.phone || '');
          setAddress(res.data.user.address || '');
        }
      } catch {
        // Fall back to context
      }
    };
    loadProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.patch('/me/profile', { phone, address });
      setSuccess(true);
      if (user) {
        setUser({ ...user, phone, address });
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '640px', animation: 'fadeIn 0.25s ease' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-info">
          <h1>Personal Profile</h1>
          <p>View employee details and update your personal contact information.</p>
        </div>
      </div>

      <ErrorBox error={error} />

      {success && (
        <div
          style={{
            backgroundColor: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            color: 'var(--success)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          ✓ Profile details successfully updated.
        </div>
      )}

      {/* User Hero Card */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)'
        }}
      >
        <div
          className="avatar"
          style={{ width: '60px', height: '60px', fontSize: '1.35rem', flexShrink: 0, boxShadow: '0 4px 12px rgba(91, 91, 214, 0.25)' }}
        >
          {initials}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{user?.name || 'User Profile'}</h2>
            <span className="badge badge-active" style={{ textTransform: 'capitalize' }}>
              {user?.role || 'User'}
            </span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            {user?.email || '—'}
          </div>
        </div>
      </div>

      {/* Employment Details */}
      <div className="card">
        <h3 style={{ margin: '0 0 1.25rem 0' }}>Employment Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Full Name
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem', marginTop: '0.15rem', display: 'block' }}>
              {user?.name || '-'}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Email Address
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem', marginTop: '0.15rem', display: 'block' }}>
              {user?.email || '-'}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              System Role
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem', marginTop: '0.15rem', display: 'block', textTransform: 'capitalize' }}>
              {user?.role || '-'}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Employee ID
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem', marginTop: '0.15rem', display: 'block' }}>
              {user?.employeeId || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div className="card">
        <h3 style={{ margin: '0 0 1.25rem 0' }}>Contact Details (Self-Service)</h3>
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
              className="input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
              Residential Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House #, Street, City"
              rows={3}
              className="textarea"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
          >
            {loading ? 'Saving...' : 'Save Contact Details'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
