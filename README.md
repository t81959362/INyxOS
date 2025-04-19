# NyxOS

This directory contains a React+TypeScript implementation of the NyxOS desktop environment and window manager for NyxOS prototyping in your browser.

## Features

- Desktop environment (taskbar, launcher, notifications, panel)
- Windowing system (move, resize, minimize, close)
- NyxOS theming (blur, transparency, flat design)
- Basic apps: File Explorer, Terminal, Text Editor, Settings
- Simulated file system and settings (in-browser)

## Getting Started

1. Install dependencies:

   ```
   cd web
   npm install
   ```

2. Start the development server:

   ```
   npm start
   ```

3. Open <http://localhost:5173> (or the port shown) in your browser.

## Tech Stack

- React + TypeScript
- Vite (for fast dev/build)
- SCSS/CSS modules for theming

## Notes

This is a UI/UX prototype and does not run the C++ kernel or real OS code.
