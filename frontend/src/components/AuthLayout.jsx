import React, { useState, useEffect, useRef } from 'react';
import './AuthLayout.css';

const AuthLayout = ({
  children,
  isPasswordFocused = false,
  hasError = false,
  loading = false,
  title,
  subtitle
}) => {
  const [headPos, setHeadPos] = useState({ x: 0, y: 0, tilt: 0 });
  const [pupilPos, setPupilPos] = useState({ x: 0, y: 0 });
  const [shakeHead, setShakeHead] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const robotRef = useRef(null);

  // Mouse tracking for head and eyes (limited range and slight tilt)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!robotRef.current || isPasswordFocused) return;
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
        const factor = Math.min(dist / 240, 1);
        setHeadPos({
          x: (dx / dist) * factor * 3.5,
          y: (dy / dist) * factor * 2.5,
          tilt: (dx / dist) * factor * 2.5
        });
        setPupilPos({
          x: (dx / dist) * factor * 4.5,
          y: (dy / dist) * factor * 3.5
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPasswordFocused]);

  // Head shake and error state for ~1s
  useEffect(() => {
    if (hasError) {
      setShakeHead(true);
      const timer = setTimeout(() => setShakeHead(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasError]);

  const getSpeechText = () => {
    const t = (title || '').toLowerCase();
    const s = (subtitle || '').toLowerCase();
    if (t.includes('setup') || s.includes('company')) {
      return "Let's set up your company";
    }
    if (t.includes('pin') || s.includes('pin')) {
      return 'Enter your secret PIN';
    }
    return 'Hi! Welcome back';
  };

  return (
    <div className="auth-page-container">
      <div className="auth-compact-card">
        {/* LEFT: 45% ANIMATED ILLUSTRATION PANEL */}
        <div className="auth-illustration-panel">
          <div className="auth-orb auth-orb-1" />
          <div className="auth-orb auth-orb-2" />
          <div className="auth-orb auth-orb-3" />

          <div
            className="auth-robot-container"
            ref={robotRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Hover Speech Bubble */}
            {isHovered && (
              <div className="auth-robot-speech-bubble" role="tooltip">
                {getSpeechText()}
              </div>
            )}

            <svg
              className="auth-robot-svg"
              viewBox="0 0 240 260"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="HCM Lite 3D Assistant Robot"
            >
              <defs>
                <linearGradient id="helmetGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#312e81" />
                  <stop offset="45%" stopColor="#4338ca" />
                  <stop offset="85%" stopColor="#1e1b4b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>

                <linearGradient id="highlightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>

                <linearGradient id="visorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#020617" />
                  <stop offset="60%" stopColor="#090d16" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>

                <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#a5f3fc" />
                  <stop offset="45%" stopColor="#06b6d4" />
                  <stop offset="90%" stopColor="#0891b2" />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="eyeErrorGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fca5a5" />
                  <stop offset="50%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#991b1b" />
                </radialGradient>

                <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3730a3" />
                  <stop offset="50%" stopColor="#312e81" />
                  <stop offset="100%" stopColor="#1e1b4b" />
                </linearGradient>

                <linearGradient id="metalGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="50%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>

                <linearGradient id="jetGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>

                <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
                  <stop offset="70%" stopColor="#000000" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </radialGradient>

                <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Ground Shadow (scales inversely with float height) */}
              <ellipse cx="120" cy="245" rx="46" ry="7" fill="url(#groundShadow)" className="robot-ground-shadow" />

              {/* Hovering Robot Group */}
              <g className="robot-float-group">
                {/* Hover Jets / Thrusters & Base Ring */}
                <ellipse cx="102" cy="214" rx="7" ry="3.5" fill="#334155" />
                <ellipse cx="138" cy="214" rx="7" ry="3.5" fill="#334155" />
                <ellipse cx="102" cy="222" rx="5" ry="8" fill="url(#jetGlow)" className="robot-jet-flame" />
                <ellipse cx="138" cy="222" rx="5" ry="8" fill="url(#jetGlow)" className="robot-jet-flame flame-alt" />
                <path d="M 88 210 C 88 217, 152 217, 152 210" stroke="#06b6d4" strokeWidth="2.5" fill="none" filter="url(#cyanGlow)" />

                {/* Torso */}
                <rect x="74" y="152" width="92" height="60" rx="18" fill="url(#bodyGrad)" stroke="#6366f1" strokeWidth="2" />
                <path d="M 78 156 Q 120 162 162 156" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" fill="none" />

                {/* Chest Console Plate */}
                <rect x="88" y="163" width="64" height="38" rx="8" fill="#090d16" stroke="#1e293b" strokeWidth="1" />

                {/* Rotating Core Ring */}
                <g className="robot-core-group" transform="translate(104, 182)">
                  <circle cx="0" cy="0" r="9" stroke="#06b6d4" strokeWidth="2" strokeDasharray="5 3" fill="none" className="robot-core-ring" />
                  <circle cx="0" cy="0" r="4.5" fill="#38bdf8" filter="url(#cyanGlow)" />
                </g>

                {/* Mini Equalizer Bars */}
                <g transform="translate(122, 173)">
                  <rect x="0" y="0" width="3" height="15" rx="1" fill="#14b8a6" className="eq-bar eq-bar-1" />
                  <rect x="6" y="0" width="3" height="15" rx="1" fill="#06b6d4" className="eq-bar eq-bar-2" />
                  <rect x="12" y="0" width="3" height="15" rx="1" fill="#38bdf8" className="eq-bar eq-bar-3" />
                </g>

                {/* LED Dots */}
                <circle cx="123" cy="194" r="1.5" fill="#10b981" />
                <circle cx="129" cy="194" r="1.5" fill="#3b82f6" />
                <circle cx="135" cy="194" r="1.5" fill="#f59e0b" />

                {/* Metallic Neck */}
                <rect x="110" y="141" width="20" height="13" rx="3" fill="url(#metalGrad)" />
                <line x1="110" y1="147" x2="130" y2="147" stroke="#1e293b" strokeWidth="1" />

                {/* Shoulder Joints */}
                <circle cx="68" cy="162" r="7.5" fill="url(#metalGrad)" stroke="#312e81" strokeWidth="1.5" />
                <circle cx="172" cy="162" r="7.5" fill="url(#metalGrad)" stroke="#312e81" strokeWidth="1.5" />

                {/* Left Arm Resting */}
                <g className="robot-left-arm-group">
                  <path d="M 68 162 Q 46 182 52 210" stroke="#4f46e5" strokeWidth="10" strokeLinecap="round" fill="none" />
                  <circle cx="52" cy="210" r="6.5" fill="#818cf8" />
                </g>

                {/* Right Arm Waving */}
                <g className={`robot-waving-arm-group ${isHovered ? 'waving-fast' : 'waving-idle'}`}>
                  <path d="M 172 162 Q 196 142 202 115" stroke="#4f46e5" strokeWidth="10" strokeLinecap="round" fill="none" />
                  <circle cx="202" cy="115" r="6.5" fill="#818cf8" />
                </g>

                {/* Interactive Head & Helmet Rig */}
                <g
                  className={`robot-head-rig ${shakeHead ? 'head-shake' : ''}`}
                  style={{
                    transform: `translate(${headPos.x}px, ${headPos.y}px) rotate(${headPos.tilt}deg)`,
                    transformOrigin: '120px 105px',
                    transition: isPasswordFocused ? 'transform 0.3s ease' : 'none'
                  }}
                >
                  {/* Antenna */}
                  <line x1="120" y1="65" x2="120" y2="28" stroke="url(#metalGrad)" strokeWidth="3.5" strokeLinecap="round" />
                  <circle cx="120" cy="24" r="8" fill="#06b6d4" className="robot-antenna-orb" filter="url(#cyanGlow)" />
                  <circle cx="120" cy="24" r="3" fill="#ffffff" />

                  {/* Glowing Ears */}
                  <rect x="56" y="88" width="7" height="22" rx="3.5" fill="#06b6d4" filter="url(#cyanGlow)" />
                  <rect x="177" y="88" width="7" height="22" rx="3.5" fill="#06b6d4" filter="url(#cyanGlow)" />

                  {/* Helmet Shell */}
                  <rect x="62" y="60" width="116" height="84" rx="38" fill="url(#helmetGrad)" stroke="#6366f1" strokeWidth="2" />
                  <path d="M 76 68 Q 120 62 164 68" stroke="url(#highlightGrad)" strokeWidth="3" strokeLinecap="round" fill="none" />

                  {/* Dark Glass Visor */}
                  <rect x="73" y="72" width="94" height="62" rx="26" fill="url(#visorGrad)" stroke="#1e293b" strokeWidth="1.5" />
                  <path d="M 80 76 Q 120 73 160 76" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />

                  {/* Visor Screen: Eyes & Mouth Expression */}
                  {loading ? (
                    /* Loading State: Spinning eye dots */
                    <g transform="translate(0, 0)">
                      <circle cx="98" cy="103" r="8" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="12 12" fill="none" className="robot-core-ring" />
                      <circle cx="142" cy="103" r="8" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="12 12" fill="none" className="robot-core-ring" />
                      <path d="M 114 123 Q 120 126 126 123" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" fill="none" />
                    </g>
                  ) : shakeHead ? (
                    /* Error State: Red surprised eyes + 'o' mouth */
                    <g>
                      <rect x="91" y="94" width="14" height="16" rx="7" fill="url(#eyeErrorGlow)" filter="url(#cyanGlow)" />
                      <rect x="135" y="94" width="14" height="16" rx="7" fill="url(#eyeErrorGlow)" filter="url(#cyanGlow)" />
                      <ellipse cx="120" cy="122" rx="4" ry="5.5" fill="none" stroke="#ef4444" strokeWidth="2" filter="url(#cyanGlow)" />
                    </g>
                  ) : (
                    /* Normal State: Glowing Cyan Eyes & Smile */
                    <g>
                      <g className="robot-eye-blink">
                        <rect
                          x={90 + (isPasswordFocused ? 0 : pupilPos.x)}
                          y={93 + (isPasswordFocused ? 0 : pupilPos.y)}
                          width="16"
                          height="18"
                          rx="8"
                          fill="url(#eyeGlow)"
                          filter="url(#cyanGlow)"
                        />
                        <circle
                          cx={98 + (isPasswordFocused ? 0 : pupilPos.x)}
                          cy={102 + (isPasswordFocused ? 0 : pupilPos.y)}
                          r="3"
                          fill="#ffffff"
                        />
                        <rect
                          x={134 + (isPasswordFocused ? 0 : pupilPos.x)}
                          y={93 + (isPasswordFocused ? 0 : pupilPos.y)}
                          width="16"
                          height="18"
                          rx="8"
                          fill="url(#eyeGlow)"
                          filter="url(#cyanGlow)"
                        />
                        <circle
                          cx={142 + (isPasswordFocused ? 0 : pupilPos.x)}
                          cy={102 + (isPasswordFocused ? 0 : pupilPos.y)}
                          r="3"
                          fill="#ffffff"
                        />
                      </g>
                      <path d="M 112 122 Q 120 128 128 122" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" fill="none" filter="url(#cyanGlow)" />
                    </g>
                  )}
                </g>

                {/* Password-Covering Articulated Arms */}
                <g className={`robot-arms-covering ${isPasswordFocused ? 'covering' : ''}`}>
                  <g className="robot-arm-cover left">
                    <path d="M 68 162 Q 74 126 96 102" stroke="#4f46e5" strokeWidth="12" strokeLinecap="round" fill="none" />
                    <circle cx="96" cy="102" r="14" fill="#6366f1" stroke="#818cf8" strokeWidth="2" />
                  </g>
                  <g className="robot-arm-cover right">
                    <path d="M 172 162 Q 166 126 144 102" stroke="#4f46e5" strokeWidth="12" strokeLinecap="round" fill="none" />
                    <circle cx="144" cy="102" r="14" fill="#6366f1" stroke="#818cf8" strokeWidth="2" />
                  </g>
                </g>

                {/* Floating Ambient Sparkles */}
                <polygon points="45,95 47,100 52,102 47,104 45,109 43,104 38,102 43,100" fill="#a5f3fc" className="robot-sparkle sparkle-1" />
                <polygon points="195,75 197,80 202,82 197,84 195,89 193,84 188,82 193,80" fill="#a5f3fc" className="robot-sparkle sparkle-2" />
              </g>
            </svg>

            <div className="auth-robot-tagline">
              HCM Lite: smart HR, simplified
            </div>
          </div>
        </div>

        {/* RIGHT: 55% CLEAN FORM SURFACE */}
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
