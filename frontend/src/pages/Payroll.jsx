import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Loading from '../components/Loading';
import Empty from '../components/Empty';
import ErrorBox from '../components/ErrorBox';

const Payroll = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isHr = user?.role === 'hr';

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchPayrollRun = async (month) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.get(`/payroll/runs?month=${month}`);
      const list = res.data?.items || (Array.isArray(res.data) ? res.data : []);
      const currentRun = list.find((r) => r.month === month) || null;
      setRun(currentRun);
    } catch (err) {
      setError(err?.response?.data?.error || `Failed to fetch payroll for ${month}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollRun(selectedMonth);
  }, [selectedMonth]);

  const handleCreateOrRecalculate = async () => {
    if (!isHr) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post('/payroll/runs', { month: selectedMonth });
      setRun(res.data);
      setSuccess(`Payroll draft for ${selectedMonth} calculated successfully.`);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to calculate payroll draft.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!isAdmin || !run) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.patch(`/payroll/runs/${run.id}/finalize`);
      setRun(res.data?.run || { ...run, isFinalized: true, finalizedAt: new Date().toISOString() });
      setSuccess(`Payroll run for ${selectedMonth} has been finalized and permanently locked.`);
      setShowConfirmModal(false);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to finalize payroll run.');
    } finally {
      setActionLoading(false);
    }
  };

  const isLocked = Boolean(run?.isFinalized);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-info">
          <h1>Payroll Processing</h1>
          <p>Monthly salary calculations, statutory progressive tax deductions, and locking.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Payroll Month:
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input"
            style={{ width: 'auto', padding: '0.45rem 0.85rem' }}
          />

          {isHr && (
            <button
              type="button"
              onClick={handleCreateOrRecalculate}
              disabled={actionLoading || isLocked}
              title={isLocked ? 'Payroll run is locked and cannot be recalculated' : 'Generate or refresh draft'}
              className="btn btn-primary"
            >
              {actionLoading ? 'Calculating...' : run ? 'Recalculate Draft' : 'Create Draft'}
            </button>
          )}

          {isAdmin && run && !isLocked && (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={actionLoading}
              className="btn"
              style={{
                backgroundColor: 'var(--success)',
                color: '#ffffff',
                boxShadow: '0 4px 12px -2px rgba(16, 185, 129, 0.35)'
              }}
            >
              Finalize Payroll
            </button>
          )}
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

      {loading && <Loading message={`Loading payroll data for ${selectedMonth}...`} />}

      {!loading && (
        !run ? (
          <Empty
            title={`No payroll run initiated for ${selectedMonth}`}
            description={
              isHr
                ? "Click 'Create Draft' above to calculate gross salaries, tax withholding, and generate draft payslips."
                : "No payroll draft has been initiated by HR for this cycle."
            }
            action={
              isHr && (
                <button
                  type="button"
                  onClick={handleCreateOrRecalculate}
                  className="btn btn-primary"
                  style={{ marginTop: '0.5rem' }}
                >
                  Create Draft
                </button>
              )
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Run Summary Banner */}
            <div
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.25rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>
                    Cycle: {run.month}
                  </span>
                  {isLocked ? (
                    <span className="badge badge-finalized" style={{ padding: '0.25rem 0.65rem' }}>
                      🔒 Locked & Finalized
                    </span>
                  ) : (
                    <span className="badge badge-pending" style={{ padding: '0.25rem 0.65rem' }}>
                      Draft Mode
                    </span>
                  )}
                </div>
                {isLocked && run.finalizedAt && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Finalized on: {new Date(run.finalizedAt).toLocaleString()}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '2rem', textAlign: 'right', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Gross</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', marginTop: '0.2rem' }}>
                    PKR {(run.totalGross || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Deductions & Tax</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)', marginTop: '0.2rem' }}>
                    PKR {(run.totalDeductions || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Net Payable</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.2rem' }}>
                    PKR {(run.totalNet || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Payslip Items Table */}
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th style={{ textAlign: 'right' }}>Basic Salary</th>
                    <th style={{ textAlign: 'right' }}>Gross (1.5x)</th>
                    <th style={{ textAlign: 'right' }}>Deductions</th>
                    <th style={{ textAlign: 'right' }}>Income Tax</th>
                    <th style={{ textAlign: 'right' }}>Net Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {(run.items || []).map((item) => (
                    <tr key={item.employeeId}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{item.name}</div>
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{item.employeeId}</div>
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                        PKR {(item.basic || 0).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text)' }}>
                        PKR {(item.gross || 0).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--danger)' }}>
                        PKR {(item.deductions || 0).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--danger)' }}>
                        PKR {(item.tax || 0).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                        PKR {(item.net || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Admin Finalize Confirmation Dialog */}
      {showConfirmModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '460px' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.2rem', color: 'var(--text)' }}>
              Finalize Payroll Run ({selectedMonth})?
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Are you sure you want to finalize and lock payroll for <strong style={{ color: 'var(--text)' }}>{selectedMonth}</strong>?
              Once locked, calculations and employee payslips cannot be edited or recalculated.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={actionLoading}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={actionLoading}
                className="btn"
                style={{ backgroundColor: 'var(--success)', color: '#ffffff' }}
              >
                {actionLoading ? 'Finalizing...' : 'Yes, Finalize & Lock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
