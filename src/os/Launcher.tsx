import React from 'react';
import { appStubs } from './defaultWindows';
import './Launcher.scss';

export const Launcher: React.FC<{
  onLaunch: (app: any) => void;
  onClose: () => void;
}> = ({ onLaunch, onClose }) => (
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
      </div>
      <button className="launcher-close" onClick={onClose}>Close</button>
    </div>
  </div>
);
