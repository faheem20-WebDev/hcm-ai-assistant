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
      // Sort newest first
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
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
          Company Announcements
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
          Official updates, notices, holiday schedules, and workplace bulletins.
        </p>
      </div>

      {success && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      <ErrorBox error={error} onRetry={fetchAnnouncements} />

      {/* Publisher Form for Admin and HR */}
      {canPost && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1.25rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#0f172a' }}>
            Publish New Announcement
          </h3>
          <form onSubmit={handlePost} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Office Closure on Eid Holidays"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                Message Content
              </label>
              <textarea
                required
                rows={3}
                placeholder="Write the announcement details here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>Priority:</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{
                    padding: '0.4rem 0.65rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.8rem'
                  }}
                >
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.55rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Publishing...' : 'Publish Announcement'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements Stream */}
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#0f172a', margin: '0 0 1rem 0' }}>
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
                    style={{
                      backgroundColor: '#ffffff',
                      border: isHigh ? '1px solid #fed7aa' : '1px solid #e2e8f0',
                      borderLeft: isHigh ? '4px solid #f97316' : '4px solid #2563eb',
                      borderRadius: '8px',
                      padding: '1.25rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: '600' }}>
                        {item.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isHigh && (
                          <span style={{
                            backgroundColor: '#ffedd5',
                            color: '#c2410c',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}>
                            High Priority
                          </span>
                        )}
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>
                    <p style={{ margin: 0, color: '#334155', fontSize: '0.875rem', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
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
