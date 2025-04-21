export interface FSNode {
  type: 'file' | 'folder';
  name: string;
  path: string;
  mtime: number;
  content?: string;
}

export class FileSystem {
  private nodes: FSNode[] = [];

  async init(): Promise<void> {
    const raw = localStorage.getItem('nyxos_fs');
    if (raw) {
      this.nodes = JSON.parse(raw);
    } else {
      this.nodes = [
        { type: 'folder', name: 'home', path: '/home', mtime: Date.now() },
        { type: 'folder', name: 'user', path: '/home/user', mtime: Date.now() },
      ];
      this.save();
    }
  }

  private save() {
    localStorage.setItem('nyxos_fs', JSON.stringify(this.nodes));
  }

  async list(path: string): Promise<FSNode[]> {
    const prefix = path === '/' ? '/' : path.endsWith('/') ? path : path + '/';
    return this.nodes.filter(node => {
      if (!node.path.startsWith(prefix) || node.path === prefix) return false;
      const rest = node.path.substring(prefix.length);
      return !rest.includes('/');
    });
  }

  async stat(path: string): Promise<FSNode | null> {
    const node = this.nodes.find(n => n.path === path);
    return node || null;
  }

  async writeFile(path: string, content: string): Promise<void> {
    const name = path.substring(path.lastIndexOf('/') + 1);
    const existing = this.nodes.find(n => n.path === path);
    if (existing) {
      existing.content = content;
      existing.mtime = Date.now();
    } else {
      this.nodes.push({ type: 'file', name, path, mtime: Date.now(), content });
    }
    this.save();
  }

  async mkdir(path: string): Promise<void> {
    if (this.nodes.some(n => n.path === path)) return;
    const name = path.substring(path.lastIndexOf('/') + 1);
    this.nodes.push({ type: 'folder', name, path, mtime: Date.now() });
    this.save();
  }

  async delete(path: string): Promise<void> {
    this.nodes = this.nodes.filter(n => n.path !== path && !n.path.startsWith(path.endsWith('/') ? path : path + '/'));
    this.save();
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    const node = this.nodes.find(n => n.path === oldPath);
    if (node) {
      node.name = newPath.substring(newPath.lastIndexOf('/') + 1);
      node.path = newPath;
      node.mtime = Date.now();
    }
    this.nodes.forEach(n => {
      if (n.path.startsWith(oldPath + '/')) {
        n.path = newPath + n.path.substring(oldPath.length);
      }
    });
    this.save();
  }

  async move(src: string, dest: string): Promise<void> {
    await this.rename(src, dest);
  }
}

export const fs = new FileSystem();
