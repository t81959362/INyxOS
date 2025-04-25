import React, { useEffect, useState } from 'react';

interface Article {
  title: string;
  url: string;
  source: string;
  image?: string | null;
  pubDate?: string | null;
}

const FEEDS = [
  {
    key: 'general',
    label: 'General (Top News)',
    urls: [
      'https://feeds.bbci.co.uk/news/rss.xml',
      'http://rss.cnn.com/rss/edition.rss',
      'https://www.independent.co.uk/news/uk/rss',
    ]
  },
  {
    key: 'bbc',
    label: 'BBC News (UK)',
    urls: ['https://feeds.bbci.co.uk/news/rss.xml']
  },
  {
    key: 'independent',
    label: 'The Independent (UK)',
    urls: ['https://www.independent.co.uk/news/uk/rss']
  },
  {
    key: 'guardian',
    label: 'The Guardian (UK)',
    urls: ['https://www.theguardian.com/world/rss']
  },

  {
    key: 'cnn',
    label: 'CNN (US/World)',
    urls: ['http://rss.cnn.com/rss/edition.rss']
  },
  {
    key: 'techcrunch',
    label: 'TechCrunch (Tech)',
    urls: ['http://feeds.feedburner.com/TechCrunch']
  },
  {
    key: 'tomshardware',
    label: "Tom's Hardware (Tech)",
    urls: ['https://www.tomshardware.com/feeds/all']
  },
  {
    key: 'verge',
    label: 'The Verge (Tech)',
    urls: ['https://www.theverge.com/rss/index.xml']
  },
  {
    key: 'arstechnica',
    label: 'Ars Technica (Tech)',
    urls: ['http://feeds.arstechnica.com/arstechnica/index']
  }
];

