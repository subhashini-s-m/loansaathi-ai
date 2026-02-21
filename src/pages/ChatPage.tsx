import { useState, useRef, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Mic, MicOff, Loader2, Volume2, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import ResilienceDashboard from '@/components/resilience/ResilienceDashboard';
import type { FinancialProfile } from '@/lib/resilienceEngine';
import { getChatbotOrchestrator } from '@/lib/agents/orchestrator';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  showResilienceDashboard?: boolean;
};

type RagDoc = {
  id: string;
  title: string;
  category: string;
};

type InputMode = 'text' | 'voice';

type EligibilityChatContext = {
  approval_probability?: number;
  risk_category?: string;
  monthly_income?: number;
  loan_amount?: number;
  credit_score?: number;
};

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

const QUICK_PROMPTS = [
  'Start instant loan eligibility check',
  'Check my financial resilience & stress test',
  'How can I improve my CIBIL score in 90 days?',
  'Help me compare personal loan vs home loan for monthly affordability',
  'What documents should I keep ready before applying for a loan?',
];

const getWelcomeMessage = (language: string) => {
  if (language === 'hi') {
    return '👋 नमस्ते! मैं **NidhiSaarthi AI** हूँ, आपका grounded वित्तीय सहायक।\n\nआप मुझसे पूछ सकते हैं:\n- ऋण पात्रता\n- EMI योजना\n- क्रेडिट स्कोर सुधार\n- दस्तावेज़ तैयारी\n\nअपनी स्थिति बताइए, मैं चरणबद्ध सलाह दूँगा।';
  }

  if (language === 'ta') {
    return '👋 வணக்கம்! நான் **NidhiSaarthi AI**, உங்கள் grounded நிதி உதவியாளர்.\n\nநீங்கள் கேட்கலாம்:\n- கடன் தகுதி\n- EMI திட்டமிடல்\n- கிரெடிட் ஸ்கோர் மேம்பாடு\n- ஆவண தயார்ப்பு\n\nஉங்கள் விவரங்களை கூறுங்கள்; படிப்படியாக உதவுகிறேன்.';
  }

  return "👋 Welcome! I'm **NidhiSaarthi AI**, your grounded financial assistant.\n\nI can help with:\n- Loan eligibility strategy\n- EMI planning\n- Credit score improvement\n- Document readiness\n\nShare your details and I’ll give practical next steps.";
};

const createMessage = (role: 'user' | 'assistant', content: string): Message => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
});

const normalizeApprovalPercent = (value?: number): number => {
  if (!Number.isFinite(value)) return 0;
  const safeValue = Number(value);
  const percent = safeValue <= 1 ? safeValue * 100 : safeValue;
  return Math.max(0, Math.min(100, Math.round(percent)));
};

