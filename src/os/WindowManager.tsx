import React, { useState } from 'react';
import { Window } from './Window';

export const WindowManager: React.FC<{
  windows: any[];
  setWindows: (fn: (w: any[]) => any[]) => void;
}> = ({ windows, setWindows }) => {
  // Only one focused window at a time
  // Only render windows that are not minimized

  const [focused, setFocused] = useState<number | null>(null);
  const minWidth = 320;
  const minHeight = 180;

  const handleMove = (idx: number) => (dx: number, dy: number) => {
    setWindows(ws => ws.map((w, i) =>
      i === idx ? { ...w, left: Math.max(0, w.left + dx), top: Math.max(0, w.top + dy) } : w
    ));
  };

  const handleResize = (idx: number) => (dw: number, dh: number, dir: string) => {
    setWindows(ws => ws.map((w, i) => {
      if (i !== idx) return w;
      let { left, top, width, height } = w;
      switch (dir) {
        case 'nw':
          left += dw; width -= dw; top += dh; height -= dh; break;
        case 'ne':
          width += dw; top += dh; height -= dh; break;
        case 'sw':
          left += dw; width -= dw; height += dh; break;
        case 'se':
          width += dw; height += dh; break;
        case 'n':
          top += dh; height -= dh; break;
        case 's':
          height += dh; break;
        case 'e':
          width += dw; break;
        case 'w':
          left += dw; width -= dw; break;
      }
      width = Math.max(minWidth, width);
      height = Math.max(minHeight, height);
      return { ...w, left, top, width, height };
    }));
  };

  return (
    <>
      {windows.map((win, idx) => (
        win.minimized ? null : (
          <Window
            key={win.id}
            win={win}
            focused={focused === idx}
            onFocus={() => setFocused(idx)}
            onClose={() => setWindows(ws => ws.filter((_, i) => i !== idx))}
            onMove={handleMove(idx)}
            onResize={handleResize(idx)}
            onMinimize={() => {
              setWindows(ws => ws.map((w, i) => i === idx ? { ...w, minimized: true, focused: false } : { ...w, focused: false }));
              setFocused(null);
            }}
            onMaximize={win.title === 'Browser' ? () => {
              setWindows(ws => ws.map((w, i) => {
                if (i !== idx) return w;
                if (!w.maximized) {
                  // Save original size/position
                  return {
                    ...w,
                    maximized: true,
                    prev: { left: w.left, top: w.top, width: w.width, height: w.height },
                    left: 0,
                    top: 0,
                    width: window.innerWidth,
                    height: window.innerHeight
                  };
                } else {
                  // Restore
                  return {
                    ...w,
                    maximized: false,
                    left: w.prev?.left ?? w.left,
                    top: w.prev?.top ?? w.top,
                    width: w.prev?.width ?? w.width,
                    height: w.prev?.height ?? w.height
                  };
                }
              }));
            } : undefined}
          />
        )
      ))}
    </>
  );
};
