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
    const handler = () => onClose();
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      className="card"
      style={{ position: 'fixed', top: y, left: x, zIndex: 9999 }}
      tabIndex={-1}
    >
      <ul className="list">
        {items.map((item, idx) => (
          <li
            key={idx}
            className={`element${item.disabled ? ' delete' : ''}`}
            onClick={item.disabled ? undefined : item.onClick}
          >
            {item.icon && <span className="icon">{item.icon}</span>}
            <span className="label">{item.label}</span>
            {item.shortcut && <span className="shortcut">{item.shortcut}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContextMenu;
