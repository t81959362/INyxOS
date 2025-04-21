import React from 'react';
import { FileExplorer } from '../apps/file_explorer/FileExplorer';
import { TextEditor } from '../apps/text_editor/TextEditor';
import { Terminal } from '../apps/terminal/Terminal';
import { Settings } from '../apps/settings/Settings';
import { BrowserApp } from '../apps/browser/BrowserApp';
import PackageManager from '../apps/package-manager';
import LibreOfficeApp from '../apps/libreoffice/LibreOfficeApp';

export const appStubs = [
  {
    id: 'explorer',
    title: 'File Explorer',
    icon: '🗂️',
    // Use the real File Explorer app
    content: () => <FileExplorer />, 
    width: 700,
    height: 520,
    top: 120,
    left: 420,
    zIndex: 10
  },
  {
    id: 'nyxnet',
    title: 'NyxNet',
    icon: '🌐',
    content: () => <BrowserApp />, 
    width: 900,
    height: 600,
    top: 80,
    left: 80,
    zIndex: 10
  },
  {
    id: 'terminal',
    title: 'Terminal',
    icon: '🖥️',
    // Use the real Terminal app
    content: () => <Terminal />,
    width: 420,
    height: 260,
    top: 170,
    left: 320,
    zIndex: 10
  },
  {
    id: 'textedit',
    title: 'Text Editor',
    icon: '📝',
    // Use the real Text Editor app
    content: () => <TextEditor />,
    width: 700,
    height: 520,
    top: 120,
    left: 420,
    zIndex: 10
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: '⚙️',
    // Use the real Settings app
    content: () => <Settings />,
    width: 700,
    height: 620,
    top: 150,
    left: 260,
    zIndex: 10
  },
  {
    id: 'package-manager',
    title: 'Package Manager',
    icon: '📦',
    content: () => <PackageManager />,
    width: 700,
    height: 520,
    top: 120,
    left: 420,
    zIndex: 10
  },
  {
    id: 'libreoffice',
    title: 'LibreOffice',
    icon: '📄',
    content: () => <LibreOfficeApp />, 
    width: 1024,
    height: 768,
    top: 120,
    left: 420,
    zIndex: 10
  },
  {
    id: 'winxp',
    title: 'Windows XP',
    icon: 'https://winxp.vercel.app/favicon.ico',
    content: () => (
      <iframe
        src="https://winxp.vercel.app/"
        sandbox="allow-scripts allow-same-origin allow-popups allow-pointer-lock"
        allow="fullscreen; pointer-lock"
        style={{ width: '100%', height: '100%', border: 'none', background: '#000' }}
        title="Windows XP"
      />
    ),
    width: 1024,
    height: 768,
    top: 100,
    left: 200,
    zIndex: 10,
  }
];

export const defaultWindows = [
  {
    ...appStubs[0],
    id: 'explorer1',
    left: 80,
    top: 80,
    zIndex: 10
  }
];
