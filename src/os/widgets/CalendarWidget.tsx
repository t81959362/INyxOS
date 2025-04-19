import React, { useState } from 'react';

interface CalendarEvent {
  date: string; // YYYY-MM-DD
  text: string;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function pad(n: number) { return n < 10 ? '0' + n : n; }

export const CalendarWidget: React.FC = () => {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('calendar_events') || '[]');
    } catch { return []; }
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [eventText, setEventText] = useState('');

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();

  function saveEvent() {
    if (selectedDate && eventText.trim()) {
      const newEvents = [...events, { date: selectedDate, text: eventText.trim() }];
      setEvents(newEvents);
      localStorage.setItem('calendar_events', JSON.stringify(newEvents));
      setEventText('');
      setSelectedDate(null);
    }
  }

  function getEventsForDate(date: string) {
    return events.filter(ev => ev.date === date);
  }

  function renderDay(day: number) {
    const dateStr = `${year}-${pad(month+1)}-${pad(day)}`;
    const isToday = dateStr === `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
    const hasEvent = getEventsForDate(dateStr).length > 0;
    return (
      <div key={day}
        onClick={() => setSelectedDate(dateStr)}
        style={{
          width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: 2, borderRadius: 8,
          background: isToday ? '#8f5fff' : hasEvent ? '#232a3966' : 'transparent',
          color: isToday ? '#fff' : '#e5e5ff',
          border: isToday ? '2px solid #fff' : '1px solid #353a4a',
          boxShadow: isToday ? '0 2px 8px #8f5fff77' : undefined,
          cursor: 'pointer',
          position: 'relative',
          fontWeight: 500
        }}
        title={hasEvent ? getEventsForDate(dateStr).map(ev => ev.text).join('\n') : undefined}
      >
        {day}
        {hasEvent && <span style={{ position: 'absolute', bottom: 5, right: 6, width: 7, height: 7, borderRadius: 4, background: '#ffb347' }} />}
      </div>
    );
  }

  const weeks: JSX.Element[][] = [];
  let week: JSX.Element[] = [];
  for (let i = 0; i < firstDay; ++i) week.push(<div key={'empty'+i} style={{ width: 34, height: 34 }} />);
  for (let d = 1; d <= daysInMonth; ++d) {
    week.push(renderDay(d));
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) while (week.length < 7) week.push(<div key={'empty'+week.length} style={{ width: 34, height: 34 }} />);
  if (week.length) weeks.push(week);

  return (
    <div style={{ padding: 14, minWidth: 260, color: '#fff' }}>
      <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8, color: '#fff', textAlign: 'center', letterSpacing: 1 }}>
        📅 Calendar
      </div>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#ffe6ff', textAlign: 'center' }}>
        {today.toLocaleString('default', { month: 'long' })} {year}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
        <button onClick={() => setMonth(m => m === 0 ? 11 : m-1) || (m === 0 && setYear(y => y-1))} style={{ marginRight: 8 }}>‹</button>
        <span style={{ flex: 1, textAlign: 'center' }}>{today.toLocaleString('default', { month: 'long' })} {year}</span>
        <button onClick={() => setMonth(m => m === 11 ? 0 : m+1) || (m === 11 && setYear(y => y+1))} style={{ marginLeft: 8 }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 34px)', gap: 2, background: 'rgba(44,18,62,0.18)', borderRadius: 8, padding: 4 }}>
        {["S","M","T","W","T","F","S"].map(d => <div key={d} style={{ fontWeight: 600, color: '#bfa', fontSize: 13, textAlign: 'center' }}>{d}</div>)}
        {weeks.flat()}
      </div>
      {selectedDate && (
        <div style={{ marginTop: 12, background: '#232a39', padding: 10, borderRadius: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            Add event for {selectedDate && (() => {
              const [y, m, d] = selectedDate.split('-');
              return `${d}/${m}/${y}`;
            })()}
          </div>
          <textarea
            value={eventText}
            onChange={e => setEventText(e.target.value)}
            style={{ width: '100%', minHeight: 48, maxHeight: 'calc(100vh - 320px)', resize: 'vertical', borderRadius: 6, border: '1px solid #8f5fff', marginBottom: 6 }}
            placeholder="Event/Reminder"
          />
          <button onClick={saveEvent} style={{ background: '#8f5fff', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 14px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Save</button>
          <button onClick={() => setSelectedDate(null)} style={{ marginLeft: 8, background: 'none', color: '#fff', border: 'none', cursor: 'pointer' }}>Cancel</button>
        </div>
      )}
    </div>
  );
};
