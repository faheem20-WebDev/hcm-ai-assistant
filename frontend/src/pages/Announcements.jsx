import React from 'react';
import Empty from '../components/Empty';

const Announcements = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            Company Announcements
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            Official notices, holiday updates, and organization broadcasts.
          </p>
        </div>
      </div>

      <Empty
        title="No active announcements"
        description="Broadcast notices and company news will be published here."
      />
    </div>
  );
};

export default Announcements;
