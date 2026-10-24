import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Loading from '../components/Loading';
import Empty from '../components/Empty';
import ErrorBox from '../components/ErrorBox';

const Organization = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('settings');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Tab Data States
  const [settings, setSettings] = useState({
    companyName: '',
    workStartTime: '09:00',
    graceMinutes: 15,
    minWorkHoursHalfDay: 5,
    weekendDays: ['Saturday', 'Sunday'],
    officeLat: 24.8607,
    officeLng: 67.0011,
    officeRadiusMeters: 150
  });

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [holidays, setHolidays] = useState([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalForm, setModalForm] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTabData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'settings') {
        const res = await api.get('/settings');
        setSettings(res.data);
      } else if (activeTab === 'departments') {
        const res = await api.get('/departments');
        setDepartments(res.data?.items || []);
      } else if (activeTab === 'designations') {
        const [desRes, deptRes] = await Promise.all([
          api.get('/designations'),
          api.get('/departments')
        ]);
        setDesignations(desRes.data?.items || []);
        setDepartments(deptRes.data?.items || []);
      } else if (activeTab === 'leave-types') {
        const res = await api.get('/leave-types');
        setLeaveTypes(res.data?.items || []);
      } else if (activeTab === 'holidays') {
        const res = await api.get('/holidays');
        setHolidays(res.data?.items || []);
      }
    } catch (err) {
      setError(err?.response?.data?.error || `Failed to load ${activeTab} data.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabData();
    setSuccess(null);
  }, [activeTab]);

  // Settings Save
  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.put('/settings', settings);
      setSuccess('Settings updated successfully.');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update settings.');
    } finally {
      setActionLoading(false);
    }
  };

  // Geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSettings((prev) => ({
          ...prev,
          officeLat: Number(pos.coords.latitude.toFixed(6)),
          officeLng: Number(pos.coords.longitude.toFixed(6))
        }));
        setSuccess('Fetched current coordinates.');
      },
      (err) => {
        setError(`Location access error: ${err.message}`);
      }
    );
  };

  // Open Add/Edit Modal
  const openModal = (item = null) => {
    setEditingItem(item);
    if (activeTab === 'departments') {
      setModalForm(item ? { ...item } : { name: '', code: '' });
    } else if (activeTab === 'designations') {
      setModalForm(item ? { ...item } : { title: '', departmentId: departments[0]?.id || '' });
    } else if (activeTab === 'leave-types') {
      setModalForm(item ? { ...item } : { name: '', quota: 10, paid: true });
    } else if (activeTab === 'holidays') {
      setModalForm(item ? { ...item } : { name: '', date: '' });
    }
    setModalOpen(true);
  };

  // Save Modal Form
  const handleModalSave = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = `/${activeTab}`;
      if (editingItem) {
        await api.put(`${endpoint}/${editingItem.id}`, modalForm);
        setSuccess('Item updated successfully.');
      } else {
        await api.post(endpoint, modalForm);
        setSuccess('Item created successfully.');
      }
      setModalOpen(false);
      fetchTabData();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save changes.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Item
  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/${activeTab}/${id}`);
      setSuccess('Item deleted successfully.');
      fetchTabData();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to delete item.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-info">
          <h1>Organization Configuration</h1>
          <p>
            {isAdmin
              ? 'Manage corporate settings, departments, designations, and leave policies.'
              : 'View organization setup and company rules (Read-only).'}
          </p>
        </div>

        {isAdmin && activeTab !== 'settings' && (
          <button
            type="button"
            onClick={() => openModal()}
            className="btn btn-primary"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New
          </button>
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

      {/* Tabs */}
      <div className="tabs-nav" style={{ marginBottom: 0 }}>
        {[
          { id: 'settings', label: 'Company Settings' },
          { id: 'departments', label: 'Departments' },
          { id: 'designations', label: 'Designations' },
          { id: 'leave-types', label: 'Leave Types' },
          { id: 'holidays', label: 'Holidays' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <Loading message={`Loading ${activeTab}...`} />}

      {!loading && (
        <>
          {/* 1. SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="card" style={{ maxWidth: '780px' }}>
              <form onSubmit={handleSettingsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={settings.companyName || ''}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    className="input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                      Office Start Time
                    </label>
                    <input
                      type="time"
                      disabled={!isAdmin}
                      value={settings.workStartTime || '09:00'}
                      onChange={(e) => setSettings({ ...settings, workStartTime: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                      Grace Minutes
                    </label>
                    <input
                      type="number"
                      disabled={!isAdmin}
                      value={settings.graceMinutes || 15}
                      onChange={(e) => setSettings({ ...settings, graceMinutes: Number(e.target.value) })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                      Half-Day Min Work Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      disabled={!isAdmin}
                      value={settings.minWorkHoursHalfDay || 5}
                      onChange={(e) => setSettings({ ...settings, minWorkHoursHalfDay: Number(e.target.value) })}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                    Weekend Days
                  </label>
                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.875rem', color: 'var(--text)', marginTop: '0.25rem' }}>
                    {['Friday', 'Saturday', 'Sunday'].map((day) => {
                      const isChecked = (settings.weekendDays || []).includes(day);
                      return (
                        <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: isAdmin ? 'pointer' : 'default' }}>
                          <input
                            type="checkbox"
                            disabled={!isAdmin}
                            checked={isChecked}
                            onChange={(e) => {
                              const current = settings.weekendDays || [];
                              const updated = e.target.checked
                                ? [...current, day]
                                : current.filter((d) => d !== day);
                              setSettings({ ...settings, weekendDays: updated });
                            }}
                          />
                          {day}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)' }}>
                      Office Geofence & Check-In Radius
                    </span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={handleUseMyLocation}
                        className="btn btn-secondary btn-sm"
                        style={{ gap: '0.35rem' }}
                      >
                        📍 Use my location
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        disabled={!isAdmin}
                        value={settings.officeLat || 0}
                        onChange={(e) => setSettings({ ...settings, officeLat: parseFloat(e.target.value) })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        disabled={!isAdmin}
                        value={settings.officeLng || 0}
                        onChange={(e) => setSettings({ ...settings, officeLng: parseFloat(e.target.value) })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        Radius (meters)
                      </label>
                      <input
                        type="number"
                        disabled={!isAdmin}
                        value={settings.officeRadiusMeters || 150}
                        onChange={(e) => setSettings({ ...settings, officeRadiusMeters: parseInt(e.target.value) || 150 })}
                        className="input"
                      />
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn btn-primary"
                    style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
                  >
                    {actionLoading ? 'Saving...' : 'Save Settings'}
                  </button>
                )}
              </form>
            </div>
          )}

          {/* 2. DEPARTMENTS TAB */}
          {activeTab === 'departments' && (
            departments.length === 0 ? (
              <Empty
                title="No departments found"
                description="Create organization departments such as Engineering, HR, or Finance."
                action={
                  isAdmin && (
                    <button
                      type="button"
                      onClick={() => openModal()}
                      className="btn btn-primary"
                      style={{ marginTop: '0.5rem' }}
                    >
                      + Add Department
                    </button>
                  )
                }
              />
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Department Name</th>
                      <th>Code</th>
                      {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((dept) => (
                      <tr key={dept.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>{dept.name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{dept.code || '-'}</td>
                        {isAdmin && (
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => openModal(dept)}
                                className="btn btn-secondary btn-sm"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(dept.id)}
                                className="btn btn-danger btn-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* 3. DESIGNATIONS TAB */}
          {activeTab === 'designations' && (
            designations.length === 0 ? (
              <Empty
                title="No designations found"
                description="Add designations like Senior Engineer or HR Manager."
                action={
                  isAdmin && (
                    <button
                      type="button"
                      onClick={() => openModal()}
                      className="btn btn-primary"
                      style={{ marginTop: '0.5rem' }}
                    >
                      + Add Designation
                    </button>
                  )
                }
              />
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Department</th>
                      {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {designations.map((des) => {
                      const dept = departments.find((d) => d.id === des.departmentId);
                      return (
                        <tr key={des.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text)' }}>{des.title}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{dept?.name || '-'}</td>
                          {isAdmin && (
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => openModal(des)}
                                  className="btn btn-secondary btn-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(des.id)}
                                  className="btn btn-danger btn-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* 4. LEAVE TYPES TAB */}
          {activeTab === 'leave-types' && (
            leaveTypes.length === 0 ? (
              <Empty
                title="No leave types configured"
                description="Define leave policies such as Annual, Sick, Casual, or Unpaid."
                action={
                  isAdmin && (
                    <button
                      type="button"
                      onClick={() => openModal()}
                      className="btn btn-primary"
                      style={{ marginTop: '0.5rem' }}
                    >
                      + Add Leave Type
                    </button>
                  )
                }
              />
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Leave Type</th>
                      <th>Yearly Quota (Days)</th>
                      <th>Type</th>
                      {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {leaveTypes.map((lt) => (
                      <tr key={lt.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>{lt.name}</td>
                        <td style={{ color: 'var(--text)' }}>{lt.quota}</td>
                        <td>
                          <span className={`badge ${lt.paid ? 'badge-present' : 'badge-inactive'}`}>
                            {lt.paid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => openModal(lt)}
                                className="btn btn-secondary btn-sm"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(lt.id)}
                                className="btn btn-danger btn-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* 5. HOLIDAYS TAB */}
          {activeTab === 'holidays' && (
            holidays.length === 0 ? (
              <Empty
                title="No holidays configured"
                description="Define gazetted company holidays."
                action={
                  isAdmin && (
                    <button
                      type="button"
                      onClick={() => openModal()}
                      className="btn btn-primary"
                      style={{ marginTop: '0.5rem' }}
                    >
                      + Add Holiday
                    </button>
                  )
                }
              />
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Holiday Name</th>
                      {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {holidays.map((hol) => (
                      <tr key={hol.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>{hol.date}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{hol.name}</td>
                        {isAdmin && (
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => openModal(hol)}
                                className="btn btn-secondary btn-sm"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(hol.id)}
                                className="btn btn-danger btn-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </>
      )}

      {/* Reusable Simple Modal */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0 }}>
                {editingItem ? 'Edit' : 'Add New'} {activeTab.replace('-', ' ')}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '0.2rem 0.5rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleModalSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activeTab === 'departments' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                      Department Name
                    </label>
                    <input
                      type="text"
                      required
                      value={modalForm.name || ''}
                      onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                      Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ENG"
                      value={modalForm.code || ''}
                      onChange={(e) => setModalForm({ ...modalForm, code: e.target.value })}
                      className="input"
                    />
                  </div>
                </>
              )}

              {activeTab === 'designations' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                      Designation Title
                    </label>
                    <input
                      type="text"
                      required
                      value={modalForm.title || ''}
                      onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                      Department
                    </label>
                    <select
                      value={modalForm.departmentId || ''}
                      onChange={(e) => setModalForm({ ...modalForm, departmentId: e.target.value })}
                      className="select"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'leave-types' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                      Leave Name
                    </label>
                    <input
                      type="text"
                      required
                      value={modalForm.name || ''}
                      onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                      Yearly Quota (Days)
                    </label>
                    <input
                      type="number"
                      required
                      value={modalForm.quota ?? 0}
                      onChange={(e) => setModalForm({ ...modalForm, quota: parseInt(e.target.value) || 0 })}
                      className="input"
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text)' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(modalForm.paid)}
                      onChange={(e) => setModalForm({ ...modalForm, paid: e.target.checked })}
                    />
                    Is Paid Leave
                  </label>
                </>
              )}

              {activeTab === 'holidays' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                      Date (YYYY-MM-DD)
                    </label>
                    <input
                      type="date"
                      required
                      value={modalForm.date || ''}
                      onChange={(e) => setModalForm({ ...modalForm, date: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                      Holiday Name
                    </label>
                    <input
                      type="text"
                      required
                      value={modalForm.name || ''}
                      onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                      className="input"
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                >
                  {actionLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Organization;
