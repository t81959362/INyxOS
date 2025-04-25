import React, { createContext, useContext, useState } from 'react';
import ContextMenu, { ContextMenuItem } from './components/ContextMenu';

interface ContextMenuContextValue {
  openMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
}

const ContextMenuContext = createContext<ContextMenuContextValue>({ openMenu: () => {} });

export const ContextMenuProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [menu, setMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  const openMenu = (x: number, y: number, items: ContextMenuItem[]) => setMenu({ x, y, items });
  const closeMenu = () => setMenu(null);
  return (
    <ContextMenuContext.Provider value={{ openMenu }}>
      {children}
      {menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={closeMenu} />}
    </ContextMenuContext.Provider>
  );
};

export const useContextMenu = () => useContext(ContextMenuContext);