const ChatPage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    createMessage('assistant', getWelcomeMessage(language)),
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ragDocs, setRagDocs] = useState<RagDoc[]>([]);
  const [statusText, setStatusText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const finalVoiceTranscriptRef = useRef('');
  const shouldSubmitVoiceRef = useRef(false);
  const hasVoiceSentRef = useRef(false);
  const didInjectEligibilityRef = useRef(false);

  // Detect if user is asking about financial resilience
  const isResilienceQuery = (text: string): boolean => {
    const patterns = [
      /resilience|resilient|stress test|financial emergency|survive|can i afford|safety net|cushion|backup|what if/i,
      /how long can i survive|financial emergency|worst case|disaster|crisis management/i,
      /check my resilience|resilience score|financial health check|stress test/i,
    ];
    return patterns.some((pattern) => pattern.test(text));
  };

  // Build financial profile from collected data
  const buildFinancialProfile = (): FinancialProfile | null => {
    const profileStr = sessionStorage.getItem('eligibility_chat_data');
    if (!profileStr) return null;

    try {
      const data = JSON.parse(profileStr);
      return {
        monthly_income: data.monthly_income || 50000,
        monthly_expenses: Math.round((data.monthly_income || 50000) * 0.6), // estimate
        savings_liquid: Math.round((data.monthly_income || 50000) * 3), // 3 months
        investments: Math.round((data.monthly_income || 50000) * 6), // 6 months savings invested
        property_value: 2500000, // default estimate
        debt_monthly: (data.loan_amount || 500000) / 60, // estimate 5-year loan
        credit_score: data.credit_score || 700,
        existing_loans: 1,
        job_stability: (data.credit_score || 700) >= 750 ? 'High' : 'Medium',
        age: 30,
        dependents: 1,
        has_insurance: false,
        investment_diversification: 40,
      } as FinancialProfile;
    } catch {
      return null;
    }
  };

  // Parse eligibility data from simple report and navigate
  const extractEligibilityDataAndNavigate = (reportContent: string) => {
    try {
      // Extract values using regex patterns from the simple report format
      const approvalMatch = reportContent.match(/Approval Chances:\s*(\d+)%/);
      const riskMatch = reportContent.match(/Risk Level:\s*(\w+)/);
      const emiMatch = reportContent.match(/Est\.\s*Monthly EMI:\s*₹([\d,]+)/);
      const incomeMatch = reportContent.match(/Income:\s*₹([\d,]+)/);
      const loanMatch = reportContent.match(/Loan:\s*₹([\d,]+)/);
      const scoreMatch = reportContent.match(/Score:\s*(\d+|N\/A)/);
      const typeMatch = reportContent.match(/Type:\s*(\w+(?:-?\w+)?)/);

      const eligibilityData = {
        approval_probability: approvalMatch ? parseInt(approvalMatch[1]) / 100 : 0,
        risk_category: riskMatch ? riskMatch[1] : 'N/A',
        monthly_income: incomeMatch ? parseInt(incomeMatch[1].replace(/,/g, '')) : 0,
        loan_amount: loanMatch ? parseInt(loanMatch[1].replace(/,/g, '')) : 0,
        credit_score: scoreMatch && scoreMatch[1] !== 'N/A' ? parseInt(scoreMatch[1]) : null,
        job_type: typeMatch ? typeMatch[1] : 'N/A',
      };

      // Store in sessionStorage for the Check Eligibility page
      sessionStorage.setItem('eligibility_chat_data', JSON.stringify(eligibilityData));
      
      // Navigate to the Check Eligibility page
      navigate('/eligibility');
    } catch (error) {
      console.error('Error parsing eligibility data:', error);
    }
  };

  useEffect(() => {
    setMessages([createMessage('assistant', getWelcomeMessage(language))]);
    setRagDocs([]);
    setStatusText('');
  }, [language]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (didInjectEligibilityRef.current) {
      return;
    }

    const rawContext = sessionStorage.getItem('eligibility_chat_context');
    if (!rawContext) {
      return;
    }

    try {
      const context = JSON.parse(rawContext) as EligibilityChatContext;
      const approval = normalizeApprovalPercent(context.approval_probability);
      const risk = context.risk_category || 'N/A';

      const assistantNote = language === 'hi'
        ? `📌 आपकी हाल की eligibility analysis मिली:\n- Approval Probability: **${approval}%**\n- Risk Band: **${risk}**\n\nमैं अब इसी प्रोफाइल के आधार पर आपको बेहतर loan strategy दूँगा।`
        : language === 'ta'
          ? `📌 உங்கள் சமீபத்திய eligibility analysis கிடைத்தது:\n- Approval Probability: **${approval}%**\n- Risk Band: **${risk}**\n\nஇந்த profile அடிப்படையில் உங்களுக்கு சிறந்த loan strategy சொல்கிறேன்.`
          : `📌 I found your recent eligibility analysis:\n- Approval Probability: **${approval}%**\n- Risk Band: **${risk}**\n\nI can now guide your next loan steps based on this profile.`;

      const prefilledPrompt = language === 'hi'
        ? 'मेरी eligibility improve करने के लिए अगले 90 दिनों का practical plan दें।'
        : language === 'ta'
          ? 'என் eligibility மேம்படுத்த அடுத்த 90 நாட்களுக்கு practical plan கொடுங்கள்.'
          : 'Give me a practical 90-day plan to improve my eligibility based on this profile.';

      setMessages((prev) => {
        if (prev.some((msg) => msg.role === 'assistant' && msg.content.includes('eligibility analysis'))) {
          return prev;
        }
        return [...prev, createMessage('assistant', assistantNote)];
      });
      setInput(prefilledPrompt);
      didInjectEligibilityRef.current = true;
    } catch {
      // ignore malformed storage
    }
  }, [language]);

  const updateAssistantMessage = useCallback((content: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      
      // Check if this is resilience completion
      const isResilienceComplete = /✅.*(financial|resilience|analysis|complete)/i.test(content) && 
                                   /calculate|calculate|showing|display/i.test(content);
      
      if (!last || last.role !== 'assistant') {
        const msg = createMessage('assistant', content);
        if (isResilienceComplete) {
          msg.showResilienceDashboard = true;
        }
        return [...prev, msg];
      }

      const next = [...prev];
      next[next.length - 1] = { ...last, content };
      if (isResilienceComplete) {
        next[next.length - 1].showResilienceDashboard = true;
      }
      return next;
    });
  }, []);

  const sendMessage = useCallback(
    async (rawText: string, inputMode: InputMode = 'text') => {
      const text = rawText.trim();
      if (!text || isLoading) {
        return;
      }

      const userMessage = createMessage('user', text);
      setMessages((prev) => [...prev, userMessage]);
      setInput('');

      setIsLoading(true);
      setStatusText(inputMode === 'voice' ? '🎤 Listening & processing...' : '✨ Thinking...');
      setRagDocs([]);

      try {
        const orchestrator = getChatbotOrchestrator();
        
        let accumulatedText = '';
        
        // Use orchestrator for all message processing (eligibility flow + LLM)
        const result = await orchestrator.processMessage(
          rawText,
          language as any,
          // onToken - for streaming LLM responses
          (token: string) => {
            accumulatedText += token;
            updateAssistantMessage(accumulatedText);
          },
          // onDone - when LLM stream completes
          (fullText: string, metadata?: any) => {
            updateAssistantMessage(fullText);
            if (metadata?.isEligibilityComplete) {
              // Store eligibility results for navigation
              sessionStorage.setItem('analysisResult', JSON.stringify(metadata.eligibilityReport));
              sessionStorage.setItem('formData', JSON.stringify(metadata.collectedFields));
            }
          },
        );

        // For non-streaming (local eligibility) responses, display immediately
        if (!result.isStreaming) {
          updateAssistantMessage(result.response);
        }

        setStatusText('✓ Ready');
      } catch (error: any) {
        const errorMsg = error?.message || 'Something went wrong on my end';
        updateAssistantMessage(`${errorMsg}\n\n💡 *Tip: Try asking about a specific loan type, sharing your income, or asking about credit scores.*`);
        setStatusText('⚠️ Error (recovering...)');
      } finally {
        setIsLoading(false);
        setTimeout(() => setStatusText(''), 2000);
      }
    },
    [isLoading, language, updateAssistantMessage],
  );

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
    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    finalVoiceTranscriptRef.current = '';
    shouldSubmitVoiceRef.current = true;
    hasVoiceSentRef.current = false;

    recognition.onresult = (event: VoiceRecognitionResultEvent) => {
      let interimTranscript = '';
      const startIndex = typeof event.resultIndex === 'number' ? event.resultIndex : 0;

      for (let i = startIndex; i < event.results.length; i++) {
        const transcript = event.results[i]?.[0]?.transcript || '';
        if (event.results[i]?.isFinal) {
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
        sendMessage(finalText, 'voice');
      }

      shouldSubmitVoiceRef.current = false;
      finalVoiceTranscriptRef.current = '';
      recognitionRef.current = null;
    };

    recognition.onerror = (event: VoiceRecognitionErrorEvent) => {
      setIsListening(false);
      shouldSubmitVoiceRef.current = false;
      finalVoiceTranscriptRef.current = '';
      recognitionRef.current = null;

      if (event?.error !== 'aborted' && event?.error !== 'no-speech') {
        console.error('Speech recognition error:', event?.error);
      }
    };

    recognition.start();

    recognitionRef.current = recognition;
    setIsListening(true);
  }, [isListening, language, sendMessage]);

  const startEligibilityFromChat = useCallback(() => {
    sendMessage('I want to check my loan eligibility now. Start step-by-step assessment.', 'text');
  }, [sendMessage]);

  const speakMessage = useCallback(
    (text: string) => {
      if (!('speechSynthesis' in window)) {
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : 'en-IN';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    },
    [language],
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container py-4 flex flex-col max-w-3xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-saffron/10">
              <Bot className="h-5 w-5 text-saffron" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{t('chat_title')}</h1>
              <p className="text-xs text-muted-foreground">{t('chat_subtitle')}</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">{statusText}</div>
        </div>

        <ScrollArea className="flex-1 rounded-xl border border-border bg-card p-4 mb-4" style={{ height: 'calc(100vh - 280px)' }}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-saffron/10">
                    <Bot className="h-4 w-4 text-saffron" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-xl px-4 py-3 text-sm ${
                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {msg.role === 'assistant' ? (
                        <>
                          {msg.showResilienceDashboard ? (
                            <>
                              <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                              {buildFinancialProfile() && (
                                <div className="mt-4 max-w-2xl">
                                  <ResilienceDashboard financialProfile={buildFinancialProfile()!} />
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>
                                  {msg.content.replace(/\*\*\[GET_DETAILED_REPORT\]\*\*.*?\*\*\[CLICK_FOR_DETAILS\]\*\*/g, '')}
                                </ReactMarkdown>
                              </div>
                              {msg.content.includes('[GET_DETAILED_REPORT]') && (
                                <Button
                                  onClick={() => extractEligibilityDataAndNavigate(msg.content)}
                                  className="mt-3 bg-saffron hover:bg-saffron/90 text-white flex items-center gap-2"
                                >
                                  Get Detailed Report
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </>
                      ) : (
                        msg.content
                      )}
                    </div>

                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => speakMessage(msg.content)}
                        className="shrink-0 p-1 hover:bg-primary/10 rounded transition-colors"
                        title="Speak response"
                      >
                        <Volume2 className="h-4 w-4 text-saffron" />
                      </button>
                    )}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
              </motion.div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-saffron/10">
                  <Bot className="h-4 w-4 text-saffron" />
                </div>
                <div className="bg-secondary rounded-xl px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            {messages.length === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className={`text-left px-3 py-2 text-xs rounded-md border transition-colors ${
                      prompt === 'Start instant loan eligibility check'
                        ? 'border-saffron/50 bg-saffron/5 hover:bg-saffron/10 font-medium text-saffron'
                        : 'border-border bg-card hover:bg-accent'
                    }`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {messages.length > 1 &&
              messages[messages.length - 1]?.role === 'assistant' &&
              /loan|borrow|emi|eligib|credit|approval/i.test(messages[messages.length - 1]?.content || '') && (
                <div className="rounded-lg border border-amber-200/30 bg-amber-50/20 p-3 mt-4">
                  <div className="text-xs font-medium text-amber-900 mb-2">💡 Quick Assessment</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => sendMessage('I have ₹50000 monthly income and credit score 700. What are my chances?', 'text')}
                      className="text-left px-2 py-1.5 text-xs rounded border border-amber-200/50 bg-white hover:bg-amber-50/50 transition-colors"
                    >
                      📊 Share profile for assessment
                    </button>
                    <button
                      onClick={() => sendMessage('Start instant loan eligibility check', 'text')}
                      className="text-left px-2 py-1.5 text-xs rounded border border-amber-200/50 bg-white hover:bg-amber-50/50 transition-colors"
                    >
                      ✅ Begin full eligibility check
                    </button>
                  </div>
                </div>
              )}

            {ragDocs.length > 0 && (
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Retrieved knowledge
                </div>
                <div className="flex flex-wrap gap-2">
                  {ragDocs.map((doc) => (
                    <span key={doc.id} className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
                      {doc.title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="mb-2 flex items-center justify-start">
          <Button variant="outline" size="sm" onClick={startEligibilityFromChat} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Check Eligibility in Chat
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleVoice}
            className={isListening ? 'bg-risk-high/10 border-risk-high/20 text-risk-high' : ''}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && sendMessage(input)}
            placeholder={t('chat_placeholder')}
            className="flex-1"
          />

          <Button variant="saffron" size="icon" onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ChatPage;
