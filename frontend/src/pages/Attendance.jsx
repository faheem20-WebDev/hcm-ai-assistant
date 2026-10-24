import React from 'react';
import Empty from '../components/Empty';

const Attendance = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            Attendance & Time Tracking
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            Check-in/out records, real-time attendance board, and correction requests.
          </p>
        </div>
      </div>

      <Empty
        title="No attendance records"
        description="Daily check-in logs and attendance logs will appear here."
      />
    </div>
  );
};

export default Attendance;
