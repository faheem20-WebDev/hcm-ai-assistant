import React, { useState, useEffect } from 'react';
import api from '../api';
import Loading from '../components/Loading';
import Empty from '../components/Empty';
import ErrorBox from '../components/ErrorBox';

const Audit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Track expanded row IDs
  const [expandedRows, setExpandedRows] = useState({});

  const fetchAuditLogs = async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/audit?page=${pageNum}&limit=${limit}`);
      const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
      setLogs(items);
      setTotal(res.data?.total || items.length);
      setPage(res.data?.page || pageNum);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs(page);
  }, [page]);

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
          System Audit Trail
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
          Immutable administrative record of modifications, security events, policy updates, and state transitions.
        </p>
      </div>

      <ErrorBox error={error} onRetry={() => fetchAuditLogs(page)} />

      {loading && <Loading message="Loading audit events..." />}

      {!loading && (
        logs.length === 0 ? (
          <Empty
            title="No audit logs available"
            description="System activity and audit trails will be recorded and displayed here."
          />
        ) : (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ width: '40px', padding: '0.85rem 0.5rem 0.85rem 1rem' }}></th>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Timestamp</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Actor</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Action</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Entity</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const isExpanded = Boolean(expandedRows[log.id]);
                  const hasState = log.before !== undefined || log.after !== undefined;

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => toggleRow(log.id)}
                        style={{
                          borderBottom: isExpanded ? 'none' : '1px solid #f1f5f9',
                          cursor: 'pointer',
                          backgroundColor: isExpanded ? '#f8fafc' : '#ffffff',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '0.85rem 0.5rem 0.85rem 1rem', color: '#64748b' }}>
                          {isExpanded ? '▼' : '▶'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: '#1e293b' }}>
                          {log.actor || 'system'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: '#e0e7ff',
                            color: '#3730a3'
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#334155', fontWeight: '500' }}>
                          {log.entity || 'General'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                          {log.details || '-'}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                          <td colSpan={6} style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                              <div style={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                padding: '0.85rem'
                              }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#dc2626', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                  Before State
                                </div>
                                <pre style={{
                                  margin: 0,
                                  fontSize: '0.8rem',
                                  backgroundColor: '#fafafa',
                                  padding: '0.75rem',
                                  borderRadius: '4px',
                                  border: '1px solid #f1f5f9',
                                  overflowX: 'auto',
                                  color: '#334155'
                                }}>
                                  {log.before !== null && log.before !== undefined
                                    ? JSON.stringify(log.before, null, 2)
                                    : 'null (None / Created)'}
                                </pre>
                              </div>

                              <div style={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                padding: '0.85rem'
                              }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                  After State
                                </div>
                                <pre style={{
                                  margin: 0,
                                  fontSize: '0.8rem',
                                  backgroundColor: '#fafafa',
                                  padding: '0.75rem',
                                  borderRadius: '4px',
                                  border: '1px solid #f1f5f9',
                                  overflowX: 'auto',
                                  color: '#334155'
                                }}>
                                  {log.after !== null && log.after !== undefined
                                    ? JSON.stringify(log.after, null, 2)
                                    : 'null (Deleted)'}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              fontSize: '0.85rem',
              color: '#64748b'
            }}>
              <div>
                Showing page {page} of {totalPages} ({total} total entries)
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    opacity: page <= 1 ? 0.5 : 1
                  }}
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    opacity: page >= totalPages ? 0.5 : 1
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default Audit;
