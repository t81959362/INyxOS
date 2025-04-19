import React from 'react';
import { createRoot } from 'react-dom/client';
import { Desktop } from './os/Desktop';
import './style/global.scss';

const root = createRoot(document.getElementById('root')!);
root.render(<Desktop />);
