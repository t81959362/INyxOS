// IndexedDB-based persistent virtual filesystem
// Fallback to localStorage if IndexedDB is not available

export interface FileEntry {
  type: 'file';
  name: string;
  path: string;
  content: string;
  mtime: number;
  tags?: string[];
  preview?: string; // URL or base64 preview
  assocApp?: string; // file association
}
export interface FolderEntry {
  type: 'folder';
  name: string;
  path: string;
  children: string[];
  mtime: number;
  tags?: string[];
  preview?: string;
}

export class FileSystemProvider {
  private db: IDBDatabase | null = null;
  private fallback: boolean = false;
  private localFS: Record<string, FileEntry | FolderEntry> = {};

  async init() {
    if (!('indexedDB' in window)) {
      this.fallback = true;
      this.loadLocal();
      await this.ensureStandardFolders();
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('osfs', 1);
      req.onupgradeneeded = e => {
        const db = (e.target as IDBOpenDBRequest).result;
        db.createObjectStore('nodes', { keyPath: 'path' });
      };
      req.onsuccess = e => {
        this.db = (e.target as IDBOpenDBRequest).result;
        resolve();
      };
      req.onerror = () => {
        this.fallback = true;
        this.loadLocal();
        resolve();
      };
    });
    await this.ensureStandardFolders();
  }

  // Ensure standard folders exist
  private async ensureStandardFolders() {
    const now = Date.now();
    const stdFolders = [
      { path: '/', name: '', children: ['/Program Files', '/Users', '/Public', '/Drives'] },
      { path: '/Program Files', name: 'Program Files', children: [] },
      { path: '/Users', name: 'Users', children: [] },
      { path: '/Public', name: 'Public', children: [] },
      { path: '/Drives', name: 'Drives', children: [] }
    ];
    for (const f of stdFolders) {
      let node = await this.stat(f.path);
      if (!node) {
        const folder: FolderEntry = {
          type: 'folder',
          name: f.name,
          path: f.path,
          children: f.children,
          mtime: now
        };
        await this.putNode(folder);
      }
    }
    // Fix root children if needed
    const root = await this.stat('/') as FolderEntry;
    if (root && root.type === 'folder') {
      let changed = false;
      for (const sub of ['/Program Files', '/Users', '/Public', '/Drives']) {
        if (!root.children.includes(sub)) {
          root.children.push(sub);
          changed = true;
        }
      }
      if (changed) {
        root.mtime = Date.now();
        await this.putNode(root);
      }
    }
  }

  private loadLocal() {
    try {
      const raw = localStorage.getItem('osfs');
      if (raw) this.localFS = JSON.parse(raw);
    } catch {}
  }
  private saveLocal() {
    localStorage.setItem('osfs', JSON.stringify(this.localFS));
  }

  async list(path: string): Promise<(FileEntry | FolderEntry)[]> {
    const node = await this.stat(path);
    if (!node || node.type !== 'folder') return [];
    return Promise.all(node.children.map(childPath => this.stat(childPath))).then(nodes => nodes.filter(Boolean) as (FileEntry | FolderEntry)[]);
  }

  async readFile(path: string): Promise<string | null> {
    const node = await this.stat(path);
    if (node && node.type === 'file') return node.content;
    return null;
  }

  async writeFile(path: string, data: string): Promise<void> {
    const now = Date.now();
    const name = path.split('/').pop() || '';
    const parent = path.split('/').slice(0, -1).join('/') || '/';
    const node: FileEntry = { type: 'file', name, path, content: data, mtime: now };
    await this.putNode(node);
    // Add to parent folder
    const parentNode = await this.stat(parent);
    if (parentNode && parentNode.type === 'folder' && !parentNode.children.includes(path)) {
      parentNode.children.push(path);
      parentNode.mtime = now;
      await this.putNode(parentNode);
    }
  }

  async delete(path: string): Promise<void> {
    const node = await this.stat(path);
    if (!node) return;
    if (node.type === 'folder') {
      for (const child of node.children) await this.delete(child);
    }
    await this.removeNode(path);
    // Remove from parent
    const parent = path.split('/').slice(0, -1).join('/') || '/';
    const parentNode = await this.stat(parent);
    if (parentNode && parentNode.type === 'folder') {
      parentNode.children = parentNode.children.filter(p => p !== path);
      parentNode.mtime = Date.now();
      await this.putNode(parentNode);
    }
  }

  async mkdir(path: string): Promise<void> {
    const now = Date.now();
    const name = path.split('/').pop() || '';
    const node: FolderEntry = { type: 'folder', name, path, children: [], mtime: now };
    await this.putNode(node);
    // Add to parent
    const parent = path.split('/').slice(0, -1).join('/') || '/';
    const parentNode = await this.stat(parent);
    if (parentNode && parentNode.type === 'folder' && !parentNode.children.includes(path)) {
      parentNode.children.push(path);
      parentNode.mtime = now;
      await this.putNode(parentNode);
    }
  }

  async move(src: string, dest: string): Promise<void> {
    const node = await this.stat(src);
    if (!node) return;
    await this.delete(src);
    if (node.type === 'file') await this.writeFile(dest, node.content);
    else if (node.type === 'folder') {
      await this.mkdir(dest);
      for (const child of node.children) {
        const childName = child.split('/').pop();
        await this.move(child, `${dest}/${childName}`);
      }
    }
  }

  async exists(path: string): Promise<boolean> {
    return !!(await this.stat(path));
  }

  async stat(path: string): Promise<FileEntry | FolderEntry | null> {
    if (this.fallback) {
      return this.localFS[path] || null;
    }
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve(null);
      const tx = this.db.transaction('nodes', 'readonly');
      const store = tx.objectStore('nodes');
      const req = store.get(path);
      req.onsuccess = e => resolve((e.target as IDBRequest).result || null);
      req.onerror = () => resolve(null);
    });
  }

  private async putNode(node: FileEntry | FolderEntry) {
    if (this.fallback) {
      this.localFS[node.path] = node;
      this.saveLocal();
      return;
    }
    return new Promise<void>((resolve, reject) => {
      if (!this.db) return resolve();
      const tx = this.db.transaction('nodes', 'readwrite');
      const store = tx.objectStore('nodes');
      store.put(node);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  private async removeNode(path: string) {
    if (this.fallback) {
      delete this.localFS[path];
      this.saveLocal();
      return;
    }
    return new Promise<void>((resolve, reject) => {
      if (!this.db) return resolve();
      const tx = this.db.transaction('nodes', 'readwrite');
      const store = tx.objectStore('nodes');
      store.delete(path);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }
}
