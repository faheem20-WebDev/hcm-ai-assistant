import React, { useState, useEffect } from 'react';
import api from '../api';
import Loading from '../components/Loading';
import Empty from '../components/Empty';
import ErrorBox from '../components/ErrorBox';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Issued Temp Password Notification
  const [tempPassInfo, setTempPassInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  // Register Form State
  const initialRegisterState = {
    name: '',
    email: '',
    departmentId: '',
    designationId: '',
    basicSalary: '',
    phone: '',
    address: '',
    joinedDate: new Date().toISOString().slice(0, 10)
  };
  const [registerForm, setRegisterForm] = useState(initialRegisterState);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    departmentId: '',
    designationId: '',
    basicSalary: '',
    status: 'active',
    phone: '',
    address: ''
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (deptFilter) params.append('departmentId', deptFilter);
      if (statusFilter) params.append('status', statusFilter);

      const [empRes, deptRes, desRes] = await Promise.all([
        api.get(`/employees?${params.toString()}`),
        api.get('/departments'),
        api.get('/designations')
      ]);

      setEmployees(empRes.data?.items || (Array.isArray(empRes.data) ? empRes.data : []));
      setDepartments(deptRes.data?.items || (Array.isArray(deptRes.data) ? deptRes.data : []));
      setDesignations(desRes.data?.items || (Array.isArray(desRes.data) ? desRes.data : []));
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to fetch employee directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, deptFilter, statusFilter]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.post('/employees', registerForm);
      setSuccess(`Employee ${registerForm.name} registered successfully.`);
      setTempPassInfo({
        name: registerForm.name,
        email: registerForm.email,
        tempPassword: res.data?.tempPassword || 'Temp123456!',
        actionType: 'Account Registered'
      });
      setRegisterForm(initialRegisterState);
      setShowRegisterModal(false);
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to register employee.');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (emp) => {
    setEditingEmp(emp);
    setEditForm({
      name: emp.name || '',
      departmentId: emp.departmentId || '',
      designationId: emp.designationId || '',
      basicSalary: emp.basicSalary || '',
      status: emp.status || 'active',
      phone: emp.phone || '',
      address: emp.address || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingEmp) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.put(`/employees/${editingEmp.id}`, editForm);
      setSuccess(`Profile for ${editForm.name} updated.`);
      setShowEditModal(false);
      setEditingEmp(null);
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update employee details.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (emp) => {
    if (!window.confirm(`Generate a new temporary password for ${emp.name} (${emp.email})?`)) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.post(`/users/${emp.id}/reset-password`);
      setTempPassInfo({
        name: emp.name,
        email: emp.email,
        tempPassword: res.data?.tempPassword || 'Reset999999!',
        actionType: 'Password Reset'
      });
      setSuccess(`Temporary password generated for ${emp.name}.`);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to reset employee password.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPin = async (emp) => {
    if (!window.confirm(`Reset 5-digit login PIN for ${emp.name}? They will be required to set a new PIN on next sign in.`)) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post(`/users/${emp.id}/reset-pin`);
      setSuccess(`5-digit PIN for ${emp.name} has been reset. They can configure a new PIN upon sign in.`);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to reset login PIN.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (tempPassInfo?.tempPassword) {
      navigator.clipboard.writeText(tempPassInfo.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getDeptName = (deptId) => {
    const d = departments.find((dept) => dept.id === deptId);
    return d ? d.name : '—';
  };

  const getDesigTitle = (desId) => {
    const des = designations.find((d) => d.id === desId);
    return des ? des.title : '—';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-info">
          <h1>Employees Directory</h1>
          <p>Register new hires, manage personnel records, configure designations, and manage security credentials.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowRegisterModal(true)}
          className="btn btn-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Register Employee
        </button>
      </div>

      {/* Temporary Password Notification Banner */}
      {tempPassInfo && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(91, 91, 214, 0.08) 0%, rgba(20, 184, 166, 0.08) 100%)',
            borderColor: 'var(--primary)',
            padding: '1.25rem 1.5rem',
            animation: 'scaleIn 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.925rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🔑 Temporary Credentials Issued ({tempPassInfo.actionType})
            </span>
            <button
              type="button"
              onClick={() => setTempPassInfo(null)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.2rem 0.5rem', color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          </div>
          <p style={{ margin: '0.5rem 0 0.75rem 0', fontSize: '0.875rem', color: 'var(--text)' }}>
            Provide these initial credentials to <strong>{tempPassInfo.name}</strong> ({tempPassInfo.email}).
            They will be forced to change this temporary password and setup their 5-digit PIN on initial login.
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem 0.75rem',
              maxWidth: '380px'
            }}
          >
            <code style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', flex: 1, letterSpacing: '0.05em' }}>
              {tempPassInfo.tempPassword}
            </code>
            <button
              type="button"
              onClick={handleCopyPassword}
              className={`btn btn-sm ${copied ? 'btn-secondary' : 'btn-primary'}`}
              style={{ padding: '0.3rem 0.75rem' }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

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

      <ErrorBox error={error} onRetry={fetchData} />

      {/* Filters Toolbar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center'
        }}
      >
        <div style={{ flex: '1 1 220px' }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>

        <div style={{ flex: '0 1 190px' }}>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="select"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '0 1 150px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {(searchTerm || deptFilter || statusFilter) && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setDeptFilter('');
              setStatusFilter('');
            }}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--danger)', fontWeight: 600 }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Directory Content */}
      {loading ? (
        <Loading message="Loading employee directory..." />
      ) : employees.length === 0 ? (
        <Empty
          title="No employees found"
          description={
            searchTerm || deptFilter || statusFilter
              ? 'No employee profiles match the specified filters.'
              : 'Zero employees registered. Click "+ Register Employee" above to add your first employee.'
          }
          action={
            !searchTerm && !deptFilter && !statusFilter ? (
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                className="btn btn-primary"
                style={{ marginTop: '0.5rem' }}
              >
                + Register First Employee
              </button>
            ) : null
          }
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>EMPLOYEE ID</th>
                <th>NAME & EMAIL</th>
                <th>DEPARTMENT</th>
                <th>DESIGNATION</th>
                <th>BASIC SALARY</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.825rem' }}>
                    {emp.id}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{emp.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>{emp.email}</div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {getDeptName(emp.departmentId)}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {getDesigTitle(emp.designationId)}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                    PKR {Number(emp.basicSalary || 0).toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge badge-${emp.status || 'active'}`}>
                      {emp.status || 'Active'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => openEditModal(emp)}
                        className="btn btn-secondary btn-sm"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetPassword(emp)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--warning)', borderColor: 'var(--warning-border)' }}
                      >
                        Reset Pwd
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetPin(emp)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--primary)', borderColor: 'rgba(91, 91, 214, 0.3)' }}
                      >
                        Reset PIN
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Register Employee Modal */}
      {showRegisterModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0 }}>Register New Employee</h2>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '0.2rem 0.5rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                  Work Email *
                </label>
                <input
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  placeholder="e.g. john@company.com"
                  className="input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                    Department *
                  </label>
                  <select
                    required
                    value={registerForm.departmentId}
                    onChange={(e) => setRegisterForm({ ...registerForm, departmentId: e.target.value })}
                    className="select"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                    Designation *
                  </label>
                  <select
                    required
                    value={registerForm.designationId}
                    onChange={(e) => setRegisterForm({ ...registerForm, designationId: e.target.value })}
                    className="select"
                  >
                    <option value="">Select Designation</option>
                    {designations
                      .filter((des) => !registerForm.departmentId || des.departmentId === registerForm.departmentId)
                      .map((des) => (
                        <option key={des.id} value={des.id}>{des.title}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                    Basic Monthly Salary (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={registerForm.basicSalary}
                    onChange={(e) => setRegisterForm({ ...registerForm, basicSalary: e.target.value })}
                    placeholder="e.g. 150000"
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                    Date Joined *
                  </label>
                  <input
                    type="date"
                    required
                    value={registerForm.joinedDate}
                    onChange={(e) => setRegisterForm({ ...registerForm, joinedDate: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  placeholder="+92 300 1234567"
                  className="input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                  Residential Address
                </label>
                <input
                  type="text"
                  value={registerForm.address}
                  onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                  placeholder="Street, City, Country"
                  className="input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                >
                  {actionLoading ? 'Creating Record...' : 'Register Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && editingEmp && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0 }}>
                Edit Employee ({editingEmp.id})
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingEmp(null);
                }}
                className="btn btn-ghost btn-sm"
                style={{ padding: '0.2rem 0.5rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                  Department
                </label>
                <select
                  value={editForm.departmentId}
                  onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                  className="select"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                  Designation
                </label>
                <select
                  value={editForm.designationId}
                  onChange={(e) => setEditForm({ ...editForm, designationId: e.target.value })}
                  className="select"
                >
                  <option value="">Select Designation</option>
                  {designations.map((des) => (
                    <option key={des.id} value={des.id}>{des.title}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                    Basic Salary (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.basicSalary}
                    onChange={(e) => setEditForm({ ...editForm, basicSalary: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="select"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                  Residential Address
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEmp(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
