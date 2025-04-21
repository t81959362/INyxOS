import * as chrono from 'chrono-node';

export interface Event { id: string; title: string; datetime: string; }

export function addEvent(nl: string): Event {
  const m = nl.match(/add\s+['"](.+?)['"]/i);
  const title = m ? m[1] : nl;
  const date = chrono.parseDate(nl) || new Date();
  const ev: Event = { id: Date.now().toString(), title, datetime: date.toISOString() };
  const all: Event[] = JSON.parse(localStorage.getItem('os_events') || '[]');
  localStorage.setItem('os_events', JSON.stringify([...all, ev]));
  return ev;
}

export function getEvents(start: Date, end: Date): Event[] {
  const all: Event[] = JSON.parse(localStorage.getItem('os_events') || '[]');
  return all.filter(e => {
    const d = new Date(e.datetime);
    return d >= start && d <= end;
  });
}
