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
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Loading from '../components/Loading';
import ErrorBox from '../components/ErrorBox';

const PIE_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#8b5cf6', '#dc2626'];

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
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
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

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              Late Arrivals (This Month)
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: data?.lateCountMonth > 0 ? '#d97706' : '#16a34a', margin: '0.25rem 0' }}>
              {data?.lateCountMonth || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Grace threshold: 09:15</div>
          </div>

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

  // =========================================================================
  // HR & ADMIN VIEWS (Items 1 & 2)
  // =========================================================================
  const deptList = data?.departments || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            {isAdmin ? 'Executive Administration Dashboard' : 'Human Resources Analytics Dashboard'}
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            Live workforce metrics, departmental statistics, and AI executive summaries.
          </p>
        </div>

        {/* AI Summarize Action */}
        <button
          onClick={handleGenerateSummary}
          disabled={summaryLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: '#7c3aed',
            color: '#ffffff',
            border: 'none',
            padding: '0.6rem 1.1rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: summaryLoading ? 'not-allowed' : 'pointer',
            opacity: summaryLoading ? 0.7 : 1
          }}
        >
          {summaryLoading ? 'Generating...' : '✨ Summarize with AI'}
        </button>
      </div>

      <ErrorBox error={error} onRetry={fetchDashboard} />
      <ErrorBox error={summaryError} />

      {/* AI Summary Card */}
      {summaryBullets && (
        <div style={{
          backgroundColor: '#faf5ff',
          border: '1px solid #d8b4fe',
          borderRadius: '8px',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>💡</span>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#581c87' }}>
              Executive Dashboard Summary
            </h3>
            <span className="ai-badge">AI-generated</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#3b0764', fontSize: '0.85rem', lineHeight: '1.6' }}>
            {summaryBullets.map((bullet, idx) => (
              <li key={idx}>{bullet}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Global Filter Bar (From Date, To Date, Department) */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        fontSize: '0.85rem'
      }}>
        <span style={{ fontWeight: '600', color: '#334155' }}>Filters:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <label style={{ color: '#64748b' }}>From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{ padding: '0.35rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <label style={{ color: '#64748b' }}>To:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{ padding: '0.35rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <label style={{ color: '#64748b' }}>Department:</label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            style={{ padding: '0.35rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem' }}
          >
            <option value="">All Departments</option>
            {deptList.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {(fromDate || toDate || departmentId) && (
          <button
            onClick={() => { setFromDate(''); setToDate(''); setDepartmentId(''); }}
            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500' }}
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
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Total Headcount</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#0f172a', marginTop: '0.25rem' }}>{data?.headcount || 0}</div>
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Present Today</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#16a34a', marginTop: '0.25rem' }}>{data?.presentToday || 0}</div>
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>On Leave Today</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#2563eb', marginTop: '0.25rem' }}>{data?.onLeaveToday || 0}</div>
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Late Today</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#f59e0b', marginTop: '0.25rem' }}>{data?.lateToday || 0}</div>
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Pending Approvals</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#dc2626', marginTop: '0.25rem' }}>{data?.pendingApprovals || 0}</div>
            </div>
          </div>

          {/* Recharts: Attendance Trend Line & Absenteeism By Dept Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#0f172a' }}>Weekly Attendance Trend</h3>
              <div style={{ height: '240px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.attendanceTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="present" stroke="#16a34a" strokeWidth={2} name="Present" />
                    <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} name="Late" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#0f172a' }}>Absenteeism Rate by Department (%)</h3>
              <div style={{ height: '240px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.absenteeismByDept || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="dept" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="rate" fill="#ef4444" radius={[4, 4, 0, 0]} name="Absenteeism %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recharts: Leave by Type & Top 5 Late-Comers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#0f172a' }}>Leave Distribution by Type</h3>
              <div style={{ height: '220px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.leaveByType || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} name="Days Taken" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#0f172a' }}>Top 5 Frequent Late-Comers (Month)</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.5rem 0' }}>Employee</th>
                    <th style={{ padding: '0.5rem 0' }}>Department</th>
                    <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Occurrences</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.topLateComers || []).map((emp) => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem 0', fontWeight: '600', color: '#1e293b' }}>{emp.name}</td>
                      <td style={{ padding: '0.5rem 0', color: '#64748b' }}>{emp.dept}</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: '700', color: '#d97706' }}>
                        {emp.count} times
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Active Headcount</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#0f172a', marginTop: '0.25rem' }}>{data?.headcount || 0}</div>
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Attrition Rate (YTD)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#16a34a', marginTop: '0.25rem' }}>{data?.attritionYtd || '0%'}</div>
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Monthly Payroll Cost</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb', marginTop: '0.25rem' }}>
                PKR {(data?.payrollCost || 0).toLocaleString()}
              </div>
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Average Gross Salary</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginTop: '0.25rem' }}>
                PKR {(data?.avgSalary || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Recharts: Headcount By Dept & Payroll Cost By Dept */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#0f172a' }}>Headcount by Department</h3>
              <div style={{ height: '240px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.headcountByDept || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="dept" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Headcount" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#0f172a' }}>Payroll Cost by Department (PKR)</h3>
              <div style={{ height: '240px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.payrollByDept || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="dept" />
                    <YAxis />
                    <Tooltip formatter={(value) => `PKR ${value.toLocaleString()}`} />
                    <Bar dataKey="cost" fill="#16a34a" radius={[4, 4, 0, 0]} name="Monthly Cost" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Last Audit Entries */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a' }}>Recent System Audit Trails</h3>
              <Link to="/audit" style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: '600' }}>
                View Full Audit →
              </Link>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '0.5rem 0' }}>Timestamp</th>
                  <th style={{ padding: '0.5rem 0' }}>Actor</th>
                  <th style={{ padding: '0.5rem 0' }}>Action</th>
                  <th style={{ padding: '0.5rem 0' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentAudits || []).map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem 0', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {a.timestamp ? new Date(a.timestamp).toLocaleString() : '-'}
                    </td>
                    <td style={{ padding: '0.5rem 0', fontWeight: '600', color: '#1e293b' }}>{a.actor}</td>
                    <td style={{ padding: '0.5rem 0' }}>
                      <span style={{
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: '#e0e7ff',
                        color: '#3730a3'
                      }}>
                        {a.action}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem 0', color: '#475569' }}>{a.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
