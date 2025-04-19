import React, { useEffect, useState } from 'react';
import { FileSystem, FSNode } from '../../os/fs';
import { useNotifications } from '../../os/NotificationProvider';
import ContextMenu, { ContextMenuItem } from '../../os/components/ContextMenu';
import '../../os/components/ContextMenu.scss';
import './FileExplorer.scss';

const fs = new FileSystem();

export const FileExplorer: React.FC = () => {
  const [cwd, setCwd] = useState('/home/user');
  const [nodes, setNodes] = useState<FSNode[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const { push } = useNotifications();

  useEffect(() => {
    (async () => {
      await fs.init();
      setNodes(await fs.list(cwd));
    })();
  }, [cwd, refreshKey]);

  const refresh = () => setRefreshKey(k => k + 1);

  const open = (node: FSNode) => {
    if (node.type === 'folder') setCwd(node.path);
    else alert(`Open file: ${node.name}\n\n${(node as any).content}`);
  };

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  // Drag-and-drop state
  const [dragging, setDragging] = useState<string | null>(null);

  // Search/filter state
  const [search, setSearch] = useState('');

  // Tagging state
  const [tagInput, setTagInput] = useState('');

  // Tree sidebar state
  const [tree, setTree] = useState<FSNode[]>([]);
  // Cloud drives state
  const [cloudDrives, setCloudDrives] = useState<{ [key: string]: boolean }>({});
  const [cloudContents, setCloudContents] = useState<{ [key: string]: FSNode[] }>({});
  const cloudDriveList = [
    { id: 'dropbox', name: 'Dropbox', icon: '📦', sample: [
      { type: 'folder' as const, name: 'Photos', path: '/Drives/Dropbox/Photos', children: [], mtime: Date.now() },
      { type: 'file' as const, name: 'Resume.pdf', path: '/Drives/Dropbox/Resume.pdf', content: '', mtime: Date.now() }
    ] },
    { id: 'gdrive', name: 'Google Drive', icon: '☁️', sample: [
      { type: 'folder' as const, name: 'Projects', path: '/Drives/Google Drive/Projects', children: [], mtime: Date.now() },
      { type: 'file' as const, name: 'Notes.txt', path: '/Drives/Google Drive/Notes.txt', content: 'Cloud note', mtime: Date.now() }
    ] }
  ];

  useEffect(() => {
    (async () => {
      await fs.init();
      setTree(await fs.list('/'));
    })();
  }, [refreshKey]);

  // Tagging handler
  const addTag = async () => {
    if (!selected || !tagInput) return;
    const node = await fs.stat(selected);
    if (!node) return;
    const tags = node.tags || [];
    if (!tags.includes(tagInput)) {
      node.tags = [...tags, tagInput];
      await fs.writeFile(node.path, node.type === 'file' ? (node as any).content : '');
      refresh();
    }
    setTagInput('');
  };

  const createFile = async () => {
    if (!newName) return;
    try {
      await fs.writeFile(cwd + '/' + newName, '');
      setNewName('');
      refresh();
      push({ title: 'File created', message: `Created file: ${newName}`, type: 'success' });
    } catch (e) {
      setError('Failed to create file.');
      push({ title: 'Error', message: `Failed to create file: ${newName}`, type: 'error' });
    }
  };

  const createFolder = async () => {
    if (!newName) return;
    try {
      await fs.mkdir(cwd + '/' + newName);
      setNewName('');
      refresh();
      push({ title: 'Folder created', message: `Created folder: ${newName}`, type: 'success' });
    } catch (e) {
      setError('Failed to create folder.');
      push({ title: 'Error', message: `Failed to create folder: ${newName}`, type: 'error' });
    }
  };

  const del = async () => {
    if (!selected) return;
    try {
      await fs.delete(selected);
      push({ title: 'Deleted', message: `Deleted: ${selected.split('/').pop()}` });
      setSelected(null);
      refresh();
    } catch (e) {
      setError('Failed to delete.');
      push({ title: 'Error', message: `Failed to delete: ${selected.split('/').pop()}`, type: 'error' });
    }
  };

  const up = () => {
    if (cwd === '/') return;
    setCwd(cwd.split('/').slice(0, -1).join('/') || '/');
  };

  // Clipboard state
  const [clipboard, setClipboard] = useState<{ node: FSNode; mode: 'cut' | 'copy' } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  // Open With dialog state
  const [openWith, setOpenWith] = useState<{ node: FSNode } | null>(null);

  // Context menu actions
  const handleContextMenu = (e: React.MouseEvent, node?: FSNode) => {
    e.preventDefault();
    let items: ContextMenuItem[] = [];
    if (node) {
      // File/folder right-click
      items = [
        { label: 'Open', icon: '📂', onClick: () => open(node) },
        { label: 'Open With...', icon: '🗂️', onClick: () => { setOpenWith({ node }); closeContextMenu(); } },
        { label: 'Open Terminal Here', icon: '⌨️', onClick: () => { push({ title: 'Terminal', message: `Terminal opened at ${node.path}` }); closeContextMenu(); } },
        { label: 'Cut', icon: '✂️', onClick: () => { setClipboard({ node, mode: 'cut' }); closeContextMenu(); } },
        { label: 'Copy', icon: '📋', onClick: () => { setClipboard({ node, mode: 'copy' }); closeContextMenu(); } },
        { label: 'Paste', icon: '📋', disabled: true },
        { label: 'Delete', icon: '🗑️', onClick: () => { del(); closeContextMenu(); } },
        { label: 'Rename', icon: '✏️', onClick: () => { setRenaming(node.path); closeContextMenu(); } },
        { label: 'Create Shortcut', icon: '🔗', disabled: true },
        { label: 'Add File(s)...', icon: '➕', disabled: true },
        { label: 'Map Directory...', icon: '🗂️', disabled: true },
        { label: 'Sort By', icon: '↕️', submenu: [
          { label: 'Name', onClick: () => {/* TODO */} },
          { label: 'Date Modified', onClick: () => {/* TODO */} },
          { label: 'Type', onClick: () => {/* TODO */} },
          { label: 'Size', onClick: () => {/* TODO */} },
        ] },
      ];
    } else {
      // Background right-click
      items = [
        { label: 'Paste', icon: '📋', disabled: !clipboard, onClick: async () => {
          if (!clipboard) return;
          try {
            if (clipboard.mode === 'copy') {
              if (clipboard.node.type === 'file') {
                await fs.writeFile(cwd + '/' + clipboard.node.name, (clipboard.node as any).content);
              } else {
                await fs.mkdir(cwd + '/' + clipboard.node.name);
              }
            } else if (clipboard.mode === 'cut') {
              await fs.move(clipboard.node.path, cwd + '/' + clipboard.node.name);
              setClipboard(null);
            }
            refresh();
          } catch (e) { setError('Paste failed'); }
          closeContextMenu();
        } },
        { label: 'Open Terminal Here', icon: '⌨️', onClick: () => { push({ title: 'Terminal', message: `Terminal opened at ${cwd}` }); closeContextMenu(); } },
        { label: 'Sort By', icon: '↕️', submenu: [
          { label: 'Name', onClick: () => {/* TODO */} },
          { label: 'Date Modified', onClick: () => {/* TODO */} },
          { label: 'Type', onClick: () => {/* TODO */} },
          { label: 'Size', onClick: () => {/* TODO */} },
        ] },
        { label: 'New Folder', icon: '📁', onClick: () => { createFolder(); closeContextMenu(); } },
        { label: 'New Text Document', icon: '📄', onClick: () => { createFile(); closeContextMenu(); } },
        { label: 'Add File(s)...', icon: '➕', disabled: true },
        { label: 'Map Directory...', icon: '🗂️', disabled: true },
        { label: 'Open Terminal Here', icon: '⌨️', disabled: true },
      ];
    }
    setContextMenu({ x: e.clientX, y: e.clientY, items });
  };

  const closeContextMenu = () => setContextMenu(null);

  return (
    <div className="file-explorer-root" onContextMenu={e => handleContextMenu(e, undefined)}>
      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={closeContextMenu} />
      )
    }
      <div className="fe-toolbar-modern">
        <button className="fe-btn" onClick={up} title="Go up one folder">
          <span className="fe-btn-icon">⬆️</span>
        </button>
        <input
          className="fe-path"
          value={cwd}
          onChange={e => setCwd(e.target.value)}
          placeholder="Current folder"
        />
        <input
          className="fe-newname"
          placeholder="Add tag"
          value={tagInput}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
          style={{ width: 90 }}
        />
        <button className="fe-btn" onClick={addTag} title="Tag selected" disabled={!selected || !tagInput}>
          <span className="fe-btn-icon">🏷️</span>
        </button>
      </div>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar folder tree */}
        <div style={{ width: 160, background: 'rgba(24,28,37,0.93)', borderRight: '1.5px solid var(--primary)', overflowY: 'auto' }}>
          <div style={{ padding: 10, fontWeight: 600, color: '#c9e5ff' }}>Folders</div>
          {tree.map(folder => (
            <div
              key={folder.path}
              style={{ padding: '7px 14px', cursor: 'pointer', color: cwd === folder.path ? '#308aff' : '#c9e5ff', fontWeight: cwd === folder.path ? 700 : 400 }}
              onClick={() => setCwd(folder.path)}
            >
              {folder.name || '/'}
            </div>
          ))}
          {/* Cloud drives */}
          <div style={{ padding: '8px 0 0 0', borderTop: '1px solid #35405a', marginTop: 10 }}>
            <div style={{ padding: '7px 14px', color: '#7ecfff', fontWeight: 600 }}>Drives</div>
            {cloudDriveList.map(drive => (
              <div key={drive.id} style={{ padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '1.2em' }}>{drive.icon}</span>
                <span style={{ flex: 1, cursor: 'pointer', color: cwd === `/Drives/${drive.name}` ? '#308aff' : '#c9e5ff', fontWeight: cwd === `/Drives/${drive.name}` ? 700 : 400 }}
                  onClick={() => {
                    if (cloudDrives[drive.id]) setCwd(`/Drives/${drive.name}`);
                  }}>
                  {drive.name}
                </span>
                {!cloudDrives[drive.id] ? (
                  <button className="fe-btn" style={{ fontSize: 12, padding: '2px 7px', marginLeft: 2 }}
                    onClick={() => {
                      setCloudDrives(d => ({ ...d, [drive.id]: true }));
                      setCloudContents(c => ({ ...c, [drive.name]: drive.sample }));
                    }}>
                    Connect
                  </button>
                ) : <span style={{ color: '#7ecfff', fontSize: 12 }}>●</span>}
              </div>
            ))}
          </div>
        </div> 
        {/* Main file list */}
        <div
          className="fe-list-modern"
          style={{ flex: 1, minWidth: 0 }}
          onContextMenu={e => handleContextMenu(e, undefined)}
        >
          {/* Show cloud drive contents if selected */}
          {cloudDriveList.some(drive => cwd === `/Drives/${drive.name}` && cloudDrives[drive.id]) ? (
            cloudDriveList.map(drive => (
              cwd === `/Drives/${drive.name}` && cloudDrives[drive.id] ? (
                (cloudContents[drive.name] || []).map(node => (
                  <div
                    key={node.path}
                    className={
                      'fe-item-modern' + (selected === node.path ? ' selected' : '')
                    }
                    tabIndex={0}
                    onClick={() => setSelected(node.path)}
                    draggable
                    onDragStart={() => setDragging(node.path)}
                    onDragEnd={() => setDragging(null)}
                    onContextMenu={e => handleContextMenu(e, node)}
                  >
                    <span className="fe-icon-modern">
                      {node.type === 'folder' ? '📁' : '📄'}
                    </span>
                    {renaming === node.path ? (
                      <input
                        className="fe-newname"
                        style={{ width: 110 }}
                        autoFocus
                        defaultValue={node.name}
                        onBlur={async e => {
                          const newName = e.target.value.trim();
                          if (newName && newName !== node.name) {
                            try {
                              await fs.rename(node.path, cwd + '/' + newName);
                              refresh();
                            } catch (err) { setError('Rename failed'); }
                          }
                          setRenaming(null);
                        }}
                        onKeyDown={async e => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget;
                            const newName = input.value.trim();
                            if (newName && newName !== node.name) {
                              try {
                                await fs.rename(node.path, cwd + '/' + newName);
                                refresh();
                              } catch (err) { setError('Rename failed'); }
                            }
                            setRenaming(null);
                          } else if (e.key === 'Escape') {
                            setRenaming(null);
                          }
                        }}
                      />
                    ) : (
                      <span className="fe-name-modern">{node.name}</span>
                    )}
                  </div>
                ))
              ) : null
            ))
          ) : (
            nodes.filter(node => {
              if (!search) return true;
              const q = search.toLowerCase();
              return node.name.toLowerCase().includes(q) || (node.tags && node.tags.some((t: string) => t.toLowerCase().includes(q)));
            }).map(node => (
              <div
                key={node.path}
                className={
                  'fe-item-modern' + (selected === node.path ? ' selected' : '')
                }
                tabIndex={0}
                onClick={() => setSelected(node.path)}
                onDoubleClick={() => open(node)}
                draggable
                onDragStart={() => setDragging(node.path)}
                onDragEnd={() => setDragging(null)}
                onDrop={async e => {
                  e.preventDefault();
                  if (dragging && node.type === 'folder' && dragging !== node.path) {
                    await fs.move(dragging, node.path + '/' + dragging.split('/').pop());
                    setDragging(null);
                    refresh();
                  }
                }}
                onDragOver={e => e.preventDefault()}
              >
                <span className="fe-icon-modern">
                  {node.type === 'folder' ? '📁' : '📄'}
                </span>
                <span className="fe-name-modern">{node.name}</span>
                {node.tags && node.tags.length > 0 && (
                  <span style={{ fontSize: '0.95em', color: '#7ecfff', marginTop: 4 }}>{node.tags.map((t: any) => `#${t}`).join(' ')}</span>
                )}
                {node.preview && (
                  <img src={node.preview} alt="preview" style={{ maxWidth: 60, maxHeight: 60, marginTop: 5, borderRadius: 6 }} />
                )}
              </div>
            ))
          )}
        </div>
        {/* Preview pane */}
        <div style={{ width: 230, background: 'rgba(24,28,37,0.96)', borderLeft: '1.5px solid var(--primary)', padding: 18, overflowY: 'auto' }}>
          <div style={{ fontWeight: 600, color: '#c9e5ff', marginBottom: 10 }}>Preview</div>
          {selected ? (
            (() => {
              const node = nodes.find(n => n.path === selected);
              if (!node) return null;
              if (node.preview) return <img src={node.preview} alt="preview" style={{ maxWidth: 180, maxHeight: 120, borderRadius: 8 }} />;
              if (node.type === 'file' && (node as any).content && (node.name.endsWith('.txt') || node.name.endsWith('.md'))) {
                return <pre style={{ color: '#fff', background: '#181c25', borderRadius: 6, padding: 10, maxWidth: 180, maxHeight: 120, overflow: 'auto' }}>{(node as any).content.slice(0, 500)}</pre>;
              }
              return <span style={{ color: '#aaa' }}>No preview available</span>;
            })()
          ) : <span style={{ color: '#aaa' }}>No file selected</span>}
        </div>
      </div>
    </div>
  );
};
