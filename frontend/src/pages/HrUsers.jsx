import React, { useState, useEffect } from 'react';
import api from '../api';
import Loading from '../components/Loading';
import Empty from '../components/Empty';
import ErrorBox from '../components/ErrorBox';

const HrUsers = () => {
  const [activeTab, setActiveTab] = useState('officers'); // 'officers' | 'requests'
  const [hrUsers, setHrUsers] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);
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
      const [hrRes, reqRes] = await Promise.all([
        api.get('/users/hr'),
        api.get('/auth/reset-requests').catch(() => ({ data: { items: [] } }))
      ]);
      setHrUsers(hrRes.data?.items || []);
      setResetRequests(reqRes.data?.items || []);
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

  const handleResetPin = async (id, userEmail) => {
    if (!window.confirm(`Reset 5-digit login PIN for ${userEmail}? They will be prompted to create a new PIN upon login.`)) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/users/${id}/reset-pin`);
      setSuccess(`5-digit PIN for ${userEmail} has been reset.`);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to reset PIN.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveResetRequest = async (reqItem) => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post(`/auth/reset-requests/${reqItem.id}/approve`);
      setTempPassInfo({
        userEmail: reqItem.email,
        tempPassword: res.data?.tempPassword || 'Reset999999!',
        actionType: 'Reset Request Approved'
      });
      setSuccess(`Reset request approved for ${reqItem.email}.`);
      fetchHrUsers();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to approve reset request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectResetRequest = async (reqItem) => {
    if (!window.confirm(`Reject password reset request for ${reqItem.email}?`)) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/auth/reset-requests/${reqItem.id}/reject`);
      setSuccess(`Reset request rejected for ${reqItem.email}.`);
      fetchHrUsers();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to reject reset request.');
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

  const pendingRequestsCount = resetRequests.filter((r) => r.status === 'pending').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            HR Users & Access Administration
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            Provision and manage Human Resource officer credentials, password resets, PIN resets, and incoming reset requests.
          </p>
        </div>

        {activeTab === 'officers' && (
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
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('officers')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'officers' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'officers' ? '#2563eb' : '#64748b',
            fontWeight: activeTab === 'officers' ? '600' : '500',
            padding: '0.6rem 0.5rem',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          HR Officers ({hrUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'requests' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'requests' ? '#2563eb' : '#64748b',
            fontWeight: activeTab === 'requests' ? '600' : '500',
            padding: '0.6rem 0.5rem',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          Password Reset Requests
          {pendingRequestsCount > 0 && (
            <span style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '700',
              padding: '0.1rem 0.45rem'
            }}>
              {pendingRequestsCount}
            </span>
          )}
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
            Provide these temporary credentials to <strong>{tempPassInfo.userEmail}</strong>. They will be forced to change this password and setup their 5-digit PIN upon sign in.
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

      <ErrorBox error={error} onRetry={fetchHrUsers} />

      {/* TAB 1: HR OFFICERS */}
      {activeTab === 'officers' && (
        loading ? (
          <Loading message="Loading HR accounts..." />
        ) : hrUsers.length === 0 ? (
          <Empty
            title="No HR Officers Found"
            description="No HR user accounts have been provisioned yet. Click '+ Create HR Login' to provision access."
          />
        ) : (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            overflowX: 'auto',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem', minWidth: '650px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Officer Name</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Email Address</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Account Status</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Password Status</th>
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
                      <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleResetPassword(hr.id, hr.email)}
                          disabled={actionLoading}
                          style={{
                            backgroundColor: '#fef3c7',
                            border: '1px solid #fde68a',
                            color: '#92400e',
                            borderRadius: '4px',
                            padding: '0.3rem 0.6rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                        >
                          Reset Pwd
                        </button>
                        <button
                          onClick={() => handleResetPin(hr.id, hr.email)}
                          disabled={actionLoading}
                          style={{
                            backgroundColor: '#e0e7ff',
                            border: '1px solid #c7d2fe',
                            color: '#3730a3',
                            borderRadius: '4px',
                            padding: '0.3rem 0.6rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                        >
                          Reset PIN
                        </button>
                        {hr.isActive && (
                          <button
                            onClick={() => handleDeactivate(hr.id, hr.email)}
                            disabled={actionLoading}
                            style={{
                              backgroundColor: '#fee2e2',
                              border: '1px solid #fecaca',
                              color: '#dc2626',
                              borderRadius: '4px',
                              padding: '0.3rem 0.6rem',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* TAB 2: PASSWORD RESET REQUESTS */}
      {activeTab === 'requests' && (
        resetRequests.length === 0 ? (
          <Empty
            title="No Reset Requests"
            description="Zero password reset requests pending. Requests submitted by users on the login page will appear here."
          />
        ) : (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            overflowX: 'auto',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem', minWidth: '650px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>User Email</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Reason / Note</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Requested At</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#475569', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resetRequests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: '#0f172a' }}>{req.email}</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{req.reason || '—'}</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(req.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor:
                          req.status === 'approved' ? '#dcfce7' : req.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                        color:
                          req.status === 'approved' ? '#15803d' : req.status === 'rejected' ? '#b91c1c' : '#b45309'
                      }}>
                        {req.status ? req.status.toUpperCase() : 'PENDING'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      {req.status === 'pending' ? (
                        <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleApproveResetRequest(req)}
                            disabled={actionLoading}
                            style={{
                              backgroundColor: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Approve & Reset
                          </button>
                          <button
                            onClick={() => handleRejectResetRequest(req)}
                            disabled={actionLoading}
                            style={{
                              backgroundColor: '#fee2e2',
                              border: '1px solid #fecaca',
                              color: '#b91c1c',
                              borderRadius: '4px',
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Completed</span>
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
                  style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }}
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
                  style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }}
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
