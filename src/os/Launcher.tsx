import React, { useState } from 'react';
import { appStubs } from './defaultWindows';
import { widgetStubs } from './widgets/WidgetRegistry';
import './Launcher.scss';

export const Launcher: React.FC<{
  onLaunch: (app: any) => void;
  onClose: () => void;
  onAddWidget?: (widget: any) => void;
  onRemoveWidget?: (widgetId: string) => void;
  activeWidgets?: string[];
}> = ({ onLaunch, onClose, onAddWidget, onRemoveWidget, activeWidgets = [] }) => {
  const [showWidgetMenu, setShowWidgetMenu] = useState(false);

  return (
    <div className="launcher-root" onClick={onClose}>
      <div className="launcher-modal" onClick={e => e.stopPropagation()}>
        <h2>Apps</h2>
        <div className="launcher-apps">
          {appStubs.map(app => (
            <button key={app.id} className="launcher-app" onClick={() => onLaunch({
              id: Math.random().toString(36).slice(2),
              title: app.title,
              icon: app.icon,
              content: app.content,
              width: app.width,
              height: app.height,
              top: app.top,
              left: app.left,
              zIndex: 10
            })}>
              <span className="launcher-app-icon">{app.icon}</span>
              <span className="launcher-app-title">{app.title}</span>
            </button>
          ))}
          <button className="launcher-app" onClick={e => { e.stopPropagation(); setShowWidgetMenu(true); }}>
            <span className="launcher-app-icon">🧩</span>
            <span className="launcher-app-title">Widgets</span>
          </button>
        </div>
        <button className="launcher-close" onClick={onClose}>Close</button>
      </div>
      {showWidgetMenu && (
        <div className="launcher-root" style={{ zIndex: 400 }} onClick={() => setShowWidgetMenu(false)}>
          <div className="launcher-modal" onClick={e => e.stopPropagation()} style={{ minWidth: 380 }}>
            <h2>Widgets</h2>
            <div className="launcher-apps">
              {widgetStubs.map(widget => (
                <div key={widget.id} className="launcher-app" style={{ flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span className="launcher-app-icon">{widget.icon}</span>
                  <span className="launcher-app-title">{widget.title}</span>
                  {activeWidgets.includes(widget.id) ? (
                    <button style={{ marginTop: 8, background: '#e53935', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                      onClick={() => onRemoveWidget && onRemoveWidget(widget.id)}>
                      Remove
                    </button>
                  ) : (
                    <button style={{ marginTop: 8, background: '#308aff', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                      onClick={() => onAddWidget && onAddWidget(widget)}>
                      Add
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button className="launcher-close" onClick={() => setShowWidgetMenu(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};
