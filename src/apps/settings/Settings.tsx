import React, { useEffect, useState } from 'react';
import { FileSystem } from '../../os/fs';
import Nyxlogo from '../../assets/Nyxlogo.png';
import './Settings.scss';

const fs = new FileSystem();

const themes = [
  { name: 'default', label: 'Default', accent: '#308aff', background: '#181c25' },
  { name: 'light', label: 'Light', accent: '#4fc3f7', background: '#f8f9fa' },
  { name: 'dark', label: 'Dark', accent: '#232a39', background: '#11131a' },
];

import { useNotifications } from '../../os/NotificationProvider';

export const Settings: React.FC = () => {
  const [theme, setTheme] = useState('default');
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
    <div className="settings-root">
      <img src={Nyxlogo} alt="Nyx OS" style={{ width: 80, margin: '1rem auto', display: 'block' }} />
      <h2>Settings</h2>
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
          <span style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
            Keyboard navigation: Tab, Shift+Tab, Enter, and Arrow keys supported throughout the OS.
          </span>
        </div>
      </div>
      <div className="settings-section">
        <label>About:</label>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <img src={Nyxlogo} alt="NyxOS Logo" style={{ width: 54, height: 54, borderRadius: 14, boxShadow: '0 2px 10px #232a39cc' }} />
          <div style={{ fontWeight: 700, fontSize: 18, marginTop: 8 }}>NyxOS Preview</div>
        </div>
      </div>
    </div>
  );
};
