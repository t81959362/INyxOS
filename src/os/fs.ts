export type FSNode = {
  type: 'file' | 'folder';
  name: string;
  path: string;
  mtime: number;
  content?: string;
  children?: FSNode[];
  tags?: string[];
  preview?: string;
};

export class FileSystem {
  async init() {
    // initialize file system (mock or real)
  }

  async list(path: string): Promise<FSNode[]> {
    // return mock or real file/folder list
    return [];
  }

  async stat(path: string): Promise<FSNode | null> {
    // mock stat
    return null;
  }

  async writeFile(path: string, content: string): Promise<void> {
    // mock write
  }

  async mkdir(path: string): Promise<void> {
    // mock mkdir
  }

  async delete(path: string): Promise<void> {
    // mock delete
  }

  async move(src: string, dest: string): Promise<void> {
    // mock move
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    // mock rename
  }
}
