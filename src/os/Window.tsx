import React, { useState } from 'react';
import './Window.scss';
import { useDragResize } from './hooks/useDragResize';

export const Window: React.FC<{
  win: any;
  focused: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMove: (dx: number, dy: number) => void;
  onResize: (dw: number, dh: number, direction: string) => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
}> = ({ win, focused, onFocus, onClose, onMove, onResize, onMinimize, onMaximize }) => {
  // Snap preview state
  const [snapPreview, setSnapPreview] = useState<string|null>(null);

  // Snap logic
  const snapToRegion = (region: string) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    let left = 0, top = 0, width = w, height = h;
    switch(region) {
      case 'left': width = w/2; height = h; left = 0; top = 0; break;
      case 'right': width = w/2; height = h; left = w/2; top = 0; break;
      case 'top': width = w; height = h/2; left = 0; top = 0; break;
      case 'bottom': width = w; height = h/2; left = 0; top = h/2; break;
      case 'topleft': width = w/2; height = h/2; left = 0; top = 0; break;
      case 'topright': width = w/2; height = h/2; left = w/2; top = 0; break;
      case 'bottomleft': width = w/2; height = h/2; left = 0; top = h/2; break;
      case 'bottomright': width = w/2; height = h/2; left = w/2; top = h/2; break;
      default: return;
    }
    // Animate snap
    onMove(left - win.left, top - win.top);
    onResize(width - win.width, height - win.height, 'se');
  };

  const { onDragStart, onResizeStart } = useDragResize({
    onMove,
    onResize,
    onSnapPreview: setSnapPreview,
    onSnap: (region) => {
      snapToRegion(region);
      setSnapPreview(null);
    }
  });

  // Snap preview overlay
  const renderSnapPreview = () => {
    if (!snapPreview) return null;
    const w = window.innerWidth;
    const h = window.innerHeight;
    let style: React.CSSProperties = { position: 'fixed', zIndex: 9999, pointerEvents: 'none', borderRadius: 18, transition: 'all 0.18s', background: 'rgba(48,138,255,0.18)', boxShadow: '0 0 0 3px #308aff77', border: '2.5px solid #308aff', backdropFilter: 'blur(2px)' };
    switch(snapPreview) {
      case 'left': style = { ...style, left: 0, top: 0, width: w/2, height: h }; break;
      case 'right': style = { ...style, left: w/2, top: 0, width: w/2, height: h }; break;
      case 'top': style = { ...style, left: 0, top: 0, width: w, height: h/2 }; break;
      case 'bottom': style = { ...style, left: 0, top: h/2, width: w, height: h/2 }; break;
      case 'topleft': style = { ...style, left: 0, top: 0, width: w/2, height: h/2 }; break;
      case 'topright': style = { ...style, left: w/2, top: 0, width: w/2, height: h/2 }; break;
      case 'bottomleft': style = { ...style, left: 0, top: h/2, width: w/2, height: h/2 }; break;
      case 'bottomright': style = { ...style, left: w/2, top: h/2, width: w/2, height: h/2 }; break;
    }
    return <div style={style} />;
  };

  // Animation state
  const [animState, setAnimState] = useState<'open'|'idle'|'close'|'minimize'|'snap'>("open");
  // Trigger open animation on mount
  React.useEffect(() => { setAnimState('open'); const t = setTimeout(() => setAnimState('idle'), 220); return () => clearTimeout(t); }, []);
  // Animate on minimize/close
  const handleMinimize = () => { setAnimState('minimize'); setTimeout(() => { onMinimize && onMinimize(); setAnimState('idle'); }, 220); };
  const handleClose = () => { setAnimState('close'); setTimeout(() => { onClose(); }, 220); };
  // Animate on snap
  React.useEffect(() => { if (snapPreview) { setAnimState('snap'); setTimeout(() => setAnimState('idle'), 320); } }, [snapPreview]);

  return (
    <>
      {renderSnapPreview()}
      <div
        className={"window-root window-anim-" + animState + (focused ? " window-focused" : "")}
        style={{
          left: win.left,
          top: win.top,
          width: win.width,
          height: win.height,
          zIndex: win.zIndex || 1,
          position: "absolute",
          borderRadius: 16,
          backdropFilter: 'blur(10px)',
          background: (win.id === 'settings' || win.title === 'Settings') ? 'transparent' : 'rgba(30,34,43,0.82)',
          boxShadow: (win.id === 'settings' || win.title === 'Settings') ? 'none' : '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
          overflow: 'hidden',
          border: (win.id === 'settings' || win.title === 'Settings') ? 'none' : (focused ? '2px solid var(--accent, #308aff)' : '2px solid rgba(48,138,255,0.13)'),
          transition: 'all 0.2s cubic-bezier(.61,1.4,.38,1)',
        }}
        tabIndex={0}
        onMouseDown={onFocus}
      >
      {(win.id !== 'settings' && win.title !== 'Settings') && (
        <div className="window-titlebar" onMouseDown={onDragStart}>
          <span className="window-title">{win.title}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
            <button
              className="window-minimize"
              onClick={handleMinimize}
              title="Minimize"
              style={{
                background: 'none',
                color: '#fff',
                border: 'none',
                borderRadius: '3px',
                width: 28,
                height: 24,
                fontSize: 20,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                transition: 'background 0.15s',
                position: 'relative',
                top: 2
              }}
            >
              _
            </button>
            {/* Maximize button only for Browser */}
            <button
              className="window-maximize"
              onClick={onMaximize}
              title="Maximize"
              style={{
                background: 'none',
                color: '#fff',
                border: 'none',
                borderRadius: '3px',
                width: 28,
                height: 24,
                fontSize: 18,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                transition: 'background 0.15s',
                position: 'relative',
                top: 2
              }}
            >
              □
            </button>
            <button
  className="window-close"
  onClick={handleClose}
  title="Close"
  style={{
    background: 'none',
    color: '#fff',
    border: 'none',
    borderRadius: '3px',
    width: 28,
    height: 24,
    fontSize: 22,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    transition: 'background 0.15s',
    position: 'relative',
    top: 2
  }}
>
  ×
</button>
          </div>
        </div>
      )}
      <div className="window-content">{
  typeof win.content === 'function'
    ? win.content()
    : (React.isValidElement(win.content)
        ? win.content
        : <div style={{color: 'red', padding: 24}}>App failed to render: invalid content.</div>)
}</div>
      {/* Resize handles */}
      <div className="resize-handle resize-nw" onMouseDown={e => onResizeStart(e, 'nw')} />
      <div className="resize-handle resize-ne" onMouseDown={e => onResizeStart(e, 'ne')} />
      <div className="resize-handle resize-sw" onMouseDown={e => onResizeStart(e, 'sw')} />
      <div className="resize-handle resize-se" onMouseDown={e => onResizeStart(e, 'se')} />
      <div className="resize-handle resize-n" onMouseDown={e => onResizeStart(e, 'n')} />
      <div className="resize-handle resize-s" onMouseDown={e => onResizeStart(e, 's')} />
      <div className="resize-handle resize-e" onMouseDown={e => onResizeStart(e, 'e')} />
      <div className="resize-handle resize-w" onMouseDown={e => onResizeStart(e, 'w')} />
    </div>
    </>
  );
};
