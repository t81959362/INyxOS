// Initializes the virtual filesystem with default folders and config on first boot
import { FileSystem } from './FileSystem';

export async function firstBoot(fs: FileSystem) {
  // Check if root exists
  if (await fs.exists('/')) return;
  // Create root and standard folders
  await fs.mkdir('/');
  await fs.mkdir('/home');
  await fs.mkdir('/home/user');
  await fs.mkdir('/apps');
  await fs.mkdir('/config');
  await fs.mkdir('/tmp');
  await fs.mkdir('/var');
  await fs.mkdir('/etc');
  // Default config
  await fs.writeFile('/config/autoexec.ini', '[run]\nexplorer\n');
  await fs.writeFile('/config/theme.ini', '[theme]\nname=default\n');
  // Example file
  await fs.writeFile('/home/user/Welcome.txt', 'Welcome to your browser OS!\nThis file is persistent.');
}
