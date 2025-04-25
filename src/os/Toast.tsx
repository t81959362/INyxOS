import React from 'react';
import './Toast.scss';

export const Toast: React.FC<{ title: string; message: string; type?: 'info' | 'success' | 'error'; onClose: () => void; }>
  = ({ title, message, type = 'info', onClose }) => (
  <div className={`toast-root toast-${type}`}>  
    <div className="toast-title">{title}</div>
    <div className="toast-message">{message}</div>
    <button className="toast-close" onClick={onClose} aria-label="Close notification">✕</button>
  </div>
);
