import React from 'react';

const ErrorBox = ({ error, onRetry = null }) => {
  if (!error) return null;

  const errorMessage =
    typeof error === 'string'
      ? error
      : error?.response?.data?.error || error?.message || 'An unexpected error occurred.';

  return (
    <div
      role="alert"
      style={{
        backgroundColor: 'var(--danger-bg)',
        border: '1px solid var(--danger-border)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.25rem',
        margin: '1.25rem 0',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.875rem',
        color: 'var(--danger)',
        fontSize: '0.875rem',
        animation: 'fadeIn 0.25s ease'
      }}
    >
      <div style={{ flexShrink: 0, marginTop: '2px' }}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <div style={{ flex: 1, lineHeight: 1.45 }}>
        <div style={{ fontWeight: 600, marginBottom: '0.15rem' }}>Attention Needed</div>
        <div style={{ opacity: 0.9 }}>{errorMessage}</div>
        {onRetry && (
          <div style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={onRetry}
              style={{ fontWeight: 600 }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorBox;
