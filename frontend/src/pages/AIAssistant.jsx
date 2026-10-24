import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import ErrorBox from '../components/ErrorBox';

const AIAssistant = () => {
  const { user } = useAuth();
  const role = user?.role || 'employee';

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${user?.name || ''}! I am your HCM Lite AI Assistant. How can I assist you with company policies, leave entitlements, or workforce data today?`,
      label: 'AI-generated',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Clickable Example Questions per Role
  const roleQuestions = {
    employee: [
      { text: 'How many sick leaves do I have left?', label: 'Sick Leaves Left' },
      { text: 'I need next Monday and Tuesday off', label: 'Smart Leave Request' },
      { text: "What is my colleague Ali's salary?", label: "Colleague Salary Refusal Test" }
    ],
    hr: [
      { text: 'Show me attendance summary for this week', label: 'Attendance Trend' },
      { text: 'Who was late today?', label: 'Late-Comers Today' },
      { text: 'What is the company leave policy for unpaid leaves?', label: 'Unpaid Leave Policy' }
    ],
    admin: [
      { text: 'What is our total monthly payroll liability?', label: 'Total Payroll Cost' },
      { text: 'Summarize recent audit log activities', label: 'Audit Trail Summary' },
      { text: 'Give me company headcount breakdown', label: 'Headcount Breakdown' }
    ]
  };

  const sampleQuestions = roleQuestions[role] || roleQuestions.employee;

  const sendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { role: 'user', content: text.trim(), time: timeNow };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: userMsg.content });
      const aiReply = {
        role: 'assistant',
        content: res.data?.reply || 'No response returned.',
        label: res.data?.label || 'AI-generated',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      setError(err?.response?.data?.error || 'AI Assistant service encountered an issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div
      style={{
        maxWidth: '880px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 130px)',
        gap: '0.85rem',
        animation: 'fadeIn 0.25s ease'
      }}
    >
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-info">
          <h1>HCM AI Assistant</h1>
          <p>Powered by Google Gemini with role-scoped data security.</p>
        </div>
        <span className="ai-badge">✦ AI-generated Engine</span>
      </div>

      {/* Suggested Questions */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Suggested Inquiries ({role.toUpperCase()}):
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendMessage(q.text)}
              disabled={loading}
              className="btn btn-secondary btn-sm"
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '0.35rem 0.85rem',
                fontSize: '0.75rem',
                gap: '0.35rem'
              }}
            >
              <span>💬</span>
              <span>{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      <ErrorBox error={error} />

      {/* Message Stream */}
      <div
        className="card"
        style={{
          flex: 1,
          padding: '1.25rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          backgroundColor: 'var(--surface-2)',
          border: '1px solid var(--border)'
        }}
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <div
              style={{
                background:
                  m.role === 'user'
                    ? 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)'
                    : 'var(--surface)',
                color: m.role === 'user' ? '#ffffff' : 'var(--text)',
                border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                padding: '0.85rem 1.15rem',
                borderRadius:
                  m.role === 'user'
                    ? '16px 16px 4px 16px'
                    : '16px 16px 16px 4px',
                fontSize: '0.875rem',
                lineHeight: 1.55,
                whiteSpace: 'pre-line',
                boxShadow: 'var(--shadow-xs)'
              }}
            >
              {m.content}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
              {m.role === 'assistant' && (
                <span className="ai-badge" style={{ fontSize: '0.65rem', padding: '0.05rem 0.4rem' }}>
                  ✦ {m.label || 'AI-generated'}
                </span>
              )}
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.time}</span>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              AI Assistant is thinking
            </span>
            <span style={{ display: 'inline-flex', gap: '4px' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  animation: 'pulse 1s infinite alternate'
                }}
              />
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent)',
                  animation: 'pulse 1s infinite alternate 0.25s'
                }}
              />
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  animation: 'pulse 1s infinite alternate 0.5s'
                }}
              />
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a policy query, leave calculation, or test security boundary..."
          disabled={loading}
          className="input"
          style={{ flex: 1, padding: '0.75rem 1rem' }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn btn-primary"
          style={{ padding: '0 1.5rem', gap: '0.4rem' }}
        >
          <span>Send</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default AIAssistant;
