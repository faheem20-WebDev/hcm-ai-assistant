import React from 'react';

const Empty = ({ title = 'No records found', description = 'There is no data to display at this time.', action = null }) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1.5rem',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px dashed #cbd5e1',
    margin: '1rem 0'
  };

  const iconStyle = {
    fontSize: '2rem',
    color: '#94a3b8',
    marginBottom: '0.5rem'
  };

  const titleStyle = {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#334155',
    margin: '0 0 0.25rem 0'
  };

  const descStyle = {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: '0 0 1rem 0',
    maxWidth: '360px'
  };

  return (
    <div style={containerStyle}>
      <div style={iconStyle}>📂</div>
      <h4 style={titleStyle}>{title}</h4>
      <p style={descStyle}>{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default Empty;
