import React from 'react';
import Empty from '../components/Empty';

const Payslips = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            My Payslips
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            View and download finalized monthly salary statements and tax deductions.
          </p>
        </div>
      </div>

      <Empty
        title="No payslips available"
        description="Finalized monthly payslips issued by HR will be accessible here."
      />
    </div>
  );
};

export default Payslips;
