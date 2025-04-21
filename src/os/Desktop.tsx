import React, { useState, useEffect } from 'react';
import { Taskbar } from './Taskbar';
import { WindowManager } from './WindowManager';
import { Launcher } from './Launcher';
import { StartMenu } from './StartMenu';
import { NotificationCenter } from './NotificationCenter';
import { NotificationProvider, useNotifications } from './NotificationProvider';
import { Toast } from './Toast';
import { defaultWindows, appStubs } from './defaultWindows';
import { desktopShortcuts } from './desktopShortcuts';
import Nyxwallpaper from '../assets/Nyxwallpaper.png'; // Corrected path
import './Desktop.scss';

import LockScreen from './LockScreen';

import { widgetStubs } from './widgets/WidgetRegistry';
import { Plasmoid } from './widgets/Plasmoid';

const DesktopContent: React.FC = () => {
  // ...existing state and logic...
  // Lock screen state and inactivity timer
  const [locked, setLocked] = useState(false);
  const [wallpaperUrl] = useState(Nyxwallpaper);
  React.useEffect(() => {
    let timer: any;
    const reset = () => {
      clearTimeout(timer);
      if (!locked) timer = setTimeout(() => setLocked(true), 5 * 60 * 1000); // 5 min
    };
    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    reset();
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', reset);
      window.removeEventListener('keydown', reset);
    };
  }, [locked]);

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
          width: 700,
          height: 520,
          top: 80 + Math.random() * 60,
          left: 120 + Math.random() * 80,
          zIndex: 10,
        }
      ]);
    };
    window.addEventListener('os-open-pwa', handler as any);

    // Listen for Settings app close event
    const closeSettingsHandler = (e: any) => {
      if (e.detail === 'settings') {
        setWindows(ws => ws.filter(w => w.id !== 'settings' && w.title !== 'Settings'));
      }
    };
    window.addEventListener('os-close-app', closeSettingsHandler);

    return () => {
      window.removeEventListener('os-open-pwa', handler as any);
      window.removeEventListener('os-close-app', closeSettingsHandler);
    };
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

  // Start Menu integration
  const [showStartMenu, setShowStartMenu] = React.useState(false);

  type AppStub = {
    id: string;
    title: string;
    icon: string;
    content: (() => JSX.Element) | JSX.Element;
    width: number;
    height: number;
    top: number;
    left: number;
    zIndex?: number;
  };

  type WidgetInstance = { id: string; widgetId: string; x?: number; y?: number; zIndex?: number };

  const [widgets, setWidgets] = useState<WidgetInstance[]>(() => {
    const saved = localStorage.getItem('os_widgets');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [];
  });
  // Find the highest zIndex in use
  const maxZ = widgets.reduce((acc: number, w: WidgetInstance) => Math.max(acc, w.zIndex ?? 100), 100);

  const { notifications, push, remove } = useNotifications();

  // Show latest notifications as toasts
  React.useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => remove(notifications[0].id), 3500);
      return () => clearTimeout(timer);
    }
  }, [notifications, remove]);

  // Persist windows state to localStorage whenever it changes

  // --- Dynamic External URL Launcher (Electron only) ---
  const [showUrlPrompt, setShowUrlPrompt] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const handleExternalUrlOpen = () => {
    if (window.electronAPI && externalUrl) {
      window.electronAPI.openExternalWindow(externalUrl);
      setShowUrlPrompt(false);
      setExternalUrl('');
    }
  }
  useEffect(() => {
    localStorage.setItem('os_windows', JSON.stringify(
      windows.map(({ content, ...rest }) => rest)
    ));
  }, [windows]);
  // Persist widgets
  useEffect(() => {
    localStorage.setItem('os_widgets', JSON.stringify(widgets));
  }, [widgets]);

  return (
    <div className="desktop-root">

      <LockScreen show={locked} onUnlock={() => setLocked(false)} wallpaperUrl={wallpaperUrl} />
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
                content: typeof app.content === 'function' ? app.content : () => app.content,
                width: app.width,
                height: app.height,
                top: app.top,
                left: app.left,
                zIndex: 10
              }])}
            >
              <span className="desktop-icon-img">{shortcut.icon ? shortcut.icon : (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="20" height="20" rx="6" fill="#8f5fff"/>
    <path d="M12 18h8M12 14h8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)}</span>
              <span className="desktop-icon-label">{shortcut.name || app.title}</span>
            </button>
          );
        })}
      </div>
      {/* Plasmoid widgets */}
      {widgets.map((w: WidgetInstance, idx: number) => {
        const stub = widgetStubs.find((ws) => ws.id === w.widgetId);
        if (!stub) return null;
        return (
          <Plasmoid
            key={w.id}
            id={w.id}
            x={w.x ?? (120 + 40 * idx)}
            y={w.y ?? (120 + 40 * idx)}
            zIndex={w.zIndex ?? (100 + idx)}
            onRemove={(id) => setWidgets((ws: WidgetInstance[]) => ws.filter((ww) => ww.id !== id))}
            onPositionChange={(id, dx, dy) => setWidgets((ws: WidgetInstance[]) => ws.map((ww) => ww.id === id ? { ...ww, x: (ww.x ?? 0) + dx, y: (ww.y ?? 0) + dy } : ww))}
            onFocus={id => setWidgets((ws: WidgetInstance[]) => {
              const zTop = (ws.reduce((acc: number, w: WidgetInstance) => Math.max(acc, w.zIndex ?? 100), 100) + 1);
              return ws.map((ww) => ww.id === id ? { ...ww, zIndex: zTop } : ww);
            })}
            widgetTitle={stub.title}
            widgetIcon={stub.icon}
          >
            <stub.component />
          </Plasmoid>
        );
      })}
      <WindowErrorBoundary>
        <WindowManager windows={windows} setWindows={setWindows} />
      </WindowErrorBoundary>
      <Taskbar
        onLauncher={() => setShowStartMenu(v => !v)}
        windows={windows}
        setWindows={setWindows}
      />
      {showStartMenu && (
        <StartMenu
          show={showStartMenu}
          onClose={() => setShowStartMenu(false)}
          onLaunchApp={(app: typeof appStubs[0]) => {
            setWindows(w => [...w, {
              id: Math.random().toString(36).slice(2),
              title: app.title,
              icon: app.icon,
              content: typeof app.content === 'function' ? app.content : () => app.content,
              width: app.width,
              height: app.height,
              top: app.top,
              left: app.left,
              zIndex: 10
            }]);
            setShowStartMenu(false);
          }}
          onLaunchWidget={(widget) => {
            setWidgets(ws => [
              ...ws,
              {
                id: 'widget-' + widget.id + '-' + Date.now(),
                widgetId: widget.id,
                x: 120 + 30 * ws.length,
                y: 120 + 30 * ws.length,
                zIndex: 100 + ws.length
              }
            ]);
            setShowStartMenu(false);
          }}
          onClearSession={() => {
            setWindows([]);
            setWidgets([]);
            localStorage.clear();
            window.location.reload();
          }}
          apps={appStubs}
          folders={[]}
          onOpenFolder={() => {}}
          onOpenShortcut={(type: 'documents' | 'pictures' | 'videos') => {
            // Open Documents, Pictures, Videos as Explorer windows
            let folderTitle = '';
            if (type === 'documents') folderTitle = 'Documents';
            if (type === 'pictures') folderTitle = 'Pictures';
            if (type === 'videos') folderTitle = 'Videos';
            setWindows(w => [...w, {
              id: 'explorer-' + type + '-' + Date.now(),
              title: folderTitle,
              icon: '📁',
              content: () => <div style={{padding: 32, color: '#fff'}}>Folder: {folderTitle}</div>,
              width: 700,
              height: 520,
              top: 120,
              left: 420,
              zIndex: 10
            }]);
            setShowStartMenu(false);
          }}
          spotlight={true}
          doubleClickApps={true}
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
