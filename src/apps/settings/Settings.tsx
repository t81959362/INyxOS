import React, { useEffect, useState } from 'react';
import { FileSystem } from '../../os/fs';
import StartMenu from '../../assets/Start Menu.png';
import './Settings.scss';
import { useNotifications } from '../../os/NotificationProvider';
import LockScreen from '../../os/LockScreen';

const fs = new FileSystem();

const themes = [
  { name: 'default', label: 'Default', accent: '#308aff', background: '#181c25' },
  { name: 'light', label: 'Light', accent: '#4fc3f7', background: '#f8f9fa' },
  { name: 'dark', label: 'Dark', accent: '#232a39', background: '#11131a' },
];

export const Settings: React.FC = () => {
  const [theme, setTheme] = useState('default');
  const [accent, setAccent] = useState(localStorage.getItem('nyxos_accent') || '');
  const [highContrast, setHighContrast] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const { push } = useNotifications();
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    (async () => {
      await fs.init();
      const ini = (await fs.readFile('/config/theme.ini')) || '';
      const m = ini.match(/name=(\w+)/);
      if (m) setTheme(m[1]);
      setHighContrast(localStorage.getItem('nyxos_high_contrast') === '1');
      setScreenReader(localStorage.getItem('nyxos_screen_reader') === '1');
      const ac = localStorage.getItem('nyxos_accent'); if (ac) setAccent(ac);
    })();
  }, []);

  const save = async (name: string) => {
    await fs.writeFile('/config/theme.ini', `[theme]\nname=${name}\n`);
    setTheme(name);
    const t = themes.find(t => t.name === name);
    if (t) {
      document.documentElement.style.setProperty('--primary', t.accent);
      document.documentElement.style.setProperty('--background', t.background);
      if (!accent) document.documentElement.style.setProperty('--accent', t.accent);
      push({ title: 'Theme', message: `Theme set to ${t.label}`, type: 'success' });
    }
  };
  const handleAccentChange = (e: React.ChangeEvent<HTMLInputElement>) => { const c=e.target.value; setAccent(c); localStorage.setItem('nyxos_accent',c); document.documentElement.style.setProperty('--accent',c); };

  const toggleHighContrast = () => { const n=!highContrast; setHighContrast(n); localStorage.setItem('nyxos_high_contrast', n?'1':'0'); document.documentElement.classList.toggle('high-contrast', n); };
  const toggleScreenReader = () => { const n=!screenReader; setScreenReader(n); localStorage.setItem('nyxos_screen_reader', n?'1':'0'); push({ title: 'Accessibility', message: n?'Screen reader enabled':'Screen reader disabled', type: n?'success':'info' }); };

  const [autoUpdate, setAutoUpdate] = useState(localStorage.getItem('nyxos_autoupdate')!=='0');
  const [locationEnabled, setLocationEnabled] = useState(localStorage.getItem('nyxos_location')==='1');
  const [telemetryEnabled, setTelemetryEnabled] = useState(localStorage.getItem('nyxos_telemetry')!=='0');
  const [animationsEnabled, setAnimationsEnabled] = useState(localStorage.getItem('nyxos_animations')==='1');
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(localStorage.getItem('nyxos_sounds')==='1');
  const [nightLightEnabled, setNightLightEnabled] = useState(localStorage.getItem('nyxos_night_light')==='1');
  const [dndEnabled, setDndEnabled] = useState(localStorage.getItem('nyxos_dnd')==='1');

  const [activeTab, setActiveTab] = useState<'appearance'|'accessibility'|'privacy'|'updates'|'about'>('appearance');

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={() => window.dispatchEvent(new CustomEvent('os-close-app',{detail:'settings'}))}>
            <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="settings-layout">
          <aside className="settings-sidebar">
            <ul>
              <li className={activeTab==='appearance'?'active':''} onClick={()=>setActiveTab('appearance')}>Appearance</li>
              <li className={activeTab==='accessibility'?'active':''} onClick={()=>setActiveTab('accessibility')}>Accessibility</li>
              <li className={activeTab==='privacy'?'active':''} onClick={()=>setActiveTab('privacy')}>Privacy</li>
              <li className={activeTab==='updates'?'active':''} onClick={()=>setActiveTab('updates')}>Updates</li>
              <li className={activeTab==='about'?'active':''} onClick={()=>setActiveTab('about')}>About</li>
            </ul>
          </aside>
          <main className="settings-content">
            {activeTab==='appearance' && (
              <section className="section">
                <h3>Appearance</h3>
                {themes.map(t=>(
                  <label key={t.name}><input type="radio" name="theme" value={t.name} checked={theme===t.name} onChange={()=>save(t.name)}/>{t.label}</label>
                ))}
                <div className="accent-picker">
                  <label>Accent:</label>
                  <input type="color" value={accent||themes.find(t=>t.name===theme)?.accent!} onChange={handleAccentChange}/>
                  <button onClick={()=>{ localStorage.removeItem('nyxos_accent'); setAccent(''); }}>Reset</button>
                </div>
              </section>
            )}
            {activeTab==='accessibility' && (
              <section className="section">
                <h3>Accessibility</h3>
                <label><input type="checkbox" checked={highContrast} onChange={toggleHighContrast}/> High Contrast</label>
                <label><input type="checkbox" checked={screenReader} onChange={toggleScreenReader}/> Screen Reader</label>
              </section>
            )}
            {activeTab==='privacy' && (
              <section className="section">
                <h3>Privacy</h3>
                <label><input type="checkbox" checked={locationEnabled} onChange={()=>{setLocationEnabled(!locationEnabled); localStorage.setItem('nyxos_location', locationEnabled?'0':'1');}}/> Location Services</label>
                <label><input type="checkbox" checked={telemetryEnabled} onChange={()=>{setTelemetryEnabled(!telemetryEnabled); localStorage.setItem('nyxos_telemetry', telemetryEnabled?'0':'1');}}/> Telemetry</label>
                <label><input type="checkbox" checked={animationsEnabled} onChange={()=>{const v=!animationsEnabled; setAnimationsEnabled(v); localStorage.setItem('nyxos_animations', v?'1':'0');}}/> Desktop Animations</label>
                <label><input type="checkbox" checked={soundEffectsEnabled} onChange={()=>{const v=!soundEffectsEnabled; setSoundEffectsEnabled(v); localStorage.setItem('nyxos_sounds', v?'1':'0');}}/> Sound Effects</label>
                <label><input type="checkbox" checked={nightLightEnabled} onChange={()=>{const v=!nightLightEnabled; setNightLightEnabled(v); localStorage.setItem('nyxos_night_light', v?'1':'0'); document.documentElement.classList.toggle('night-light', v);}}/> Night Light</label>
                <label><input type="checkbox" checked={dndEnabled} onChange={()=>{const v=!dndEnabled; setDndEnabled(v); localStorage.setItem('nyxos_dnd', v?'1':'0'); push({title:'Notifications', message: v? 'Do Not Disturb enabled':'Do Not Disturb disabled', type:'info'});}}/> Do Not Disturb</label>
              </section>
            )}
            {activeTab==='updates' && (
              <section className="section">
                <h3>Updates</h3>
                <label><input type="checkbox" checked={autoUpdate} onChange={()=>{setAutoUpdate(!autoUpdate); localStorage.setItem('nyxos_autoupdate', autoUpdate?'0':'1');}}/> Automatic Updates</label>
                <button onClick={()=>push({title:'Updater',message:'Checking for updates...',type:'info'})}>Check Now</button>
              </section>
            )}
            {activeTab==='about' && (
              <section className="section about-section">
                <div className="about-neofetch">
                  <pre className="neofetch">{`
  /\\
 /  \\
/ /\\ \\
/ ____ \\
/_/    \\_\\

NyxOS 1.0.0
CPU: ${navigator.hardwareConcurrency} cores
Resolution: ${window.screen.width}x${window.screen.height}
Browser: ${navigator.userAgent}
`}</pre>
                </div>
                <p className="about-text">NyxOS is a fast, lightweight running locally in your browser.</p>
              </section>
            )}
            <LockScreen show={locked} onUnlock={()=>setLocked(false)}/>
          </main>
        </div>
      </div>
    </div>
  );
};
export default Settings;
