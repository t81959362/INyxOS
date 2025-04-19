import React from 'react';
import './LockScreen.scss';

const LockScreen: React.FC<{
  show: boolean;
  onUnlock: () => void;
  wallpaperUrl?: string;
  showNotifications?: boolean;
  showMedia?: boolean;
}> = ({ show, onUnlock, wallpaperUrl, showNotifications, showMedia }) => {
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const now = new Date();
  if (!show) return null;
  return (
    <div className="lock-screen-root">
      <div
        className="lock-screen-bg"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background: wallpaperUrl ? `url(${wallpaperUrl}) center/cover no-repeat` : 'linear-gradient(120deg,#181c25 0%,#232a39 100%)',
          opacity: 1,
          filter: 'blur(10px) saturate(1.15)',
          transition: 'background 0.5s',
        }}
      />
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minWidth: 340,
        minHeight: 320,
        padding: '48px 36px',
        borderRadius: 20,
        background: 'rgba(255,255,255,0.18)',
        boxShadow: '0 8px 48px 0 rgba(48,138,255,0.08), 0 2px 8px 0 rgba(24,28,37,0.08)',
        backdropFilter: 'blur(18px) saturate(1.15)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.15)'
      }}>
        <div style={{ fontSize: 48, fontWeight: 700, marginBottom: 16 }}>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        <div style={{ fontSize: 24, marginBottom: 32 }}>{now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
        <form onSubmit={e => { e.preventDefault(); if (!password || password === 'unlock') { onUnlock(); setPassword(''); setError(''); } else { setError('Incorrect password'); } }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <input type="password" placeholder="Enter password (default: unlock)" value={password} onChange={e => setPassword(e.target.value)} style={{ fontSize: 18, padding: '8px 18px', borderRadius: 8, border: 'none', outline: 'none', background: '#232a39cc', color: '#fff', marginBottom: 6 }} />
          <button type="submit" style={{ fontSize: 18, padding: '7px 28px', borderRadius: 8, background: '#308aff', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Unlock</button>
          {error && <div style={{ color: '#ff5252', fontWeight: 500 }}>{error}</div>}
        </form>
        {/* TODO: Add notifications/media info here if enabled */}
      </div>
    </div>
  );
};

export default LockScreen;
