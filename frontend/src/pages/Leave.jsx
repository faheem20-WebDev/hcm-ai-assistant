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
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
          Leave Entitlements & Applications
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
          {isEmployee ? 'Apply for paid time off, review quotas, and track application statuses.' : 'HR Leave approval queue.'}
        </p>
      </div>

      {success && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
          {success}
        </div>
      )}

      <ErrorBox error={error} />

      {loading && <Loading message="Loading leave information..." />}

      {!loading && isEmployee && (
        <>
          {/* Balance Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Annual Leave</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#2563eb', margin: '0.25rem 0' }}>
                {balances.annual}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Quota: 14 days/year</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Sick Leave</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#16a34a', margin: '0.25rem 0' }}>
                {balances.sick}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Quota: 8 days/year</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Casual Leave</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f59e0b', margin: '0.25rem 0' }}>
                {balances.casual}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Quota: 10 days/year</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Unpaid Leave</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#64748b', margin: '0.25rem 0' }}>
                Unlimited
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Salary deducted per day</div>
            </div>
          </div>

          {/* Smart Leave AI Box */}
          <div style={{
            backgroundColor: '#faf5ff',
            border: '1px solid #e9d5ff',
            borderRadius: '8px',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>✨</span>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#6b21a8' }}>
                Smart Leave Assistant
              </h3>
              <span className="ai-badge">AI-generated</span>
            </div>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: '#7e22ce' }}>
              Type naturally (e.g. "next Monday and Tuesday off for family wedding" or "sick leave tomorrow") to auto-fill the form.
            </p>

            <form onSubmit={handleSmartLeaveParse} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={smartPrompt}
                onChange={(e) => setSmartPrompt(e.target.value)}
                placeholder="Describe your leave request..."
                style={{
                  flex: 1,
                  minWidth: '240px',
                  padding: '0.55rem 0.75rem',
                  border: '1px solid #d8b4fe',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
              <button
                type="submit"
                disabled={smartLoading || !smartPrompt.trim()}
                style={{
                  backgroundColor: '#7c3aed',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.55rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: smartLoading || !smartPrompt.trim() ? 'not-allowed' : 'pointer',
                  opacity: smartLoading || !smartPrompt.trim() ? 0.6 : 1
                }}
              >
                {smartLoading ? 'Analyzing...' : 'Parse with Smart Leave'}
              </button>
            </form>

            {smartError && (
              <div style={{ marginTop: '0.5rem', color: '#b91c1c', fontSize: '0.8rem' }}>
                ⚠️ {smartError}
              </div>
            )}
            {smartParsed && (
              <div style={{ marginTop: '0.5rem', color: '#15803d', fontSize: '0.8rem', fontWeight: '500' }}>
                ✓ Parsed successfully! Please review and confirm the details below before submitting.
              </div>
            )}
          </div>

          {/* Apply Form */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.05rem', color: '#0f172a' }}>
              Apply for Leave
            </h3>

            {formError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>
                <strong>Submission Error (422): </strong>
                {formError}
              </div>
            )}

            <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                    Leave Type
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
                  >
                    <option value="Annual">Annual Leave</option>
                    <option value="Sick">Sick Leave</option>
                    <option value="Casual">Casual Leave</option>
                    <option value="Unpaid">Unpaid Leave</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                  Reason for Leave
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="State the purpose of your leave..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.65rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? 'Submitting...' : 'Confirm & Apply'}
                </button>
              </div>
            </form>
          </div>

          {/* Leave History Table */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.75rem' }}>
              Your Leave History
            </h3>
            {leaves.length === 0 ? (
              <Empty
                title="No leave applications"
                description="Your past and upcoming leave applications will be listed here."
              />
            ) : (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Type</th>
                      <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Dates</th>
                      <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Reason</th>
                      <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Status</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#475569', fontWeight: '600' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((l) => (
                      <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: '#1e293b' }}>{l.type}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                          {l.startDate} to {l.endDate}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{l.reason}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: l.status === 'approved' ? '#dcfce7' : l.status === 'rejected' ? '#fee2e2' : l.status === 'cancelled' ? '#f1f5f9' : '#fef3c7',
                            color: l.status === 'approved' ? '#15803d' : l.status === 'rejected' ? '#b91c1c' : l.status === 'cancelled' ? '#64748b' : '#b45309',
                            textTransform: 'capitalize'
                          }}>
                            {l.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          {l.status === 'pending' && (
                            <button
                              onClick={() => handleCancel(l.id)}
                              style={{
                                background: 'none',
                                border: '1px solid #fecaca',
                                color: '#dc2626',
                                borderRadius: '4px',
                                padding: '0.25rem 0.6rem',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
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

      {/* HR / Admin View fallback */}
      {!loading && !isEmployee && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '0.85rem 1rem', color: '#475569' }}>Employee</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569' }}>Type</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569' }}>Dates</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569' }}>Reason</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#475569' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>{l.employeeId}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>{l.type}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>{l.startDate} to {l.endDate}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{l.reason}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>{l.status}</td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    {l.status === 'pending' && (
                      <button
                        onClick={() => { setSelectedLeave(l); setDecisionModalOpen(true); }}
                        style={{ padding: '0.25rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* HR Decision Modal */}
      {decisionModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Review Leave Request</h3>
            <form onSubmit={handleDecisionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Decision</label>
                <select
                  value={decisionType}
                  onChange={(e) => setDecisionType(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                >
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Comment</label>
                <textarea
                  rows={3}
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  placeholder="Optional review comment..."
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setDecisionModalOpen(false)} style={{ padding: '0.4rem 0.8rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.4rem 0.8rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px' }}>Save Decision</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leave;
