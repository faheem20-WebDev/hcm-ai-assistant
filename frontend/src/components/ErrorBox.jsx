import React from 'react';

const ErrorBox = ({ error, onRetry = null }) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' 
    ? error 
    : error?.response?.data?.error || error?.message || 'An unexpected error occurred.';

  const containerStyle = {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '1rem',
    margin: '1rem 0',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    color: '#991b1b',
    fontSize: '0.875rem'
  };

  const iconStyle = {
    fontSize: '1.25rem',
    lineHeight: 1
  };

  const contentStyle = {
    flex: 1
  };

  const btnStyle = {
    marginTop: '0.5rem',
    backgroundColor: '#b91c1c',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '0.35rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer'
  };

  return (
    <div style={containerStyle} role="alert">
      <span style={iconStyle}>⚠️</span>
      <div style={contentStyle}>
        <strong>Error: </strong>
        <span>{errorMessage}</span>
        {onRetry && (
          <div>
            <button style={btnStyle} onClick={onRetry}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorBox;
