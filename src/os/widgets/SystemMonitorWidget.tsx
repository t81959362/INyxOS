import React from 'react';
export const SystemMonitorWidget: React.FC = () => (
  <div style={{ padding: 16, minWidth: 180 }}>
    <div style={{ fontSize: 22, marginBottom: 6 }}>📊 System Monitor</div>
    <div style={{ fontSize: 14, color: '#88a' }}>CPU: 12%<br />RAM: 48%<br />Battery: 89%</div>
    <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>Demo widget</div>
  </div>
);
