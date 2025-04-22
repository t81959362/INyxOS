import React from 'react';
import { createRoot } from 'react-dom/client';
import { Desktop } from './os/Desktop';
import { NotificationProvider } from './os/NotificationProvider';
import './style/global.scss';
import './index.css';
import './i18n';

const root = createRoot(document.getElementById('root')!);
// Register service worker for background sync & notifications
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
root.render(
  <NotificationProvider>
    <Desktop />
  </NotificationProvider>
);
