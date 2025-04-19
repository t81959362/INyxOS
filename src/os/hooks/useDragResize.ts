import { useRef, useCallback } from 'react';

export function useDragResize({
  onMove,
  onResize,
  minWidth = 320,
  minHeight = 180,
  onSnapPreview,
  onSnap
}: {
  onMove: (dx: number, dy: number) => void;
  onResize: (dw: number, dh: number, direction: string) => void;
  minWidth?: number;
  minHeight?: number;
  onSnapPreview?: (region: string|null) => void;
  onSnap?: (region: string) => void;
}) {
  const dragData = useRef<any>(null);

  // Drag window
  const onDragStart = useCallback((e: React.MouseEvent) => {
    dragData.current = {
      type: 'move',
      startX: e.clientX,
      startY: e.clientY
    };
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
  }, []);

  // Snap detection helpers
  const getSnapRegion = (x: number, y: number, width: number, height: number) => {
    const edge = 32; // px
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (x < edge && y < edge) return 'topleft';
    if (x > w - edge && y < edge) return 'topright';
    if (x < edge && y > h - edge) return 'bottomleft';
    if (x > w - edge && y > h - edge) return 'bottomright';
    if (x < edge) return 'left';
    if (x > w - edge) return 'right';
    if (y < edge) return 'top';
    if (y > h - edge) return 'bottom';
    return null;
  };

  // Resize window
  const onResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    dragData.current = {
      type: 'resize',
      direction,
      startX: e.clientX,
      startY: e.clientY
    };
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
  }, []);

  // Move/resize handler
  const onDragMove = useCallback((e: MouseEvent) => {
    if (!dragData.current) return;
    const dx = e.clientX - dragData.current.startX;
    const dy = e.clientY - dragData.current.startY;
    if (dragData.current.type === 'move') {
      onMove(dx, dy);
      dragData.current.startX = e.clientX;
      dragData.current.startY = e.clientY;
      if (onSnapPreview) {
        const region = getSnapRegion(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
        onSnapPreview(region);
      }
    } else if (dragData.current.type === 'resize') {
      onResize(dx, dy, dragData.current.direction);
      dragData.current.startX = e.clientX;
      dragData.current.startY = e.clientY;
    }
  }, [onMove, onResize, onSnapPreview]);

  // End drag/resize
  const onDragEnd = useCallback((e?: MouseEvent) => {
    if (dragData.current && dragData.current.type === 'move' && onSnap) {
      const x = e?.clientX ?? 0;
      const y = e?.clientY ?? 0;
      const region = getSnapRegion(x, y, window.innerWidth, window.innerHeight);
      if (region) {
        onSnap(region);
      }
      if (onSnapPreview) onSnapPreview(null);
    }
    dragData.current = null;
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);
  }, [onDragMove, onSnap, onSnapPreview]);

  return { onDragStart, onResizeStart };
}
