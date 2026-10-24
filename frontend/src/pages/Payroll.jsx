import React from 'react';
import Empty from '../components/Empty';

const Payroll = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            Payroll Runs & Processing
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            Monthly payroll draft calculations, tax withholding, and finalizations.
          </p>
        </div>
      </div>

      <Empty
        title="No payroll runs initiated"
        description="Initiate a monthly payroll run to generate payslip drafts and tax calculations."
      />
    </div>
  );
};

export default Payroll;