function formatPubDate(pubDate: string) {
  if (!pubDate) return '';
  const date = new Date(pubDate);
  if (isNaN(date.getTime())) return pubDate;
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)} hr ago`;
  return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

import styles from './NewsFeedWidget.module.css';
import modalStyles from './NewsFeedWidget.a11y.module.css';

export const NewsFeedWidget: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedKey, setFeedKey] = useState('general');
  const [customFeeds, setCustomFeeds] = useState<{label: string, url: string}[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('custom_rss_feeds') || '[]');
    } catch { return []; }
  });
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [showManageFeeds, setShowManageFeeds] = useState(false);
  const [modalArticle, setModalArticle] = useState<Article|null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [feedError, setFeedError] = useState<string|null>(null);

  useEffect(() => {
    let feed = FEEDS.find(f => f.key === feedKey);
    // If not found, check custom feeds
    if (!feed) {
      const cf = customFeeds.find(f => f.url === feedKey);
      if (cf) feed = { key: cf.url, label: cf.label, urls: [cf.url] };
    }
    if (!feed) return;
    setLoading(true);
    setError(null);
    setFeedError(null);
    Promise.all(
      feed.urls.map(url =>
        fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`)
          .then(r => r.json())
          .then(data => {
            if (data.status === 'error') throw new Error(data.message || 'Feed error');
            function extractImage(item: any): string | null {
              if (item.thumbnail) return item.thumbnail;
              if (item.enclosure && (item.enclosure.link || item.enclosure.url)) return item.enclosure.link || item.enclosure.url;
              if (item['media:content'] && item['media:content'].url) return item['media:content'].url;
              if (item['media:thumbnail'] && item['media:thumbnail'].url) return item['media:thumbnail'].url;
              // Try to extract first <img> from description HTML
              if (item.description) {
                const match = item.description.match(/<img[^>]+src=["']?([^"'>]+)["']?/i);
                if (match && match[1]) return match[1];
              }
              return null;
            }
            return data.items.map((item: any) => ({
              title: item.title,
              url: item.link,
              source: data.feed && data.feed.title ? data.feed.title : 'News',
              image: extractImage(item),
              pubDate: item.pubDate || item.published || item.date || null
            }));
          })
          .catch(() => [])
      )
    )
    .then(results => {
      // Flatten and sort by pubDate descending if available
      const all = ([] as Article[]).concat(...results);
      all.sort((a, b) => (b.pubDate || '').localeCompare(a.pubDate || ''));
      setArticles(all.slice(0, 20));
      setLoading(false);
    })
    .catch((err) => {
      setError('Failed to load news');
      setFeedError((err && err.message) ? err.message : 'Feed error');
      setLoading(false);
    });
  }, [feedKey]);

  return (
    <div style={{ padding: 14, minWidth: 240, color: '#fff' }}>
      <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8, color: '#fff', textAlign: 'center', letterSpacing: 1 }}>
        📰 News Feed
      </div>
      <div style={{ marginBottom: 10 }}>
        <label htmlFor="newsfeed-select" style={{ display: 'none' }}>Select news feed</label>
        <select id="newsfeed-select" aria-label="Select news feed" value={feedKey} onChange={e => setFeedKey(e.target.value)} style={{ padding: 4, borderRadius: 6, border: '1px solid #8f5fff', fontWeight: 600 }}>
          {FEEDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          {customFeeds.map((cf, i) => <option key={cf.url} value={cf.url}>{cf.label}</option>)}
        </select>
        {/* If you do not see the Manage button or article previews, try a full page reload (Ctrl+Shift+R) to clear cache. */}
        <button aria-label="Manage custom feeds" style={{ marginLeft: 8, background: '#8f5fff', color: '#fff', border: '2px solid #fff', borderRadius: 8, padding: '6px 16px', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 2px 8px #0002', transition: 'background 0.18s' }} onClick={() => setShowManageFeeds(v => !v)}>
          Manage
        </button>
        <form style={{ marginTop: 8, display: 'flex', gap: 6 }} onSubmit={e => {
          e.preventDefault();
          if (!newFeedUrl.trim()) return;
          let url = newFeedUrl.trim();
          if (!/^https?:\/\//.test(url)) url = 'https://' + url;
          const label = url.replace(/^https?:\/\/(www\.)?/,'').split(/[/?#]/)[0];
          setCustomFeeds(feeds => {
            const updated = [...feeds, { label: label.charAt(0).toUpperCase()+label.slice(1), url }];
            localStorage.setItem('custom_rss_feeds', JSON.stringify(updated));
            return updated;
          });
          setFeedKey(url);
          setNewFeedUrl('');
        }}>
          <label htmlFor="add-custom-feed" style={{ display: 'none' }}>Add custom RSS feed URL</label>
          <input
            id="add-custom-feed"
            type="text"
            value={newFeedUrl}
            onChange={e => setNewFeedUrl(e.target.value)}
            placeholder="Add custom RSS feed URL"
            style={{ flex: 1, borderRadius: 6, border: '1px solid #8f5fff', padding: 4, fontSize: 14 }}
            aria-label="Custom RSS feed URL"
          />
          <button type="submit" style={{ background: '#8f5fff', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Add</button>
        </form>
        {showManageFeeds && (
          <div style={{ marginTop: 10, background: '#18122a', borderRadius: 8, padding: 10 }} aria-label="Manage custom feeds">
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#fff' }}>Custom Feeds</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {customFeeds.map((cf, idx) => (
                <li key={cf.url} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ flex: 1, color: '#fff', fontWeight: 600 }}>{cf.label}</span>
                  <button aria-label={`Remove ${cf.label}`} style={{ background: 'none', color: '#ff5252', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginLeft: 8 }} onClick={() => {
                    setCustomFeeds(feeds => {
                      const updated = feeds.filter(f => f.url !== cf.url);
                      localStorage.setItem('custom_rss_feeds', JSON.stringify(updated));
                      if (feedKey === cf.url && updated.length > 0) setFeedKey(updated[0].url);
                      if (feedKey === cf.url && updated.length === 0) setFeedKey('general');
                      return updated;
                    });
                  }}>×</button>
                  {idx > 0 && (
                    <button aria-label={`Move up ${cf.label}`} style={{ background: 'none', color: '#8f5fff', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginLeft: 2 }} onClick={() => {
                      setCustomFeeds(feeds => {
                        const updated = [...feeds];
                        [updated[idx-1], updated[idx]] = [updated[idx], updated[idx-1]];
                        localStorage.setItem('custom_rss_feeds', JSON.stringify(updated));
                        return updated;
                      });
                    }}>↑</button>
                  )}
                  {idx < customFeeds.length-1 && (
                    <button aria-label={`Move down ${cf.label}`} style={{ background: 'none', color: '#8f5fff', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginLeft: 2 }} onClick={() => {
                      setCustomFeeds(feeds => {
                        const updated = [...feeds];
                        [updated[idx+1], updated[idx]] = [updated[idx], updated[idx+1]];
                        localStorage.setItem('custom_rss_feeds', JSON.stringify(updated));
                        return updated;
                      });
                    }}>↓</button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {feedError && (
        <div style={{ color: '#ffb347', background: '#2e1856', borderRadius: 8, padding: 12, marginBottom: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }} role="alert">
          <span aria-label="Feed error" style={{ fontSize: 22 }}>⚠️</span> {feedError}
          <button style={{ marginLeft: 'auto', background: '#8f5fff', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 14px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }} onClick={() => window.location.reload()}>Retry</button>
          {customFeeds.some(f => f.url === feedKey) && (
            <button style={{ background: 'none', color: '#ff5252', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginLeft: 8 }} onClick={() => {
              setCustomFeeds(feeds => {
                const updated = feeds.filter(f => f.url !== feedKey);
                localStorage.setItem('custom_rss_feeds', JSON.stringify(updated));
                setFeedKey('general');
                return updated;
              });
            }}>Remove Feed</button>
          )}
        </div>
      )}
      {loading ? <div style={{ color: '#aaa' }}>Loading...</div> : error ? <div style={{ color: '#ff5252' }}>{error}</div> : (
        <ul className={styles['newsfeed-list']} style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 320, overflowY: 'auto' }}>
          {articles.map((a, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18, background: 'rgba(44,18,62,0.22)', borderRadius: 8, padding: 10 }}>
              {a.image && <img src={a.image} alt="" style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 6, flexShrink: 0, background: '#222' }} />}
              <div style={{ flex: 1 }}>
                <button
                  aria-label={`Preview article: ${a.title}`}
                  style={{ color: '#fff', background: 'none', border: 'none', fontWeight: 700, fontSize: 16, textAlign: 'left', textDecoration: 'none', lineHeight: 1.3, letterSpacing: 0.1, outline: 'none', cursor: 'pointer', padding: 0, width: '100%', borderBottom: '1.5px dotted #8f5fff', transition: 'background 0.18s, color 0.18s' }}
                  onClick={() => { try { setModalArticle(a); setModalOpen(true); } catch { setError('Preview failed to open. Try reloading.'); } }}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { try { setModalArticle(a); setModalOpen(true); } catch { setError('Preview failed to open. Try reloading.'); } } }}
                  tabIndex={0}
                  onMouseOver={e => (e.currentTarget.style.background = '#22113a')}
                  onFocus={e => (e.currentTarget.style.background = '#22113a')}
                  onMouseOut={e => (e.currentTarget.style.background = 'none')}
                  onBlur={e => (e.currentTarget.style.background = 'none')}
                >{a.title}</button>
                <div style={{ fontSize: 13, color: '#fff', marginTop: 2, fontWeight: 600 }}>{a.source}
                  {a.pubDate && (
                    <span style={{ color: '#ccc', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                      • {formatPubDate(a.pubDate)}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {modalOpen && modalArticle && (
        <div className={modalStyles['newsfeed-modal-bg']} role="dialog" aria-modal="true" aria-label="Article preview" tabIndex={-1} onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className={modalStyles['newsfeed-modal']} tabIndex={0} style={{ outline: '2px solid #8f5fff' }}>
            <button className={modalStyles['newsfeed-modal-close']} aria-label="Close preview" onClick={() => setModalOpen(false)} tabIndex={0}>&times;</button>
            {modalArticle.image && <img src={modalArticle.image} alt="" className={modalStyles['newsfeed-modal-img']} />}
            <div className={modalStyles['newsfeed-modal-title']}>{modalArticle.title}</div>
            <div className={modalStyles['newsfeed-modal-meta']}>
              {modalArticle.source} {modalArticle.pubDate && <span>• {formatPubDate(modalArticle.pubDate)}</span>}
            </div>
            {modalArticle.url && (
              <a href={modalArticle.url} target="_blank" rel="noopener noreferrer" className={modalStyles['newsfeed-modal-link']} tabIndex={0}>Read Full Article</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
