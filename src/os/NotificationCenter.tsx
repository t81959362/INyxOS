import React from 'react';
import './NotificationCenter.scss';

export const NotificationCenter: React.FC<{ notifications: any[] }> = ({ notifications }) => (
  <div className="notification-center-root">
    {notifications.map((n, i) => (
      <div key={i} className="notification">
        <strong>{n.title}</strong>
        <div>{n.message}</div>
      </div>
    ))}
  </div>
);
