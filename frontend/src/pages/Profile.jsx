import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import ErrorBox from '../components/ErrorBox';

const Profile = () => {
  const { user } = useAuth();
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.patch('/me/profile', { phone, address });
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
          Personal Profile
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
          View employee details and update your personal contact information.
        </p>
      </div>

      <ErrorBox error={error} />

      {success && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#15803d',
          padding: '0.75rem',
          borderRadius: '6px',
          fontSize: '0.85rem',
          marginBottom: '1rem'
        }}>
          Profile details successfully updated.
        </div>
      )}

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#0f172a' }}>Employment Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Full Name</span>
            <span style={{ fontWeight: '600', color: '#1e293b' }}>{user?.name || '-'}</span>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Email Address</span>
            <span style={{ fontWeight: '600', color: '#1e293b' }}>{user?.email || '-'}</span>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Role</span>
            <span style={{ fontWeight: '600', color: '#1e293b', textTransform: 'capitalize' }}>{user?.role || '-'}</span>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Employee ID</span>
            <span style={{ fontWeight: '600', color: '#1e293b' }}>{user?.employeeId || '-'}</span>
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        padding: '1.5rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#0f172a' }}>Contact Details (Self-Service)</h3>
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
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
              Residential Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House #, Street, City"
              rows={3}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              alignSelf: 'flex-start',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.65rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Saving...' : 'Save Contact Details'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
