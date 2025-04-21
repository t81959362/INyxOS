import React, { useEffect, useState } from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import './PackageManager.scss';

interface AppRegistryEntry {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  url: string;
  type: 'pwa';
  featured?: boolean;
  updateUrl?: string;
  sandbox?: string;
}

const registryUrl = '/registry.json';

export const PackageManager: React.FC = () => {
  const [apps, setApps] = useState<AppRegistryEntry[]>([]);
  const [installed, setInstalled] = useState<{ [id: string]: AppRegistryEntry }>(() => {
    const saved = localStorage.getItem('os_installed_apps');
    return saved ? JSON.parse(saved) : {};
  });
  const [filter, setFilter] = useState('all');
  const [showFeatured, setShowFeatured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customApps, setCustomApps] = useState<AppRegistryEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('os_custom_apps') || '[]'); } catch { return []; }
  });
  const [removedApps, setRemovedApps] = useState<string[]>(() => {
    const saved = localStorage.getItem('os_removed_apps');
    return saved ? JSON.parse(saved) : [];
  });
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const tryFetch = async () => {
      try {
        let res = await fetch(registryUrl);
        if (!res.ok) throw new Error('Could not load registry.json');
        const data = await res.json();
        setApps(data.filter((a: AppRegistryEntry) => a.type === 'pwa'));
      } catch (err) {
        setError('Failed to load app registry. Please check registry.json path.');
      }
    };
    tryFetch();
  }, []);

  const handleInstall = (app: AppRegistryEntry) => {
    setInstalled(prev => {
      const next = { ...prev, [app.id]: app };
      localStorage.setItem('os_installed_apps', JSON.stringify(next));
      return next;
    });
  };

  const handleUninstall = (app: AppRegistryEntry) => {
    // reset view to show all apps on uninstall
    setFilter('all'); setShowFeatured(false); setSearchTerm('');
    setInstalled(prev => {
      const next = { ...prev };
      delete next[app.id];
      localStorage.setItem('os_installed_apps', JSON.stringify(next));
      return next;
    });
  };

  const handleAddCustom = () => {
    if (newName && newUrl) {
      const id = newName.toLowerCase().replace(/\s+/g, '-');
      const icon = newUrl.replace(/\/+$/,'') + '/favicon.ico';
      const app: AppRegistryEntry = { id, name: newName, description: '', icon, category: 'Custom', url: newUrl, type: 'pwa', sandbox: 'allow-scripts allow-same-origin' };
      const updated = [...customApps, app];
      setCustomApps(updated);
      localStorage.setItem('os_custom_apps', JSON.stringify(updated));
      setNewName(''); setNewUrl('');
    }
  };

  const handleDeleteApp = (app: AppRegistryEntry) => {
    const updated = [...removedApps, app.id];
    setRemovedApps(updated);
    localStorage.setItem('os_removed_apps', JSON.stringify(updated));
  };

  const openApp = (app: AppRegistryEntry) => {
    // reset view to show all apps on launch
    setFilter('all'); setShowFeatured(false); setSearchTerm('');
    const event = new CustomEvent('os-open-pwa', { detail: app });
    window.dispatchEvent(event);
  };

  const combinedApps = [...apps, ...customApps];
  const visibleApps = combinedApps.filter(a => !removedApps.includes(a.id));
  const categories = Array.from(new Set(visibleApps.map(a => a.category)));

  return (
    <div className="package-manager-root">
      <h1>Package Manager</h1>
      <div className="pm-controls">
        <input
          className="pm-search"
          placeholder="Search apps..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <button type="button"
          className={showFeatured ? 'active' : ''}
          onClick={() => { setShowFeatured(true); setFilter('all'); }}
        >Featured</button>
        <button type="button"
          className={!showFeatured ? 'active' : ''}
          onClick={() => { setShowFeatured(false); setFilter('all'); }}
        >All Apps</button>
        <select value={filter} onChange={e => { setFilter(e.target.value); setShowFeatured(false); }}>
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      {/* custom PWA form */}
      <div className="pm-add-custom">
        <input placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} />
        <input placeholder="URL" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
        <button type="button" className="pm-btn pm-btn-install" onClick={handleAddCustom}>Add Custom PWA</button>
      </div>
      {error && <div className="pm-error">{error}</div>}
      <div className="pm-app-list">
        {visibleApps
          .filter(app => (showFeatured ? app.featured : true))
          .filter(app => filter === 'all' || app.category === filter)
          .filter(app => !searchTerm || app.name.toLowerCase().includes(searchTerm.toLowerCase()) || app.description.toLowerCase().includes(searchTerm.toLowerCase()))
          .map(app => (
            <div className="pm-app-card" key={app.id}>
              <img src={app.icon} alt={app.name} className="pm-app-icon" />
              <div className="pm-app-info">
                <div className="pm-app-title">{app.name}</div>
                <div className="pm-app-desc">{app.description}</div>
                <div className="pm-app-category">{app.category}</div>
              </div>
              <div className="pm-app-actions">
                {installed[app.id] ? (
                  <>
                    <button type="button" className="pm-btn pm-btn-launch" onClick={() => openApp(app)}>Launch</button>
                    <button type="button" className="pm-btn pm-btn-uninstall" onClick={() => handleUninstall(app)}>Uninstall</button>
                  </>
                ) : (
                  <>
                    <button type="button" className="pm-btn pm-btn-install" onClick={() => handleInstall(app)}>Install</button>
                    <PWAInstallButton app={app} />
                  </>
                )}
                <button type="button" className="pm-btn pm-btn-delete" onClick={() => handleDeleteApp(app)}>Delete</button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
