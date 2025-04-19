import React from 'react';
import { Notification } from './NotificationProvider';
import './NotificationPopover.scss';

export const NotificationPopover: React.FC<{
  notifications: Notification[];
  onRemove: (id: string) => void;
}> = ({ notifications, onRemove }) => (
  <div className="notification-popover-root" role="dialog" aria-label="Notifications">
    <div className="notification-popover-title">Notifications</div>
    {notifications.length === 0 ? (
      <div className="notification-popover-empty">No notifications</div>
    ) : notifications.slice().reverse().map(n => (
      <div key={n.id} className={`notification-popover-item notification-popover-${n.type || 'info'}`}> 
        <div className="notification-popover-header">
          <span className="notification-popover-item-title">{n.title}</span>
          <button className="notification-popover-remove" onClick={() => onRemove(n.id)} aria-label="Dismiss notification">✕</button>
        </div>
        <div className="notification-popover-message">{n.message}</div>
      </div>
    ))}
  </div>
);
