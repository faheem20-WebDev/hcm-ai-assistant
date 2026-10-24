import React from 'react';

const Loading = ({ message = 'Loading...', fullScreen = false, type = 'card' }) => {
  if (fullScreen) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg)',
          gap: '1.25rem',
          padding: '2rem'
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '3px solid var(--border)',
              borderTopColor: 'var(--primary)',
              animation: 'spin 0.9s cubic-bezier(0.6, 0.2, 0.4, 0.8) infinite'
            }}
          />
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent)',
              opacity: 0.85,
              animation: 'pulse 1.4s ease-in-out infinite'
            }}
          />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500, margin: 0 }}>
          {message}
        </p>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        margin: '1.5rem 0',
        padding: '1.75rem',
        animation: 'fadeIn 0.25s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: '2.5px solid var(--border)',
            borderTopColor: 'var(--primary)',
            animation: 'spin 0.8s linear infinite',
            flexShrink: 0
          }}
        />
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>
          {message}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', width: '100%' }}>
        <div className="skeleton" style={{ height: '14px', width: '85%' }} />
        <div className="skeleton" style={{ height: '14px', width: '60%' }} />
        <div className="skeleton" style={{ height: '14px', width: '72%' }} />
      </div>
    </div>
  );
};

export default Loading;
