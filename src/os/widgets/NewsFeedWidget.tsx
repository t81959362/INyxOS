import React, { useEffect, useState } from 'react';

interface Article {
  title: string;
  url: string;
  source: string;
}

const TOPICS = ['general', 'technology', 'science', 'business', 'sports', 'entertainment', 'health'];

export const NewsFeedWidget: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState('general');

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`https://gnews.io/api/v4/top-headlines?lang=en&topic=${topic}&token=demo`)
      .then(r => r.json())
      .then(data => {
        if (data.articles) {
          setArticles(data.articles.map((a: any) => ({ title: a.title, url: a.url, source: a.source.name })));
        } else {
          setError('No articles found');
        }
        setLoading(false);
      })
      .catch(() => { setError('Failed to load news'); setLoading(false); });
  }, [topic]);

  return (
    <div style={{ padding: 14, minWidth: 240, color: '#fff' }}>
      <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8, color: '#fff', textAlign: 'center', letterSpacing: 1 }}>
        📰 News Feed
      </div>
      <div style={{ marginBottom: 10 }}>
        <select value={topic} onChange={e => setTopic(e.target.value)} style={{ padding: 4, borderRadius: 6, border: '1px solid #8f5fff', fontWeight: 600 }}>
          {TOPICS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>
      {loading ? <div style={{ color: '#aaa' }}>Loading...</div> : error ? <div style={{ color: '#ff5252' }}>{error}</div> : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 220, overflowY: 'auto' }}>
          {articles.map((a, i) => (
            <li key={i} style={{ marginBottom: 10 }}>
              <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: '#8f5fff', fontWeight: 600, textDecoration: 'none' }}>{a.title}</a>
              <div style={{ fontSize: 13, color: '#bfa' }}>{a.source}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
