import React, { useEffect, useState } from 'react';

// Minimal stock info for 3 symbols (static for demo, replace with API for live)
// (Removed old STOCKS definition; see below for new version with labels)

function useTopNews(count = 3) {
  const [articles, setArticles] = useState<{ title: string; source: string }[]>([]);
  useEffect(() => {
    fetch('https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/news/rss.xml')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.items)) {
          setArticles(
            data.items.slice(0, count).map((item: any) => ({
              title: item.title,
              source: 'BBC News',
            }))
          );
        }
      });
  }, [count]);
  return articles;
}

const boxStyle: React.CSSProperties = {
  background: 'rgba(18,18,28,0.82)',
  borderRadius: 10,
  padding: '8px 14px',
  margin: '0 7px',
  minWidth: 110,
  color: '#fff',
  fontSize: 15,
  fontWeight: 600,
  boxShadow: '0 2px 12px 0 #0005',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 38,
  maxWidth: 210,
  textAlign: 'center',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
};

const STOCKS = [
  { label: 'Apple', symbol: 'AAPL', price: 207.66, change: +1.5 },
  { label: 'Tesla', symbol: 'TSLA', price: 255.81, change: +2.02 },
  { label: 'Nvidia', symbol: 'NVDA', price: 105.82, change: +3.02 },
];

export const LockScreenStocksAndNews: React.FC = () => {
  const news = useTopNews(3);
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 32,
        left: 0,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      {/* Stocks group */}
      <div
        style={{
          background: 'rgba(18,18,28,0.43)',
          borderRadius: 16,
          backdropFilter: 'blur(18px) brightness(1.15)',
          WebkitBackdropFilter: 'blur(18px) brightness(1.15)',
          padding: '11px 16px 8px 16px',
          marginRight: 18,
          minWidth: 155,
          boxShadow: '0 4px 18px 0 #0004',
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          pointerEvents: 'auto',
        }}
      >
        {STOCKS.map((s) => (
          <div key={s.symbol} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <span style={{ fontWeight: 500, fontSize: 13.5, color: '#e0e0f0', minWidth: 52 }}>{s.label}</span>
            <span style={{ fontWeight: 400, fontSize: 12.5, color: '#e0e0f0', minWidth: 48 }}>{s.price.toFixed(2)}</span>
            <span style={{ fontWeight: 500, fontSize: 12, color: s.change >= 0 ? '#4dfc9b' : '#ff6e7a', minWidth: 36, textAlign: 'right' }}>
              {s.change >= 0 ? '+' : '-'}{Math.abs(s.change).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
      {/* News group */}
      <div
        style={{
          background: 'rgba(18,18,28,0.43)',
          borderRadius: 18,
          backdropFilter: 'blur(18px) brightness(1.15)',
          WebkitBackdropFilter: 'blur(18px) brightness(1.15)',
          padding: '13px 18px 11px 18px',
          minWidth: 260,
          maxWidth: 350,
          boxShadow: '0 4px 24px 0 #0005',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          pointerEvents: 'auto',
        }}
      >
        {news.map((a) => (
          <div key={a.title} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 400, fontSize: 13.5, color: '#e0e0f0', maxWidth: 170, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{a.title}</span>
            <span style={{ fontWeight: 400, fontSize: 12.5, color: '#bfaaff', marginLeft: 6, flexShrink: 0 }}>BBC News</span>
          </div>
        ))}
      </div>
    </div>
  );
};
