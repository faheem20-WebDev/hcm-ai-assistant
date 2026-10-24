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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            Organization Configuration
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            {isAdmin ? 'Manage corporate settings, departments, designations, and leave policies.' : 'View organization setup and company rules (Read-only).'}
          </p>
        </div>

        {isAdmin && activeTab !== 'settings' && (
          <button
            onClick={() => openModal()}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.55rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            + Add New
          </button>
        )}
      </div>

      {success && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      <ErrorBox error={error} />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #cbd5e1', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {[
          { id: 'settings', label: 'Settings' },
          { id: 'departments', label: 'Departments' },
          { id: 'designations', label: 'Designations' },
          { id: 'leave-types', label: 'Leave Types' },
          { id: 'holidays', label: 'Holidays' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.65rem 1.1rem',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
              color: activeTab === tab.id ? '#2563eb' : '#64748b',
              fontWeight: activeTab === tab.id ? '600' : '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
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
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', maxWidth: '720px' }}>
              <form onSubmit={handleSettingsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={settings.companyName || ''}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                      Office Start Time
                    </label>
                    <input
                      type="time"
                      disabled={!isAdmin}
                      value={settings.workStartTime || '09:00'}
                      onChange={(e) => setSettings({ ...settings, workStartTime: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                      Grace Minutes
                    </label>
                    <input
                      type="number"
                      disabled={!isAdmin}
                      value={settings.graceMinutes || 15}
                      onChange={(e) => setSettings({ ...settings, graceMinutes: Number(e.target.value) })}
                      style={{ width: '100%', padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                      Half-Day Min Work Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      disabled={!isAdmin}
                      value={settings.minWorkHoursHalfDay || 5}
                      onChange={(e) => setSettings({ ...settings, minWorkHoursHalfDay: Number(e.target.value) })}
                      style={{ width: '100%', padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Weekend Days
                  </label>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#334155' }}>
                    {['Friday', 'Saturday', 'Sunday'].map((day) => {
                      const isChecked = (settings.weekendDays || []).includes(day);
                      return (
                        <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
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

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a' }}>Office Geofence</span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={handleUseMyLocation}
                        style={{
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        📍 Use my location
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        disabled={!isAdmin}
                        value={settings.officeLat || 0}
                        onChange={(e) => setSettings({ ...settings, officeLat: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        disabled={!isAdmin}
                        value={settings.officeLng || 0}
                        onChange={(e) => setSettings({ ...settings, officeLng: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
                        Radius (meters)
                      </label>
                      <input
                        type="number"
                        disabled={!isAdmin}
                        value={settings.officeRadiusMeters || 150}
                        onChange={(e) => setSettings({ ...settings, officeRadiusMeters: parseInt(e.target.value) || 150 })}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.65rem 1.25rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      marginTop: '0.5rem'
                    }}
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
                action={isAdmin && <button onClick={() => openModal()} style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add Department</button>}
              />
            ) : (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Department Name</th>
                      <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Code</th>
                      {isAdmin && <th style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#475569', fontWeight: '600' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((dept) => (
                      <tr key={dept.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '500' }}>{dept.name}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{dept.code || '-'}</td>
                        {isAdmin && (
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <button
                              onClick={() => openModal(dept)}
                              style={{ marginRight: '0.5rem', background: 'none', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(dept.id)}
                              style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              Delete
                            </button>
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
                action={isAdmin && <button onClick={() => openModal()} style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add Designation</button>}
              />
            ) : (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Title</th>
                      <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Department</th>
                      {isAdmin && <th style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#475569', fontWeight: '600' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {designations.map((des) => {
                      const dept = departments.find((d) => d.id === des.departmentId);
                      return (
                        <tr key={des.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '500' }}>{des.title}</td>
                          <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{dept?.name || '-'}</td>
                          {isAdmin && (
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                              <button
                                onClick={() => openModal(des)}
                                style={{ marginRight: '0.5rem', background: 'none', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(des.id)}
                                style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}
                              >
                                Delete
                              </button>
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
                action={isAdmin && <button onClick={() => openModal()} style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add Leave Type</button>}
              />
            ) : (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Leave Type</th>
                      <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Yearly Quota (Days)</th>
                      <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Type</th>
                      {isAdmin && <th style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#475569', fontWeight: '600' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {leaveTypes.map((lt) => (
                      <tr key={lt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '500' }}>{lt.name}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>{lt.quota}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: lt.paid ? '#dcfce7' : '#f1f5f9',
                            color: lt.paid ? '#15803d' : '#64748b'
                          }}>
                            {lt.paid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <button
                              onClick={() => openModal(lt)}
                              style={{ marginRight: '0.5rem', background: 'none', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(lt.id)}
                              style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              Delete
                            </button>
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
                action={isAdmin && <button onClick={() => openModal()} style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add Holiday</button>}
              />
            ) : (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Date</th>
                      <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Holiday Name</th>
                      {isAdmin && <th style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#475569', fontWeight: '600' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {holidays.map((hol) => (
                      <tr key={hol.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '500', color: '#1e293b' }}>{hol.date}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{hol.name}</td>
                        {isAdmin && (
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <button
                              onClick={() => openModal(hol)}
                              style={{ marginRight: '0.5rem', background: 'none', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(hol.id)}
                              style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              Delete
                            </button>
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
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem', color: '#0f172a' }}>
              {editingItem ? 'Edit' : 'Add New'} {activeTab.replace('-', ' ')}
            </h3>

            <form onSubmit={handleModalSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activeTab === 'departments' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Department Name</label>
                    <input
                      type="text"
                      required
                      value={modalForm.name || ''}
                      onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Code</label>
                    <input
                      type="text"
                      placeholder="e.g. ENG"
                      value={modalForm.code || ''}
                      onChange={(e) => setModalForm({ ...modalForm, code: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                </>
              )}

              {activeTab === 'designations' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Designation Title</label>
                    <input
                      type="text"
                      required
                      value={modalForm.title || ''}
                      onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Department</label>
                    <select
                      value={modalForm.departmentId || ''}
                      onChange={(e) => setModalForm({ ...modalForm, departmentId: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
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
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Leave Name</label>
                    <input
                      type="text"
                      required
                      value={modalForm.name || ''}
                      onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Yearly Quota (Days)</label>
                    <input
                      type="number"
                      required
                      value={modalForm.quota ?? 0}
                      onChange={(e) => setModalForm({ ...modalForm, quota: parseInt(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
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
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Date (YYYY-MM-DD)</label>
                    <input
                      type="date"
                      required
                      value={modalForm.date || ''}
                      onChange={(e) => setModalForm({ ...modalForm, date: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Holiday Name</label>
                    <input
                      type="text"
                      required
                      value={modalForm.name || ''}
                      onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
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
