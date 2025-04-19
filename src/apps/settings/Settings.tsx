import React, { useEffect, useState } from 'react';
import { FileSystem } from '../../os/fs';
import StartMenu from '../../assets/Start Menu.png';
import './Settings.scss';

const fs = new FileSystem();

const themes = [
  { name: 'default', label: 'Default', accent: '#308aff', background: '#181c25' },
  { name: 'light', label: 'Light', accent: '#4fc3f7', background: '#f8f9fa' },
  { name: 'dark', label: 'Dark', accent: '#232a39', background: '#11131a' },
];

import { useNotifications } from '../../os/NotificationProvider';

import LockScreen from '../../os/LockScreen';

export const Settings: React.FC = () => {
  const [theme, setTheme] = useState('default');
  const [locked, setLocked] = useState(false);
  const [status, setStatus] = useState('');
  const [highContrast, setHighContrast] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const [accent, setAccent] = useState(localStorage.getItem('nyxos_accent') || '');
  const { push } = useNotifications();

  useEffect(() => {
    (async () => {
      await fs.init();
      const ini = (await fs.readFile('/config/theme.ini')) || '';
      const match = ini.match(/name=(\w+)/);
      if (match) setTheme(match[1]);
      setHighContrast(localStorage.getItem('nyxos_high_contrast') === '1');
      setScreenReader(localStorage.getItem('nyxos_screen_reader') === '1');
      // Apply accent color if set
      const accentColor = localStorage.getItem('nyxos_accent');
      if (accentColor) {
        document.documentElement.style.setProperty('--accent', accentColor);
        setAccent(accentColor);
      }
    })();
  }, []);

  const save = async (name: string) => {
    await fs.writeFile('/config/theme.ini', `[theme]\nname=${name}\n`);
    setTheme(name);
    setStatus('Saved!');
    // Apply theme to document root
    const t = themes.find(t => t.name === name);
    if (t) {
      document.documentElement.style.setProperty('--primary', t.accent);
      document.documentElement.style.setProperty('--background', t.background);
      // If no custom accent, update accent to theme default
      if (!localStorage.getItem('nyxos_accent')) {
        document.documentElement.style.setProperty('--accent', t.accent);
      }
    }
  };

  // Accent color logic
  const handleAccentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setAccent(color);
    localStorage.setItem('nyxos_accent', color);
    document.documentElement.style.setProperty('--accent', color);
    setStatus('Accent color updated!');
  };

  const resetAccent = () => {
    localStorage.removeItem('nyxos_accent');
    const t = themes.find(t => t.name === theme);
    const fallback = t ? t.accent : '#308aff';
    setAccent('');
    document.documentElement.style.setProperty('--accent', fallback);
    setStatus('Accent color reset to theme default');
  };

  const toggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    localStorage.setItem('nyxos_high_contrast', next ? '1' : '0');
    if (next) {
      document.documentElement.classList.add('high-contrast');
      push({ title: 'Accessibility', message: 'High-contrast mode enabled', type: 'success' });
    } else {
      document.documentElement.classList.remove('high-contrast');
      push({ title: 'Accessibility', message: 'High-contrast mode disabled', type: 'info' });
    }
  };

  const toggleScreenReader = () => {
    const next = !screenReader;
    setScreenReader(next);
    localStorage.setItem('nyxos_screen_reader', next ? '1' : '0');
    push({ title: 'Accessibility', message: next ? 'Screen reader hints enabled' : 'Screen reader hints disabled', type: next ? 'success' : 'info' });
    // Optionally trigger ARIA hints
  };

  return (
    <div className="settings-root" style={{ position: 'relative' }}>
      <button
        aria-label="Close Settings"
        style={{
          position: 'absolute',
          top: 12,
          right: 16,
          width: 32,
          height: 32,
          border: 'none',
          background: 'none',
          color: '#fff',
          fontSize: 22,
          fontWeight: 700,
          cursor: 'pointer',
          zIndex: 10,
          transition: 'color 0.18s',
        }}
        onClick={() => {
          window.dispatchEvent(new CustomEvent('os-close-app', { detail: 'settings' }));
        }}
        onMouseOver={e => (e.currentTarget.style.color = '#ff4477')}
        onMouseOut={e => (e.currentTarget.style.color = '#fff')}
      >
        ×
      </button>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
  <img src={StartMenu} alt="Start Menu" style={{ width: 74, height: 74, borderRadius: 18, objectFit: 'cover' }} />
</div>
<h2 style={{ textAlign: 'center', marginBottom: 18 }}>Settings</h2>
      <div className="settings-section">
        <label>Theme:</label>
        <select value={theme} onChange={e => save(e.target.value)}>
          {themes.map(t => (
            <option key={t.name} value={t.name}>{t.label}</option>
          ))}
        </select>
      </div>
      <div className="settings-section">
        <label>Accent Color:</label>
        <input
          type="color"
          value={accent || themes.find(t => t.name === theme)?.accent || '#308aff'}
          onChange={handleAccentChange}
          style={{ marginLeft: 8, marginRight: 8 }}
        />
        <button onClick={resetAccent} style={{ marginLeft: 8 }}>Reset</button>
      </div>
      <span className="settings-status">{status}</span>
      <div className="settings-section">
        <label>Accessibility:</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label>
            <input type="checkbox" checked={highContrast} onChange={toggleHighContrast} />
            High-contrast mode
          </label>
          <label>
            <input type="checkbox" checked={screenReader} onChange={toggleScreenReader} />
            Enable screen reader hints
          </label>
          <button
            onClick={() => setLocked(true)}
            style={{ marginTop: 12, alignSelf: 'flex-start', background: '#232a3990', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 16 }}
          >
            🔒 Lock Screen
          </button>
          <span style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
            Keyboard navigation: Tab, Shift+Tab, Enter, and Arrow keys supported throughout the OS.
          </span>
        </div>
        <LockScreen show={locked} onUnlock={() => setLocked(false)} />
      </div>
      <div className="settings-section">
        <label>About:</label>
        <div style={{ width: '100%', textAlign: 'center', margin: '0 auto', fontWeight: 700, fontSize: 18 }}>
          NyxOS Preview
        </div>
      </div>
    </div>
  );
};
