import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Bot, User, Loader2, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type VoiceRecognitionResultEvent = {
  resultIndex?: number;
  results: ArrayLike<{
    isFinal: boolean;
    0?: {
      transcript?: string;
    };
  }>;
};

type VoiceRecognitionErrorEvent = {
  error?: string;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const ChatWidget = () => {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: t('chat_welcome') },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const finalVoiceTranscriptRef = useRef('');
  const shouldSubmitVoiceRef = useRef(false);
  const hasVoiceSentRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';
    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          language,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant' && prev.length > 1 && prev[prev.length - 2]?.role === 'user') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      console.error('Chat error:', e);
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, language, isLoading]);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      shouldSubmitVoiceRef.current = false;
      finalVoiceTranscriptRef.current = '';
      hasVoiceSentRef.current = false;
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : 'en-IN';

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    finalVoiceTranscriptRef.current = '';
    shouldSubmitVoiceRef.current = true;
    hasVoiceSentRef.current = false;

    recognition.onresult = (e: VoiceRecognitionResultEvent) => {
      let interimTranscript = '';
      const startIndex = typeof e.resultIndex === 'number' ? e.resultIndex : 0;

      for (let i = startIndex; i < e.results.length; i++) {
        const transcript = e.results[i]?.[0]?.transcript || '';
        if (e.results[i]?.isFinal) {
          finalVoiceTranscriptRef.current += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const preview = `${finalVoiceTranscriptRef.current} ${interimTranscript}`.trim();
      if (preview) {
        setInput(preview);
      }
    };

    recognition.onend = () => {
      setIsListening(false);

      const finalText = finalVoiceTranscriptRef.current.trim();
      if (shouldSubmitVoiceRef.current && finalText && !hasVoiceSentRef.current) {
        hasVoiceSentRef.current = true;
        setInput(finalText);
        sendMessage(finalText);
      }

      shouldSubmitVoiceRef.current = false;
      finalVoiceTranscriptRef.current = '';
      recognitionRef.current = null;
    };

    recognition.onerror = (e: VoiceRecognitionErrorEvent) => {
      setIsListening(false);
      shouldSubmitVoiceRef.current = false;
      finalVoiceTranscriptRef.current = '';
      recognitionRef.current = null;

      if (e?.error !== 'aborted' && e?.error !== 'no-speech') {
        console.error('Speech recognition error:', e?.error);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [isListening, language, sendMessage]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 z-50 w-[360px] max-h-[500px] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-primary/5">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-saffron" />
                <span className="font-semibold text-sm text-foreground">{t('chat_title')}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-3" style={{ height: '340px' }}>
              <div className="space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-saffron/10">
                        <Bot className="h-3 w-3 text-saffron" />
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                      msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-xs dark:prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-saffron/10">
                      <Bot className="h-3 w-3 text-saffron" />
                    </div>
                    <div className="bg-secondary rounded-lg px-3 py-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="border-t border-border p-2 flex gap-1.5">
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={toggleVoice}>
                {isListening ? <MicOff className="h-3.5 w-3.5 text-risk-high" /> : <Mic className="h-3.5 w-3.5" />}
              </Button>
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                placeholder={t('chat_placeholder')}
                className="h-8 text-xs"
              />
              <Button variant="saffron" size="icon" className="h-8 w-8 shrink-0" onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-saffron text-white shadow-lg hover:bg-saffron/90 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </motion.button>
    </>
  );
};

export default ChatWidget;
