/**
 * Chat Service - Calls Supabase chat edge function with SSE streaming
 */

import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
  onRagDocs?: (docs: any[]) => void;
}

/**
 * Stream a response from the Supabase chat edge function (LLM + RAG).
 * Falls back to a local error message if the edge function is unreachable.
 */
export async function streamChatResponse(
  messages: ChatMessage[],
  language: 'en' | 'hi' | 'ta',
  callbacks: StreamCallbacks,
  inputMode: 'text' | 'voice' = 'text',
): Promise<void> {
  try {
    const supabaseUrl = (supabase as any).supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = (supabase as any).supabaseKey || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
      },
      body: JSON.stringify({ messages, language, inputMode }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response stream');
    }

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process SSE lines
      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIdx).trim();
        buffer = buffer.slice(newlineIdx + 1);

        if (!line) continue;

        // Handle RAG event
        if (line.startsWith('event: rag')) {
          // Next data line contains RAG docs
          const dataIdx = buffer.indexOf('\n');
          if (dataIdx !== -1) {
            const dataLine = buffer.slice(0, dataIdx).trim();
            buffer = buffer.slice(dataIdx + 1);
            if (dataLine.startsWith('data: ')) {
              try {
                const ragData = JSON.parse(dataLine.slice(6));
                callbacks.onRagDocs?.(ragData.usedDocs || []);
              } catch { /* ignore parse errors */ }
            }
          }
          continue;
        }

        if (line.startsWith('event: error')) {
          const dataIdx = buffer.indexOf('\n');
          if (dataIdx !== -1) {
            const dataLine = buffer.slice(0, dataIdx).trim();
            buffer = buffer.slice(dataIdx + 1);
            if (dataLine.startsWith('data: ')) {
              try {
                const errData = JSON.parse(dataLine.slice(6));
                callbacks.onError(errData.error || 'Stream error');
              } catch { /* ignore */ }
            }
          }
          continue;
        }

        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') continue;

        try {
          const parsed = JSON.parse(payload);
          const token = parsed?.choices?.[0]?.delta?.content || '';
          if (token) {
            fullText += token;
            callbacks.onToken(token);
          }
        } catch { /* ignore parse errors */ }
      }
    }

    // Clean up the generated text
    fullText = cleanLLMOutput(fullText);
    callbacks.onDone(fullText);
  } catch (error: any) {
    console.error('[ChatService] Error:', error);
    callbacks.onError(error.message || 'Failed to get AI response');
  }
}

/**
 * Clean up common LLM artifacts
 */
function cleanLLMOutput(text: string): string {
  // Remove trailing incomplete sentences
  let cleaned = text.trim();
  // Remove any "User:" or "Assistant:" artifacts from continuation
  cleaned = cleaned.replace(/\n(User|Assistant|System):\s*$/gi, '').trim();
  // Remove duplicate newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  return cleaned;
}
