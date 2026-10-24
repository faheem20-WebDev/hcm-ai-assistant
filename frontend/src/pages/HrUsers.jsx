import React from 'react';
import Empty from '../components/Empty';

const HrUsers = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            HR Users Management
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            Provision and manage Human Resource officer accounts and credentials.
          </p>
        </div>
      </div>

      <Empty
        title="No HR users added"
        description="HR users authorized to access HR features will appear here."
      />
    </div>
  );
};

export default HrUsers;
