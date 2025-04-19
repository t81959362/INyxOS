import React, { useEffect, useState } from 'react';
import { FileSystem } from '../../os/fs';
import './TextEditor.scss';

const fs = new FileSystem();

export const TextEditor: React.FC = () => {
  const [cwd, setCwd] = useState('/home/user');
  const [filename, setFilename] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');
  const [openFiles, setOpenFiles] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      await fs.init();
      setOpenFiles((await fs.list(cwd)).filter(f => f.type === 'file').map(f => f.name));
    })();
  }, [cwd]);

  const open = async (name: string) => {
    setFilename(name);
    setContent((await fs.readFile(`${cwd}/${name}`)) || '');
    setStatus('');
  };
  const save = async () => {
    if (!filename) return;
    await fs.writeFile(`${cwd}/${filename}`, content);
    setStatus('Saved!');
  };
  const newFile = async () => {
    const newFilename = prompt('Enter new file name:');
    if (newFilename) {
      const fullPath = `${cwd}/${newFilename}`;
      // Check if file already exists (optional, but good practice)
      try {
        await fs.readFile(fullPath); // Check existence
        alert(`File "${newFilename}" already exists.`);
        return;
      } catch (e) {
        // File doesn't exist, proceed
      }

      try {
        await fs.writeFile(fullPath, ''); // Create empty file
        setFilename(newFilename);
        setContent('');
        setStatus('New file created.');
        // Refresh file list
        setOpenFiles((await fs.list(cwd)).filter(f => f.type === 'file').map(f => f.name));
      } catch (error) {
        setStatus('Error creating file.');
        console.error('Error creating file:', error);
      }
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setStatus('');
  };

  return (
    <div className="text-editor-root-modern">
      <div className="te-toolbar-modern">
        <select className="te-select" value={filename} onChange={e => open(e.target.value)}>
          <option value="">Open file...</option>
          {openFiles.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <button className="te-btn" onClick={newFile}>📄 New</button>
        <button className="te-btn" onClick={save} disabled={!filename}>💾 Save</button>
        <input className="te-path" value={cwd} onChange={e => setCwd(e.target.value)} placeholder="Working folder" />
        <span className="te-status-modern">{status}</span>
      </div>
      <div className="te-editor-area-container">
        <div className="te-line-numbers">
          {content.split('\n').map((_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
        </div>
        <textarea
          className="te-area-modern"
          value={content}
          onChange={onChange}
          onScroll={(e) => {
            const lineNumbersDiv = e.currentTarget.previousElementSibling as HTMLElement;
            if (lineNumbersDiv) {
              lineNumbersDiv.scrollTop = e.currentTarget.scrollTop;
            }
          }}
        />
      </div>
    </div>
  );
};
