import React, { useState, useEffect } from 'react';
import { Taskbar } from './Taskbar';
import { WindowManager } from './WindowManager';
import { Launcher } from './Launcher';
import { NotificationCenter } from './NotificationCenter';
import { NotificationProvider, useNotifications } from './NotificationProvider';
import { Toast } from './Toast';
import { defaultWindows, appStubs } from './defaultWindows';
import { desktopShortcuts } from './desktopShortcuts';
import Nyxwallpaper from '../assets/Nyxwallpaper.png'; // Corrected path
import './Desktop.scss';

const DesktopContent: React.FC = () => {
  // ...existing state and logic...
  // Listen for PWA launch events
  useEffect(() => {
    const handler = (e: any) => {
      const app = e.detail;
      setWindows(ws => [
        ...ws,
        {
          id: 'pwa-' + app.id + '-' + Date.now(),
          title: app.name,
          icon: app.icon || '🌐',
          content: (
            <iframe
              src={app.url}
              style={{ width: '100%', height: '100%', border: 'none', background: '#181c25' }}
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
              title={app.name}
            />
          ),
          width: 900,
          height: 600,
          top: 80 + Math.random() * 60,
          left: 120 + Math.random() * 80,
          zIndex: 10,
        }
      ]);
    };
    window.addEventListener('os-open-pwa', handler as any);
    return () => window.removeEventListener('os-open-pwa', handler as any);
  }, []);
  const [windows, setWindows] = useState<any[]>(() => {
  const saved = localStorage.getItem('os_windows');
  if (saved) {
    try {
      // Rehydrate windows: restore content property from appStubs if possible
      const parsed = JSON.parse(saved);
      return parsed.map((win: any) => {
        // Try to match by id, app, or title
        let stub = appStubs.find(a => a.id === win.id || a.id === win.app || a.title === win.title);
        // If not found, try to match by title ignoring case and whitespace
        if (!stub && win.title) {
          stub = appStubs.find(a => a.title && a.title.replace(/\s+/g, '').toLowerCase() === win.title.replace(/\s+/g, '').toLowerCase());
        }
        // If still not found, try to match by icon (for built-in apps)
        if (!stub && win.icon) {
          stub = appStubs.find(a => a.icon === win.icon);
        }
        if (typeof win.content !== 'function' && stub) {
          return { ...win, content: typeof stub.content === 'function' ? stub.content : () => stub.content };
        }
        return win;
      });
    } catch {
      return defaultWindows;
    }
  }
  return defaultWindows;
});

// Simple error boundary to prevent one app from crashing the desktop
class WindowErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, info: any) { console.error('Window error:', error, info); }
  render() {
    if (this.state.hasError) return <div style={{color: 'red', padding: 24}}>App crashed. Please close this window.</div>;
    return this.props.children;
  }
}

  const [showLauncher, setShowLauncher] = React.useState(false);
  const { notifications, push, remove } = useNotifications();

  // Show latest notifications as toasts
  React.useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => remove(notifications[0].id), 3500);
      return () => clearTimeout(timer);
    }
  }, [notifications, remove]);

  // Persist windows state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('os_windows', JSON.stringify(
      windows.map(({ content, ...rest }) => rest)
    ));
  }, [windows]);

  return (
    <div className="desktop-root">
      <div className="desktop-icons">
        {desktopShortcuts.map((shortcut: { id: string; app: string; icon?: string; name?: string }) => {
          const app = appStubs.find(a => a.id === shortcut.app);
          if (!app) return null;
          return (
            <button
              key={shortcut.id}
              className="desktop-icon"
              onClick={() => setWindows(w => [...w, {
                id: Math.random().toString(36).slice(2),
                title: app.title,
                icon: app.icon,
                content: typeof app.content === 'function' ? app.content() : app.content,
                width: app.width,
                height: app.height,
                top: app.top,
                left: app.left,
                zIndex: 10
              }])}
            >
              <span className="desktop-icon-img">{shortcut.icon || app.icon}</span>
              <span className="desktop-icon-label">{shortcut.name || app.title}</span>
            </button>
          );
        })}
      </div>
      <WindowErrorBoundary>
  <WindowManager windows={windows} setWindows={setWindows} />
</WindowErrorBoundary>
      <Taskbar
        onLauncher={() => setShowLauncher(v => !v)}
        windows={windows}
        setWindows={setWindows}
      />
      {showLauncher && (
        <Launcher
          onLaunch={app => {
            setWindows(w => [...w, {
              id: Math.random().toString(36).slice(2),
              title: app.title,
              icon: app.icon,
              content: typeof app.content === 'function' ? app.content() : app.content,
              width: app.width,
              height: app.height,
              top: app.top,
              left: app.left,
              zIndex: 10
            }]);
            setShowLauncher(false);
          }}
          onClose={() => setShowLauncher(false)}
        />
      )}
      <NotificationCenter notifications={notifications} />
      <div style={{ position: 'fixed', bottom: 60, right: 24, zIndex: 999 }}>
        {notifications.slice(-2).map(n => (
          <Toast key={n.id} title={n.title} message={n.message} type={n.type} onClose={() => remove(n.id)} />
        ))}
      </div>
    </div>
  );
};

export const Desktop: React.FC = () => (
  <NotificationProvider>
    <DesktopContent />
  </NotificationProvider>
);
