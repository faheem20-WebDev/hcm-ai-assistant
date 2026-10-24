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
  const [tempPassInfo, setTempPassInfo] = useState(null);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-info">
          <h1>HR Users & Access Administration</h1>
          <p>Provision and manage Human Resource officer credentials, password resets, PIN resets, and incoming reset requests.</p>
        </div>

        {activeTab === 'officers' && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create HR Login
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs-nav" style={{ marginBottom: 0 }}>
        <button
          type="button"
          onClick={() => setActiveTab('officers')}
          className={`tab-btn ${activeTab === 'officers' ? 'active' : ''}`}
        >
          HR Officers ({hrUsers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          Password Reset Requests
          {pendingRequestsCount > 0 && (
            <span
              style={{
                backgroundColor: 'var(--danger)',
                color: '#ffffff',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.725rem',
                fontWeight: 700,
                padding: '0.1rem 0.45rem',
                lineHeight: 1.2
              }}
            >
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* Copyable Temporary Password Box */}
      {tempPassInfo && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(91, 91, 214, 0.08) 0%, rgba(20, 184, 166, 0.08) 100%)',
            borderColor: 'var(--primary)',
            padding: '1.25rem 1.5rem',
            animation: 'scaleIn 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.925rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🔑 Temporary Credentials Issued ({tempPassInfo.actionType})
            </span>
            <button
              type="button"
              onClick={() => setTempPassInfo(null)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.2rem 0.5rem', color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          </div>
          <p style={{ margin: '0.5rem 0 0.75rem 0', fontSize: '0.875rem', color: 'var(--text)' }}>
            Provide these temporary credentials to <strong>{tempPassInfo.userEmail}</strong>. They will be forced to change this password and setup their 5-digit PIN upon sign in.
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem 0.75rem',
              maxWidth: '380px'
            }}
          >
            <code style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', flex: 1, letterSpacing: '0.05em' }}>
              {tempPassInfo.tempPassword}
            </code>
            <button
              type="button"
              onClick={handleCopyPassword}
              className={`btn btn-sm ${copied ? 'btn-secondary' : 'btn-primary'}`}
              style={{ padding: '0.3rem 0.75rem' }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

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
          ✓ {success}
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
            action={
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
                style={{ marginTop: '0.5rem' }}
              >
                + Create HR Login
              </button>
            }
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Officer Name</th>
                  <th>Email Address</th>
                  <th>Account Status</th>
                  <th>Password Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hrUsers.map((hr) => (
                  <tr key={hr.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{hr.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{hr.email}</td>
                    <td>
                      <span className={`badge ${hr.isActive ? 'badge-active' : 'badge-inactive'}`}>
                        {hr.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: hr.mustChangePassword ? 'var(--warning-bg)' : 'var(--success-bg)',
                          color: hr.mustChangePassword ? 'var(--warning)' : 'var(--success)',
                          border: `1px solid ${hr.mustChangePassword ? 'var(--warning-border)' : 'var(--success-border)'}`
                        }}
                      >
                        {hr.mustChangePassword ? 'Pending Change' : 'Active'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleResetPassword(hr.id, hr.email)}
                          disabled={actionLoading}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--warning)', borderColor: 'var(--warning-border)' }}
                        >
                          Reset Pwd
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResetPin(hr.id, hr.email)}
                          disabled={actionLoading}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--primary)', borderColor: 'rgba(91, 91, 214, 0.3)' }}
                        >
                          Reset PIN
                        </button>
                        {hr.isActive && (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(hr.id, hr.email)}
                            disabled={actionLoading}
                            className="btn btn-danger btn-sm"
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
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User Email</th>
                  <th>Reason / Note</th>
                  <th>Requested At</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resetRequests.map((req) => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{req.email}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{req.reason || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {new Date(req.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge badge-${req.status || 'pending'}`}>
                        {req.status ? req.status.toUpperCase() : 'PENDING'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {req.status === 'pending' ? (
                        <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => handleApproveResetRequest(req)}
                            disabled={actionLoading}
                            className="btn btn-primary btn-sm"
                          >
                            Approve & Reset
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectResetRequest(req)}
                            disabled={actionLoading}
                            className="btn btn-danger btn-sm"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>Completed</span>
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
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0 }}>Create HR Officer Login</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '0.2rem 0.5rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHr} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="sarah.hr@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
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
