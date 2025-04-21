import React, { useState, useEffect, useRef } from 'react';
import './StartMenu.scss';

const SIDEBAR_ITEMS = [
  { id: 'apps', label: 'Apps', icon: '🧩' },
  { id: 'games', label: 'Games', icon: '🕹️' },
  { id: 'widgets', label: 'Widgets', icon: '🔲' },
  { id: 'documents', label: 'Documents', icon: '📄' },
  { id: 'pictures', label: 'Pictures', icon: '🖼️' },
  { id: 'videos', label: 'Videos', icon: '🎬' },
  { id: 'power', label: 'Power', icon: '⏻' },
];

interface AppStub {
  id: string;
  title: string;
  icon: string;
  content: (() => JSX.Element) | JSX.Element;
  width: number;
  height: number;
  top: number;
  left: number;
}

interface StartMenuProps {
  show: boolean;
  onClose: () => void;
  onLaunchApp: (app: AppStub) => void;
  onClearSession: () => void;
  apps?: AppStub[];
  folders?: any[];
  onOpenFolder?: (folder: string) => void;
  onOpenShortcut?: (type: 'documents' | 'pictures' | 'videos') => void;
  spotlight?: boolean;
  doubleClickApps?: boolean;
}

import { widgetStubs } from './widgets/WidgetRegistry';
import DuckStationApp from '../apps/games/DuckStationApp';
import PPSSPPApp from '../apps/games/PPSSPPApp';

export const StartMenu: React.FC<StartMenuProps & { onLaunchWidget?: (widget: any) => void }> = ({
  show,
  onClose,
  onLaunchApp,
  onClearSession,
  onLaunchWidget = () => {},
  apps = [],
  folders = [],
  onOpenFolder,
  onOpenShortcut,
  spotlight = false,
  doubleClickApps = false,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show && menuRef.current) {
      menuRef.current.classList.add('startmenu-open');
    }
    return () => {
      if (menuRef.current) {
        menuRef.current.classList.remove('startmenu-open');
      }
    };
  }, [show]);
  const [expanded, setExpanded] = useState('apps');
  const [showApps, setShowApps] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    if (!show) setShowApps(false);
  }, [show]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Escape' && e.shiftKey) || (e.key === 'Meta' && document.fullscreenElement)) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Handle sidebar click for apps section
  const handleSidebarClick = (id: string) => {
    setExpanded(id);
    setShowApps(id === 'apps');
  };

  // Helper to safely invoke optional folder/shortcut handlers
  const handleOpenFolder = (folder: string) => {
    if (onOpenFolder) onOpenFolder(folder);
  };
  const handleOpenShortcut = (type: 'documents' | 'pictures' | 'videos') => {
    if (onOpenShortcut) onOpenShortcut(type);
  };

  if (!show) return null;

  return (
    <div className={`startmenu-root${spotlight ? ' startmenu-spotlight' : ''}`} onClick={onClose}>
      <div
        className={`startmenu-main glass`}
        ref={menuRef}
        onClick={e => e.stopPropagation()}
      >
        <nav className={`startmenu-sidebar${sidebarExpanded ? ' expanded' : ''}`}>
          {SIDEBAR_ITEMS.map(item => (
            <button key={item.id} className={`sidebar-item${expanded === item.id ? ' active' : ''}`} onClick={() => handleSidebarClick(item.id)}>
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <section className="startmenu-content">
          {expanded === 'apps' && showApps && (
            <div className="apps-list">
              {apps.map(app => (
                <button key={app.id} className="app-item" onClick={() => onLaunchApp(app)}>
                  <span className="app-icon">
                    {/^https?:\/\//.test(app.icon) ? (
                      <img
                        src={app.icon}
                        alt={`${app.title} icon`}
                        style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                      />
                    ) : (
                      app.icon
                    )}
                  </span>
                  <span className="app-title">{app.title}</span>
                </button>
              ))}
            </div>
          )}
          {expanded === 'games' && (
            <div className="apps-list">
              {[
                { id: 'minecraft', title: 'Minecraft', icon: 'https://eaglercraft.q13x.com/favicon.ico', content: () => (
                  <iframe
                    src="https://eaglercraft.q13x.com/1.8-wasm/?retina=true&scale=0.8"
                    sandbox="allow-scripts allow-same-origin allow-popups"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="Minecraft"
                  />
                ), width: 900, height: 600, top: 120, left: 420 },
                { id: 'duckstation', title: 'DuckStation', icon: '🕹️', content: () => <DuckStationApp />, width: 800, height: 600, top: 120, left: 420 },
                { id: 'ppsspp', title: 'PPSSPP', icon: '🕹️', content: () => <PPSSPPApp />, width: 800, height: 600, top: 120, left: 420 }
              ].map(app => (
                <button key={app.id} className="app-item" onClick={() => onLaunchApp(app)}>
                  <span className="app-icon">
                    {/^https?:\/\//.test(app.icon) ? (
                      <img
                        src={app.icon}
                        alt={`${app.title} icon`}
                        style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                      />
                    ) : (
                      app.icon
                    )}
                  </span>
                  <span className="app-title">{app.title}</span>
                </button>
              ))}
            </div>
          )}
          {expanded === 'widgets' && (
            <div className="widgets-list" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '18px 0 0 18px' }}>
              {widgetStubs.map(widget => (
                <button
                  key={widget.id}
                  className="widget-item"
                  onClick={() => onLaunchWidget(widget)}
                >
                  <span style={{ fontSize: 20 }}>{widget.icon}</span>
                  <span>{widget.title}</span>
                </button>
              ))}
            </div>
          )}
          {expanded === 'documents' && (
            <div className="folder-list">
              <button className="folder-shortcut" onClick={() => handleOpenShortcut('documents')}>Open Documents</button>
            </div>
          )}
          {expanded === 'pictures' && (
            <div className="folder-list">
              <button className="folder-shortcut" onClick={() => handleOpenShortcut('pictures')}>Open Pictures</button>
            </div>
          )}
          {expanded === 'videos' && (
            <div className="folder-list">
              <button className="folder-shortcut" onClick={() => handleOpenShortcut('videos')}>Open Videos</button>
            </div>
          )}
          {expanded === 'power' && (
            <div className="power-list">
              <button className="power-btn" onClick={onClearSession}>Power Off (Clear Session)</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default StartMenu;
