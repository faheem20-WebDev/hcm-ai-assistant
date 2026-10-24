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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            Payroll Processing
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            Monthly salary calculations, statutory progressive tax deductions, and locking.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>
            Payroll Month:
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.875rem',
              backgroundColor: '#ffffff'
            }}
          />

          {isHr && (
            <button
              onClick={handleCreateOrRecalculate}
              disabled={actionLoading || isLocked}
              title={isLocked ? 'Payroll run is locked and cannot be recalculated' : 'Generate or refresh draft'}
              style={{
                backgroundColor: isLocked ? '#94a3b8' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.55rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: isLocked || actionLoading ? 'not-allowed' : 'pointer',
                opacity: isLocked ? 0.7 : 1
              }}
            >
              {actionLoading ? 'Calculating...' : run ? 'Recalculate Draft' : 'Create Draft'}
            </button>
          )}

          {isAdmin && run && !isLocked && (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={actionLoading}
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.55rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: actionLoading ? 'not-allowed' : 'pointer'
              }}
            >
              Finalize Payroll
            </button>
          )}
        </div>
      </div>

      {success && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {success}
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
                  onClick={handleCreateOrRecalculate}
                  style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Create Draft
                </button>
              )
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Run Summary Banner */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>
                    Cycle: {run.month}
                  </span>
                  {isLocked ? (
                    <span style={{
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      border: '1px solid #fde68a',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      🔒 Locked & Finalized
                    </span>
                  ) : (
                    <span style={{
                      backgroundColor: '#eff6ff',
                      color: '#1e40af',
                      border: '1px solid #bfdbfe',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '700'
                    }}>
                      Draft Mode
                    </span>
                  )}
                </div>
                {isLocked && run.finalizedAt && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Finalized on: {new Date(run.finalizedAt).toLocaleString()}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'right' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Total Gross</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a' }}>
                    PKR {(run.totalGross || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Total Deductions & Tax</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#dc2626' }}>
                    PKR {(run.totalDeductions || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Total Net Payable</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#16a34a' }}>
                    PKR {(run.totalNet || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Payslip Items Table */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Employee</th>
                    <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600', textAlign: 'right' }}>Basic Salary</th>
                    <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600', textAlign: 'right' }}>Gross (1.5x)</th>
                    <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600', textAlign: 'right' }}>Deductions</th>
                    <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600', textAlign: 'right' }}>Income Tax</th>
                    <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600', textAlign: 'right' }}>Net Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {(run.items || []).map((item) => (
                    <tr key={item.employeeId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.employeeId}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#475569' }}>
                        PKR {(item.basic || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                        PKR {(item.gross || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#dc2626' }}>
                        PKR {(item.deductions || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#dc2626' }}>
                        PKR {(item.tax || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: '700', color: '#16a34a' }}>
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
            maxWidth: '460px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.2rem', color: '#0f172a' }}>
              Finalize Payroll Run ({selectedMonth})?
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.875rem', color: '#475569', lineHeight: '1.5' }}>
              Are you sure you want to finalize and lock payroll for <strong>{selectedMonth}</strong>?
              Once locked, calculations and employee payslips cannot be edited or recalculated.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={actionLoading}
                style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={actionLoading}
                style={{ padding: '0.5rem 1.25rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}
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
