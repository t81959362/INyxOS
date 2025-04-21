import React, { useState, useEffect, useRef } from 'react';
import { askAI } from '../utils/askAI';
import { useDropzone } from 'react-dropzone';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
// PDF worker
GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.js', import.meta.url).toString();
import './AiAssistant.scss';

type Props = { onClose: () => void };

const AiAssistant: React.FC<Props> = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<string[]>(["Nexa: Hello! I'm Nexa, your assistant. How can I help you today?"]);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setChat(prev => [...prev, `You: ${input}`]);
    try {
      const response = await askAI(input);
      // if response is just a URL, show popup only and exit
      const trimmed = response.trim();
      if (/^https?:\/\/\S+$/i.test(trimmed)) {
        setImageUrl(trimmed);
        // clear input and reset height
        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        setLoading(false);
        return;
      }
      setChat(prev => [...prev, `Nexa: ${response}`]);
      setImageUrl(null);
    } catch {
      setChat(prev => [...prev, `Nexa: Sorry, something went wrong.`]);
    }
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(false);
  };

  const handleThink = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setChat(prev => [...prev, `You: ${input}`]);
    try {
      const response = await askAI(`flash thinking ${input}`);
      setChat(prev => [...prev, `Nexa (Thinking): ${response}`]);
    } catch {
      setChat(prev => [...prev, `Nexa: Sorry, something went wrong.`]);
    }
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  // Dropzone setup
  const handleFiles = async (files: File[]) => {
    setLoading(true);
    for (const file of files) {
      let text = '';
      if (file.type === 'application/pdf') {
        const data = await file.arrayBuffer();
        const pdf = await getDocument({ data }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => (item as any).str).join(' ') + '\n';
        }
      } else {
        text = await file.text();
      }
      const prompt = `Summarize and extract action items from the following content:\n\n${text}`;
      const summary = await askAI(prompt);
      setChat(prev => [...prev, `Nexa: ${summary}`]);
    }
    setLoading(false);
  };

  const handleUrlSummarize = async () => {
    if (!urlInput) return;
    setLoading(true);
    try {
      const res = await fetch(urlInput);
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const text = Array.from(doc.querySelectorAll('p')).map(p => p.innerText).join('\n');
      const prompt = `Summarize and extract action items from the following content:\n\n${text}`;
      const summary = await askAI(prompt);
      setChat(prev => [...prev, `Nexa: ${summary}`]);
    } catch {
      setChat(prev => [...prev, `Nexa: Sorry, I couldn't fetch or summarize that URL.`]);
    }
    setUrlInput('');
    setLoading(false);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop: handleFiles, multiple: true });

  return (
    <div className="ai-assistant-overlay">
      {/* file/URL upload zone */}
      <div {...getRootProps()} className="ai-upload-zone">
        <input {...getInputProps()} />
        <p>Drag & drop PDF or TXT to summarize</p>
        <div className="ai-upload-url">
          <input type="text" placeholder="Paste URL..." value={urlInput} onChange={e => setUrlInput(e.target.value)} disabled={loading} />
          <button onClick={handleUrlSummarize} disabled={loading || !urlInput}>Summarize URL</button>
        </div>
      </div>
      {imageUrl && (
        <div className="ai-image-popup">
          <img src={imageUrl} alt="Preview" />
        </div>
      )}
      <div className="ai-assistant-header">
        <span>Nexa</span>
        {loading && <div className="ai-spinner" />}
        <button className="ai-close-btn" onClick={onClose}>×</button>
      </div>
      <div className="ai-assistant-body">
        {chat.map((line, idx) => (
          <div key={idx} className="ai-chat-line">{line}</div>
        ))}
      </div>
      <div className="ai-assistant-input">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleInputChange}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask me anything..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading}>Send</button>
        <button className="ai-think-btn" onClick={handleThink} disabled={loading} title="Research">💡</button>
      </div>
    </div>
  );
};

export default AiAssistant;
