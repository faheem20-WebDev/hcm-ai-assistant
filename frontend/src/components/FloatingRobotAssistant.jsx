import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import './FloatingRobotAssistant.css';

const FloatingRobotAssistant = ({ user }) => {
  const role = user?.role || 'employee';

  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Mouse eye tracking state
  const [pupilPos, setPupilPos] = useState({ x: 0, y: 0 });
  const [headPos, setHeadPos] = useState({ x: 0, y: 0, tilt: 0 });
  const robotRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Chat conversation state (preserved across open/close)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${user?.name || ''}! I'm Nova, your AI workforce assistant. How can I assist you with leaves, policies, or attendance today?`,
      label: 'AI-generated',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Suggested questions per role
  const roleSuggestions = {
    hr: [
      'Who is on leave today?',
      'Who came late most often this month?',
      "What is this month's attendance rate?"
    ],
    employee: [
      'How many sick leaves do I have left?',
      'I need next Monday and Tuesday off',
      "What is my colleague's salary?"
    ],
    admin: [
      'How many active employees do we have?',
      'Summarize payroll cost',
      'Who is on leave today?'
    ]
  };

  const suggestions = roleSuggestions[role] || roleSuggestions.employee;

  // Initial speech bubble timer: appears after 3.5s and hides after 5s
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setShowBubble(true);
      const hideTimer = setTimeout(() => setShowBubble(false), 5000);
      return () => clearTimeout(hideTimer);
    }, 3500);

    return () => clearTimeout(showTimer);
  }, []);

  // Esc key closes panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Mouse tracking for pupils and head
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!robotRef.current) return;
      if (isOpen) {
        // Look up-left towards the open chat panel
        setHeadPos({ x: -2.5, y: -2, tilt: -2.5 });
        setPupilPos({ x: -3.5, y: -2.5 });
        return;
      }

      const rect = robotRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist === 0) {
        setHeadPos({ x: 0, y: 0, tilt: 0 });
        setPupilPos({ x: 0, y: 0 });
      } else {
        const factor = Math.min(dist / 220, 1);
        setHeadPos({
          x: (dx / dist) * factor * 3,
          y: (dy / dist) * factor * 2,
          tilt: (dx / dist) * factor * 2
        });
        setPupilPos({
          x: (dx / dist) * factor * 4,
          y: (dy / dist) * factor * 3
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isOpen]);

  // Auto-scroll messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Toggle chat panel
  const handleToggleChat = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setHasUnread(false);
        setShowBubble(false);
      }
      return next;
    });
  };

  // Send message using existing /ai/chat endpoint
  const handleSendMessage = async (textToSend) => {
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
        content: res.data?.reply || 'I processed your query.',
        label: res.data?.label || 'AI-generated',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiReply]);
      if (!isOpen) {
        setHasUnread(true);
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'AI Assistant is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className="floating-robot-anchor">
      {/* 1. CHAT POPUP PANEL */}
      {isOpen && (
        <div className="floating-chat-panel" role="dialog" aria-modal="true" aria-label="HCM AI Assistant Chat">
          {/* Header */}
          <div className="floating-chat-header">
            <div className="floating-chat-header-info">
              <div className="floating-chat-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="8" width="16" height="12" rx="4" fill="#0F1224" stroke="#FFFFFF" strokeWidth="1.5" />
                  <circle cx="8.5" cy="13" r="1.5" fill="#2DD4BF" />
                  <circle cx="15.5" cy="13" r="1.5" fill="#2DD4BF" />
                  <path d="M10.5 16.5C11 17 13 17 13.5 16.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h3 className="floating-chat-title">Nova • HCM Assistant</h3>
                <span className="ai-badge" style={{ fontSize: '0.625rem', padding: '0.05rem 0.35rem' }}>
                  AI-generated
                </span>
              </div>
            </div>

            <div className="floating-chat-actions">
              <Link
                to="/ai"
                onClick={() => setIsOpen(false)}
                className="floating-chat-open-full"
                title="Open full page chat"
              >
                Open full page ↗
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="floating-chat-close-btn"
                aria-label="Close assistant"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="floating-chat-suggestions">
            {suggestions.map((text, i) => (
              <button
                key={i}
                type="button"
                className="floating-chat-chip"
                onClick={() => handleSendMessage(text)}
                disabled={loading}
              >
                {text}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="floating-chat-messages">
            {messages.map((m, idx) => (
              <div key={idx} className={`floating-msg-bubble ${m.role}`}>
                <div>{m.content}</div>
                <div className="floating-msg-meta">
                  {m.role === 'assistant' && <span>✦ Nova</span>}
                  <span>{m.time}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="floating-typing">
                <span>Nova is typing</span>
                <span className="floating-dot" />
                <span className="floating-dot" />
                <span className="floating-dot" />
              </div>
            )}

            {error && (
              <div style={{ color: 'var(--danger)', fontSize: '0.75rem', padding: '0.35rem 0.5rem', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}>
                ⚠️ {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleFormSubmit} className="floating-chat-input-bar">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Nova anything..."
              className="floating-chat-input"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="floating-chat-send"
              aria-label="Send message"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* 2. SPEECH BUBBLE */}
      {(showBubble || isHovered) && !isOpen && (
        <div className="floating-speech-bubble" onClick={handleToggleChat}>
          <span>✨</span> Hi, I'm Nova! Ask me anything
        </div>
      )}

      {/* 3. ANIMATED ROBOT TRIGGER BUTTON */}
      <button
        ref={robotRef}
        type="button"
        onClick={handleToggleChat}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`floating-robot-trigger ${isOpen ? 'chat-open' : ''}`}
        aria-label="Chat with Nova, HCM AI Assistant"
        title="Chat with Nova, HCM AI Assistant"
      >
        {/* Unread indicator */}
        {hasUnread && !isOpen && <span className="floating-unread-dot" />}

        <svg
          className="floating-robot-svg"
          viewBox="0 0 240 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="floatHelmetGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#312E81" />
              <stop offset="45%" stopColor="#4338CA" />
              <stop offset="85%" stopColor="#1E1B4B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            <linearGradient id="floatVisorGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#020617" />
              <stop offset="60%" stopColor="#090D16" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            <radialGradient id="floatEyeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#A5F3FC" />
              <stop offset="45%" stopColor="#06B6D4" />
              <stop offset="90%" stopColor="#0891B2" />
              <stop offset="100%" stopColor="#0891B2" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="floatBodyGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3730A3" />
              <stop offset="50%" stopColor="#312E81" />
              <stop offset="100%" stopColor="#1E1B4B" />
            </linearGradient>

            <linearGradient id="floatMetalGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="50%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            <linearGradient id="floatJetGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
            </linearGradient>

            <radialGradient id="floatGroundShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#000000" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>

            <filter id="floatCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Ground Shadow */}
          <ellipse cx="120" cy="245" rx="46" ry="7" fill="url(#floatGroundShadow)" className="robot-shadow-loop" />

          {/* Floating Robot Body Group */}
          <g className="robot-float-loop">
            {/* Thrusters / Hover Jets */}
            <ellipse cx="102" cy="214" rx="7" ry="3.5" fill="#334155" />
            <ellipse cx="138" cy="214" rx="7" ry="3.5" fill="#334155" />
            <ellipse cx="102" cy="222" rx="5" ry="8" fill="url(#floatJetGlow)" className="robot-jet-flame" />
            <ellipse cx="138" cy="222" rx="5" ry="8" fill="url(#floatJetGlow)" className="robot-jet-flame flame-alt" />
            <path d="M 88 210 C 88 217, 152 217, 152 210" stroke="#06B6D4" strokeWidth="2.5" fill="none" filter="url(#floatCyanGlow)" />

            {/* Torso */}
            <rect x="74" y="152" width="92" height="60" rx="18" fill="url(#floatBodyGrad)" stroke="#6366F1" strokeWidth="2" />
            <path d="M 78 156 Q 120 162 162 156" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" fill="none" />

            {/* Chest Plate Console */}
            <rect x="88" y="163" width="64" height="38" rx="8" fill="#090D16" stroke="#1E293B" strokeWidth="1" />

            {/* Rotating Core Ring */}
            <g transform="translate(104, 182)">
              <circle cx="0" cy="0" r="9" stroke="#06B6D4" strokeWidth="2" strokeDasharray="5 3" fill="none" className="robot-core-ring" />
              <circle cx="0" cy="0" r="4.5" fill="#38BDF8" filter="url(#floatCyanGlow)" />
            </g>

            {/* Equalizer Bars */}
            <g transform="translate(122, 173)">
              <rect x="0" y="0" width="3" height="15" rx="1" fill="#14B8A6" className="eq-bar-1" />
              <rect x="6" y="0" width="3" height="15" rx="1" fill="#06B6D4" className="eq-bar-2" />
              <rect x="12" y="0" width="3" height="15" rx="1" fill="#38BDF8" className="eq-bar-3" />
            </g>

            {/* Metallic Neck */}
            <rect x="110" y="141" width="20" height="13" rx="3" fill="url(#floatMetalGrad)" />

            {/* Shoulder Joints */}
            <circle cx="68" cy="162" r="7.5" fill="url(#floatMetalGrad)" stroke="#312E81" strokeWidth="1.5" />
            <circle cx="172" cy="162" r="7.5" fill="url(#floatMetalGrad)" stroke="#312E81" strokeWidth="1.5" />

            {/* Left Arm */}
            <path d="M 68 162 Q 46 182 52 210" stroke="#4F46E5" strokeWidth="10" strokeLinecap="round" fill="none" />
            <circle cx="52" cy="210" r="6.5" fill="#818CF8" />

            {/* Right Arm (waves on hover & periodically) */}
            <g className="robot-waving-arm">
              <path d="M 172 162 Q 196 142 202 115" stroke="#4F46E5" strokeWidth="10" strokeLinecap="round" fill="none" />
              <circle cx="202" cy="115" r="6.5" fill="#818CF8" />
            </g>

            {/* Head Rig with Interactive Motion */}
            <g
              style={{
                transform: `translate(${headPos.x}px, ${headPos.y}px) rotate(${headPos.tilt}deg)`,
                transformOrigin: '120px 105px',
                transition: isOpen ? 'transform 0.3s ease' : 'none'
              }}
            >
              {/* Antenna */}
              <line x1="120" y1="65" x2="120" y2="28" stroke="url(#floatMetalGrad)" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="120" cy="24" r="8" fill="#06B6D4" className="robot-antenna-orb" filter="url(#floatCyanGlow)" />
              <circle cx="120" cy="24" r="3" fill="#FFFFFF" />

              {/* Glowing Ears */}
              <rect x="56" y="88" width="7" height="22" rx="3.5" fill="#06B6D4" filter="url(#floatCyanGlow)" />
              <rect x="177" y="88" width="7" height="22" rx="3.5" fill="#06B6D4" filter="url(#floatCyanGlow)" />

              {/* Helmet Shell */}
              <rect x="62" y="60" width="116" height="84" rx="38" fill="url(#floatHelmetGrad)" stroke="#6366F1" strokeWidth="2" />

              {/* Glass Visor */}
              <rect x="73" y="72" width="94" height="62" rx="26" fill="url(#floatVisorGrad)" stroke="#1E293B" strokeWidth="1.5" />

              {/* Eye Expressions */}
              {loading ? (
                /* Waiting State: spinning eye dots */
                <g>
                  <circle cx="98" cy="103" r="7" stroke="#06B6D4" strokeWidth="2.5" strokeDasharray="10 10" fill="none" className="robot-core-ring" />
                  <circle cx="142" cy="103" r="7" stroke="#06B6D4" strokeWidth="2.5" strokeDasharray="10 10" fill="none" className="robot-core-ring" />
                  <path d="M 114 123 Q 120 126 126 123" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" fill="none" />
                </g>
              ) : (
                /* Glowing Eyes & Happy Smile */
                <g>
                  <g className="robot-eye-blink">
                    <rect
                      x={90 + pupilPos.x}
                      y={93 + pupilPos.y}
                      width="16"
                      height="18"
                      rx="8"
                      fill="url(#floatEyeGlow)"
                      filter="url(#floatCyanGlow)"
                    />
                    <circle cx={98 + pupilPos.x} cy={102 + pupilPos.y} r="3" fill="#FFFFFF" />
                    <rect
                      x={134 + pupilPos.x}
                      y={93 + pupilPos.y}
                      width="16"
                      height="18"
                      rx="8"
                      fill="url(#floatEyeGlow)"
                      filter="url(#floatCyanGlow)"
                    />
                    <circle cx={142 + pupilPos.x} cy={102 + pupilPos.y} r="3" fill="#FFFFFF" />
                  </g>
                  {/* Happy Smile */}
                  <path d="M 112 122 Q 120 128 128 122" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" fill="none" filter="url(#floatCyanGlow)" />
                </g>
              )}
            </g>
          </g>
        </svg>
      </button>
    </div>
  );
};

export default FloatingRobotAssistant;
