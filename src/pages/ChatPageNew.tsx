import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Mic, MicOff, Loader2, CheckCircle, TrendingUp, Calculator, FileText, Volume2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';
import ReactMarkdown from 'react-markdown';
import { getChatbotOrchestrator } from '@/lib/agents/orchestrator';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  metadata?: any;
  streaming?: boolean;
}

const defaultOptions = [
  { icon: CheckCircle, label: 'Check Loan Approval', path: '/eligibility', color: 'text-green-600' },
  { icon: Zap, label: 'Instant Eligibility Check (AI)', action: 'eligibility', color: 'text-saffron' },
  { icon: TrendingUp, label: 'Improve Credit Score', action: 'credit', color: 'text-blue-600' },
  { icon: Calculator, label: 'Calculate EMI', action: 'emi', color: 'text-purple-600' },
];

const ChatPageNew = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const orchestrator = getChatbotOrchestrator();

  const getWelcomeMessage = () => {
    if (language === 'hi') {
      return `👋 नमस्ते! मैं **NidhiSaarthi AI** हूँ, आपका व्यक्तिगत वित्तीय सलाहकार।\n\nमैं आपकी मदद कर सकता हूँ:\n✅ ऋण पात्रता और स्वीकृति संभावना\n💰 EMI गणना और योजना\n📈 क्रेडिट स्कोर में सुधार की रणनीति\n🏦 बैंक का चयन और तुलना\n📋 आवश्यक दस्तावेज़\n💡 वित्तीय योजना सलाह\n\nमैं आपकी कैसे मदद कर सकता हूँ?`;
    }
    return `👋 Namaste! I'm **NidhiSaarthi AI**, your personal financial advisor powered by AI.\n\nI can help you with:\n✅ Loan eligibility & approval chances\n💰 EMI calculations & planning\n📈 Credit score improvement strategies\n🏦 Bank selection & comparison\n📋 Document requirements\n💡 Financial planning advice\n\nHow can I assist you today?`;
  };

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: getWelcomeMessage() },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showOptions, setShowOptions] = useState(true);
  const [eligibilityComplete, setEligibilityComplete] = useState(false);
  const [eligibilityReport, setEligibilityReport] = useState<any>(null);
  const [collectedFields, setCollectedFields] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    });
  }, []);

  // Update welcome message when language changes
  useEffect(() => {
    setMessages([{ role: 'assistant', content: getWelcomeMessage() }]);
    setShowOptions(true);
    setEligibilityComplete(false);
  }, [language]);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // ──────────────────────────────────────────────
  //  SEND MESSAGE  (supports LLM streaming)
  // ──────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const trimmedText = text.trim();
    setShowOptions(false);
    setMessages(prev => [...prev, { role: 'user', content: trimmedText }]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await orchestrator.processMessage(
        trimmedText,
        language as any,
        // onToken — called for each streamed chunk from LLM
        (token: string) => {
          setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === 'assistant' && updated[lastIdx].streaming) {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: updated[lastIdx].content + token,
              };
            } else {
              // First token — create assistant placeholder
              updated.push({ role: 'assistant', content: token, streaming: true });
            }
            return updated;
          });
          scrollToBottom();
        },
        // onDone — called when LLM stream finishes
        (fullText: string, metadata?: any) => {
          setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: fullText,
                streaming: false,
                metadata,
              };
            }
            return updated;
          });
          setIsLoading(false);
          scrollToBottom();
        },
      );

      // If the result was NOT streamed (local response), display it with typewriter
      if (!result.isStreaming) {
        await streamLocalResponse(result.response, result.metadata);
      }

      // Handle eligibility completion
      if (result.metadata?.isEligibilityComplete && result.metadata?.eligibilityReport) {
        setEligibilityReport(result.metadata.eligibilityReport);
        setCollectedFields(result.metadata.collectedFields);
        setEligibilityComplete(true);
        sessionStorage.setItem('analysisResult', JSON.stringify(result.metadata.eligibilityReport));
        sessionStorage.setItem('formData', JSON.stringify(result.metadata.collectedFields));
      }

      // For non-streaming results, turn off loading
      if (!result.isStreaming) {
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
      }]);
      setIsLoading(false);
    }
  }, [language, isLoading, orchestrator, scrollToBottom]);

  // Typewriter effect for local (non-LLM) responses
  const streamLocalResponse = useCallback(async (text: string, metadata?: any) => {
    const chunkSize = Math.max(6, Math.floor(text.length / 48));
    let cursor = 0;

    setMessages(prev => [...prev, { role: 'assistant', content: '', metadata, streaming: true }]);

    while (cursor < text.length) {
      const next = text.slice(0, cursor + chunkSize);
      setMessages(prev => {
        const updated = [...prev];
        const idx = updated.length - 1;
        if (idx >= 0 && updated[idx].role === 'assistant') {
          updated[idx] = { ...updated[idx], content: next, streaming: true };
        }
        return updated;
      });
      cursor += chunkSize;
      await new Promise(r => setTimeout(r, 16));
    }

    setMessages(prev => {
      const updated = [...prev];
      const idx = updated.length - 1;
      if (idx >= 0 && updated[idx].role === 'assistant') {
        updated[idx] = { ...updated[idx], content: text, streaming: false };
      }
      return updated;
    });
  }, []);

  // ──────────────────────────────────────────────
  //  OPTION / ACTION HANDLERS
  // ──────────────────────────────────────────────

  const handleOptionClick = (option: any) => {
    if (option.path) { navigate(option.path); return; }
    if (option.action === 'eligibility') { sendMessage('Start instant loan eligibility check'); return; }
    if (option.action === 'credit') { sendMessage('How can I improve my credit score?'); return; }
    if (option.action === 'emi') { sendMessage('Help me calculate EMI for a personal loan'); return; }
    if (option.prompt) { sendMessage(option.prompt); }
  };

  const handleGetDetailedReport = () => {
    if (eligibilityReport && collectedFields) {
      sessionStorage.setItem('analysisResult', JSON.stringify(eligibilityReport));
      sessionStorage.setItem('formData', JSON.stringify(collectedFields));
      navigate('/results');
    }
  };

  const handleContinueChat = () => {
    setEligibilityComplete(false);
    setInput('');
    setShowOptions(false);
  };

  const handleInlineAction = useCallback((action: string) => {
    if (action === 'detailed_report') { handleGetDetailedReport(); return; }
    if (action === 'continue_chat') { handleContinueChat(); return; }
    sendMessage(action.replace(/_/g, ' '));
  }, [sendMessage]);

  // ──────────────────────────────────────────────
  //  VOICE INPUT  (single utterance, clean send)
  // ──────────────────────────────────────────────

  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in your browser');
      return;
    }
    const recognition = new SpeechRecognition();
    const voiceLangMap: Record<string, string> = { en: 'en-US', hi: 'hi-IN', ta: 'ta-IN' };
    recognition.lang = voiceLangMap[language] || 'en-US';
    recognition.continuous = false;    // Single utterance - stops after natural pause
    recognition.interimResults = true; // Show live preview while speaking
    recognition.maxAlternatives = 1;

    let finalTranscript = '';
    let didSend = false;

    recognition.onresult = (e: any) => {
      let interim = '';
      finalTranscript = '';
      for (let i = 0; i < e.results.length; i++) {
        const transcript = e.results[i][0]?.transcript || '';
        if (e.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }
      const preview = (finalTranscript + ' ' + interim).trim();
      if (preview) setInput(preview);
    };

    recognition.onend = () => {
      setIsListening(false);
      const text = finalTranscript.trim();
      if (text && !didSend) {
        didSend = true;
        setInput(text);
        sendMessage(text);
      }
    };

    recognition.onerror = (e: any) => {
      setIsListening(false);
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.error('Speech recognition error:', e.error);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [isListening, language, sendMessage]);

  // ──────────────────────────────────────────────
  //  TEXT-TO-SPEECH
  // ──────────────────────────────────────────────

  const speakResponse = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_\[\]]/g, ''));
      const ttsLangMap: Record<string, string> = { en: 'en-US', hi: 'hi-IN', ta: 'ta-IN' };
      utterance.lang = ttsLangMap[language] || 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, [language]);

  // ──────────────────────────────────────────────
  //  RENDER
  // ──────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container py-4 flex flex-col max-w-3xl">
        {/* Title bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-saffron/10">
            <Bot className="h-5 w-5 text-saffron" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('chat_title')}</h1>
            <p className="text-xs text-muted-foreground">{t('chat_subtitle')}</p>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollContainerRef}
          className="flex-1 rounded-xl border border-border bg-card p-4 mb-4 overflow-y-auto"
          style={{ height: 'calc(100vh - 280px)' }}
        >
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-saffron/10">
                    <Bot className="h-4 w-4 text-saffron" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                    {msg.role === 'assistant' && !msg.streaming && (
                      <button
                        onClick={() => speakResponse(msg.content)}
                        className="shrink-0 p-1 hover:bg-primary/10 rounded transition-colors"
                        title="Speak response"
                      >
                        <Volume2 className="h-4 w-4 text-saffron" />
                      </button>
                    )}
                  </div>
                  {/* Action buttons from metadata */}
                  {msg.role === 'assistant' && Array.isArray(msg.metadata?.actions) && msg.metadata.actions.length > 0 && !msg.streaming && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.metadata.actions.map((action: { label: string; action: string }) => (
                        <Button
                          key={action.action}
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => handleInlineAction(action.action)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </motion.div>
            ))}

            {/* Loading indicator */}
            {isLoading && !messages.some(m => m.streaming) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-saffron/10">
                  <Loader2 className="h-4 w-4 text-saffron animate-spin" />
                </div>
                <div className="bg-secondary text-foreground rounded-xl px-4 py-3">
                  <p className="text-sm">Thinking...</p>
                </div>
              </motion.div>
            )}

            {/* Quick actions */}
            {showOptions && messages.length === 1 && (
              <div className="grid gap-2 mt-6">
                <p className="text-xs text-muted-foreground font-medium">Quick actions:</p>
                <div className="grid grid-cols-2 gap-2">
                  {defaultOptions.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => handleOptionClick(option)}
                      className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 hover:bg-secondary transition-colors text-left text-sm"
                    >
                      <option.icon className={`h-4 w-4 ${option.color}`} />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Eligibility complete actions */}
            {eligibilityComplete && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 mt-6 pt-4 border-t border-border"
              >
                <Button
                  onClick={handleGetDetailedReport}
                  className="flex-1 bg-saffron hover:bg-saffron/90 text-saffron-foreground font-semibold"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Get Detailed Report
                </Button>
                <Button onClick={handleContinueChat} variant="outline" className="flex-1">
                  Continue in Chat
                </Button>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="flex gap-2">
          <button
            onClick={toggleVoice}
            className={`p-2.5 rounded-lg transition-colors ${
              isListening
                ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                : 'bg-secondary hover:bg-secondary/80'
            }`}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder={isListening ? 'Listening...' : (t('chat_placeholder') || 'Type your question...')}
            className="flex-1"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-lg bg-saffron text-saffron-foreground hover:shadow-lg transition-all disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ChatPageNew;
