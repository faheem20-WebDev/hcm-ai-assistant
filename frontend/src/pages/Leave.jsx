import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Loading from '../components/Loading';
import Empty from '../components/Empty';
import ErrorBox from '../components/ErrorBox';

const Leave = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';

  const [balances, setBalances] = useState({ annual: 0, sick: 0, casual: 0, unpaid: 0 });
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Smart Leave AI Box State
  const [smartPrompt, setSmartPrompt] = useState('');
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartError, setSmartError] = useState(null);
  const [smartParsed, setSmartParsed] = useState(false);

  // Apply Form State
  const [leaveType, setLeaveType] = useState('Annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // HR Decision Modal State
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [decisionType, setDecisionType] = useState('approved');
  const [decisionComment, setDecisionComment] = useState('');

  const fetchLeaveData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isEmployee) {
        const [balRes, listRes] = await Promise.all([
          api.get('/leave/balance/me'),
          api.get('/leave/me')
        ]);
        setBalances(balRes.data || { annual: 0, sick: 0, casual: 0, unpaid: 0 });
        setLeaves(listRes.data?.items || (Array.isArray(listRes.data) ? listRes.data : []));
      } else {
        // HR / Admin queue
        const res = await api.get('/leave');
        setLeaves(res.data?.items || (Array.isArray(res.data) ? res.data : []));
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load leave records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, [isEmployee]);

  // Smart Leave Parser
  const handleSmartLeaveParse = async (e) => {
    e.preventDefault();
    if (!smartPrompt.trim()) return;

    setSmartLoading(true);
    setSmartError(null);
    setSmartParsed(false);

    try {
      const res = await api.post('/ai/smart-leave', { text: smartPrompt });
      if (res.data?.error) {
        setSmartError(res.data.error);
      } else {
        if (res.data.type) setLeaveType(res.data.type);
        if (res.data.start) setStartDate(res.data.start);
        if (res.data.end) setEndDate(res.data.end);
        if (res.data.reason) setReason(res.data.reason);
        setSmartParsed(true);
      }
    } catch (err) {
      setSmartError(err?.response?.data?.error || 'Could not parse smart leave request.');
    } finally {
      setSmartLoading(false);
    }
  };

  // Submit Leave Application
  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setSuccess(null);

    try {
      await api.post('/leave', {
        type: leaveType,
        startDate,
        endDate,
        reason
      });
      setSuccess('Leave application submitted successfully for HR approval.');
      setStartDate('');
      setEndDate('');
      setReason('');
      setSmartParsed(false);
      setSmartPrompt('');
      fetchLeaveData();
    } catch (err) {
      if (err.response?.status === 422) {
        setFormError(err.response?.data?.error || 'Validation error: Your leave request overlaps with existing leaves or exceeds quota.');
      } else {
        setFormError(err?.response?.data?.error || 'Failed to apply for leave.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel Leave
  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this leave application?')) return;
    try {
      await api.patch(`/leave/${id}/cancel`);
      setSuccess('Leave application cancelled.');
      fetchLeaveData();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to cancel leave.');
    }
  };

  // HR Decision
  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLeave) return;
    try {
      await api.patch(`/leave/${selectedLeave.id}/decision`, {
        decision: decisionType,
        comment: decisionComment
      });
      setSuccess(`Leave marked as ${decisionType}.`);
      setDecisionModalOpen(false);
      fetchLeaveData();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to record leave decision.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-info">
          <h1>Leave Entitlements & Applications</h1>
          <p>
            {isEmployee
              ? 'Apply for paid time off, review quotas, and track application statuses.'
              : 'HR Leave approval queue and request decisions.'}
          </p>
        </div>
      </div>

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

      <ErrorBox error={error} />

      {loading && <Loading message="Loading leave information..." />}

      {!loading && isEmployee && (
        <>
          {/* Balance Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Annual Leave</span>
                <div className="kpi-icon" style={{ backgroundColor: 'rgba(91, 91, 214, 0.12)', color: 'var(--primary)' }}>
                  🌴
                </div>
              </div>
              <div className="kpi-val" style={{ color: 'var(--primary)' }}>
                {balances.annual}
              </div>
              <div className="kpi-sub">Total Quota: 14 days/yr</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Sick Leave</span>
                <div className="kpi-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
                  💊
                </div>
              </div>
              <div className="kpi-val" style={{ color: 'var(--success)' }}>
                {balances.sick}
              </div>
              <div className="kpi-sub">Total Quota: 8 days/yr</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Casual Leave</span>
                <div className="kpi-icon" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
                  ☕
                </div>
              </div>
              <div className="kpi-val" style={{ color: 'var(--warning)' }}>
                {balances.casual}
              </div>
              <div className="kpi-sub">Total Quota: 10 days/yr</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Unpaid Leave</span>
                <div className="kpi-icon" style={{ backgroundColor: 'var(--surface-3)', color: 'var(--text-muted)' }}>
                  📅
                </div>
              </div>
              <div className="kpi-val" style={{ color: 'var(--text-muted)' }}>
                Unlimited
              </div>
              <div className="kpi-sub">Salary deducted per day</div>
            </div>
          </div>

          {/* Smart Leave AI Box */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, rgba(91, 91, 214, 0.06) 0%, rgba(20, 184, 166, 0.06) 100%)',
              borderColor: 'rgba(91, 91, 214, 0.35)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.15rem' }}>✨</span>
              <h3 style={{ margin: 0, fontSize: '0.975rem', fontWeight: 700, color: 'var(--text)' }}>
                Smart Leave Natural Language Assistant
              </h3>
              <span className="ai-badge">AI-generated</span>
            </div>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Type naturally (e.g. <em>"next Monday and Tuesday off for family wedding"</em> or <em>"sick leave tomorrow"</em>) to auto-fill the form.
            </p>

            <form onSubmit={handleSmartLeaveParse} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={smartPrompt}
                onChange={(e) => setSmartPrompt(e.target.value)}
                placeholder="Describe your leave request naturally..."
                className="input"
                style={{ flex: 1, minWidth: '240px' }}
              />
              <button
                type="submit"
                disabled={smartLoading || !smartPrompt.trim()}
                className="btn btn-primary"
                style={{ gap: '0.5rem' }}
              >
                <span>✨</span>
                {smartLoading ? 'Analyzing...' : 'Parse with Smart Leave'}
              </button>
            </form>

            {smartError && (
              <div style={{ marginTop: '0.75rem', color: 'var(--danger)', fontSize: '0.825rem', fontWeight: 500 }}>
                ⚠️ {smartError}
              </div>
            )}
            {smartParsed && (
              <div style={{ marginTop: '0.75rem', color: 'var(--success)', fontSize: '0.825rem', fontWeight: 600 }}>
                ✓ Parsed successfully! Please review and confirm the form fields below before submitting.
              </div>
            )}
          </div>

          {/* Apply Form */}
          <div className="card">
            <h3 style={{ margin: '0 0 1.25rem 0' }}>Apply for Leave</h3>

            {formError && (
              <div
                style={{
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  color: 'var(--danger)',
                  padding: '0.85rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  marginBottom: '1.25rem'
                }}
              >
                <strong>Submission Error (422): </strong>
                {formError}
              </div>
            )}

            <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                    Leave Type
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="select"
                  >
                    <option value="Annual">Annual Leave</option>
                    <option value="Sick">Sick Leave</option>
                    <option value="Casual">Casual Leave</option>
                    <option value="Unpaid">Unpaid Leave</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                  Reason for Leave
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="State the purpose of your leave..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 1.75rem' }}
                >
                  {submitting ? 'Submitting...' : 'Confirm & Apply'}
                </button>
              </div>
            </form>
          </div>

          {/* Leave History Table */}
          <div className="card">
            <h3 style={{ margin: '0 0 1rem 0' }}>Your Leave History</h3>
            {leaves.length === 0 ? (
              <Empty
                title="No leave applications"
                description="Your past and upcoming leave applications will be listed here."
              />
            ) : (
              <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((l) => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>{l.type}</td>
                        <td style={{ color: 'var(--text)' }}>
                          {l.startDate} to {l.endDate}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{l.reason}</td>
                        <td>
                          <span className={`badge badge-${l.status || 'pending'}`}>
                            {l.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {l.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleCancel(l.id)}
                              className="btn btn-danger btn-sm"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* HR / Admin View */}
      {!loading && !isEmployee && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Reason</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No leave applications submitted yet.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{l.employeeId}</td>
                    <td style={{ color: 'var(--text)' }}>{l.type}</td>
                    <td style={{ color: 'var(--text)' }}>{l.startDate} to {l.endDate}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{l.reason}</td>
                    <td>
                      <span className={`badge badge-${l.status || 'pending'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {l.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => { setSelectedLeave(l); setDecisionModalOpen(true); }}
                          className="btn btn-secondary btn-sm"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* HR Decision Modal */}
      {decisionModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0 }}>Review Leave Request</h2>
              <button
                type="button"
                onClick={() => setDecisionModalOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '0.2rem 0.5rem' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleDecisionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '0.35rem' }}>
                  Decision
                </label>
                <select
                  value={decisionType}
                  onChange={(e) => setDecisionType(e.target.value)}
                  className="select"
                >
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '0.35rem' }}>
                  Comment
                </label>
                <textarea
                  rows={3}
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  placeholder="Optional review comment..."
                  className="textarea"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setDecisionModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leave;
