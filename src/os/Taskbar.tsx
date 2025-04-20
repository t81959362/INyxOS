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

export const Taskbar: React.FC<{
  onLauncher: () => void;
  windows: any[];
  setWindows: (fn: (w: any[]) => any[]) => void;
}> = ({ onLauncher, windows, setWindows }) => {
  const { notifications, remove } = useNotifications();
  const [showPopover, setShowPopover] = React.useState(false);

  const trayIcons: TrayIcon[] = [
    {
      id: 'notifications',
      icon: (
        <span title="Notifications" onClick={() => setShowPopover(v => !v)} style={{ position: 'relative' }}>
          🔔
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
      icon: <span title="Network">🌐</span>,
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
              title={win.title}
              onClick={() => handleTaskbarClick(idx)}
            >
              <span className="taskbar-app-emoji">{win.icon}</span>
              <span className="taskbar-app-title">{win.title}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="taskbar-right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <SystemTray icons={trayIcons} />
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
