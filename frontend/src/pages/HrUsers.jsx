import React, { useState, useEffect } from 'react';
import api from '../api';
import Loading from '../components/Loading';
import Empty from '../components/Empty';
import ErrorBox from '../components/ErrorBox';

const HrUsers = () => {
  const [hrUsers, setHrUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Create Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Generated Temp Password Notification Box
  const [tempPassInfo, setTempPassInfo] = useState(null); // { userEmail, tempPassword, actionType }
  const [copied, setCopied] = useState(false);

  const fetchHrUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/users/hr');
      setHrUsers(res.data?.items || []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to fetch HR officers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHrUsers();
  }, []);

  const handleCreateHr = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post('/users/hr', { name, email });
      setSuccess(`HR Account created for ${email}.`);
      setTempPassInfo({
        userEmail: email,
        tempPassword: res.data?.password || res.data?.tempPassword || 'TempHr123!',
        actionType: 'Account Created'
      });
      setName('');
      setEmail('');
      setShowCreateModal(false);
      fetchHrUsers();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create HR account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async (id, userEmail) => {
    if (!window.confirm(`Are you sure you want to deactivate ${userEmail}?`)) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.patch(`/users/${id}/deactivate`);
      setSuccess(`User ${userEmail} deactivated.`);
      fetchHrUsers();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to deactivate HR user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (id, userEmail) => {
    if (!window.confirm(`Reset password for ${userEmail}? A temporary password will be generated.`)) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post(`/users/${id}/reset-password`);
      const tempPass = res.data?.tempPassword;
      setTempPassInfo({
        userEmail,
        tempPassword: tempPass,
        actionType: 'Password Reset'
      });
      setSuccess(`Temporary password generated for ${userEmail}.`);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to reset password.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (tempPassInfo?.tempPassword) {
      navigator.clipboard.writeText(tempPassInfo.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            HR Users Administration
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            Provision and manage Human Resource officer credentials, password resets, and account access.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '0.6rem 1.1rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          + Create HR Login
        </button>
      </div>

      {/* Copyable Temporary Password Box */}
      {tempPassInfo && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '600', color: '#1e40af', fontSize: '0.9rem' }}>
              🔑 Temporary Credentials Issued ({tempPassInfo.actionType})
            </span>
            <button
              onClick={() => setTempPassInfo(null)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155' }}>
            Provide these temporary credentials to <strong>{tempPassInfo.userEmail}</strong>. They will be forced to change this password upon first sign in.
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginTop: '0.25rem',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '0.5rem 0.75rem',
            maxWidth: '380px'
          }}>
            <code style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', flex: 1, letterSpacing: '0.05em' }}>
              {tempPassInfo.tempPassword}
            </code>
            <button
              onClick={handleCopyPassword}
              style={{
                backgroundColor: copied ? '#16a34a' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {success && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      <ErrorBox error={error} />

      {loading && <Loading message="Loading HR accounts..." />}

      {!loading && (
        hrUsers.length === 0 ? (
          <Empty
            title="No HR users found"
            description="Create HR users to allow staff members to manage attendance, leave, and draft payroll."
            action={
              <button
                onClick={() => setShowCreateModal(true)}
                style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Create HR Login
              </button>
            }
          />
        ) : (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Name</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Email</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>First-Login Reset</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#475569', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hrUsers.map((hr) => (
                  <tr key={hr.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: '#1e293b' }}>{hr.name}</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{hr.email}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: hr.isActive ? '#dcfce7' : '#fee2e2',
                        color: hr.isActive ? '#15803d' : '#b91c1c'
                      }}>
                        {hr.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: hr.mustChangePassword ? '#d97706' : '#64748b', fontSize: '0.8rem' }}>
                      {hr.mustChangePassword ? 'Pending Change' : 'Active'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleResetPassword(hr.id, hr.email)}
                        disabled={actionLoading}
                        style={{
                          marginRight: '0.5rem',
                          background: 'none',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          padding: '0.3rem 0.6rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        Reset Password
                      </button>
                      {hr.isActive && (
                        <button
                          onClick={() => handleDeactivate(hr.id, hr.email)}
                          disabled={actionLoading}
                          style={{
                            background: 'none',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            borderRadius: '4px',
                            padding: '0.3rem 0.6rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Create HR Login Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '1.75rem',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem', color: '#0f172a' }}>
              Create HR Officer Login
            </h3>

            <form onSubmit={handleCreateHr} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="sarah.hr@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {actionLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrUsers;
