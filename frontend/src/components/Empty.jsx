import React from 'react';

const Empty = ({
  title = 'No records found',
  description = 'There is no data to display at this time.',
  action = null
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1.5px dashed var(--border)',
        margin: '1.5rem 0',
        animation: 'fadeIn 0.25s ease'
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'var(--surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          boxShadow: 'inset 0 0 0 1px var(--border)'
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          <line x1="9" y1="13" x2="15" y2="13" stroke="var(--accent)" strokeWidth="2" />
        </svg>
      </div>

      <h4
        style={{
          fontSize: '1.05rem',
          fontWeight: 600,
          color: 'var(--text)',
          margin: '0 0 0.35rem 0'
        }}
      >
        {title}
      </h4>

      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--text-muted)',
          margin: '0 0 1.25rem 0',
          maxWidth: '380px',
          lineHeight: 1.5
        }}
      >
        {description}
      </p>

      {action && <div>{action}</div>}
    </div>
  );
};

export default Empty;
