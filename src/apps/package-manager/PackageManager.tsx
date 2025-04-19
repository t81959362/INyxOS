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
}

const registryUrl = '/registry.json';

export const PackageManager: React.FC = () => {
  const [apps, setApps] = useState<AppRegistryEntry[]>([]);
  const [installed, setInstalled] = useState<{ [id: string]: AppRegistryEntry }>({});
  const [filter, setFilter] = useState('all');
  const [showFeatured, setShowFeatured] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const saved = localStorage.getItem('os_installed_apps');
    if (saved) setInstalled(JSON.parse(saved));
  }, []);

  const handleInstall = (app: AppRegistryEntry) => {
    setInstalled(prev => {
      const next = { ...prev, [app.id]: app };
      localStorage.setItem('os_installed_apps', JSON.stringify(next));
      return next;
    });
  };

  const handleUninstall = (app: AppRegistryEntry) => {
    setInstalled(prev => {
      const next = { ...prev };
      delete next[app.id];
      localStorage.setItem('os_installed_apps', JSON.stringify(next));
      return next;
    });
  };

  // Run app in OS window (iframe sandbox)
  const openApp = (app: AppRegistryEntry) => {
    // Dispatch an event or call OS API to open an iframe window for this app
    const event = new CustomEvent('os-open-pwa', { detail: app });
    window.dispatchEvent(event);
  };

  const categories = Array.from(new Set(apps.map(a => a.category)));

  return (
    <div className="package-manager-root">
      <h1>Package Manager</h1>
      <div className="pm-controls">
        <button className={showFeatured ? 'active' : ''} onClick={() => setShowFeatured(true)}>Featured</button>
        <button className={!showFeatured ? 'active' : ''} onClick={() => setShowFeatured(false)}>All Apps</button>
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      {error && <div className="pm-error">{error}</div>}
      <div className="pm-app-list">
        {apps
          .filter(app => (showFeatured ? app.featured : true))
          .filter(app => filter === 'all' || app.category === filter)
          .map(app => (
            <div className="pm-app-card" key={app.id}>
              <img src={app.icon} alt={app.name} className="pm-app-icon" />
              <div className="pm-app-info">
                <div className="pm-app-title">{app.name}</div>
                <div className="pm-app-desc">{app.description}</div>
                <div className="pm-app-category">{app.category}</div>
              </div>
              {installed[app.id] ? (
                <div className="pm-app-actions">
                  <button className="pm-btn pm-btn-launch" onClick={() => openApp(app)}>Launch</button>
                  <button className="pm-btn pm-btn-uninstall" onClick={() => handleUninstall(app)}>Uninstall</button>
                </div>
              ) : (
                <div className="pm-app-actions">
                  <button className="pm-btn pm-btn-install" onClick={() => handleInstall(app)}>Install</button>
                  {/* Native PWA install support */}
                  <PWAInstallButton app={app} />
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};
