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
    <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.15rem 0' }}>
            HCM AI Assistant
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>
            Powered by Google Gemini with role-scoped data security.
          </p>
        </div>
        <span className="ai-badge">✦ AI-generated Engine</span>
      </div>

      {/* Clickable Example Questions */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.35rem' }}>
          Suggested Inquiries ({role.toUpperCase()}):
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(q.text)}
              disabled={loading}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '9999px',
                padding: '0.35rem 0.85rem',
                fontSize: '0.75rem',
                color: '#334155',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#334155'; }}
            >
              <span>💬</span>
              <span>{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      <ErrorBox error={error} />

      {/* Message Stream */}
      <div style={{
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
      }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '82%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: m.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                backgroundColor: m.role === 'user' ? '#2563eb' : '#f8fafc',
                color: m.role === 'user' ? '#ffffff' : '#0f172a',
                border: m.role === 'user' ? 'none' : '1px solid #e2e8f0',
                padding: '0.85rem 1.1rem',
                borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                whiteSpace: 'pre-line',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              {m.content}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
              {m.role === 'assistant' && (
                <span className="ai-badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                  ✦ {m.label || 'AI-generated'}
                </span>
              )}
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{m.time}</span>
            </div>
          </div>
        ))}

        {/* Loading Dots */}
        {loading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Assistant is analyzing query</span>
            <span style={{ display: 'inline-flex', gap: '3px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#2563eb', animation: 'hcm-spin 1s infinite alternate' }} />
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#7c3aed', animation: 'hcm-spin 1s infinite alternate 0.2s' }} />
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#2563eb', animation: 'hcm-spin 1s infinite alternate 0.4s' }} />
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question or test security boundary..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '0.875rem',
            outline: 'none'
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
