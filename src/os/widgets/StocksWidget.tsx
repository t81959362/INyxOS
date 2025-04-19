import React from 'react';

export const StocksWidget: React.FC = () => {
  return (
    <div style={{ padding: 14, minWidth: 420, color: '#fff', overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontWeight: 700, fontSize: 22, marginBottom: 8, color: '#fff', letterSpacing: 1 }}>
        <span style={{ fontSize: 26, display: 'flex', alignItems: 'center' }}>📈</span>
        <span>Stocks</span>
      </div>
      <div
        style={{ overflowX: 'auto', cursor: 'grab', marginTop: 12 }}
        tabIndex={0}
        onMouseDown={e => {
          const target = e.currentTarget;
          let startX = e.pageX;
          let scrollLeft = target.scrollLeft;
          let isDown = true;
          target.style.cursor = 'grabbing';
          const onMove = (ev: MouseEvent) => {
            if (!isDown) return;
            const x = ev.pageX;
            target.scrollLeft = scrollLeft - (x - startX);
          };
          const onUp = () => {
            isDown = false;
            target.style.cursor = 'grab';
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
          };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        }}
        onTouchStart={e => {
          const target = e.currentTarget;
          let startX = e.touches[0].pageX;
          let scrollLeft = target.scrollLeft;
          let isDown = true;
          const onMove = (ev: TouchEvent) => {
            if (!isDown) return;
            const x = ev.touches[0].pageX;
            target.scrollLeft = scrollLeft - (x - startX);
          };
          const onUp = () => {
            isDown = false;
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onUp);
          };
          window.addEventListener('touchmove', onMove);
          window.addEventListener('touchend', onUp);
        }}
      >
        <iframe
          title="TradingView Ticker Tape"
          src="https://s.tradingview.com/embed-widget/ticker-tape/?locale=en#%7B%22symbols%22%3A%5B%7B%22proName%22%3A%22NASDAQ%3AAAPL%22%2C%22title%22%3A%22Apple%22%7D%2C%7B%22proName%22%3A%22NASDAQ%3ATSLA%22%2C%22title%22%3A%22Tesla%22%7D%2C%7B%22proName%22%3A%22NASDAQ%3ANVDA%22%2C%22title%22%3A%22Nvidia%22%7D%2C%7B%22proName%22%3A%22NASDAQ%3AAMD%22%2C%22title%22%3A%22AMD%22%7D%2C%7B%22proName%22%3A%22NASDAQ%3AMSFT%22%2C%22title%22%3A%22Microsoft%22%7D%2C%7B%22proName%22%3A%22NASDAQ%3AGOOGL%22%2C%22title%22%3A%22Alphabet%22%7D%2C%7B%22proName%22%3A%22NASDAQ%3AMETA%22%2C%22title%22%3A%22Meta%22%7D%2C%7B%22proName%22%3A%22NASDAQ%3AAMZN%22%2C%22title%22%3A%22Amazon%22%7D%2C%7B%22proName%22%3A%22INDEX%3AFTSE%22%2C%22title%22%3A%22FTSE%20100%22%7D%5D%2C%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Afalse%2C%22displayMode%22%3A%22adaptive%22%2C%22locale%22%3A%22en%22%7D"
          width="700"
          height="80"
          style={{ border: 0, minWidth: 700, display: 'block' }}
          frameBorder="0"
          allowTransparency={true}
          scrolling="no"
        />
      </div>
      <div style={{ marginTop: 10, fontSize: 13, color: '#bfaaff', textAlign: 'center' }}>
        Real-time data powered by <a href="https://www.tradingview.com/" style={{ color: '#bfaaff', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">TradingView</a>.
      </div>
    </div>
  );
};
