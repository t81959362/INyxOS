import React, { useState, useRef } from 'react';
import './BrowserApp.scss';
import NyxIcon from '../../assets/Nyxlogo.png';
import ArrowBackIcon from '../../assets/icons/arrow-back.svg';
import ArrowForwardIcon from '../../assets/icons/arrow-forward.svg';
import ReloadIcon from '../../assets/icons/reload.svg';
import HomeIcon from '../../assets/icons/home.svg';
import BookmarkIcon from '../../assets/icons/bookmark.svg';

const DEFAULT_HOME = 'https://andisearch.com/';

interface Tab {
  id: string;
  url: string;
  title: string;
  input: string;
  error?: string;
  history: string[];
  historyIndex: number;
  pinned?: boolean;
}

const PROXIES = {
  none: {
    label: 'No Proxy (Direct)',
    url: (target: string) => target
  },
  allOrigins: {
    label: 'allOrigins',
    url: (target: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`
  },
  chainflare: {
    label: 'Chainflare',
    url: (target: string) => `https://chainflare.sytes.net/raw?url=${encodeURIComponent(target)}`
  },
  corsflix: {
    label: 'Corsflix',
    url: (target: string) => `https://proxy.corsfix.com/?${encodeURIComponent(target)}`
  },
  corsAnywhere: {
    label: 'CORS Anywhere',
    // Note: Use your own self-hosted endpoint for unlimited usage
    url: (target: string) => `https://cors-anywhere.herokuapp.com/${target}`
  },
  corsproxy: {
    label: 'CORS Proxy (corsproxy.io)',
    url: (target: string) => `https://corsproxy.io/${encodeURIComponent(target)}`
  }
};

function proxiedUrl(url: string, proxy: keyof typeof PROXIES): string {
  return PROXIES[proxy].url(url);
}

export const BrowserApp: React.FC = () => {
  const [proxy, setProxy] = useState<keyof typeof PROXIES>(() => {
    try {
      const raw = localStorage.getItem('os_browser_proxy');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed in PROXIES) return parsed as keyof typeof PROXIES;
      }
    } catch {}
    return 'allOrigins'; // Default to use a CORS proxy
  });

  // Ensure proxy is always valid after mount
  React.useEffect(() => {
    if (!(proxy in PROXIES)) {
      setProxy('none');
    }
  }, [proxy]);
  // Rehydrate state from localStorage
  const [tabs, setTabs] = useState<Tab[]>(() => {
    try {
      const raw = localStorage.getItem('os_browser_tabs');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return [{ id: Math.random().toString(36).slice(2), url: DEFAULT_HOME, title: 'New Tab', input: DEFAULT_HOME, history: [DEFAULT_HOME], historyIndex: 0 }];
  });
  const [active, setActive] = useState(() => {
    try {
      const raw = localStorage.getItem('os_browser_active');
      if (raw) return JSON.parse(raw);
    } catch {}
    return 0;
  });
  const [bookmarks, setBookmarks] = useState<{title: string, url: string}[]>(() => {
    try {
      const raw = localStorage.getItem('os_browser_bookmarks');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  // Persist state to localStorage
  React.useEffect(() => {
    localStorage.setItem('os_browser_tabs', JSON.stringify(tabs));
  }, [tabs]);
  React.useEffect(() => {
    localStorage.setItem('os_browser_active', JSON.stringify(active));
  }, [active]);
  React.useEffect(() => {
    localStorage.setItem('os_browser_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);
  React.useEffect(() => {
    localStorage.setItem('os_browser_proxy', JSON.stringify(proxy));
  }, [proxy]);
  const iframeRefs = useRef<(HTMLIFrameElement|null)[]>([]);

  // Navigation
  const go = (tabIdx: number, target?: string, pushHistory = true, forceProxy?: keyof typeof PROXIES) => {
    setTabs(tabs => {
      const t = [...tabs];
      let next = target || t[tabIdx].input;
      if (!/^https?:\/\//.test(next) && !/^ftp:\/\//.test(next)) {
        next = 'https://' + next;
      }
      const tab = t[tabIdx];
      let newHistory = tab.history;
      let newIndex = tab.historyIndex;
      if (pushHistory) {
        newHistory = tab.history.slice(0, tab.historyIndex + 1).concat([next]);
        newIndex = newHistory.length - 1;
      }
      t[tabIdx] = { ...tab, url: next, input: next, error: undefined, history: newHistory, historyIndex: newIndex };
      return t;
    });
    // If forceProxy is provided, setProxy immediately
    if (forceProxy && forceProxy !== proxy) setProxy(forceProxy);
  };

  // Handle iframe error: try fallback to allOrigins if currently on none
  const handleIframeError = (tabIdx: number) => {
    if (proxy === 'none') {
      setProxy('allOrigins');
      // Optionally, reload the current tab
      setTimeout(() => {
        go(tabIdx, tabs[tabIdx]?.url, false, 'allOrigins');
      }, 100);
    } else {
      setTabs(tabs => {
        const t = [...tabs];
        t[tabIdx] = { ...t[tabIdx], error: 'Failed to load page. (Possible CORS or network error.)' };
        return t;
      });
    }
  };

  const back = () => {
    setTabs(tabs => {
      const t = [...tabs];
      const tab = t[active];
      if (tab.historyIndex > 0) {
        const newIndex = tab.historyIndex - 1;
        t[active] = { ...tab, url: tab.history[newIndex], input: tab.history[newIndex], error: undefined, historyIndex: newIndex };
      }
      return t;
    });
  };
  const forward = () => {
    setTabs(tabs => {
      const t = [...tabs];
      const tab = t[active];
      if (tab.historyIndex < tab.history.length - 1) {
        const newIndex = tab.historyIndex + 1;
        t[active] = { ...tab, url: tab.history[newIndex], input: tab.history[newIndex], error: undefined, historyIndex: newIndex };
      }
      return t;
    });
  };
  const reload = () => {
    setTabs(tabs => {
      const t = [...tabs];
      t[active] = { ...t[active], url: t[active].url, error: undefined };
      return t;
    });
  };
  const goHome = () => {
    setTabs(tabs => {
      const t = [...tabs];
      t[active] = { ...t[active], url: DEFAULT_HOME, input: DEFAULT_HOME, error: undefined };
      return t;
    });
  };
  // Tabs
  const addTab = () => {
    setTabs(tabs => [...tabs, { id: Math.random().toString(36).slice(2), url: DEFAULT_HOME, title: 'New Tab', input: DEFAULT_HOME, history: [DEFAULT_HOME], historyIndex: 0 }]);
    setActive(tabs.length);
  };
  const closeTab = (idx: number) => {
    setTabs(tabs => {
      const t = tabs.filter((_, i) => i !== idx);
      return t.length ? t : [{ id: Math.random().toString(36).slice(2), url: DEFAULT_HOME, title: 'New Tab', input: DEFAULT_HOME, history: [DEFAULT_HOME], historyIndex: 0 }];
    });
    setActive((a: number) => a === idx ? 0 : a > idx ? a - 1 : a);
  };
  // Bookmarks
  const addBookmark = () => {
    const tab = tabs[active];
    setBookmarks(bm => bm.some(b => b.url === tab.url) ? bm : [...bm, { title: tab.title || tab.url, url: tab.url }]);
  };
  const removeBookmark = (url: string) => {
    setBookmarks(bm => bm.filter(b => b.url !== url));
  };
  const goBookmark = (bmUrl: string) => {
    setTabs(tabs => {
      const t = [...tabs];
      t[active] = { ...t[active], url: bmUrl, input: bmUrl, error: undefined };
      return t;
    });
  };

  // Iframe title update (using postMessage workaround)
  React.useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!tabs[active]) return;
      if (typeof e.data === 'string' && e.data.startsWith('TITLE:')) {
        setTabs(tabs => {
          const t = [...tabs];
          t[active] = { ...t[active], title: e.data.slice(6) };
          return t;
        });
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [active, tabs]);

  return (
    <div className="browser-app-root">
      {/* Tab Bar - now at the very top */}
      <div className="browser-tabbar">
        {tabs.map((tab, idx) => (
          <div
            key={tab.id}
            className={`browser-tab${idx === active ? ' active' : ''}${tab.pinned ? ' pinned' : ''}`}
            draggable
            onDragStart={e => {
              e.dataTransfer.setData('tab-index', idx.toString());
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const fromIdx = Number(e.dataTransfer.getData('tab-index'));
              if (fromIdx === idx) return;
              setTabs(tabs => {
                const t = [...tabs];
                const [moved] = t.splice(fromIdx, 1);
                t.splice(idx, 0, moved);
                return t;
              });
              setActive((a: number) => (a === fromIdx ? idx : a === idx ? fromIdx : a));
            }}
            onClick={() => setActive(idx)}
            title={tab.url}
          >
            <img src={NyxIcon} alt="icon" style={{width:16,height:16,verticalAlign:'middle',marginRight:6,borderRadius:3}} />
            <span className={`browser-tab-title${tab.title === 'New Tab' ? ' browser-tab-title--new' : ''}`}>{tab.title || tab.url}</span>
            {tabs.length > 1 && (
              <button className="browser-tab-close" onClick={e => { e.stopPropagation(); closeTab(idx); }} title="Close Tab">×</button>
            )}
            {tab.pinned && <span className="browser-tab-pin" title="Pinned">📌</span>}
          </div>
        ))}
        <button className="browser-tab-add" onClick={addTab} title="New Tab">+</button>
      </div>
      {/* Toolbar now below tab bar */}
      <div className="browser-toolbar">
        <div className="browser-toolbar-left">
          <button onClick={back} title="Back" aria-label="Back" disabled={tabs[active]?.historyIndex === 0}>
            <img src={ArrowBackIcon} alt="Back" style={{width:20,height:20,opacity:tabs[active]?.historyIndex===0?0.4:1}} />
          </button>
          <button onClick={forward} title="Forward" aria-label="Forward" disabled={tabs[active]?.historyIndex === tabs[active]?.history.length - 1}>
            <img src={ArrowForwardIcon} alt="Forward" style={{width:20,height:20,opacity:tabs[active]?.historyIndex===tabs[active]?.history.length-1?0.4:1}} />
          </button>
          <button onClick={reload} title="Reload" aria-label="Reload">
            <img src={ReloadIcon} alt="Reload" style={{width:20,height:20}} />
          </button>
          <button onClick={goHome} title="Home" aria-label="Home">
            <img src={HomeIcon} alt="Home" style={{width:20,height:20}} />
          </button>
        </div>
        <form className="browser-toolbar-center" onSubmit={e => { e.preventDefault(); go(active); }}>
          <input
            className="browser-url-input"
            value={tabs[active] ? tabs[active].input : ''}
            onChange={e => setTabs(tabs => {
              if (!tabs[active]) return tabs;
              const t = [...tabs];
              t[active] = { ...t[active], input: e.target.value };
              return t;
            })}
            spellCheck={false}
            autoComplete="off"
            aria-label="URL bar"
          />
        </form>
        <div className="browser-toolbar-right">
          <button
            onClick={() => {
              const isBookmarked = bookmarks.some(b => b.url === tabs[active]?.url);
              if (isBookmarked) removeBookmark(tabs[active].url);
              else addBookmark();
            }}
            title={bookmarks.some(b => b.url === tabs[active]?.url) ? 'Remove bookmark' : 'Bookmark this page'}
            aria-label="Bookmark"
            style={{ background: 'none', border: 'none', padding: 0, marginRight: 8 }}
          >
            <img
              src={BookmarkIcon}
              alt="Bookmark"
              style={{
                width: 22,
                height: 22,
                filter: bookmarks.some(b => b.url === tabs[active]?.url)
                  ? 'drop-shadow(0 0 2px #308aff)' : 'none',
                color: bookmarks.some(b => b.url === tabs[active]?.url) ? '#308aff' : '#fff',
                opacity: bookmarks.some(b => b.url === tabs[active]?.url) ? 1 : 0.7,
                transition: 'filter 0.15s, color 0.15s, opacity 0.15s'
              }}
            />
          </button>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <select
              value={''}
              onChange={e => {
                const url = e.target.value;
                if (url) goBookmark(url);
              }}
              title="Bookmarks"
              className="browser-proxy-selector"
              style={{ marginRight: 8 }}
            >
              <option value="" disabled selected>
                {bookmarks.length ? 'Bookmarks' : 'No bookmarks'}
              </option>
              {bookmarks.map(b => (
                <option key={b.url} value={b.url}>{b.title}</option>
              ))}
            </select>
            <select value={proxy} onChange={e => setProxy(e.target.value as keyof typeof PROXIES)} title="Proxy selector" className="browser-proxy-selector">
              {Object.entries(PROXIES).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="browser-content">
        {tabs.some(tab => tab.error) ? (
          tabs.map((tab, idx) =>
            tab.error && active === idx ? (
              <div className="browser-error" key={tab.id}>
                <div>{tab.error}</div>
                <div style={{marginTop: 10, color: '#fa0', fontSize: '0.98em'}}>
                  If this site fails to load, try switching the proxy using the dropdown in the toolbar above. Some sites block certain proxies or require special headers.
                </div>
                <div style={{fontSize: '0.95em', marginTop: 8, color: '#555'}}>
                  <strong>URL:</strong> {tab.url}<br/>
                  <strong>Proxy:</strong> {proxy}<br/>
                  <strong>Proxied URL:</strong> {proxiedUrl(tab.url, proxy)}
                </div>
              </div>
            ) : null
          )
        ) : null}
        {tabs.map((tab, idx) => (
          <iframe
            key={tab.id}
            ref={el => (iframeRefs.current[idx] = el)}
            className="browser-iframe"
            src={proxiedUrl(tab.url, proxy)}
            title={tab.url}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-popups-to-escape-sandbox"
            allow="clipboard-read; clipboard-write; encrypted-media; fullscreen; geolocation; microphone; camera; display-capture; autoplay; picture-in-picture;"
            style={{ flex: 1, width: '100%', border: 'none', background: '#fff', display: active === idx ? 'block' : 'none' }}
            onError={() => handleIframeError(idx)}
          />
        ))}
      </div>
    </div>
  );
};
