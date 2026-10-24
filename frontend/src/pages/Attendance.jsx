import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Loading from '../components/Loading';
import Empty from '../components/Empty';
import ErrorBox from '../components/ErrorBox';

const statusColors = {
  present: { bg: '#dcfce7', text: '#15803d', label: 'Present' },
  late: { bg: '#fef3c7', text: '#b45309', label: 'Late' },
  half_day: { bg: '#ffedd5', text: '#c2410c', label: 'Half Day' },
  absent: { bg: '#fee2e2', text: '#b91c1c', label: 'Absent' },
  on_leave: { bg: '#e0e7ff', text: '#3730a3', label: 'On Leave' },
  missing_checkout: { bg: '#f1f5f9', text: '#475569', label: 'Missing Checkout' }
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
    const startingDayOfWeek = firstDay.getDay(); // 0 is Sun

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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            Attendance & Time Tracking
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            {isEmployee ? 'Review your monthly attendance history and request attendance corrections.' : 'Real-time company attendance monitor.'}
          </p>
        </div>

        {isEmployee && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff'
              }}
            />
          </div>
        )}
      </div>

      {success && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      <ErrorBox error={error} />

      {loading && <Loading message="Loading attendance records..." />}

      {!loading && isEmployee && (
        <>
          {/* Status Legend */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.25rem',
            fontSize: '0.8rem'
          }}>
            <span style={{ fontWeight: '600', color: '#334155' }}>Status Legend:</span>
            {Object.entries(statusColors).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: v.bg, border: `1px solid ${v.text}` }} />
                <span style={{ color: '#475569' }}>{v.label}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }} />
              <span style={{ color: '#64748b' }}>Weekend / Off</span>
            </div>
          </div>

          {/* Monthly Attendance Calendar */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', padding: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '0.5rem' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', padding: '0.25rem 0' }}>
                  {d}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
              {calendarDays.map((cell, idx) => {
                if (!cell) {
                  return <div key={`empty-${idx}`} style={{ minHeight: '80px', backgroundColor: '#fafafa', borderRadius: '6px' }} />;
                }

                const { dayNum, dateStr, record, isWeekend } = cell;
                const status = record?.status;
                const colorInfo = statusColors[status];

                let bg = isWeekend ? '#f8fafc' : '#ffffff';
                let borderColor = '#e2e8f0';
                if (colorInfo) {
                  bg = colorInfo.bg;
                  borderColor = colorInfo.text;
                }

                return (
                  <div
                    key={dateStr}
                    onClick={() => handleDayClick(dateStr, record)}
                    title="Click to request attendance correction"
                    style={{
                      minHeight: '80px',
                      backgroundColor: bg,
                      border: `1px solid ${borderColor}`,
                      borderRadius: '6px',
                      padding: '0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'transform 0.1s ease, box-shadow 0.1s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: isWeekend ? '#94a3b8' : '#1e293b' }}>
                        {dayNum}
                      </span>
                      {status && (
                        <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', color: colorInfo?.text }}>
                          {colorInfo?.label || status}
                        </span>
                      )}
                    </div>

                    {record && (
                      <div style={{ fontSize: '0.7rem', color: '#334155', marginTop: '0.25rem' }}>
                        <div>In: {record.checkIn || '-'}</div>
                        <div>Out: {record.checkOut || '-'}</div>
                      </div>
                    )}

                    {!record && !isWeekend && (
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontStyle: 'italic' }}>
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
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.75rem' }}>
                Your Correction Requests
              </h3>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>Date</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>Requested In</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>Requested Out</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>Reason</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {corrections.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{c.date}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{c.requestedCheckIn}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{c.requestedCheckOut}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{c.reason}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: c.status === 'approved' ? '#dcfce7' : c.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                            color: c.status === 'approved' ? '#15803d' : c.status === 'rejected' ? '#b91c1c' : '#b45309',
                            textTransform: 'capitalize'
                          }}>
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
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Employee</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Check-In</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Check-Out</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>{r.name}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>{r.checkIn || '-'}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>{r.checkOut || '-'}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: r.status === 'present' ? '#dcfce7' : '#fee2e2',
                      color: r.status === 'present' ? '#15803d' : '#b91c1c',
                      textTransform: 'capitalize'
                    }}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Correction Request Modal */}
      {correctionModalOpen && (
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
            maxWidth: '440px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', color: '#0f172a' }}>
              Request Attendance Correction
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: '#64748b' }}>
              Target Date: <strong>{selectedDate}</strong>
            </p>

            <form onSubmit={handleCorrectionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    Requested Check-In
                  </label>
                  <input
                    type="time"
                    required
                    value={reqCheckIn}
                    onChange={(e) => setReqCheckIn(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    Requested Check-Out
                  </label>
                  <input
                    type="time"
                    required
                    value={reqCheckOut}
                    onChange={(e) => setReqCheckOut(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                  Reason (Required)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why a correction is needed (e.g. system glitch, offsite client meeting)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCorrectionModalOpen(false)}
                  style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '0.5rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}
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
