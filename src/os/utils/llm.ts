export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Send a chat-style completion request to OpenRouter.
 * Requires VITE_OPENROUTER_API_KEY in .env
 */
export async function chatCompletion(messages: ChatMessage[], model = import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.0-flash-thinking-exp-1219:free'): Promise<string> {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!key) throw new Error('OpenRouter API key not configured.');
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model, messages }),
  });
  const data = await res.json();
  const msg = data.choices?.[0]?.message?.content;
  if (!msg) throw new Error('No response from OpenRouter');
  return msg;
}
