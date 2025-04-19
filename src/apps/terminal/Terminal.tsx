import React, { useEffect, useRef, useState } from 'react';
import { FileSystem } from '../../os/fs';
import './Terminal.scss';

const fs = new FileSystem();

function parseCmd(input: string) {
  // Simple shell parser: splits on space, handles quoted args
  const re = /"([^"]*)"|'([^']*)'|([^\s]+)/g;
  const args: string[] = [];
  let m;
  while ((m = re.exec(input))) {
    args.push(m[1] || m[2] || m[3]);
  }
  return args;
}

export const Terminal: React.FC = () => {
  const [lines, setLines] = useState<string[]>([
    'NyxOS Shell v0.1',
    'Type `help` for commands.'
  ]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('/home/user');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const print = (line: string) => setLines(l => [...l, line]);
  const prompt = () => `${cwd} $ `;

  const run = async (cmd: string) => {
    if (!cmd.trim()) return;
    print(prompt() + cmd);
    const [name, ...args] = parseCmd(cmd);
    try {
      switch (name) {
        case 'help':
          print('Commands: ls, cd, cat, echo, touch, mkdir, rm, clear, pwd, edit, save, exit, js');
          print('Use `js <code>` to run JavaScript.');
          break;
        case 'ls': {
          const nodes = await fs.list(cwd);
          print(nodes.map(n => n.name + (n.type === 'folder' ? '/' : '')).join('  '));
          break;
        }
        case 'cd': {
          if (!args[0]) { print('Usage: cd <dir>'); break; }
          let target = args[0];
          if (!target.startsWith('/')) target = cwd + '/' + target;
          if (await fs.exists(target) && (await fs.stat(target))?.type === 'folder') setCwd(target);
          else print('No such directory: ' + args[0]);
          break;
        }
        case 'pwd':
          print(cwd);
          break;
        case 'cat': {
          if (!args[0]) { print('Usage: cat <file>'); break; }
          let target = args[0];
          if (!target.startsWith('/')) target = cwd + '/' + target;
          if (await fs.exists(target)) print((await fs.readFile(target)) || '');
          else print('No such file: ' + args[0]);
          break;
        }
        case 'echo':
          print(args.join(' '));
          break;
        case 'touch': {
          if (!args[0]) { print('Usage: touch <file>'); break; }
          let target = args[0];
          if (!target.startsWith('/')) target = cwd + '/' + target;
          await fs.writeFile(target, '');
          print('Created ' + target);
          break;
        }
        case 'mkdir': {
          if (!args[0]) { print('Usage: mkdir <dir>'); break; }
          let target = args[0];
          if (!target.startsWith('/')) target = cwd + '/' + target;
          await fs.mkdir(target);
          print('Created ' + target);
          break;
        }
        case 'rm': {
          if (!args[0]) { print('Usage: rm <file/dir>'); break; }
          let target = args[0];
          if (!target.startsWith('/')) target = cwd + '/' + target;
          await fs.delete(target);
          print('Deleted ' + target);
          break;
        }
        case 'edit': {
          if (!args[0]) { print('Usage: edit <file>'); break; }
          let target = args[0];
          if (!target.startsWith('/')) target = cwd + '/' + target;
          let text = await fs.readFile(target) || '';
          print('--- Editing (type and then `save` to write) ---');
          print(text);
          break;
        }
        case 'save':
          print('Use the Text Editor app to save files.');
          break;
        case 'clear':
          setLines([]);
          break;
        case 'exit':
          print('exit (not implemented)');
          break;
        case 'js': {
          if (!args.length) { print('Usage: js <JavaScript code>'); break; }
          try {
            // Sandbox: only allow pure JS, no access to outer scope
            // eslint-disable-next-line no-new-func
            const result = Function(`"use strict";return (${args.join(' ')})`)();
            print('Result: ' + String(result));
          } catch (err) {
            print('JS Error: ' + (err as any).message);
          }
          break;
        }
        default:
          print('Unknown command: ' + name);
      }
    } catch (e) {
      print('Error: ' + (e as any).message);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run(input);
    setInput('');
  };

  return (
    <div className="terminal-root" onClick={() => inputRef.current?.focus()}>
      <div className="term-lines">
        {lines.map((line, i) => <div key={i} className="term-line">{line}</div>)}
        <form onSubmit={onSubmit} className="term-form">
          <span className="term-prompt">{prompt()}</span>
          <input
            ref={inputRef}
            className="term-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </form>
      </div>
    </div>
  );
};
