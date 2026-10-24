import React from 'react';
import Empty from '../components/Empty';

const Employees = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            Employees Directory
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            View, onboard, and manage company staff records and profiles.
          </p>
        </div>
      </div>

      <Empty
        title="No employees registered"
        description="Employee profiles created by HR or Admin will be listed here."
      />
    </div>
  );
};

export default Employees;
