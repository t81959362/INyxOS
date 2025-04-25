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
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.2451 7.99993C19.036 9.13376 19.4998 10.5127 19.4998 11.9999C19.4998 13.4872 19.036 14.8661 18.2451 15.9999M12.1343 4.36561L8.96863 7.5313C8.79568 7.70425 8.7092 7.79073 8.60828 7.85257C8.51881 7.9074 8.42127 7.9478 8.31923 7.9723C8.20414 7.99993 8.08185 7.99993 7.83726 7.99993H6.1C5.53995 7.99993 5.25992 7.99993 5.04601 8.10892C4.85785 8.20479 4.70487 8.35777 4.60899 8.54594C4.5 8.75985 4.5 9.03987 4.5 9.59993V14.3999C4.5 14.96 4.5 15.24 4.60899 15.4539C4.70487 15.6421 4.85785 15.7951 5.04601 15.8909C5.25992 15.9999 5.53995 15.9999 6.1 15.9999H7.83726C8.08185 15.9999 8.20414 15.9999 8.31923 16.0276C8.42127 16.0521 8.51881 16.0925 8.60828 16.1473C8.7092 16.2091 8.79568 16.2956 8.96863 16.4686L12.1343 19.6342C12.5627 20.0626 12.7769 20.2768 12.9608 20.2913C13.1203 20.3038 13.2763 20.2392 13.3802 20.1175C13.5 19.9773 13.5 19.6744 13.5 19.0686V4.9313C13.5 4.32548 13.5 4.02257 13.3802 3.88231C13.2763 3.76061 13.1203 3.69602 12.9608 3.70858C12.7769 3.72305 12.5627 3.93724 12.1343 4.36561Z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
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
