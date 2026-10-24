import React, { useState, useEffect, useRef } from 'react';
import './AuthLayout.css';

const AuthLayout = ({
  children,
  isPasswordFocused = false,
  hasError = false,
  title,
  subtitle
}) => {
  const [pupilPos, setPupilPos] = useState({ x: 0, y: 0 });
  const [shakeHead, setShakeHead] = useState(false);
  const robotRef = useRef(null);

  // Pupil mouse follow interaction
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!robotRef.current || isPasswordFocused) return;
      const rect = robotRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxOffset = 5.5;

      if (dist === 0) {
        setPupilPos({ x: 0, y: 0 });
      } else {
        const factor = Math.min(dist / 220, 1) * maxOffset;
        setPupilPos({
          x: (dx / dist) * factor,
          y: (dy / dist) * factor
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPasswordFocused]);

  // Shake head once on error
  useEffect(() => {
    if (hasError) {
      setShakeHead(true);
      const timer = setTimeout(() => setShakeHead(false), 700);
      return () => clearTimeout(timer);
    }
  }, [hasError]);

  return (
    <div className="auth-page-container">
      <div className="auth-compact-card">
        {/* LEFT: ANIMATED ILLUSTRATION PANEL */}
        <div className="auth-illustration-panel">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />

        <div className="auth-robot-container" ref={robotRef}>
          <svg
            className="auth-robot-svg"
            viewBox="0 0 240 280"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="HCM Lite Assistant Robot"
          >
            {/* Robot Body */}
            <g className="robot-body-group">
              {/* Left Arm */}
              <path
                d="M 72 180 Q 45 195 50 225"
                stroke="#4f46e5"
                strokeWidth="12"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="50" cy="225" r="7" fill="#818cf8" />

              {/* Right Waving Arm */}
              <g className="robot-waving-arm">
                <path
                  d="M 168 180 Q 198 165 204 135"
                  stroke="#4f46e5"
                  strokeWidth="12"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="204" cy="132" r="7" fill="#818cf8" />
              </g>

              {/* Torso */}
              <rect x="72" y="167" width="96" height="74" rx="20" className="robot-body" />
              <rect x="86" y="180" width="68" height="40" rx="10" fill="#0f172a" opacity="0.6" />
              <circle cx="120" cy="200" r="7" className="robot-heart" />

              {/* Neck */}
              <rect x="108" y="154" width="24" height="14" rx="4" fill="#334155" />
            </g>

            {/* Robot Head Group (Shakes on Error) */}
            <g className={`robot-head-group ${shakeHead ? 'head-shake' : ''}`}>
              {/* Antenna */}
              <line
                x1="120"
                y1="70"
                x2="120"
                y2="34"
                stroke="#4f46e5"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <circle cx="120" cy="30" r="9" className="antenna-tip" />

              {/* Head Shell */}
              <rect x="65" y="70" width="110" height="85" rx="34" className="robot-head" />

              {/* Screen Faceplate */}
              <rect x="76" y="80" width="88" height="65" rx="24" fill="#0f172a" />

              {/* Cheeks */}
              <circle cx="86" cy="126" r="5" fill="#f472b6" opacity="0.6" />
              <circle cx="154" cy="126" r="5" fill="#f472b6" opacity="0.6" />

              {/* Eye Sockets */}
              <g className="robot-eye-blinking">
                <circle cx="96" cy="108" r="14" fill="rgba(20, 184, 166, 0.2)" />
                <circle cx="144" cy="108" r="14" fill="rgba(20, 184, 166, 0.2)" />

                {/* Eye Irises */}
                <circle cx="96" cy="108" r="10" fill="#14b8a6" />
                <circle cx="144" cy="108" r="10" fill="#14b8a6" />

                {/* Tracking Pupils */}
                <circle
                  cx={96 + (isPasswordFocused ? 0 : pupilPos.x)}
                  cy={108 + (isPasswordFocused ? 0 : pupilPos.y)}
                  r="4.5"
                  fill="#ffffff"
                />
                <circle
                  cx={144 + (isPasswordFocused ? 0 : pupilPos.x)}
                  cy={108 + (isPasswordFocused ? 0 : pupilPos.y)}
                  r="4.5"
                  fill="#ffffff"
                />
              </g>

              {/* Smile Mouth */}
              <path
                d="M 112 126 Q 120 134 128 126"
                stroke="#14b8a6"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />

              {/* Cute Hands Covering Eyes when Password Field is Focused */}
              <g className={`robot-hands ${isPasswordFocused ? 'covering' : ''}`}>
                <circle
                  className="robot-hand left-hand"
                  cx="96"
                  cy="108"
                  r="16"
                  fill="#6366f1"
                  stroke="#818cf8"
                  strokeWidth="2.5"
                />
                <circle
                  className="robot-hand right-hand"
                  cx="144"
                  cy="108"
                  r="16"
                  fill="#6366f1"
                  stroke="#818cf8"
                  strokeWidth="2.5"
                />
              </g>
            </g>
          </svg>

          <div className="auth-robot-tagline">
            HCM Lite: smart HR, simplified
          </div>
        </div>
      </div>

      {/* RIGHT: AUTH FORM PANEL */}
      <div className="auth-form-panel">
        <div className="auth-form-content">
          {/* Mobile Small Robot/Logo Header */}
          <div className="auth-mobile-header">
            <div className="auth-brand-logo">✨</div>
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-primary)' }}>
              HCM Lite
            </div>
          </div>

          {(title || subtitle) && (
            <div className="auth-header">
              <div className="auth-brand-logo">✨</div>
              {title && <h1 className="auth-title">{title}</h1>}
              {subtitle && <p className="auth-subtitle">{subtitle}</p>}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  </div>
);
};

export default AuthLayout;
