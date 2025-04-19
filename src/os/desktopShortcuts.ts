import { DesktopShortcut } from './types';

export const desktopShortcuts: DesktopShortcut[] = [
  {
    id: 'explorer',
    name: 'File Explorer',
    icon: '🗂️',
    app: 'explorer',
  },
  {
    id: 'browser',
    name: 'Browser',
    icon: '🌐',
    app: 'browser',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    icon: '🖥️',
    app: 'terminal',
  },
  {
    id: 'textedit',
    name: 'Text Editor',
    icon: '📝',
    app: 'textedit',
  },
  {
    id: 'package-manager',
    name: 'Package Manager',
    icon: '📦',
    app: 'package-manager',
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: '⚙️',
    app: 'settings',
  },
];
