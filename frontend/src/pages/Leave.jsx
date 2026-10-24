import React from 'react';
import Empty from '../components/Empty';

const Leave = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            Leave Management
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            Leave balances, applications, and approval workflows.
          </p>
        </div>
      </div>

      <Empty
        title="No leave requests"
        description="Submitted leave requests and approvals will appear here."
      />
    </div>
  );
};

export default Leave;
