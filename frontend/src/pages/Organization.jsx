import React, { useState } from 'react';
import Empty from '../components/Empty';

const Organization = () => {
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
          Organization Setup
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
          Manage company settings, departments, designations, leave types, and holidays.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #cbd5e1', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {['settings', 'departments', 'designations', 'leave-types', 'holidays'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.6rem 1rem',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
              color: activeTab === tab ? '#2563eb' : '#64748b',
              fontWeight: activeTab === tab ? '600' : '500',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      <Empty
        title={`No ${activeTab.replace('-', ' ')} configured`}
        description={`Organization configuration for ${activeTab.replace('-', ' ')} will be displayed here.`}
      />
    </div>
  );
};

export default Organization;
