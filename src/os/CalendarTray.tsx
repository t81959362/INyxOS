import React from 'react';

const CalendarTray: React.FC = () => {
  const [show, setShow] = React.useState(false);
  const now = new Date();

  return (
    <span className="tray-icon" title="Calendar" onClick={() => setShow(v => !v)} tabIndex={0} style={{ position: 'relative', top: '1px', left: '-2px' }}>
      <svg width="1.3em" height="1.3em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 10h16m-8-3V4M7 7V4m10 3V4M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Zm3-7h.01v.01H8V13Zm4 0h.01v.01H12V13Zm4 0h.01v.01H16V13Zm-8 4h.01v.01H8V17Zm4 0h.01v.01H12V17Zm4 0h.01v.01H16V17Z"/>
      </svg>
      {show && (
        <div className="tray-popover tray-calendar-popover" style={{ position: 'absolute', right: 0, bottom: 48, background: 'rgba(30,34,43,0.97)', borderRadius: 12, boxShadow: '0 2px 16px #000a', padding: 18, minWidth: 260, zIndex: 1000 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 18 }}>
            {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </div>
          <CalendarView date={now} />
        </div>
      )}
    </span>
  );
};

// Simple monthly calendar grid
const CalendarView: React.FC<{ date: Date }> = ({ date }) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const today = date.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', background: 'none', color: '#fff' }}>
      <thead>
        <tr style={{ fontSize: 14, color: '#9cf' }}>
          <th>Su</th><th>Mo</th><th>Tu</th><th>We</th><th>Th</th><th>Fr</th><th>Sa</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) }).map((_, rowIdx) => (
          <tr key={rowIdx}>
            {Array.from({ length: 7 }).map((_, colIdx) => {
              const dayNum = rowIdx * 7 + colIdx - firstDay + 1;
              return (
                <td key={colIdx} style={{
                  padding: 6,
                  borderRadius: 6,
                  background: dayNum === today ? '#308aff' : 'none',
                  color: dayNum === today ? '#fff' : '#cce',
                  fontWeight: dayNum === today ? 700 : 400,
                  opacity: dayNum > 0 && dayNum <= daysInMonth ? 1 : 0.3
                }}>
                  {dayNum > 0 && dayNum <= daysInMonth ? dayNum : ''}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CalendarTray;
