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

// OpenRouter configuration
const OR_API_KEY = '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';
const DEFAULT_MODEL_ID = 'google/gemini-2.5-pro-exp-03-25:free';

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

  // AI Assistant Config state
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState(localStorage.getItem('nexa_model') || DEFAULT_MODEL_ID);
  const [testStatus, setTestStatus] = useState<'idle'|'testing'|'success'|'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [gpuWorkers, setGpuWorkers] = useState<number>(Number(localStorage.getItem('nexa_gpu_workers') || '1'));
  interface Metrics { totalCalls: number; totalTokens: number; lastLatency: number; costEstimate: number; }
  const [metrics, setMetrics] = useState<Metrics>(() => JSON.parse(localStorage.getItem('nexa_usage') || JSON.stringify({ totalCalls:0, totalTokens:0, lastLatency:0, costEstimate:0 })));

  useEffect(() => { localStorage.setItem('nexa_gpu_workers', gpuWorkers.toString()); }, [gpuWorkers]);
  useEffect(() => { localStorage.setItem('nexa_usage', JSON.stringify(metrics)); }, [metrics]);

  // Fetch these specific free, low-latency models as of April 2025
  useEffect(() => {
    fetch('https://openrouter.ai/api/v1/models', { headers: { Authorization: `Bearer ${OR_API_KEY}` } })
      .then(res => res.json())
      .then(data => {
        const list = data.data || data.models;
        const desired = [
          'moonshotai/kimi-vl-a3b-thinking:free',
          'qwen/qwen2.5-vl-3b-instruct:free',
          'nvidia/llama-3.1-nemotron-nano-8b-v1:free',
          'deepseek/deepseek-v3-base:free',
          'deepseek/deepseek-r1-zero:free'
        ];
        const available = desired.filter(id => list.some((m: any) => m.id === id));
        setModels(available);
      })
      .catch(err => console.error('Model fetch error:', err));
  }, []);

  // Auto-test selected model
  useEffect(() => {
    if (!OR_API_KEY || !selectedModel) return;
    setTestStatus('testing');
    fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OR_API_KEY}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: 'user', content: 'What model are you?' }]
      })
    })
      .then(res => res.json())
      .then(data => {
        const msg = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || 'No response';
        setTestMessage(msg);
        setTestStatus('success');
      })
      .catch(err => {
        console.error(err);
        setTestMessage(err.message || 'Error');
        setTestStatus('error');
      });
  }, [selectedModel]);

  // Appearance extensions
  const [systemFont, setSystemFont] = useState(localStorage.getItem('nyxos_font_family') || 'system-ui');
  const [fontSize, setFontSize] = useState(Number(localStorage.getItem('nyxos_font_size')) || 14);
  const [cursorAccel, setCursorAccel] = useState(Number(localStorage.getItem('nyxos_cursor_accel')) || 1);
  const [touchSwipe, setTouchSwipe] = useState(localStorage.getItem('nyxos_touch_swipe') === '1');
  const [touchPinch, setTouchPinch] = useState(localStorage.getItem('nyxos_touch_pinch') === '1');
  const [vsyncEnabled, setVsyncEnabled] = useState(localStorage.getItem('nyxos_vsync') !== '0');

  // Accessibility extensions
  const [windowMagnifier, setWindowMagnifier] = useState(localStorage.getItem('nyxos_window_magnifier') === '1');
  const [colorBlindMode, setColorBlindMode] = useState(localStorage.getItem('nyxos_color_blind') === '1');
  const [reduceMotion, setReduceMotion] = useState(localStorage.getItem('nyxos_reduce_motion') === '1');

  // Localization & keymap
  const languages = [ { code: 'en', label: 'English', flag: '🇺🇸' }, { code: 'es', label: 'Español', flag: '🇪🇸' } ];
  const [language, setLanguage] = useState(localStorage.getItem('nyxos_language') || 'en');
  const [keymap, setKeymap] = useState(localStorage.getItem('nyxos_keymap') || 'qwerty');

  const [activeTab, setActiveTab] = useState<'appearance'|'accessibility'|'privacy'|'updates'|'nexa'|'language'|'about'>('appearance');

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
              <li className={activeTab==='nexa'?'active':''} onClick={()=>setActiveTab('nexa')}>Nexa Assistant</li>
              <li className={activeTab==='language'?'active':''} onClick={()=>setActiveTab('language')}>Language</li>
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
                  <button onClick={()=>{
                    localStorage.removeItem('nyxos_accent');
                    setAccent('');
                    const def = themes.find(t=>t.name===theme)?.accent || '';
                    document.documentElement.style.setProperty('--accent', def);
                  }}>Reset</button>
                </div>
                {/* Appearance extensions */}
                <div className="font-settings">
                  <label>Font Family: <select value={systemFont} onChange={e=>{setSystemFont(e.target.value);localStorage.setItem('nyxos_font_family',e.target.value);document.documentElement.style.setProperty('--font-family',e.target.value);}}>
                    <option value="system-ui">System UI</option><option value="Arial">Arial</option><option value="Roboto">Roboto</option><option value="Custom">Custom...</option>
                  </select></label>
                  <label>Font Size: <input type="number" min={10} max={72} value={fontSize} onChange={e=>{const v=Number(e.target.value);setFontSize(v);localStorage.setItem('nyxos_font_size',v.toString());document.documentElement.style.setProperty('--font-size',`${v}px`);}}/>px</label>
                  <p>Place custom fonts (.ttf/.otf) in /assets/fonts/</p>
                </div>
                <div className="cursor-settings">
                  <label>Cursor Acceleration: <input type="range" min="0.1" max="5" step="0.1" value={cursorAccel} onChange={e=>{const v=Number(e.target.value);setCursorAccel(v);localStorage.setItem('nyxos_cursor_accel',v.toString());}}/></label>
                </div>
                <div className="touch-settings">
                  <label><input type="checkbox" checked={touchSwipe} onChange={e=>{const v=e.target.checked;setTouchSwipe(v);localStorage.setItem('nyxos_touch_swipe',v?'1':'0');}}/> Two-finger swipe</label>
                  <label><input type="checkbox" checked={touchPinch} onChange={e=>{const v=e.target.checked;setTouchPinch(v);localStorage.setItem('nyxos_touch_pinch',v?'1':'0');}}/> Pinch-zoom</label>
                </div>
                <label><input type="checkbox" checked={vsyncEnabled} onChange={e=>{const v=e.target.checked;setVsyncEnabled(v);localStorage.setItem('nyxos_vsync',v?'1':'0');}}/> VSync</label>
              </section>
            )}
            {activeTab==='accessibility' && (
              <section className="section">
                <h3>Accessibility</h3>
                <label><input type="checkbox" checked={highContrast} onChange={toggleHighContrast}/> High Contrast</label>
                <label><input type="checkbox" checked={screenReader} onChange={toggleScreenReader}/> Screen Reader</label>
                <label><input type="checkbox" checked={windowMagnifier} onChange={e=>{const v=e.target.checked;setWindowMagnifier(v);localStorage.setItem('nyxos_window_magnifier',v?'1':'0');}}/> Window Magnifier</label>
                <label><input type="checkbox" checked={colorBlindMode} onChange={e=>{const v=e.target.checked;setColorBlindMode(v);localStorage.setItem('nyxos_color_blind',v?'1':'0');document.documentElement.classList.toggle('color-blind',v);}}/> Color Blind Mode</label>
                <label><input type="checkbox" checked={reduceMotion} onChange={e=>{const v=e.target.checked;setReduceMotion(v);localStorage.setItem('nyxos_reduce_motion',v?'1':'0');document.documentElement.classList.toggle('reduce-motion',v);}}/> Reduce Motion</label>
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
            {activeTab==='nexa' && (
              <section className="section">
                <h3>Nexa Assistant Config</h3>
                <div className="section-item">
                  <label>Model:
                    <select value={selectedModel} onChange={e=>{ setSelectedModel(e.target.value); localStorage.setItem('nexa_model', e.target.value); }}>
                      <option value="">Select model</option>
                      {models.map(m=><option key={m} value={m}>{m}</option>)}
                    </select>
                  </label>
                  {testStatus==='testing' && <p className="small">Testing model...</p>}
                  {testStatus==='success' && <p className="small">Test successful: {testMessage}</p>}
                  {testStatus==='error' && <p className="small">Test failed: {testMessage}</p>}
                  <p>Current Model: {selectedModel}</p>
                </div>
                <div className="section-item">
                  <h4>GPU Workers</h4>
                  <input type="range" min={1} max={8} value={gpuWorkers} onChange={e=>setGpuWorkers(Number(e.target.value))} /> <span>{gpuWorkers}</span>
                </div>
                <div className="usage-dashboard">
                  <h4>Usage Dashboard</h4>
                  <p>Total Calls: {metrics.totalCalls}</p>
                  <p>Total Tokens: {metrics.totalTokens}</p>
                  <p>Last Latency: {metrics.lastLatency} ms</p>
                  <p>Estimated Cost: ${metrics.costEstimate.toFixed(4)}</p>
                </div>
              </section>
            )}
            {activeTab==='language' && (
              <section className="section">
                <h3>Language & Keyboard</h3>
                <label>Language: <select value={language} onChange={e=>{setLanguage(e.target.value);localStorage.setItem('nyxos_language',e.target.value);}}>{languages.map(l=><option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}</select></label>
                <label>Keymap: <select value={keymap} onChange={e=>{setKeymap(e.target.value);localStorage.setItem('nyxos_keymap',e.target.value);}}><option value="qwerty">QWERTY</option><option value="colemak">Colemak</option><option value="dvorak">Dvorak</option></select></label>
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
