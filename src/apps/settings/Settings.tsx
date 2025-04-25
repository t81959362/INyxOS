import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

// Auto-import any custom fonts in assets/fonts
const customFontModules: Record<string, string> = import.meta.glob('../../assets/fonts/*.{ttf,otf}', { eager: true, as: 'url' });
const customFonts = Object.entries(customFontModules).map(([path, url]) => {
  const name = path.split('/').pop()?.replace(/\.(ttf|otf)$/, '') || '';
  return { name, url };
});

export const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
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
  const [fontSize, setFontSize] = useState(Number(localStorage.getItem('nyxos_font_size') || '14'));
  const [cursorAccel, setCursorAccel] = useState(Number(localStorage.getItem('nyxos_cursor_accel')) || 1);
  const [touchSwipe, setTouchSwipe] = useState(localStorage.getItem('nyxos_touch_swipe') === '1');
  const [touchPinch, setTouchPinch] = useState(localStorage.getItem('nyxos_touch_pinch') === '1');
  const [vsyncEnabled, setVsyncEnabled] = useState(localStorage.getItem('nyxos_vsync') !== '0');

  // Accessibility extensions
  const [windowMagnifier, setWindowMagnifier] = useState(localStorage.getItem('nyxos_window_magnifier') === '1');
  const [colorBlindMode, setColorBlindMode] = useState(localStorage.getItem('nyxos_color_blind') === '1');
  const [reduceMotion, setReduceMotion] = useState(localStorage.getItem('nyxos_reduce_motion') === '1');

  // Localization & keymap
  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'uk', label: 'Українська', flag: '🇺🇦' },
  ];
  const [language, setLanguage] = useState(localStorage.getItem('nyxos_language') || 'en');
  const [keymap, setKeymap] = useState(localStorage.getItem('nyxos_keymap') || 'qwerty');
  const [dateFormat, setDateFormat] = useState(localStorage.getItem('nyxos_date_format') || 'MM/DD/YYYY');
  const [timeZone, setTimeZone] = useState(localStorage.getItem('nyxos_time_zone') || Intl.DateTimeFormat().resolvedOptions().timeZone);

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.lang = language;
    localStorage.setItem('nyxos_language', language);
  }, [language, i18n]);
  useEffect(() => { localStorage.setItem('nyxos_date_format', dateFormat); }, [dateFormat]);
  useEffect(() => { localStorage.setItem('nyxos_time_zone', timeZone); }, [timeZone]);

  const [activeTab, setActiveTab] = useState<'appearance'|'accessibility'|'privacy'|'updates'|'nexa'|'language'|'about'>('appearance');

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>{t('settings.title')}</h2>
          <button className="settings-close" onClick={() => window.dispatchEvent(new CustomEvent('os-close-app',{detail:'settings'}))}>
            <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="settings-layout">
          <aside className="settings-sidebar">
            <ul>
              <li className={activeTab==='appearance'?'active':''} onClick={()=>setActiveTab('appearance')}>{t('settings.tabs.appearance')}</li>
              <li className={activeTab==='accessibility'?'active':''} onClick={()=>setActiveTab('accessibility')}>{t('settings.tabs.accessibility')}</li>
              <li className={activeTab==='privacy'?'active':''} onClick={()=>setActiveTab('privacy')}>{t('settings.tabs.privacy')}</li>
              <li className={activeTab==='updates'?'active':''} onClick={()=>setActiveTab('updates')}>{t('settings.tabs.updates')}</li>
              <li className={activeTab==='nexa'?'active':''} onClick={()=>setActiveTab('nexa')}>{t('settings.tabs.nexa')}</li>
              <li className={activeTab==='language'?'active':''} onClick={()=>setActiveTab('language')}>{t('settings.tabs.language')}</li>
              <li className={activeTab==='about'?'active':''} onClick={()=>setActiveTab('about')}>{t('settings.tabs.about')}</li>
            </ul>
          </aside>
          <main className="settings-content">
            {activeTab==='appearance' && (
              <section className="section">
                <h3>{t('settings.tabs.appearance')}</h3>
                {themes.map(t=>(
                  <label key={t.name}><input type="radio" name="theme" value={t.name} checked={theme===t.name} onChange={()=>save(t.name)}/>{t.label}</label>
                ))}
                <div className="font-settings">
                  <label>{t('settings.appearance.fontFamily')}
                    <select className="font-family-select" value={systemFont} onChange={e=>{
                      const v=e.target.value;
                      setSystemFont(v);
                      localStorage.setItem('nyxos_font_family', v);
                      const custom = customFonts.find(cf => cf.name === v);
                      if (custom) {
                        let styleTag = document.getElementById(`font-face-${v}`) as HTMLStyleElement;
                        if (!styleTag) {
                          styleTag = document.createElement('style');
                          styleTag.id = `font-face-${v}`;
                        }
                        styleTag.innerHTML = `@font-face { font-family: '${v}'; src: url('${custom.url}'); font-display: swap; }`;
                        document.head.appendChild(styleTag);
                        document.documentElement.style.setProperty('--font-family', `'${v}'`);
                      } else {
                        document.documentElement.style.setProperty('--font-family', v);
                      }
                    }}>
                      <option value="system-ui">{t('settings.appearance.systemUi')}</option>
                      <option value="Arial">Arial</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Custom">{t('settings.appearance.custom')}</option>
                      {customFonts.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                    </select>
                  </label>
                  <label>{t('settings.appearance.fontSize')}
                    <select className="font-size-select" value={fontSize} onChange={e=>{
                      const v=Number(e.target.value); setFontSize(v); localStorage.setItem('nyxos_font_size',v.toString());
                      document.documentElement.style.setProperty('--font-size',`${v}px`);
                    }}>
                      {[12,14,16,18,20,24,28,32].map(s=><option key={s} value={s}>{s}px</option>)}
                    </select>
                  </label>
                  <p>{t('settings.appearance.customFontsInfo')}</p>
                </div>
                <div className="cursor-settings">
                  <label>{t('settings.appearance.cursorAcceleration')}: <input type="range" min="0.1" max="5" step="0.1" value={cursorAccel} onChange={e=>{const v=Number(e.target.value);setCursorAccel(v);localStorage.setItem('nyxos_cursor_accel',v.toString());}}/></label>
                </div>
                <div className="touch-settings">
                  <label><input type="checkbox" checked={touchSwipe} onChange={e=>{const v=e.target.checked;setTouchSwipe(v);localStorage.setItem('nyxos_touch_swipe',v?'1':'0');}}/> {t('settings.appearance.touchSwipe')}</label>
                  <label><input type="checkbox" checked={touchPinch} onChange={e=>{const v=e.target.checked;setTouchPinch(v);localStorage.setItem('nyxos_touch_pinch',v?'1':'0');}}/> {t('settings.appearance.touchPinch')}</label>
                </div>
                <label><input type="checkbox" checked={vsyncEnabled} onChange={e=>{const v=e.target.checked;setVsyncEnabled(v);localStorage.setItem('nyxos_vsync',v?'1':'0');}}/> {t('settings.appearance.vsync')}</label>
              </section>
            )}
            {activeTab==='accessibility' && (
              <section className="section">
                <h3>{t('settings.tabs.accessibility')}</h3>
                <label><input type="checkbox" checked={highContrast} onChange={toggleHighContrast}/> {t('settings.accessibility.highContrast')}</label>
                <label><input type="checkbox" checked={screenReader} onChange={toggleScreenReader}/> {t('settings.accessibility.screenReader')}</label>
                <label><input type="checkbox" checked={windowMagnifier} onChange={e=>{const v=e.target.checked;setWindowMagnifier(v);localStorage.setItem('nyxos_window_magnifier',v?'1':'0');}}/> {t('settings.accessibility.windowMagnifier')}</label>
                <label><input type="checkbox" checked={colorBlindMode} onChange={e=>{const v=e.target.checked;setColorBlindMode(v);localStorage.setItem('nyxos_color_blind',v?'1':'0');document.documentElement.classList.toggle('color-blind',v);}}/> {t('settings.accessibility.colorBlind')}</label>
                <label><input type="checkbox" checked={reduceMotion} onChange={e=>{const v=e.target.checked;setReduceMotion(v);localStorage.setItem('nyxos_reduce_motion',v?'1':'0');document.documentElement.classList.toggle('reduce-motion',v);}}/> {t('settings.accessibility.reduceMotion')}</label>
              </section>
            )}
            {activeTab==='privacy' && (
              <section className="section">
                <h3>{t('settings.tabs.privacy')}</h3>
                <label><input type="checkbox" checked={locationEnabled} onChange={()=>{setLocationEnabled(!locationEnabled); localStorage.setItem('nyxos_location', locationEnabled?'0':'1');}}/> {t('settings.privacy.location')}</label>
                <label><input type="checkbox" checked={telemetryEnabled} onChange={()=>{setTelemetryEnabled(!telemetryEnabled); localStorage.setItem('nyxos_telemetry', telemetryEnabled?'0':'1');}}/> {t('settings.privacy.telemetry')}</label>
                <label><input type="checkbox" checked={animationsEnabled} onChange={()=>{const v=!animationsEnabled; setAnimationsEnabled(v); localStorage.setItem('nyxos_animations', v?'1':'0');}}/> {t('settings.privacy.animations')}</label>
                <label><input type="checkbox" checked={soundEffectsEnabled} onChange={()=>{const v=!soundEffectsEnabled; setSoundEffectsEnabled(v); localStorage.setItem('nyxos_sounds', v?'1':'0');}}/> {t('settings.privacy.sounds')}</label>
                <label><input type="checkbox" checked={nightLightEnabled} onChange={()=>{const v=!nightLightEnabled; setNightLightEnabled(v); localStorage.setItem('nyxos_night_light', v?'1':'0'); document.documentElement.classList.toggle('night-light', v);}}/> {t('settings.privacy.nightLight')}</label>
                <label><input type="checkbox" checked={dndEnabled} onChange={()=>{const v=!dndEnabled; setDndEnabled(v); localStorage.setItem('nyxos_dnd', v?'1':'0'); push({title:'Notifications', message: v? 'Do Not Disturb enabled':'Do Not Disturb disabled', type:'info'});}}/> {t('settings.privacy.dnd')}</label>
                <button
                  type="button"
                  aria-label="Lock screen"
                  style={{
                    marginTop: 12,
                    padding: '7px 18px',
                    borderRadius: 8,
                    background: '#232a39',
                    color: '#fff',
                    border: '1.5px solid #444',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px 0 #0002',
                    transition: 'background 0.18s',
                    outline: 'none',
                  }}
                  onClick={() => window.dispatchEvent(new CustomEvent('os-lock'))}
                >
                  Lock Screen
                </button>
              </section>
            )}
            {activeTab==='updates' && (
              <section className="section">
                <h3>{t('settings.tabs.updates')}</h3>
                <label><input type="checkbox" checked={autoUpdate} onChange={()=>{setAutoUpdate(!autoUpdate); localStorage.setItem('nyxos_autoupdate', autoUpdate?'0':'1');}}/> {t('settings.updates.autoUpdate')}</label>
                <button onClick={()=>push({title:'Updater',message:'Checking for updates...',type:'info'})}>{t('settings.updates.checkNow')}</button>
              </section>
            )}
            {activeTab==='nexa' && (
              <section className="section">
                <h3>{t('settings.tabs.nexa')}</h3>
                <div className="section-item">
                  <select className="model-select" value={selectedModel} onChange={e=>{ setSelectedModel(e.target.value); localStorage.setItem('nexa_model', e.target.value); }}>
                    <option value="">{t('settings.nexa.selectModel')}</option>
                    {models.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                  {testStatus==='testing' && <p className="small">{t('settings.nexa.testingModel')}</p>}
                  {testStatus==='success' && <p className="small">{t('settings.nexa.testSuccessful')} {testMessage}</p>}
                  {testStatus==='error' && <p className="small">{t('settings.nexa.testFailed')} {testMessage}</p>}
                  <p>{t('settings.nexa.currentModel')} {selectedModel}</p>
                </div>
                <div className="section-item">
                  <h4>{t('settings.nexa.gpuWorkers')}</h4>
                  <input type="range" min={1} max={8} value={gpuWorkers} onChange={e=>setGpuWorkers(Number(e.target.value))} /> <span>{gpuWorkers}</span>
                </div>
                <div className="usage-dashboard">
                  <h4>{t('settings.nexa.usageDashboard')}</h4>
                  <p>{t('settings.nexa.totalCalls')} {metrics.totalCalls}</p>
                  <p>{t('settings.nexa.totalTokens')} {metrics.totalTokens}</p>
                  <p>{t('settings.nexa.lastLatency')} {metrics.lastLatency} ms</p>
                  <p>{t('settings.nexa.estimatedCost')} ${metrics.costEstimate.toFixed(4)}</p>
                </div>
              </section>
            )}
            {activeTab==='language' && (
              <section className="section">
                <h3>{t('settings.tabs.language')}</h3>
                <label>{t('settings.language.language')}: <select value={language} onChange={e=>setLanguage(e.target.value)}>
                  {languages.map(l => (
                    <option key={l.code} value={l.code}>
                      {l.code === 'en' ? l.label : `${l.flag} ${l.label}`}
                    </option>
                  ))}
                </select></label>
                <label>{t('settings.language.keymap')}: <select value={keymap} onChange={e=>{const v=e.target.value;setKeymap(v);localStorage.setItem('nyxos_keymap',v);}}>
                  <option value="qwerty">{t('settings.language.qwerty')}</option><option value="colemak">{t('settings.language.colemak')}</option><option value="dvorak">{t('settings.language.dvorak')}</option>
                </select></label>
                <label>{t('settings.language.dateFormat')}: <select value={dateFormat} onChange={e=>{const v=e.target.value;setDateFormat(v);localStorage.setItem('nyxos_date_format',v);}}>
                  <option value="MM/DD/YYYY">{t('settings.language.mmddyyyy')}</option>
                  <option value="DD/MM/YYYY">{t('settings.language.ddmmyyyy')}</option>
                  <option value="YYYY-MM-DD">{t('settings.language.yyyymmdd')}</option>
                </select></label>
                <label>{t('settings.language.timeZone')}: <select value={timeZone} onChange={e=>{const v=e.target.value;setTimeZone(v);localStorage.setItem('nyxos_time_zone',v);}}>
                  {/* list common time zones or use Intl.supportedValuesOf */}
                  {Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone').map(tz=><option key={tz} value={tz}>{tz}</option>) : <option value={timeZone}>{timeZone}</option>}
                </select></label>
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
                <p className="about-text">{t('settings.about.text')}</p>
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
