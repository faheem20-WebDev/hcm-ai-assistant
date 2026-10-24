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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-info">
          <h1>System Audit Trail</h1>
          <p>Immutable administrative record of modifications, security events, policy updates, and state transitions.</p>
        </div>
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
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '36px', padding: '0.85rem 0.5rem 0.85rem 1rem' }}></th>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const isExpanded = Boolean(expandedRows[log.id]);

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => toggleRow(log.id)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isExpanded ? 'var(--surface-2)' : 'transparent',
                          transition: 'background var(--transition-fast)'
                        }}
                      >
                        <td style={{ padding: '0.85rem 0.5rem 0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                              transition: 'transform var(--transition-fast)'
                            }}
                          >
                            ▶
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.825rem' }}>
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                          {log.actor || 'system'}
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: 'rgba(91, 91, 214, 0.12)',
                              color: 'var(--primary)',
                              border: '1px solid rgba(91, 91, 214, 0.25)'
                            }}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text)', fontWeight: 500 }}>
                          {log.entity || 'General'}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {log.details || '-'}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr style={{ backgroundColor: 'var(--surface-2)' }}>
                          <td colSpan={6} style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                              <div
                                style={{
                                  backgroundColor: 'var(--surface)',
                                  border: '1px solid var(--border)',
                                  borderRadius: 'var(--radius-md)',
                                  padding: '1rem'
                                }}
                              >
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                                  Before State
                                </div>
                                <pre
                                  style={{
                                    margin: 0,
                                    fontSize: '0.8rem',
                                    backgroundColor: 'var(--surface-2)',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border)',
                                    overflowX: 'auto',
                                    color: 'var(--text)',
                                    fontFamily: 'var(--font-mono)'
                                  }}
                                >
                                  {log.before !== null && log.before !== undefined
                                    ? JSON.stringify(log.before, null, 2)
                                    : 'null (None / Created)'}
                                </pre>
                              </div>

                              <div
                                style={{
                                  backgroundColor: 'var(--surface)',
                                  border: '1px solid var(--border)',
                                  borderRadius: 'var(--radius-md)',
                                  padding: '1rem'
                                }}
                              >
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                                  After State
                                </div>
                                <pre
                                  style={{
                                    margin: 0,
                                    fontSize: '0.8rem',
                                    backgroundColor: 'var(--surface-2)',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border)',
                                    overflowX: 'auto',
                                    color: 'var(--text)',
                                    fontFamily: 'var(--font-mono)'
                                  }}
                                >
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
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1.25rem',
                backgroundColor: 'var(--surface-2)',
                borderTop: '1px solid var(--border)',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}
            >
              <div>
                Showing page <strong style={{ color: 'var(--text)' }}>{page}</strong> of <strong style={{ color: 'var(--text)' }}>{totalPages}</strong> ({total} total entries)
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn btn-secondary btn-sm"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="btn btn-secondary btn-sm"
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
