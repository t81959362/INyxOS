import React, { useRef, useState } from 'react';
import { useDragResize } from '../hooks/useDragResize';

export interface PlasmoidProps {
  id: string;
  children: React.ReactNode;
  x: number;
  y: number;
  zIndex?: number;
  onRemove?: (id: string) => void;
  onPositionChange?: (id: string, dx: number, dy: number) => void;
  onFocus?: (id: string) => void;
}

export const Plasmoid: React.FC<PlasmoidProps> = ({ id, children, x, y, zIndex = 100, onRemove, onPositionChange, onFocus }) => {
  // Use the same drag logic as Window
  const handleMove = (dx: number, dy: number) => {
    if (onPositionChange) onPositionChange(id, dx, dy);
  };

  // No resize for widgets, so dummy handler
  const handleResize = () => {};

  const { onDragStart } = useDragResize({
    onMove: handleMove,
    onResize: handleResize
  });

  return (
    <div
      className="plasmoid-root"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        zIndex,
        minWidth: 180,
        minHeight: 80,
        background: 'rgba(24,28,37,0.82)',
        borderRadius: 14,
        boxShadow: '0 4px 24px #232a3930',
        userSelect: 'none',
        cursor: 'default',
        pointerEvents: 'auto',
        transition: 'box-shadow 0.15s',
      }}
      // onPointerDown removed: handled by onMouseDown in the titlebar
    >
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px 0 12px', cursor: 'grab', userSelect: 'none' }}
        onMouseDown={onDragStart}
        onClick={() => onFocus && onFocus(id)}
      >
        <span style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>Widget</span>
        {onRemove && (
          <button onClick={() => onRemove(id)} style={{ background: 'none', color: '#fff', border: 'none', fontWeight: 700, fontSize: 18, cursor: 'pointer', marginLeft: 8 }}>×</button>
        )}
      </div>
      <div style={{ padding: 12 }}>{children}</div>
    </div>
  );
};
