import React, { useState, useEffect, useRef } from "react";
import "./OptionsCenter.scss";

// Helper for per-app audio (to be implemented with real app integration)
const getAudioApps = () => {
  // This should be replaced with real integration with your app/window system
  // For now, return a simulated list of apps with audio elements
  return Array.from(document.querySelectorAll("audio, video")).map((el, i) => {
    const media = el as HTMLMediaElement & { dataset: DOMStringMap };
    return {
      id: `media-app-${i}`,
      name: media.dataset.appname || `App ${i + 1}`,
      element: media,
      volume: media.volume,
    };
  });
};

const OptionsCenter: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  // Tablet Mode
  const [tabletMode, setTabletMode] = useState(false);
  // Night Light
  const [nightLight, setNightLight] = useState(false);

  // Per-app volume
  const [audioApps, setAudioApps] = useState(getAudioApps());

  useEffect(() => {
    setAudioApps(getAudioApps());
  }, []);


  // Night Light: apply/remove warm, dim orange filter (comfortable, not pink)
  useEffect(() => {
    if (nightLight) {
      document.body.style.filter = 'brightness(0.85) sepia(0.55) hue-rotate(-20deg) saturate(1.15) contrast(0.98)';
    } else {
      document.body.style.filter = '';
    }
    return () => {
      document.body.style.filter = '';
    };
  }, [nightLight]);



  // Tablet mode toggle (should integrate with your state)
  const handleTabletToggle = () => {
    setTabletMode((v) => !v);
    // TODO: Integrate with your OS's tablet mode state
  };

  // Per-app volume change
  const handleAppVolume = (id: string, volume: number) => {
    setAudioApps((apps) =>
      apps.map((app) => {
        if (app.id === id) {
          (app.element as HTMLMediaElement).volume = volume;
          return { ...app, volume };
        }
        return app;
      })
    );
  };



  return (
    <div className="options-center-glass" tabIndex={0}>
      <button className="options-center-close" onClick={onClose}>
        ×
      </button>
      {/* Custom Action Tiles */}
      <CustomActionTiles
        nightLight={nightLight} setNightLight={setNightLight}
        tabletMode={tabletMode} setTabletMode={setTabletMode}
      />
      <div className="options-center-grid">
        {/* Night Light */}
        <div className="options-card night-light">
          <div className="options-card-title">Night Light</div>
          <div className="options-card-status">{nightLight ? "On" : "Off"}</div>
          <label className="switch">
            <input
              type="checkbox"
              checked={nightLight}
              onChange={() => setNightLight(v => !v)}
            />
            <span className="slider" />
          </label>
        </div>
        {/* Media Controls */}
        <MediaControls />
        {/* Per-App Volume */}
        {audioApps.length > 0 ? (
          <div className="options-card per-app-volume">
            <div className="options-card-title">Per-app Volume</div>
            <div className="options-card-apps">
              {audioApps.map((app) => (
                <div key={app.id} className="app-volume-row">
                  <span>{app.name}</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={app.volume}
                    onChange={(e) => handleAppVolume(app.id, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="options-card per-app-volume">
            <div className="options-card-title">Per-app Volume</div>
            <div className="options-card-apps"><div>No audio or video apps running</div></div>
          </div>
        )}
        {/* Tablet Mode */}
        <div className="options-card tablet">
          <div className="options-card-icon tablet" />
          <div className="options-card-title">Tablet mode</div>
          <div className="options-card-status">{tabletMode ? "On" : "Off"}</div>
          <label className="switch">
            <input
              type="checkbox"
              checked={tabletMode}
              onChange={handleTabletToggle}
            />
            <span className="slider" />
          </label>
        </div>
        {/* Per-App Volume (only if audio apps) */}
        {audioApps.length > 0 && (
          <div className="options-card per-app-volume">
            <div className="options-card-title">Per-app Volume</div>
            <div className="options-card-apps">
              {audioApps.map((app) => (
                <div key={app.id} className="app-volume-row">
                  <span>{app.name}</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={app.volume}
                    onChange={(e) => handleAppVolume(app.id, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// MediaControls component for full-featured playback control
const MediaControls: React.FC = () => {
  const [media, setMedia] = useState<HTMLMediaElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaCover, setMediaCover] = useState<string | null>(null);

  // Find the currently playing or most recently interacted media element
  useEffect(() => {
    const allMedia = Array.from(document.querySelectorAll('audio, video')) as HTMLMediaElement[];
    let active: HTMLMediaElement | null = null;
    // Prefer media that is not paused
    active = allMedia.find(m => !m.paused && !m.ended) || allMedia[0] || null;
    setMedia(active || null);
  }, []);

  // Sync state with media element
  useEffect(() => {
    if (!media) return;
    const update = () => {
      setIsPlaying(!media.paused && !media.ended);
      setCurrentTime(media.currentTime);
      setDuration(media.duration || 0);
      setVolume(media.volume);
      setMediaTitle((media as any).dataset?.title || media.getAttribute('title') || media.currentSrc?.split('/').pop() || 'Unknown Media');
      if (media instanceof HTMLVideoElement && media.poster) {
        setMediaCover(media.poster);
      } else if ((media as any).dataset?.cover) {
        setMediaCover((media as any).dataset.cover);
      } else {
        setMediaCover(null);
      }
    };
    update();
    media.addEventListener('timeupdate', update);
    media.addEventListener('play', update);
    media.addEventListener('pause', update);
    media.addEventListener('volumechange', update);
    media.addEventListener('loadedmetadata', update);
    return () => {
      media.removeEventListener('timeupdate', update);
      media.removeEventListener('play', update);
      media.removeEventListener('pause', update);
      media.removeEventListener('volumechange', update);
      media.removeEventListener('loadedmetadata', update);
    };
  }, [media]);

  // Controls
  const handlePlayPause = () => {
    if (!media) return;
    if (media.paused) media.play();
    else media.pause();
  };
  const handlePrev = () => {
    if (!media) return;
    media.currentTime = Math.max(0, media.currentTime - 10);
  };
  const handleNext = () => {
    if (!media) return;
    media.currentTime = Math.min(media.duration, media.currentTime + 10);
  };
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!media) return;
    media.currentTime = Number(e.target.value);
  };
  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!media) return;
    media.volume = Number(e.target.value);
  };

  if (!media) {
    return (
      <div className="options-card media-controls">
        <div className="media-controls-empty">
          <div className="media-cover-placeholder" />
          <div className="media-title">No media playing</div>
        </div>
      </div>
    );
  }

  return (
    <div className="options-card media-controls">
      <div className="media-controls-row">
        <div className="media-cover">
          {mediaCover ? <img src={mediaCover} alt="cover" /> : <div className="media-cover-placeholder" />}
        </div>
        <div className="media-meta">
          <div className="media-title">{mediaTitle}</div>
          <div className="media-seek-row">
            <span className="media-time">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="media-seek-bar"
            />
            <span className="media-time">{formatTime(duration)}</span>
          </div>
          <div className="media-controls-buttons">
            <button onClick={handlePrev} title="Back 10s">⏮</button>
            <button onClick={handlePlayPause} title={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? '⏸' : '▶️'}</button>
            <button onClick={handleNext} title="Forward 10s">⏭</button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolume}
              className="media-volume-bar"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

function formatTime(secs: number) {
  if (!isFinite(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// CustomActionTiles component
const ACTION_TILES_KEY = 'os_custom_action_tiles_v1';

type ActionTile = {
  id: string;
  type: 'website' | 'script' | 'toggle';
  title: string;
  icon: string;
  url?: string;
  script?: string;
  toggleTarget?: 'nightLight' | 'tabletMode';
};

const defaultTiles: ActionTile[] = [];

const CustomActionTiles: React.FC<{
  nightLight: boolean, setNightLight: (v: boolean) => void,
  tabletMode: boolean, setTabletMode: (v: boolean) => void
}> = ({ nightLight, setNightLight, tabletMode, setTabletMode }) => {
  const [tiles, setTiles] = useState<ActionTile[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(ACTION_TILES_KEY) || '[]');
    } catch {
      return defaultTiles;
    }
  });
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<'website' | 'script' | 'toggle'>('website');
  const [input, setInput] = useState<any>({});

  useEffect(() => {
    localStorage.setItem(ACTION_TILES_KEY, JSON.stringify(tiles));
  }, [tiles]);

  const handleTileClick = (tile: ActionTile) => {
    if (tile.type === 'website' && tile.url) {
      window.open(tile.url, '_blank');
    } else if (tile.type === 'script' && tile.script) {
      // eslint-disable-next-line no-eval
      if (window.confirm('Run this script?')) eval(tile.script);
    } else if (tile.type === 'toggle' && tile.toggleTarget) {
      if (tile.toggleTarget === 'nightLight') setNightLight(!nightLight);
      if (tile.toggleTarget === 'tabletMode') setTabletMode(!tabletMode);
    }
  };
  const handleRemove = (id: string) => setTiles(ts => ts.filter(t => t.id !== id));

  const handleAdd = () => {
    let tile: ActionTile | null = null;
    if (addType === 'website' && input.url && input.title) {
      tile = {
        id: Math.random().toString(36).slice(2),
        type: 'website',
        title: input.title,
        icon: '🌐',
        url: input.url
      };
    } else if (addType === 'script' && input.script && input.title) {
      tile = {
        id: Math.random().toString(36).slice(2),
        type: 'script',
        title: input.title,
        icon: '⚡',
        script: input.script
      };
    } else if (addType === 'toggle' && input.toggleTarget && input.title) {
      tile = {
        id: Math.random().toString(36).slice(2),
        type: 'toggle',
        title: input.title,
        icon: input.toggleTarget === 'nightLight' ? '🌙' : '📱',
        toggleTarget: input.toggleTarget
      };
    }
    if (tile) {
      setTiles(ts => [...ts, tile!]);
      setShowAdd(false);
      setInput({});
    }
  };

  return (
    <div className="action-tiles-bar">
      <div className="action-tiles-list">
        {tiles.map(tile => (
          <div className="action-tile" key={tile.id} onClick={() => handleTileClick(tile)} title={tile.title}>
            <span className="action-tile-icon">{tile.icon}</span>
            <span className="action-tile-title">{tile.title}</span>
            <button className="action-tile-remove" onClick={e => { e.stopPropagation(); handleRemove(tile.id); }} title="Remove">×</button>
          </div>
        ))}
        <button className="action-tile-add" onClick={() => setShowAdd(v => !v)} title="Add Action Tile">＋</button>
      </div>
      {showAdd && (
        <div className="action-tile-add-form">
          <select value={addType} onChange={e => setAddType(e.target.value as any)}>
            <option value="website">Website</option>
            <option value="script">Script</option>
            <option value="toggle">Toggle Setting</option>
          </select>
          {addType === 'website' && (
            <>
              <input placeholder="Title" value={input.title||''} onChange={e => setInput((inp: any) => ({...inp, title: e.target.value}))} />
              <input placeholder="URL (https://...)" value={input.url||''} onChange={e => setInput((inp: any) => ({...inp, url: e.target.value}))} />
            </>
          )}
          {addType === 'script' && (
            <>
              <input placeholder="Title" value={input.title||''} onChange={e => setInput((inp: any) => ({...inp, title: e.target.value}))} />
              <textarea placeholder="JS Script" value={input.script||''} onChange={e => setInput((inp: any) => ({...inp, script: e.target.value}))} />
            </>
          )}
          {addType === 'toggle' && (
            <>
              <input placeholder="Title" value={input.title||''} onChange={e => setInput((inp: any) => ({...inp, title: e.target.value}))} />
              <select value={input.toggleTarget||''} onChange={e => setInput((inp: any) => ({...inp, toggleTarget: e.target.value}))}>
                <option value="">Select Setting</option>
                <option value="nightLight">Night Light</option>
                <option value="tabletMode">Tablet Mode</option>
              </select>
            </>
          )}
          <button className="action-tile-save" onClick={handleAdd}>Save</button>
          <button className="action-tile-cancel" onClick={() => setShowAdd(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default OptionsCenter;
