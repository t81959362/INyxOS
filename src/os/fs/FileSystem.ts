// Virtual filesystem API for browser OS
// Uses IndexedDB for persistence, falls back to localStorage if needed

import { FileSystemProvider, FileEntry, FolderEntry } from './FileSystemProvider';

export type FSNode = FileEntry | FolderEntry;

export class FileSystem {
  private provider: FileSystemProvider;

  constructor() {
    this.provider = new FileSystemProvider();
  }

  async init() {
    await this.provider.init();
  }

  async list(path: string): Promise<FSNode[]> {
    return this.provider.list(path);
  }

  async readFile(path: string): Promise<string | null> {
    return this.provider.readFile(path);
  }

  async writeFile(path: string, data: string): Promise<void> {
    await this.provider.writeFile(path, data);
  }

  async delete(path: string): Promise<void> {
    await this.provider.delete(path);
  }

  async mkdir(path: string): Promise<void> {
    await this.provider.mkdir(path);
  }

  async move(src: string, dest: string): Promise<void> {
    await this.provider.move(src, dest);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    await this.move(oldPath, newPath);
  }

  async exists(path: string): Promise<boolean> {
    return this.provider.exists(path);
  }

  async stat(path: string): Promise<FSNode | null> {
    return this.provider.stat(path);
  }
}
