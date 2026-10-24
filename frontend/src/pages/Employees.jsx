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
  const [tempPassInfo, setTempPassInfo] = useState(null); // { name, email, tempPassword, actionType }
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
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            Employees Directory
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            Register new hires, manage personnel records, configure designations, and manage security credentials.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '0.65rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>+</span> Register Employee
        </button>
      </div>

      {/* Temporary Password Notification Banner */}
      {tempPassInfo && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '600', color: '#1e40af', fontSize: '0.9rem' }}>
              🔑 Temporary Credentials Issued ({tempPassInfo.actionType})
            </span>
            <button
              onClick={() => setTempPassInfo(null)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.1rem' }}
            >
              ✕
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155' }}>
            Provide these initial credentials to <strong>{tempPassInfo.name}</strong> ({tempPassInfo.email}).
            They will be forced to change this temporary password and setup their 5-digit PIN on initial login.
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginTop: '0.25rem',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '0.5rem 0.75rem',
            maxWidth: '380px'
          }}>
            <code style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', flex: 1, letterSpacing: '0.05em' }}>
              {tempPassInfo.tempPassword}
            </code>
            <button
              onClick={handleCopyPassword}
              style={{
                backgroundColor: copied ? '#16a34a' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#15803d',
          padding: '0.75rem 1rem',
          borderRadius: '6px',
          fontSize: '0.875rem',
          marginBottom: '1rem'
        }}>
          {success}
        </div>
      )}

      <ErrorBox error={error} onRetry={fetchData} />

      {/* Filters Toolbar */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'center'
      }}>
        <div style={{ flex: '1 1 200px' }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '0.875rem',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ flex: '0 1 180px' }}>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '0.875rem',
              backgroundColor: '#ffffff'
            }}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '0 1 140px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '0.875rem',
              backgroundColor: '#ffffff'
            }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {(searchTerm || deptFilter || statusFilter) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setDeptFilter('');
              setStatusFilter('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
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
        />
      ) : (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          overflowX: 'auto',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>EMPLOYEE ID</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>NAME & EMAIL</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>DEPARTMENT</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>DESIGNATION</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>BASIC SALARY</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>STATUS</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>
                    {emp.id}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.875rem' }}>{emp.name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{emp.email}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#334155' }}>
                    {getDeptName(emp.departmentId)}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#334155' }}>
                    {getDesigTitle(emp.designationId)}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#334155', fontWeight: '500' }}>
                    PKR {Number(emp.basicSalary || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: emp.status === 'active' ? '#dcfce7' : '#fee2e2',
                      color: emp.status === 'active' ? '#15803d' : '#b91c1c'
                    }}>
                      {emp.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => openEditModal(emp)}
                        style={{
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          borderRadius: '4px',
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleResetPassword(emp)}
                        style={{
                          backgroundColor: '#fef3c7',
                          border: '1px solid #fde68a',
                          color: '#92400e',
                          borderRadius: '4px',
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Reset Pwd
                      </button>
                      <button
                        onClick={() => handleResetPin(emp)}
                        style={{
                          backgroundColor: '#e0e7ff',
                          border: '1px solid #c7d2fe',
                          color: '#3730a3',
                          borderRadius: '4px',
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>
                Register New Employee
              </h2>
              <button
                onClick={() => setShowRegisterModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                  Work Email *
                </label>
                <input
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  placeholder="e.g. john@company.com"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                    Department *
                  </label>
                  <select
                    required
                    value={registerForm.departmentId}
                    onChange={(e) => setRegisterForm({ ...registerForm, departmentId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                    Designation *
                  </label>
                  <select
                    required
                    value={registerForm.designationId}
                    onChange={(e) => setRegisterForm({ ...registerForm, designationId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      backgroundColor: '#ffffff'
                    }}
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
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                    Basic Monthly Salary (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={registerForm.basicSalary}
                    onChange={(e) => setRegisterForm({ ...registerForm, basicSalary: e.target.value })}
                    placeholder="e.g. 150000"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                    Date Joined *
                  </label>
                  <input
                    type="date"
                    required
                    value={registerForm.joinedDate}
                    onChange={(e) => setRegisterForm({ ...registerForm, joinedDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  placeholder="+92 300 1234567"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                  Residential Address
                </label>
                <input
                  type="text"
                  value={registerForm.address}
                  onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                  placeholder="Street, City, Country"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.6rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.6rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.7 : 1
                  }}
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>
                Edit Employee ({editingEmp.id})
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingEmp(null);
                }}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                  Department
                </label>
                <select
                  value={editForm.departmentId}
                  onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                  Designation
                </label>
                <select
                  value={editForm.designationId}
                  onChange={(e) => setEditForm({ ...editForm, designationId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="">Select Designation</option>
                  {designations.map((des) => (
                    <option key={des.id} value={des.id}>{des.title}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                    Basic Salary (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.basicSalary}
                    onChange={(e) => setEditForm({ ...editForm, basicSalary: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                  Residential Address
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEmp(null);
                  }}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.6rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.6rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.7 : 1
                  }}
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
