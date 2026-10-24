import React, { useState } from 'react';
import api from '../api';
import ErrorBox from '../components/ErrorBox';

const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: userMsg.content });
      const aiReply = {
        role: 'assistant',
        content: res.data?.reply || 'No response returned.',
        label: res.data?.label || 'AI-generated'
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to process AI assistant request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
          AI HR Assistant
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
          Ask queries about company policies, leave entitlements, payroll breakdowns, or team metrics.
        </p>
      </div>

      <ErrorBox error={error} />

      <div style={{
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', margin: 'auto', padding: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✨</div>
            <p style={{ fontWeight: '500', color: '#475569' }}>How can I assist your HR workflow today?</p>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Queries are scoped strictly to your authenticated role permissions.
            </p>
          </div>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%'
              }}
            >
              <div
                style={{
                  backgroundColor: m.role === 'user' ? '#2563eb' : '#f1f5f9',
                  color: m.role === 'user' ? '#ffffff' : '#1e293b',
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  lineHeight: '1.4'
                }}
              >
                {m.content}
              </div>
              {m.role === 'assistant' && (
                <div style={{ marginTop: '0.35rem' }}>
                  <span className="ai-badge">✦ {m.label || 'AI-generated'}</span>
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div style={{ alignSelf: 'flex-start', color: '#64748b', fontSize: '0.85rem' }}>
            AI Assistant is analyzing query...
          </div>
        )}
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '0.875rem'
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '0 1.25rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? 0.6 : 1
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default AIAssistant;
