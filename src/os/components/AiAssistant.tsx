import React, { useState, useEffect, useRef } from 'react';
import * as ort from 'onnxruntime-web';
import './AiAssistant.scss';

// Path to your ONNX model (place mobilellm-125M.onnx in public/models/)
const modelUrl = `${import.meta.env.BASE_URL}models/mobilellm-125m.onnx`;

type Props = { onClose: () => void };

const AiAssistant: React.FC<Props> = ({ onClose }) => {
  const [session, setSession] = useState<ort.InferenceSession | null>(null);
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    (async () => {
      const opts = { executionProviders: ['webgpu'], graphOptimizationLevel: 'all' };
      const sess = await ort.InferenceSession.create(modelUrl, opts);
      setSession(sess);
    })();
  }, []);

  const handleSend = async () => {
    if (!session || !input.trim()) return;
    setLoading(true);
    // TODO: preprocess input to tensor, session.run, postprocess output
    // Placeholder: echo back
    setChat(prev => [...prev, `You: ${input}`, `Assistant: ${input}`]);
    setInput('');
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
        <span>AI Assistant</span>
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
          disabled={!session || loading}
        />
        <button onClick={handleSend} disabled={!session || loading}>Send</button>
      </div>
    </div>
  );
};

export default AiAssistant;
