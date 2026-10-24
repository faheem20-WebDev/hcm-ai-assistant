import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Loading from '../components/Loading';
import ErrorBox from '../components/ErrorBox';

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 0.85rem',
          boxShadow: 'var(--shadow-md)',
          fontSize: '0.8rem',
          color: 'var(--text)'
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
          {label}
        </div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: entry.color
              }}
            />
            <span style={{ color: 'var(--text-muted)' }}>{entry.name}:</span>
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>
              {formatter ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { user } = useAuth();
  const role = user?.role;
  const isEmployee = role === 'employee';
  const isHr = role === 'hr';
  const isAdmin = role === 'admin';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters for Admin / HR
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  // AI Summary State
  const [summaryBullets, setSummaryBullets] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  // Employee Check-In/Out states
  const [checkActionLoading, setCheckActionLoading] = useState(false);
  const [checkSuccess, setCheckSuccess] = useState(null);
  const [checkError, setCheckError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = '/dashboard/me';
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      if (departmentId) params.append('departmentId', departmentId);

      const qs = params.toString() ? `?${params.toString()}` : '';

      if (isAdmin) endpoint = `/dashboard/admin${qs}`;
      else if (isHr) endpoint = `/dashboard/hr${qs}`;
      else endpoint = `/dashboard/me`;

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
  }, [role, fromDate, toDate, departmentId]);

  // AI Summary Trigger
  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await api.post('/ai/summary', { dashboard: data });
      setSummaryBullets(res.data?.bullets || []);
    } catch (err) {
      setSummaryError(err?.response?.data?.error || 'Failed to generate AI executive summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  // Employee Check In
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

  // Employee Check Out
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

  // =========================================================================
  // EMPLOYEE VIEW
  // =========================================================================
  if (isEmployee) {
    const todayAtt = data?.todayAttendance;
    const hours = data?.hoursThisWeek || 0;
    const targetHours = data?.targetHours || 40;
    const hoursPercent = Math.min(100, Math.round((hours / targetHours) * 100));
    const balances = data?.leaveBalance || { annual: 0, sick: 0, casual: 0, unpaid: 0 };
    const lastSlip = data?.lastPayslip;
    const announcements = data?.announcements || [];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
        {/* Employee Header */}
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div className="page-header-info">
            <h1>Welcome back, {data?.name || user?.name}!</h1>
            <p>
              {new Date().toLocaleDateString('en-PK', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'Asia/Karachi'
              })}{' '}
              (Asia/Karachi)
            </p>
          </div>

          <Link to="/ai" className="btn btn-secondary" style={{ gap: '0.45rem' }}>
            <span style={{ color: 'var(--primary)', fontSize: '1rem' }}>✨</span>
            Ask AI Assistant
          </Link>
        </div>

        {/* Hero Attendance Card */}
        <div
          className="card"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)',
            borderColor: todayAtt ? 'var(--border)' : 'rgba(91, 91, 214, 0.3)'
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              Today's Attendance Status
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text)', marginTop: '0.35rem' }}>
              {!todayAtt ? (
                <span style={{ color: 'var(--warning)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--warning)',
                      display: 'inline-block'
                    }}
                  />
                  Not Checked In
                </span>
              ) : todayAtt.checkOut ? (
                <span style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--success)',
                      display: 'inline-block'
                    }}
                  />
                  Completed (In: {todayAtt.checkIn} | Out: {todayAtt.checkOut})
                </span>
              ) : (
                <span style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary)',
                      display: 'inline-block'
                    }}
                  />
                  Checked In at {todayAtt.checkIn}
                </span>
              )}
            </div>
            {todayAtt?.status && (
              <div style={{ marginTop: '0.5rem' }}>
                <span className={`badge badge-${todayAtt.status}`}>
                  Status: {todayAtt.status.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={checkActionLoading || Boolean(todayAtt)}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.4rem' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
              </svg>
              Check In
            </button>
            <button
              type="button"
              onClick={handleCheckOut}
              disabled={checkActionLoading || !todayAtt || Boolean(todayAtt?.checkOut)}
              className="btn btn-secondary"
              style={{ padding: '0.65rem 1.4rem' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Check Out
            </button>
          </div>
        </div>

        {checkSuccess && (
          <div
            style={{
              backgroundColor: 'var(--success-bg)',
              border: '1px solid var(--success-border)',
              color: 'var(--success)',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>✓</span> {checkSuccess}
          </div>
        )}

        {checkError && <ErrorBox error={checkError} />}

        {/* Employee KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="kpi-card">
            <div className="kpi-top">
              <span className="kpi-title">Hours This Week</span>
              <div className="kpi-icon" style={{ backgroundColor: 'rgba(91, 91, 214, 0.12)', color: 'var(--primary)' }}>
                ⏱️
              </div>
            </div>
            <div className="kpi-val">
              {hours} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {targetHours} hrs</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--surface-3)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginTop: '0.25rem' }}>
              <div
                style={{
                  width: `${hoursPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.6s ease'
                }}
              />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-top">
              <span className="kpi-title">Late Arrivals (Month)</span>
              <div
                className="kpi-icon"
                style={{
                  backgroundColor: data?.lateCountMonth > 0 ? 'var(--warning-bg)' : 'var(--success-bg)',
                  color: data?.lateCountMonth > 0 ? 'var(--warning)' : 'var(--success)'
                }}
              >
                ⚠️
              </div>
            </div>
            <div className="kpi-val" style={{ color: data?.lateCountMonth > 0 ? 'var(--warning)' : 'var(--success)' }}>
              {data?.lateCountMonth || 0}
            </div>
            <div className="kpi-sub">Grace threshold: 09:15 AM</div>
          </div>

          <div className="kpi-card" style={{ justifyContent: 'space-between' }}>
            <div>
              <div className="kpi-top">
                <span className="kpi-title">Latest Payslip</span>
                <div className="kpi-icon" style={{ backgroundColor: 'rgba(20, 184, 166, 0.12)', color: 'var(--accent)' }}>
                  💵
                </div>
              </div>
              <div className="kpi-val" style={{ color: 'var(--accent)', fontSize: '1.4rem' }}>
                {lastSlip ? `PKR ${(lastSlip.net || 0).toLocaleString()}` : 'None Issued'}
              </div>
              <div className="kpi-sub">
                {lastSlip ? `Finalized for ${lastSlip.month}` : 'No finalized cycles yet'}
              </div>
            </div>
            <Link
              to="/payslips"
              style={{
                fontSize: '0.8rem',
                color: 'var(--primary)',
                fontWeight: 600,
                marginTop: '0.5rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              View Payslips →
            </Link>
          </div>
        </div>

        {/* Leave Balances Grid */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0 }}>Leave Balances</h3>
            <Link to="/leave" className="btn btn-secondary btn-sm">
              Apply for Leave →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'Annual', quota: balances.annual, color: 'var(--primary)' },
              { label: 'Sick', quota: balances.sick, color: 'var(--accent)' },
              { label: 'Casual', quota: balances.casual, color: 'var(--warning)' },
              { label: 'Unpaid', quota: 'Unlimited', color: 'var(--text-muted)' }
            ].map((b) => (
              <div
                key={b.label}
                style={{
                  backgroundColor: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  {b.label}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: b.color, marginTop: '0.25rem' }}>
                  {b.quota}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>days left</div>
              </div>
            ))}
          </div>
        </div>

        {/* Company Notices */}
        {announcements.length > 0 && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Company Notices</h3>
              <Link to="/announcements" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                View All →
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {announcements.map((a) => (
                <div
                  key={a.id}
                  style={{
                    borderLeft: '3px solid var(--primary)',
                    paddingLeft: '0.85rem',
                    paddingTop: '0.2rem',
                    paddingBottom: '0.2rem'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>{a.title}</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {a.content || a.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // HR & ADMIN VIEWS
  // =========================================================================
  const deptList = data?.departments || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
      {/* Top Header & Actions */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-info">
          <h1>{isAdmin ? 'Executive Administration Dashboard' : 'Human Resources Analytics Dashboard'}</h1>
          <p>Live workforce metrics, departmental statistics, and AI executive summaries.</p>
        </div>

        {/* AI Summarize Action */}
        <button
          type="button"
          onClick={handleGenerateSummary}
          disabled={summaryLoading}
          className="btn btn-primary"
          style={{ gap: '0.5rem' }}
        >
          <span style={{ fontSize: '1rem' }}>✨</span>
          {summaryLoading ? 'Generating Summary...' : 'Summarize with AI'}
        </button>
      </div>

      <ErrorBox error={error} onRetry={fetchDashboard} />
      <ErrorBox error={summaryError} />

      {/* AI Summary Card */}
      {summaryBullets && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(91, 91, 214, 0.05), rgba(20, 184, 166, 0.05))',
            borderColor: 'rgba(91, 91, 214, 0.3)',
            animation: 'scaleIn 0.25s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'rgba(91, 91, 214, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem'
              }}
            >
              ✨
            </div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>
              Executive Dashboard Summary
            </h3>
            <span className="ai-badge">AI-generated</span>
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.25rem',
              color: 'var(--text)',
              fontSize: '0.875rem',
              lineHeight: '1.65'
            }}
          >
            {summaryBullets.map((bullet, idx) => (
              <li key={idx} style={{ marginBottom: '0.25rem' }}>{bullet}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Global Filter Bar */}
      <div
        className="card"
        style={{
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.85rem'
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>Filters:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <label style={{ color: 'var(--text-muted)' }}>From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="input"
            style={{ padding: '0.35rem 0.65rem', width: 'auto', fontSize: '0.8rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <label style={{ color: 'var(--text-muted)' }}>To:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="input"
            style={{ padding: '0.35rem 0.65rem', width: 'auto', fontSize: '0.8rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <label style={{ color: 'var(--text-muted)' }}>Department:</label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="select"
            style={{ padding: '0.35rem 0.65rem', width: 'auto', fontSize: '0.8rem' }}
          >
            <option value="">All Departments</option>
            {deptList.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {(fromDate || toDate || departmentId) && (
          <button
            type="button"
            onClick={() => { setFromDate(''); setToDate(''); setDepartmentId(''); }}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--danger)', fontWeight: 600 }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. HR DASHBOARD CONTENT */}
      {/* ------------------------------------------------------------- */}
      {isHr && (
        <>
          {/* HR KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Total Headcount</span>
                <div className="kpi-icon" style={{ backgroundColor: 'rgba(91, 91, 214, 0.12)', color: 'var(--primary)' }}>
                  👥
                </div>
              </div>
              <div className="kpi-val">{data?.headcount || 0}</div>
              <div className="kpi-sub">Active workforce</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Present Today</span>
                <div className="kpi-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
                  ✓
                </div>
              </div>
              <div className="kpi-val" style={{ color: 'var(--success)' }}>{data?.presentToday || 0}</div>
              <div className="kpi-sub">Checked-in employees</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">On Leave Today</span>
                <div className="kpi-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: 'var(--info)' }}>
                  ✈️
                </div>
              </div>
              <div className="kpi-val" style={{ color: 'var(--info)' }}>{data?.onLeaveToday || 0}</div>
              <div className="kpi-sub">Approved time off</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Late Today</span>
                <div className="kpi-icon" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
                  ⏱️
                </div>
              </div>
              <div className="kpi-val" style={{ color: 'var(--warning)' }}>{data?.lateToday || 0}</div>
              <div className="kpi-sub">Past grace period</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Pending Approvals</span>
                <div className="kpi-icon" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>
                  ⏳
                </div>
              </div>
              <div className="kpi-val" style={{ color: 'var(--danger)' }}>{data?.pendingApprovals || 0}</div>
              <div className="kpi-sub">Leaves & corrections</div>
            </div>
          </div>

          {/* Recharts: Attendance Trend Line & Absenteeism By Dept Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
            <div className="card">
              <h3 style={{ margin: '0 0 1rem 0' }}>Weekly Attendance Trend</h3>
              <div style={{ height: '250px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.attendanceTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="present" stroke="var(--success)" strokeWidth={2.5} name="Present" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="late" stroke="var(--warning)" strokeWidth={2.5} name="Late" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h3 style={{ margin: '0 0 1rem 0' }}>Absenteeism Rate by Department (%)</h3>
              <div style={{ height: '250px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.absenteeismByDept || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="dept" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="rate" fill="var(--danger)" radius={[6, 6, 0, 0]} name="Absenteeism %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recharts: Leave by Type & Top 5 Late-Comers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
            <div className="card">
              <h3 style={{ margin: '0 0 1rem 0' }}>Leave Distribution by Type</h3>
              <div style={{ height: '230px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.leaveByType || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis dataKey="name" type="category" width={90} stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="var(--primary)" radius={[0, 6, 6, 0]} name="Days Taken" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h3 style={{ margin: '0 0 0.85rem 0' }}>Top 5 Frequent Late-Comers (Month)</h3>
              <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th style={{ textAlign: 'right' }}>Occurrences</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.topLateComers || []).length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                          No late arrivals recorded this month.
                        </td>
                      </tr>
                    ) : (
                      (data?.topLateComers || []).map((emp) => (
                        <tr key={emp.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text)' }}>{emp.name}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{emp.dept}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--warning)' }}>
                            {emp.count} times
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. ADMIN DASHBOARD CONTENT */}
      {/* ------------------------------------------------------------- */}
      {isAdmin && (
        <>
          {/* Admin KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Active Headcount</span>
                <div className="kpi-icon" style={{ backgroundColor: 'rgba(91, 91, 214, 0.12)', color: 'var(--primary)' }}>
                  👥
                </div>
              </div>
              <div className="kpi-val">{data?.headcount || 0}</div>
              <div className="kpi-sub">Total enrolled staff</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Attrition Rate (YTD)</span>
                <div className="kpi-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
                  📊
                </div>
              </div>
              <div className="kpi-val" style={{ color: 'var(--success)' }}>{data?.attritionYtd || '0%'}</div>
              <div className="kpi-sub">Annual retention index</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Monthly Payroll Cost</span>
                <div className="kpi-icon" style={{ backgroundColor: 'rgba(20, 184, 166, 0.12)', color: 'var(--accent)' }}>
                  💳
                </div>
              </div>
              <div className="kpi-val" style={{ color: 'var(--primary)', fontSize: '1.45rem' }}>
                PKR {(data?.payrollCost || 0).toLocaleString()}
              </div>
              <div className="kpi-sub">Total monthly outlay</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Average Gross Salary</span>
                <div className="kpi-icon" style={{ backgroundColor: 'rgba(91, 91, 214, 0.12)', color: 'var(--primary)' }}>
                  💰
                </div>
              </div>
              <div className="kpi-val" style={{ fontSize: '1.45rem' }}>
                PKR {(data?.avgSalary || 0).toLocaleString()}
              </div>
              <div className="kpi-sub">Per active employee</div>
            </div>
          </div>

          {/* Recharts: Headcount By Dept & Payroll Cost By Dept */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
            <div className="card">
              <h3 style={{ margin: '0 0 1rem 0' }}>Headcount by Department</h3>
              <div style={{ height: '250px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.headcountByDept || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="dept" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} name="Headcount" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h3 style={{ margin: '0 0 1rem 0' }}>Payroll Cost by Department (PKR)</h3>
              <div style={{ height: '250px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.payrollByDept || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="dept" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip
                      content={
                        <CustomTooltip
                          formatter={(value) => `PKR ${Number(value).toLocaleString()}`}
                        />
                      }
                    />
                    <Bar dataKey="cost" fill="var(--accent)" radius={[6, 6, 0, 0]} name="Monthly Cost" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Last Audit Entries */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>Recent System Audit Trails</h3>
              <Link to="/audit" className="btn btn-secondary btn-sm">
                View Full Audit →
              </Link>
            </div>
            <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentAudits || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                        No audit events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    (data?.recentAudits || []).map((a) => (
                      <tr key={a.id}>
                        <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                          {a.timestamp ? new Date(a.timestamp).toLocaleString() : '-'}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>{a.actor}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: 'rgba(91, 91, 214, 0.12)',
                              color: 'var(--primary)',
                              border: '1px solid rgba(91, 91, 214, 0.25)'
                            }}
                          >
                            {a.action}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{a.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
