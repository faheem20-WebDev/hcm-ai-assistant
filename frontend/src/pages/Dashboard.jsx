import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Loading from '../components/Loading';
import ErrorBox from '../components/ErrorBox';

const Dashboard = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkActionLoading, setCheckActionLoading] = useState(false);
  const [checkSuccess, setCheckSuccess] = useState(null);
  const [checkError, setCheckError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = user?.role === 'admin'
        ? '/dashboard/admin'
        : user?.role === 'hr'
        ? '/dashboard/hr'
        : '/dashboard/me';
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user?.role]);

  // Check In Handler
  const handleCheckIn = async () => {
    setCheckActionLoading(true);
    setCheckSuccess(null);
    setCheckError(null);

    const performCall = async (lat = 24.8607, lng = 67.0011) => {
      try {
        const res = await api.post('/attendance/check-in', { latitude: lat, longitude: lng });
        setCheckSuccess(`Checked in successfully at ${res.data.checkIn || new Date().toLocaleTimeString()}.`);
        fetchDashboard();
      } catch (err) {
        if (err.response?.status === 409) {
          setCheckError('You have already completed check-in for today.');
        } else {
          setCheckError(err?.response?.data?.error || 'Check-in failed. Please ensure you are within office premises.');
        }
      } finally {
        setCheckActionLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => performCall(pos.coords.latitude, pos.coords.longitude),
        () => performCall()
      );
    } else {
      performCall();
    }
  };

  // Check Out Handler
  const handleCheckOut = async () => {
    setCheckActionLoading(true);
    setCheckSuccess(null);
    setCheckError(null);

    const performCall = async (lat = 24.8607, lng = 67.0011) => {
      try {
        const res = await api.post('/attendance/check-out', { latitude: lat, longitude: lng });
        setCheckSuccess(`Checked out successfully at ${res.data.checkOut || new Date().toLocaleTimeString()}.`);
        fetchDashboard();
      } catch (err) {
        setCheckError(err?.response?.data?.error || 'Check-out failed.');
      } finally {
        setCheckActionLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => performCall(pos.coords.latitude, pos.coords.longitude),
        () => performCall()
      );
    } else {
      performCall();
    }
  };

  if (loading) return <Loading message="Loading dashboard overview..." />;

  // Employee specific view
  if (isEmployee) {
    const todayAtt = data?.todayAttendance;
    const hours = data?.hoursThisWeek || 0;
    const targetHours = data?.targetHours || 40;
    const hoursPercent = Math.min(100, Math.round((hours / targetHours) * 100));
    const balances = data?.leaveBalance || { annual: 0, sick: 0, casual: 0, unpaid: 0 };
    const lastSlip = data?.lastPayslip;
    const announcements = data?.announcements || [];

    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Top Header & Assistant Prompt */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
              Welcome back, {data?.name || user?.name}!
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
              {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Karachi' })} (Asia/Karachi)
            </p>
          </div>

          <Link
            to="/ai"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#ede9fe',
              color: '#6d28d9',
              border: '1px solid #ddd6fe',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >
            ✨ Ask my assistant
          </Link>
        </div>

        {/* Check-In / Check-Out Widget */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              Today's Attendance Status
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginTop: '0.25rem' }}>
              {!todayAtt ? (
                <span style={{ color: '#d97706' }}>Not Checked In</span>
              ) : todayAtt.checkOut ? (
                <span style={{ color: '#16a34a' }}>Completed (In: {todayAtt.checkIn} | Out: {todayAtt.checkOut})</span>
              ) : (
                <span style={{ color: '#2563eb' }}>Checked In at {todayAtt.checkIn}</span>
              )}
            </div>
            {todayAtt?.status && (
              <span style={{
                display: 'inline-block',
                marginTop: '0.4rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: '600',
                backgroundColor: todayAtt.status === 'present' ? '#dcfce7' : todayAtt.status === 'late' ? '#fef3c7' : '#fee2e2',
                color: todayAtt.status === 'present' ? '#15803d' : todayAtt.status === 'late' ? '#b45309' : '#b91c1c',
                textTransform: 'capitalize'
              }}>
                Status: {todayAtt.status}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleCheckIn}
              disabled={checkActionLoading || Boolean(todayAtt)}
              style={{
                backgroundColor: Boolean(todayAtt) ? '#94a3b8' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.65rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: Boolean(todayAtt) || checkActionLoading ? 'not-allowed' : 'pointer',
                opacity: Boolean(todayAtt) ? 0.6 : 1
              }}
            >
              Check In
            </button>
            <button
              onClick={handleCheckOut}
              disabled={checkActionLoading || !todayAtt || Boolean(todayAtt?.checkOut)}
              style={{
                backgroundColor: !todayAtt || Boolean(todayAtt?.checkOut) ? '#94a3b8' : '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.65rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: !todayAtt || Boolean(todayAtt?.checkOut) || checkActionLoading ? 'not-allowed' : 'pointer',
                opacity: !todayAtt || Boolean(todayAtt?.checkOut) ? 0.6 : 1
              }}
            >
              Check Out
            </button>
          </div>
        </div>

        {checkSuccess && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
            {checkSuccess}
          </div>
        )}

        {checkError && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
            {checkError}
          </div>
        )}

        {/* Stats Grid: Hours this week, Late count, Last Payslip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {/* Hours this week vs 40 */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              Hours This Week
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0.25rem 0' }}>
              {hours} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>/ {targetHours} hrs</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden', marginTop: '0.5rem' }}>
              <div style={{ width: `${hoursPercent}%`, height: '100%', backgroundColor: '#2563eb' }} />
            </div>
          </div>

          {/* Late Count */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              Late Arrivals (This Month)
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: data?.lateCountMonth > 0 ? '#d97706' : '#16a34a', margin: '0.25rem 0' }}>
              {data?.lateCountMonth || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Grace period: 15 mins (09:15)</div>
          </div>

          {/* Last Payslip */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
                Latest Payslip
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: '700', color: '#16a34a', margin: '0.25rem 0' }}>
                {lastSlip ? `PKR ${(lastSlip.net || 0).toLocaleString()}` : 'None Issued'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {lastSlip ? `Finalized for ${lastSlip.month}` : 'No finalized cycles yet'}
              </div>
            </div>
            <Link to="/payslips" style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: '600', marginTop: '0.5rem' }}>
              View Payslips →
            </Link>
          </div>
        </div>

        {/* Leave Balance Cards */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: '600' }}>Leave Balances</h3>
            <Link to="/leave" style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: '600' }}>
              Apply for Leave →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'Annual', quota: balances.annual, color: '#2563eb' },
              { label: 'Sick', quota: balances.sick, color: '#16a34a' },
              { label: 'Casual', quota: balances.casual, color: '#f59e0b' },
              { label: 'Unpaid', quota: 'Unlimited', color: '#64748b' }
            ].map((b) => (
              <div key={b.label} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>{b.label}</div>
                <div style={{ fontSize: '1.35rem', fontWeight: '700', color: b.color, marginTop: '0.25rem' }}>
                  {b.quota}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>days left</div>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements Widget */}
        {announcements.length > 0 && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '600' }}>Company Notices</h3>
              <Link to="/announcements" style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: '600' }}>
                View All →
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {announcements.map((a) => (
                <div key={a.id} style={{ borderLeft: '3px solid #2563eb', paddingLeft: '0.75rem' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#1e293b' }}>{a.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>{a.content || a.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Admin / HR Dashboard view
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            Overview ({user?.role?.toUpperCase()})
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            Workforce summary and today's operational indicators.
          </p>
        </div>
      </div>

      <ErrorBox error={error} onRetry={fetchDashboard} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
            Total Employees
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginTop: '0.25rem' }}>
            {data?.totalEmployees || 0}
          </div>
        </div>

        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
            Present Today
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a', marginTop: '0.25rem' }}>
            {data?.presentToday || 0}
          </div>
        </div>

        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
            On Leave Today
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b', marginTop: '0.25rem' }}>
            {data?.onLeaveToday || 0}
          </div>
        </div>

        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
            Pending Corrections
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626', marginTop: '0.25rem' }}>
            {data?.pendingCorrections || 0}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
