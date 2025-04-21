import React from 'react';
import StartMenuIcon from '../assets/Start Menu.png';
import { SystemTray, TrayIcon } from './SystemTray';
import CalendarTray from './CalendarTray';
import BatteryTray from './BatteryTray';
import OptionsCenter from './OptionsCenter';
import './Taskbar.scss';

// NotificationPopover import
import { NotificationPopover } from './NotificationPopover';
import { useNotifications } from './NotificationProvider';
import AiAssistant from './components/AiAssistant';

export const Taskbar: React.FC<{
  onLauncher: () => void;
  windows: any[];
  setWindows: (fn: (w: any[]) => any[]) => void;
}> = ({ onLauncher, windows, setWindows }) => {
  const { notifications, remove } = useNotifications();
  const [showPopover, setShowPopover] = React.useState(false);
  const [showHiddenIcons, setShowHiddenIcons] = React.useState(false);
  const [showAI, setShowAI] = React.useState(false);

  const trayIcons: TrayIcon[] = [
    {
      id: 'notifications',
      icon: (
        <span title="Notifications" onClick={() => setShowPopover(v => !v)} style={{ position: 'relative' }}>
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.9997 19C14.9997 20.6569 13.6566 22 11.9997 22C10.3429 22 8.99972 20.6569 8.99972 19M13.7962 6.23856C14.2317 5.78864 14.4997 5.17562 14.4997 4.5C14.4997 3.11929 13.3804 2 11.9997 2C10.619 2 9.49972 3.11929 9.49972 4.5C9.49972 5.17562 9.76772 5.78864 10.2032 6.23856M17.9997 11.2C17.9997 9.82087 17.3676 8.49823 16.2424 7.52304C15.1171 6.54786 13.591 6 11.9997 6C10.4084 6 8.8823 6.54786 7.75708 7.52304C6.63186 8.49823 5.99972 9.82087 5.99972 11.2C5.99972 13.4818 5.43385 15.1506 4.72778 16.3447C3.92306 17.7056 3.5207 18.3861 3.53659 18.5486C3.55476 18.7346 3.58824 18.7933 3.73906 18.9036C3.87089 19 4.53323 19 5.85791 19H18.1415C19.4662 19 20.1286 19 20.2604 18.9036C20.4112 18.7933 20.4447 18.7346 20.4629 18.5486C20.4787 18.3861 20.0764 17.7056 19.2717 16.3447C18.5656 15.1506 17.9997 13.4818 17.9997 11.2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {notifications.length > 0 && (
            <span style={{
              position: 'absolute',
              top: -3, right: -3,
              background: '#e53935', color: '#fff', borderRadius: '50%', fontSize: 10, width: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #232a39',
            }}>{notifications.length}</span>
          )}
        </span>
      ),
      popover: showPopover ? (
        <NotificationPopover notifications={notifications} onRemove={remove} />
      ) : null,
    },
    {
      id: 'network',
      icon: (
        <span title="Nexa" onClick={() => setShowAI(v => !v)} style={{ cursor: 'pointer' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="18" viewBox="0 0 24 24" fill="none" stroke="#e6c4ff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
            <rect x="9" y="9" width="6" height="6" />
            <line x1="9" y1="1" x2="9" y2="4" />
            <line x1="15" y1="1" x2="15" y2="4" />
            <line x1="9" y1="23" x2="9" y2="20" />
            <line x1="15" y1="23" x2="15" y2="20" />
            <line x1="1" y1="9" x2="4" y2="9" />
            <line x1="23" y1="9" x2="20" y2="9" />
            <line x1="1" y1="15" x2="4" y2="15" />
            <line x1="23" y1="15" x2="20" y2="15" />
          </svg>
        </span>
      ),
      popover: showAI ? <AiAssistant onClose={() => setShowAI(false)} /> : null,
    },
    {
      id: 'battery',
      icon: <BatteryTray />
    },
    {
      id: 'calendar',
      icon: <CalendarTray />
    },
    {
      id: 'clock',
      icon: <span className="clock">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>,
    },
  ];

  // Find the focused window (topmost, not minimized)
  const focusedIdx = windows.findIndex(w => w.focused && !w.minimized);

  const handleTaskbarClick = (idx: number) => {
    setWindows(ws => ws.map((w, i) => {
      if (i === idx) {
        // If minimized, restore and focus; otherwise, just focus
        return { ...w, minimized: false, focused: true, zIndex: Math.max(...ws.map(w2 => w2.zIndex || 0), 10) + 1 };
      } else {
        return { ...w, focused: false };
      }
    }));
  };

  const handleMinimize = (idx: number) => {
    setWindows(ws => ws.map((w, i) => i === idx ? { ...w, minimized: true, focused: false } : w));
  };

  const [showOptions, setShowOptions] = React.useState(false);

  // Shorten URL titles to domain names
  const shortenTitle = (t: string) => {
    if (t.startsWith('http://') || t.startsWith('https://')) {
      try {
        const h = new URL(t).hostname.replace(/^www\./, '');
        return h.charAt(0).toUpperCase() + h.slice(1);
      } catch {
        return t;
      }
    }
    return t;
  };

  return (
    <div className="taskbar-root">
      <button
        className="taskbar-launcher"
        onClick={onLauncher}
        title="Open Launcher"
        style={{ background: 'none', border: 'none', padding: 0, marginRight: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 42 }}
      >
        <img src={StartMenuIcon} alt="Start Menu" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 8, boxShadow: '0 1.5px 6px #232a3920' }} />
      </button>
      <div className="taskbar-center">
        <div className="taskbar-apps">
          {windows.map((win, idx) => (
            <div
              key={win.id}
              className={
                'taskbar-app-icon' +
                (win.focused && !win.minimized ? ' taskbar-app-icon--active' : '') +
                (win.minimized ? ' taskbar-app-icon--minimized' : '')
              }
              title={shortenTitle(win.title)}
              onClick={() => handleTaskbarClick(idx)}
            >
              {typeof win.icon === 'string' && (win.icon.startsWith('http') || win.icon.startsWith('/')) ? (
                <img src={win.icon} alt={win.title} className="taskbar-app-img" />
              ) : (
                <span className="taskbar-app-emoji">{win.icon}</span>
              )}
              <span className="taskbar-app-title">{shortenTitle(win.title)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="taskbar-right" style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
        <button
          className={`taskbar-hidden-toggle${showHiddenIcons ? ' open' : ''}`}
          onClick={() => setShowHiddenIcons(h => !h)}
          title={showHiddenIcons ? 'Hide hidden icons' : 'Show hidden icons'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12l6-4-6-4" />
          </svg>
        </button>
        <SystemTray icons={showHiddenIcons ? trayIcons : trayIcons.slice(0, 3)} />
        <button
          className="taskbar-options-btn"
          title="Action Center"
          aria-label="Open Action Center"
          onClick={() => setShowOptions(v => !v)}
          style={{ background: 'none', border: 'none', borderRadius: 8, padding: 4, cursor: 'pointer', fontSize: 24, color: '#bfaaff', transition: 'background 0.14s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {/* Modern Control Center/Sliders Icon (SVG) */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
            <rect x="4" y="8" width="20" height="2.4" rx="1.2" fill="#bfaaff"/>
            <rect x="7" y="13.8" width="14" height="2.4" rx="1.2" fill="#bfaaff"/>
            <rect x="10" y="19.6" width="8" height="2.4" rx="1.2" fill="#bfaaff"/>
          </svg>
        </button>
        {showOptions && (
          <OptionsCenter onClose={() => setShowOptions(false)} />
        )}
      </div>
    </div>
  );
};
