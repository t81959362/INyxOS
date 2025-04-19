import React from 'react';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  onClick?: () => void;
  submenu?: ContextMenuItem[];
}

export interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  React.useEffect(() => {
    const handler = (e: MouseEvent) => onClose();
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      className="glass-context-menu"
      style={{ position: 'fixed', top: y, left: x, zIndex: 9999, minWidth: 180 }}
      tabIndex={-1}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          className={`glass-context-menu-item${item.disabled ? ' disabled' : ''}`}
          onClick={item.disabled ? undefined : item.onClick}
          tabIndex={0}
        >
          {item.icon && <span className="gcm-icon">{item.icon}</span>}
          <span className="gcm-label">{item.label}</span>
          {item.shortcut && <span className="gcm-shortcut">{item.shortcut}</span>}
          {item.submenu && <span className="gcm-arrow">▶</span>}
        </div>
      ))}
    </div>
  );
};

export default ContextMenu;
