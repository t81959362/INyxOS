import React from 'react';
import './SystemTray.scss';

export interface TrayIcon {
  id: string;
  icon: React.ReactNode;
  onClick?: () => void;
  popover?: React.ReactNode;
}

export const SystemTray: React.FC<{ icons: TrayIcon[] }> = ({ icons }) => {
  const [showVolume, setShowVolume] = React.useState(false);
  // For now, stub: just one slider for 'System'. Later, enumerate apps with audio.
  const volumePopover = showVolume && (
    <div className="tray-popover tray-volume-popover" style={{ position: 'absolute', right: 0, bottom: 48, background: 'rgba(30,34,43,0.95)', borderRadius: 12, boxShadow: '0 2px 16px #000a', padding: 18, minWidth: 180, zIndex: 1000 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Volume Mixer</div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ marginRight: 8 }}>System</span>
        <input type="range" min={0} max={100} defaultValue={80} style={{ flex: 1 }} />
      </div>
      <div style={{ fontSize: 13, color: '#888' }}>(Per-app volume coming soon)</div>
    </div>
  );
  return (
    <div className="system-tray-root" style={{ position: 'relative' }}>
      {/* Volume icon */}
      <span
        className="tray-icon"
        title="Volume Mixer"
        onClick={() => setShowVolume(v => !v)}
        tabIndex={0}
        style={{ position: 'relative' }}
      >
        <span role="img" aria-label="Volume">🔊</span>
        {volumePopover}
      </span>
      {/* Other tray icons */}
      {icons.map(icon => (
        <span key={icon.id} className="tray-icon" onClick={icon.onClick} tabIndex={0}>
          {icon.icon}
          {icon.popover}
        </span>
      ))}
    </div>
  );
};
