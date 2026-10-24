import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Loading from '../components/Loading';
import Empty from '../components/Empty';
import ErrorBox from '../components/ErrorBox';

const Announcements = () => {
  const { user } = useAuth();
  const canPost = user?.role === 'admin' || user?.role === 'hr';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Post Form State (Admin & HR)
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/announcements');
      const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
      const sorted = [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setAnnouncements(sorted);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!canPost) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/announcements', { title, content, priority });
      setSuccess('Announcement published successfully.');
      setTitle('');
      setContent('');
      setPriority('normal');
      fetchAnnouncements();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to publish announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '880px', margin: '0 auto', animation: 'fadeIn 0.25s ease' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-info">
          <h1>Company Announcements</h1>
          <p>Official updates, notices, holiday schedules, and workplace bulletins.</p>
        </div>
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

      <ErrorBox error={error} onRetry={fetchAnnouncements} />

      {/* Publisher Form for Admin and HR */}
      {canPost && (
        <div className="card">
          <h3 style={{ margin: '0 0 1rem 0' }}>Publish New Announcement</h3>
          <form onSubmit={handlePost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Office Closure on Eid Holidays"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                Message Content
              </label>
              <textarea
                required
                rows={3}
                placeholder="Write the announcement details here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="textarea"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Priority:</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="select"
                  style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                >
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
              >
                {submitting ? 'Publishing...' : 'Publish Announcement'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements Stream */}
      <div>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 1rem 0' }}>
          Recent Broadcasts
        </h2>

        {loading && <Loading message="Loading announcements..." />}

        {!loading && (
          announcements.length === 0 ? (
            <Empty
              title="No announcements published"
              description="Important company broadcasts will be posted here as they become available."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {announcements.map((item) => {
                const isHigh = item.priority === 'high';
                return (
                  <div
                    key={item.id}
                    className="card"
                    style={{
                      borderLeft: isHigh ? '4px solid var(--warning)' : '4px solid var(--primary)',
                      padding: '1.25rem 1.5rem',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text)' }}>
                        {item.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isHigh && (
                          <span className="badge badge-late" style={{ fontSize: '0.675rem' }}>
                            High Priority
                          </span>
                        )}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text)', fontSize: '0.875rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                      {item.content || item.message}
                    </p>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Announcements;
