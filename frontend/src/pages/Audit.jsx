import React from 'react';
import Empty from '../components/Empty';

const Audit = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            System Audit Log
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            Security logs, user actions, administrative overrides, and timestamped events.
          </p>
        </div>
      </div>

      <Empty
        title="No audit entries found"
        description="Recorded administrative events and compliance trails will appear here."
      />
    </div>
  );
};

export default Audit;
