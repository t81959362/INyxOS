import React, { useState, useEffect, useRef } from 'react';
import { askAI } from '../utils/askAI';
import { useTranslation } from 'react-i18next';
import './AiAssistant.scss';

type Props = { onClose: () => void };

const AiAssistant: React.FC<Props> = ({ onClose }) => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<string[]>([t('aiAssistant.greeting')]);
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // handle soft close animation
  const [isClosing, setIsClosing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startClose = () => setIsClosing(true);
  // close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        startClose();
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);
  // after closing animation, call onClose
  useEffect(() => {
    if (!isClosing) return;
    const node = containerRef.current;
    if (!node) return;
    const onAnimEnd = (e: AnimationEvent) => {
      if (e.animationName === 'slideDown') onClose();
    };
    node.addEventListener('animationend', onAnimEnd);
    return () => node.removeEventListener('animationend', onAnimEnd);
  }, [isClosing, onClose]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);

    // Always use fallback for user label
    const youLabel = t('aiAssistant.you') || 'You';
    setChat((prev: string[]) => [...prev, `${youLabel}: ${input}`]);
    console.log('Added to chat:', `${youLabel}: ${input}`);

    try {
      const response = await askAI(input);

      // Handle multiple images
      if (Array.isArray(response)) {
        setImageUrls(response);
        setImageUrl(response[0] || null);
        setLoading(false);
        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        return;
      }

      // If response is just a URL, show popup only and exit
      const trimmed = (response as string).trim();
      if (/^https?:\/\//i.test(trimmed)) {
        setImageUrls([trimmed]);
        setImageUrl(trimmed);
        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        setLoading(false);
        return;
      }

      // Always use fallback for Nexa label
      const nexaLabel = t('aiAssistant.nexa') || 'Nexa';
      setChat(prev => [...prev, `${nexaLabel}: ${response}`]);
      setImageUrls([]);
      setImageUrl(null);
    } catch {
      const nexaLabel = t('aiAssistant.nexa') || 'Nexa';
      setChat((prev: string[]) => [...prev, `${nexaLabel}: ${t('aiAssistant.error') || 'Error'}`]);
    }

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(false);
  };

  const handleThink = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setChat(prev => [...prev, `${t('aiAssistant.you')}: ${input}`]);
    try {
      const response = await askAI(`flash thinking ${input}`);
      const nexaThinkingLabel = t('aiAssistant.nexaThinking') || 'Nexa (thinking)';
setChat((prev: string[]) => [...prev, `${nexaThinkingLabel}: ${response}`]);
      // clear previous images
      setImageUrls([]);
    } catch {
      setChat(prev => [...prev, `${t('aiAssistant.nexa')}: ${t('aiAssistant.error')}`]);
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
    <div
      ref={containerRef}
      className={`ai-assistant-overlay ${isClosing ? 'closing' : ''}`}
    >
      {/* display image previews */}
      {imageUrls.length > 0 && (
        <div className="ai-image-popup">
          {imageUrls.map((url, idx) => (
            <img key={idx} src={url} alt={`Preview ${idx + 1}`} />
          ))}
        </div>
      )}
      <div className="ai-assistant-header">
        <span>Nexa</span>
        <button className="ai-close-btn" onClick={startClose}>×</button>
      </div>
      <div className="ai-assistant-body">
        {chat.map((line, idx) => (
          <div className="ai-chat-line" key={idx}>
            {typeof line === 'object'
              ? JSON.stringify(line, null, 2)
              : String(line)}
          </div>
        ))}
        {loading && <div className="ai-chat-line"><span className="ai-spinner" /></div>}
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
          onDragOver={e => e.preventDefault()}
          onDrop={async e => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files);
            for (const file of files) {
              if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
                const text = await file.text();
                setInput((prev: string) => prev + '\n' + text);
              }
            }
          }}
          placeholder={t('aiAssistant.placeholder')}
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading}>{t('aiAssistant.send')}</button>
        <button className="ai-think-btn" onClick={handleThink} disabled={loading} title={t('aiAssistant.research')}>
          <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9a3 3 0 0 1 3-3m-2 15h4m0-3c0-4.1 4-4.9 4-9A6 6 0 1 0 6 9c0 4 4 5 4 9h4Z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AiAssistant;
