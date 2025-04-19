import React from 'react';

export type WidgetStub = {
  id: string;
  title: string;
  icon: React.ReactNode;
  component: React.FC<any>;
};

// Example widgets (expand as needed)
import { WeatherWidget } from './WeatherWidget';
import { NotesWidget } from './NotesWidget';
import { SystemMonitorWidget } from './SystemMonitorWidget';
import { CalendarWidget } from './CalendarWidget';
import { NewsFeedWidget } from './NewsFeedWidget';
import { CalculatorWidget } from './CalculatorWidget';
import { StocksWidget } from './StocksWidget';

export const widgetStubs: WidgetStub[] = [
  {
    id: 'weather',
    title: 'Weather',
    icon: '☀️',
    component: WeatherWidget,
  },
  {
    id: 'notes',
    title: 'Sticky Notes',
    icon: '📝',
    component: NotesWidget,
  },
  {
    id: 'sysmon',
    title: 'System Monitor',
    icon: '📊',
    component: SystemMonitorWidget,
  },
  {
    id: 'calendar',
    title: 'Calendar',
    icon: '📅',
    component: CalendarWidget,
  },
  {
    id: 'news',
    title: 'News Feed',
    icon: '📰',
    component: NewsFeedWidget,
  },
  {
    id: 'calculator',
    title: 'Calculator',
    icon: '🧮',
    component: CalculatorWidget,
  },
  {
    id: 'stocks',
    title: 'Stocks',
    icon: '📈',
    component: StocksWidget,
  },
];
