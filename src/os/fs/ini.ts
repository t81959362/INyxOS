// INI parser for config files
export function parseINI(src: string): Record<string, any> {
  const result: Record<string, any> = {};
  let section = '';
  src.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (!line || line.startsWith(';') || line.startsWith('#')) return;
    if (line.startsWith('[') && line.endsWith(']')) {
      section = line.slice(1, -1);
      result[section] = {};
    } else {
      const eq = line.indexOf('=');
      if (eq >= 0) {
        const key = line.slice(0, eq).trim();
        const value = line.slice(eq + 1).trim();
        if (section) result[section][key] = value;
        else result[key] = value;
      }
    }
  });
  return result;
}
