import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Loading from '../components/Loading';
import Empty from '../components/Empty';
import ErrorBox from '../components/ErrorBox';

const statusMap = {
  present: { badgeClass: 'badge-present', label: 'Present' },
  late: { badgeClass: 'badge-late', label: 'Late' },
  half_day: { badgeClass: 'badge-half_day', label: 'Half Day' },
  absent: { badgeClass: 'badge-absent', label: 'Absent' },
  on_leave: { badgeClass: 'badge-on_leave', label: 'On Leave' },
  missing_checkout: { badgeClass: 'badge-missing_checkout', label: 'Missing Checkout' }
};

const Attendance = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';

  // Month navigation (YYYY-MM)
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [records, setRecords] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Correction Request Modal
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [reqCheckIn, setReqCheckIn] = useState('09:00');
  const [reqCheckOut, setReqCheckOut] = useState('17:30');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isEmployee) {
        const [attRes, corRes] = await Promise.all([
          api.get(`/attendance/me?month=${selectedMonth}`),
          api.get('/attendance/corrections')
        ]);
        setRecords(attRes.data?.items || (Array.isArray(attRes.data) ? attRes.data : []));
        setCorrections(corRes.data?.items || (Array.isArray(corRes.data) ? corRes.data : []));
      } else {
        // HR/Admin view
        const res = await api.get(`/attendance/board?date=${new Date().toISOString().slice(0, 10)}`);
        setRecords(res.data?.records || []);
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to fetch attendance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedMonth, isEmployee]);

  // Click on a calendar day
  const handleDayClick = (dayStr, record) => {
    setSelectedDate(dayStr);
    setReqCheckIn(record?.checkIn || '09:00');
    setReqCheckOut(record?.checkOut || '17:30');
    setReason('');
    setCorrectionModalOpen(true);
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for the attendance correction.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/attendance/corrections', {
        date: selectedDate,
        requestedCheckIn: reqCheckIn,
        requestedCheckOut: reqCheckOut,
        reason: reason.trim()
      });
      setSuccess(`Correction request for ${selectedDate} submitted for HR review.`);
      setCorrectionModalOpen(false);
      fetchAttendance();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to submit correction request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Build Calendar Days for Month
  const buildCalendarDays = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const totalDays = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const rec = records.find((r) => r.date === dateStr);
      const isWeekend = new Date(year, month - 1, d).getDay() === 0 || new Date(year, month - 1, d).getDay() === 6;
      days.push({
        dayNum: d,
        dateStr,
        record: rec,
        isWeekend
      });
    }

    return days;
  };

  const calendarDays = buildCalendarDays();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-info">
          <h1>Attendance & Time Tracking</h1>
          <p>
            {isEmployee
              ? 'Review your monthly attendance history and request attendance corrections.'
              : 'Real-time company attendance monitor and employee daily logs.'}
          </p>
        </div>

        {isEmployee && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input"
              style={{ width: 'auto', padding: '0.45rem 0.85rem' }}
            />
          </div>
        )}
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

      {loading && <Loading message="Loading attendance records..." />}

      {!loading && isEmployee && (
        <>
          {/* Status Legend */}
          <div
            className="card"
            style={{
              padding: '0.85rem 1.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
              fontSize: '0.8rem'
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>Status Legend:</span>
            {Object.entries(statusMap).map(([k, v]) => (
              <span key={k} className={`badge ${v.badgeClass}`}>
                {v.label}
              </span>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  backgroundColor: 'var(--surface-3)',
                  border: '1px solid var(--border)'
                }}
              />
              <span>Weekend / Off</span>
            </div>
          </div>

          {/* Monthly Attendance Calendar */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.5rem',
                textAlign: 'center',
                marginBottom: '0.75rem'
              }}
            >
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div
                  key={d}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '0.25rem 0'
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
              {calendarDays.map((cell, idx) => {
                if (!cell) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      style={{
                        minHeight: '88px',
                        backgroundColor: 'var(--surface-2)',
                        borderRadius: 'var(--radius-sm)',
                        opacity: 0.4
                      }}
                    />
                  );
                }

                const { dayNum, dateStr, record, isWeekend } = cell;
                const status = record?.status;
                const statusInfo = statusMap[status];

                return (
                  <div
                    key={dateStr}
                    onClick={() => handleDayClick(dateStr, record)}
                    title="Click to request attendance correction"
                    style={{
                      minHeight: '88px',
                      backgroundColor: isWeekend ? 'var(--surface-2)' : 'var(--surface)',
                      border: status ? '1.5px solid var(--border)' : '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.6rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.825rem',
                          fontWeight: 700,
                          color: isWeekend ? 'var(--text-muted)' : 'var(--text)'
                        }}
                      >
                        {dayNum}
                      </span>
                      {status && (
                        <span className={`badge ${statusInfo?.badgeClass || ''}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                          {statusInfo?.label || status}
                        </span>
                      )}
                    </div>

                    {record && (
                      <div style={{ fontSize: '0.725rem', color: 'var(--text)', marginTop: '0.35rem', lineHeight: 1.3 }}>
                        <div>In: <strong style={{ color: 'var(--text)' }}>{record.checkIn || '-'}</strong></div>
                        <div>Out: <strong style={{ color: 'var(--text)' }}>{record.checkOut || '-'}</strong></div>
                      </div>
                    )}

                    {!record && !isWeekend && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.35rem' }}>
                        No punch
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Corrections List */}
          {corrections.length > 0 && (
            <div className="card">
              <h3 style={{ margin: '0 0 1rem 0' }}>Your Correction Requests</h3>
              <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Requested In</th>
                      <th>Requested Out</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {corrections.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>{c.date}</td>
                        <td style={{ color: 'var(--text)' }}>{c.requestedCheckIn}</td>
                        <td style={{ color: 'var(--text)' }}>{c.requestedCheckOut}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{c.reason}</td>
                        <td>
                          <span className={`badge badge-${c.status || 'pending'}`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* HR / Admin View fallback */}
      {!loading && !isEmployee && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No check-in records recorded for today.
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{r.name}</td>
                    <td style={{ color: 'var(--text)' }}>{r.checkIn || '-'}</td>
                    <td style={{ color: 'var(--text)' }}>{r.checkOut || '-'}</td>
                    <td>
                      <span className={`badge badge-${r.status || 'present'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Correction Request Modal */}
      {correctionModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0 }}>Request Correction</h2>
              <button
                type="button"
                onClick={() => setCorrectionModalOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '0.2rem 0.5rem' }}
              >
                ✕
              </button>
            </div>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Target Date: <strong style={{ color: 'var(--text)' }}>{selectedDate}</strong>
            </p>

            <form onSubmit={handleCorrectionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                    Requested In
                  </label>
                  <input
                    type="time"
                    required
                    value={reqCheckIn}
                    onChange={(e) => setReqCheckIn(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                    Requested Out
                  </label>
                  <input
                    type="time"
                    required
                    value={reqCheckOut}
                    onChange={(e) => setReqCheckOut(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                  Reason (Required)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why a correction is needed (e.g. system glitch, offsite client meeting)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCorrectionModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
