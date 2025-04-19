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
          background: wallpaperUrl ? `url(${wallpaperUrl}) center/cover no-repeat` : '#181c25',
          opacity: 1,
          filter: 'blur(18px) saturate(1.12)',
          transition: 'background 0.5s',
        }}
      />
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minWidth: 360,
        minHeight: 260,
        padding: '42px 32px',
        borderRadius: 24,
        background: 'rgba(30,24,48,0.49)',
        boxShadow: '0 8px 36px 0 rgba(24,28,37,0.13)',
        backdropFilter: 'blur(18px) saturate(1.12)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.12)',
        border: '1.5px solid rgba(80,100,120,0.10)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 44, fontWeight: 700, marginBottom: 10, color: '#fff' }}>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        <div style={{ fontSize: 20, marginBottom: 24, color: '#eaeaff', fontWeight: 600 }}>{now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <form onSubmit={e => { e.preventDefault(); if (!password || password === 'unlock') { onUnlock(); setPassword(''); setError(''); } else { setError('Incorrect password'); } }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
          <input type="password" placeholder="Enter password (default: un)" value={password} onChange={e => setPassword(e.target.value)} style={{ fontSize: 16, padding: '8px 18px', borderRadius: 8, border: 'none', outline: 'none', background: '#232a39cc', color: '#fff', marginBottom: 6, width: '88%', maxWidth: 260, textAlign: 'center', boxShadow: '0 2px 10px 0 #0002' }} />
          <button type="submit" style={{ fontSize: 16, padding: '7px 28px', borderRadius: 8, background: '#308aff', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px 0 #308aff33', transition: 'background 0.18s' }}>Unlock</button>
          {error && <div style={{ color: '#ff5252', fontWeight: 600 }}>{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default LockScreen;
