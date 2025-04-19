import React, { useRef, useState } from 'react';

export interface PlasmoidProps {
  id: string;
  children: React.ReactNode;
  x: number;
  y: number;
  zIndex?: number;
  onRemove?: (id: string) => void;
  onPositionChange?: (id: string, x: number, y: number) => void;
  onFocus?: (id: string) => void;
}

export const Plasmoid: React.FC<PlasmoidProps> = ({ id, children, x, y, zIndex = 100, onRemove, onPositionChange, onFocus }) => {
  const [dragging, setDragging] = useState(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    setDragging(true);
    lastPointer.current = { x: e.clientX, y: e.clientY };
    if (onFocus) onFocus(id);
    window.getSelection()?.removeAllRanges();
    window.addEventListener('pointermove', onPointerMove as EventListener);
    window.addEventListener('pointerup', onPointerUp as EventListener);
  }

  function onPointerMove(e: Event) {
    if (!dragging || !lastPointer.current) return;
    const evt = e as PointerEvent;
    const dx = evt.clientX - lastPointer.current.x;
    const dy = evt.clientY - lastPointer.current.y;
    if (dx !== 0 || dy !== 0) {
      onPositionChange?.(id, x + dx, y + dy);
      lastPointer.current = { x: evt.clientX, y: evt.clientY };
    }
  }

  function onPointerUp() {
    setDragging(false);
    lastPointer.current = null;
    window.removeEventListener('pointermove', onPointerMove as EventListener);
    window.removeEventListener('pointerup', onPointerUp as EventListener);
  }

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
        userSelect: dragging ? 'none' : undefined,
        cursor: dragging ? 'grabbing' : 'default',
        transition: dragging ? 'none' : 'box-shadow 0.15s',
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px 0 12px', cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none' }}
        onPointerDown={onPointerDown}
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
