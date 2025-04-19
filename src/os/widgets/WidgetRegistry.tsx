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
];
