import React from 'react';
export const WeatherWidget: React.FC = () => (
  <div style={{ padding: 16, minWidth: 180 }}>
    <div style={{ fontSize: 28 }}>☀️</div>
    <div style={{ fontWeight: 600, fontSize: 18 }}>Weather</div>
    <div style={{ fontSize: 14, color: '#88a' }}>21°C, Sunny</div>
    <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>Demo widget</div>
  </div>
);
