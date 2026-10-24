import React from 'react';

const Loading = ({ message = 'Loading...', fullScreen = false }) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2.5rem 1.5rem',
    gap: '0.75rem',
    minHeight: fullScreen ? '100vh' : '220px',
    width: '100%'
  };

  const spinnerStyle = {
    width: '38px',
    height: '38px',
    border: '3px solid #e2e8f0',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'hcm-spin 0.8s linear infinite'
  };

  const textStyle = {
    color: '#64748b',
    fontSize: '0.9rem',
    fontWeight: '500'
  };

  return (
    <div style={containerStyle}>
      <div style={spinnerStyle}></div>
      <p style={textStyle}>{message}</p>
    </div>
  );
};

export default Loading;
