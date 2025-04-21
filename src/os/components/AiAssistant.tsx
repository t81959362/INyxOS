import React, { useState, useEffect, useRef } from 'react';
import { askAI } from '../utils/askAI';
import './AiAssistant.scss';

type Props = { onClose: () => void };

const AiAssistant: React.FC<Props> = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<string[]>(["Nexa: Hello! I'm Nexa, your assistant. How can I help you today?"]);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setChat(prev => [...prev, `You: ${input}`]);
    try {
      const response = await askAI(input);
      setChat(prev => [...prev, `Nexa: ${response}`]);
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

  return (
    <div className="ai-assistant-overlay">
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
      </div>
    </div>
  );
};

export default AiAssistant;
