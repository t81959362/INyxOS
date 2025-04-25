// Autoexec mechanism: run apps/scripts at startup based on config
import { FileSystem } from './FileSystem';
import { parseINI } from './ini';

export async function runAutoexec(fs: FileSystem, launchApp: (appId: string) => void) {
  if (!(await fs.exists('/config/autoexec.ini'))) return;
  const ini = parseINI((await fs.readFile('/config/autoexec.ini')) || '');
  if (ini['run']) {
    // run can be single or array
    const runs = Array.isArray(ini['run']) ? ini['run'] : [ini['run']];
    for (const appId of runs) {
      launchApp(appId);
    }
  }
}
