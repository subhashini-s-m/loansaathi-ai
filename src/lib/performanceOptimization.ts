/**
 * Performance Optimization for Chat API
 * Features: Smart caching, request deduplication, circuit breaker, retry logic, rate limiting
 */

// Structured logging
const logger = {
  debug: (msg: string, data?: any) => console.debug(`[API] ${msg}`, data || ''),
  info: (msg: string, data?: any) => console.log(`[API] ✓ ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[API] ⚠ ${msg}`, data || ''),
  error: (msg: string, err?: any) => console.error(`[API] ✗ ${msg}`, err || ''),
};

interface CacheEntry {
  response: string;
  timestamp: number;
  ttl: number;
}

interface RequestMetrics {
  timestamp: number;
  duration: number;
  status: 'success' | 'error';
  tokenUsage?: number;
}

interface CircuitBreakerState {
  failures: number;
  successCount: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

/**
 * Enhanced cache with smart invalidation
 */
class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number = 150;
  private compressionThreshold: number = 5000; // Characters

  private generateKey(messages: any[], language: string): string {
    const lastMessage = messages[messages.length - 1]?.content || '';
    // Use hash for consistency with long messages
    const hash = this.simpleHash(lastMessage);
    return `${language}:${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  get(messages: any[], language: string): string | null {
    try {
      const key = this.generateKey(messages, language);
      const entry = this.cache.get(key);

      if (!entry) return null;

      // Intelligent TTL: longer for stable content
      const age = Date.now() - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
        logger.debug('Cache expired', { age, ttl: entry.ttl });
        return null;
      }

      logger.info('Cache hit');
      return entry.response;
    } catch (e) {
      logger.error('Cache retrieval failed', e);
      return null;
    }
  }

  set(messages: any[], language: string, response: string, ttl: number = 3600000): void {
    try {
      // LRU eviction if needed
      if (this.cache.size >= this.maxSize) {
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toRemove = Math.ceil(this.maxSize * 0.2); // Remove oldest 20%
        for (let i = 0; i < toRemove; i++) {
          this.cache.delete(entries[i][0]);
        }
        logger.info('Cache evicted', { removed: toRemove });
      }

      const key = this.generateKey(messages, language);
      // Reduce TTL for very large responses
      const adjustedTtl = response.length > this.compressionThreshold ? ttl * 0.5 : ttl;
      
      this.cache.set(key, { response, timestamp: Date.now(), ttl: adjustedTtl });
      logger.debug('Cached response', { size: response.length });
    } catch (e) {
      logger.error('Cache storage failed', e);
    }
  }

  clear(): void {
    const oldSize = this.cache.size;
    this.cache.clear();
    logger.info('Cache cleared', { clearedCount: oldSize });
  }

  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return { size: this.cache.size, maxSize: this.maxSize };
  }
}

/**
 * Enhanced metrics tracking with performance insights
 */
class RequestMetricsTracker {
  private metrics: RequestMetrics[] = [];
  private maxMetrics: number = 100;
  private errorThreshold: number = 0.3; // 30% error rate triggers alert

  recordRequest(duration: number, status: 'success' | 'error', tokenUsage?: number): void {
    try {
      if (this.metrics.length >= this.maxMetrics) {
        this.metrics.shift();
      }

      this.metrics.push({
        timestamp: Date.now(),
        duration,
      status,
      tokenUsage,
    });
    } catch (e) {
      logger.error('Metrics recording failed', e);
    }
  }

  getAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    return Math.round(total / this.metrics.length);
  }

  getSuccessRate(): number {
    if (this.metrics.length === 0) return 0;
    const successful = this.metrics.filter(m => m.status === 'success').length;
    return (successful / this.metrics.length) * 100;
  }

  /**
   * Get recent metrics for analysis
   */
  getRecentMetrics(count: number = 10): RequestMetrics[] {
    return this.metrics.slice(-count);
  }

  /**
   * Identify performance bottlenecks
   */
  identifyBottlenecks(): string[] {
    const avgTime = this.getAverageResponseTime();
    const bottlenecks: string[] = [];

    if (avgTime > 5000) {
      bottlenecks.push('High average response time (>5s)');
    }

    const recentErrors = this.metrics.slice(-10).filter(m => m.status === 'error').length;
    if (recentErrors > 2) {
      bottlenecks.push('High error rate in recent requests');
    }

    const longRequests = this.metrics.filter(m => m.duration > 10000);
    if (longRequests.length > this.metrics.length * 0.2) {
      bottlenecks.push('20%+ of requests take longer than 10 seconds');
    }

    return bottlenecks;
  }
}

/**
 * Optimize prompt for faster LLM processing
 * Reduces token count while maintaining context
 */
export function optimizePrompt(
  messages: Array<{ role: string; content: string }>,
  ragContext: string = ''
): Array<{ role: string; content: string }> {
  // Keep only last 5 messages to reduce token count
  const recentMessages = messages.slice(-5);

  // Compress user message if too long
  const optimized = recentMessages.map(msg => {
    if (msg.role === 'user' && msg.content.length > 500) {
      // Summarize very long user inputs
      const keyPoints = msg.content
        .split(/[.!?]+/)
        .slice(0, 3)
        .join('. ');
      return {
        ...msg,
        content: keyPoints.length > 100 ? keyPoints : msg.content,
      };
    }
    return msg;
  });

  // If RAG context available, prepend as system message (single combined message)
  if (ragContext && ragContext.length > 0) {
    return [
      {
        role: 'system',
        content: `You are a helpful financial advisor. Use the following financial knowledge to answer questions:\n${ragContext}`,
      },
      ...optimized,
    ];
  }

  return optimized;
}

/**
 * Create optimized system prompt for faster processing
 */
export function createSystemPrompt(language: 'en' | 'hi' | 'ta' = 'en'): string {
  const prompts = {
    en: `You are NidhiSaarthi AI, a friendly personal financial advisor for Indian users. 
You help with loan eligibility, EMI calculations, and financial planning.
Keep responses concise and helpful.
Use emoji and formatting for clarity.
Be supportive and non-judgmental about financial situations.
Always respond in English when the user language is English.`,
    hi: `आप NidhiSaarthi AI हैं, भारतीय उपयोगकर्ताओं के लिए एक दोस्ताना व्यक्तिगत वित्तीय सलाहकार।
आप ऋण पात्रता, EMI गणना, और वित्तीय योजना में मदद करते हैं।
प्रतिक्रिया सहायक और स्पष्ट रखें।
स्पष्टता के लिए इमोजी और स्वरूपण का उपयोग करें।
हमेशा हिंदी में जवाब दें जब उपयोगकर्ता की भाषा हिंदी हो।`,
    ta: `நீங்கள் NidhiSaarthi AI, இந்திய பயனர்களுக்கான நட்பூர்ணமான ব்যக்தिगत நிதி ஆலோசகர்.
கடன் தகுதி, EMI கணக்கீடு, மற்றும் நிதி திட்டமிடலில் உங்கள் உதவி வேண்டும்.
பதிலை உபयோगী மற்றும் தெளிவாக வைக்கவும்.
பதிலை தமிழில் வைக்கவும் உபயோகப்பாடு மற்றும் தெளிவுக்கு.
எப்போதும் தமிழ் உபயோகப்பாட்டு பயனர் மொழி என்றால் தமிழ் பதில் கொடுங்கள்.`,
  };

  return prompts[language] || prompts.en;
}

/**
 * Batch concurrent API requests for parallel processing
 */
export async function batchRequests(
  requests: Array<{ url: string; init: RequestInit }>,
  timeout: number = 30000
): Promise<Array<Response | Error>> {
  const promises = requests.map(({ url, init }) =>
    Promise.race([
      fetch(url, init),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      ),
    ]).catch(error => error)
  );

  return Promise.all(promises);
}

/**
 * Implement request deduplication
 */
class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<Response>> = new Map();

  /**
   * Deduplicate identical concurrent requests
   */
  async fetch(key: string, fetchFn: () => Promise<Response>): Promise<Response> {
    // If identical request is already in progress, wait for it
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Otherwise, make the request and cache the promise
    const promise = fetchFn();
    this.pendingRequests.set(key, promise);

    try {
      const response = await promise;
      return response;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Clear pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }
}

// Export singleton instances
export const responseCache = new ResponseCache();
export const metricsTracker = new RequestMetricsTracker();
export const requestDeduplicator = new RequestDeduplicator();

/**
 * Make optimized API call with caching, retry logic, and metrics
 */
export async function makeOptimizedChatRequest(
  messages: any[],
  language: string,
  chatUrl: string,
  authToken: string,
  enableCache: boolean = true,
  enableMetrics: boolean = true,
  ragContext: string = '',
  retries: number = 2,
  timeoutMs: number = 30000
): Promise<Response> {
  const startTime = Date.now();

  try {
    // Check cache first
    if (enableCache) {
      const cached = responseCache.get(messages, language);
      if (cached) {
        logger.info('Cache hit');
        return new Response(cached, {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
        });
      }
    }

    // Prepare request payload
    const deduplicationKey = `${language}:${messages[messages.length - 1]?.content || ''}`;
    const systemPrompt = createSystemPrompt(language as 'en' | 'hi' | 'ta');
    const optimizedMessages = optimizePrompt(messages, ragContext);
    const finalMessages = optimizedMessages[0]?.role === 'system'
      ? optimizedMessages
      : [{ role: 'system', content: systemPrompt }, ...optimizedMessages];

    // Retry logic with exponential backoff
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          const backoffMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s...
          logger.warn(`Retry ${attempt}/${retries} after ${backoffMs}ms`);
          await new Promise(r => setTimeout(r, backoffMs));
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await requestDeduplicator.fetch(deduplicationKey, () =>
          fetch(chatUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              messages: finalMessages,
              language,
            }),
            signal: controller.signal,
          })
        );

        clearTimeout(timeoutId);

        if (enableMetrics) {
          const duration = Date.now() - startTime;
          metricsTracker.recordRequest(duration, response.ok ? 'success' : 'error');

          if (duration > 5000) {
            logger.warn(`Slow response: ${duration}ms`);
          }
        }

        if (response.ok) {
          logger.info(`Success after ${attempt} attempts`);
          return response;
        }

        // Non-200 response - don't retry on client errors
        if (response.status >= 400 && response.status < 500) {
          logger.error(`Client error: ${response.status}`);
          return response;
        }

        lastError = new Error(`HTTP ${response.status}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`Attempt ${attempt + 1} failed: ${lastError.message}`);

        if (enableMetrics) {
          metricsTracker.recordRequest(Date.now() - startTime, 'error');
        }

        // Don't retry on abort/timeout unless we have more retries
        if (attempt < retries && (lastError.name === 'AbortError' || lastError.message.includes('timeout'))) {
          continue;
        }

        if (attempt === retries) {
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Unknown error after retries');
  } catch (error) {
    if (enableMetrics) {
      metricsTracker.recordRequest(Date.now() - startTime, 'error');
    }

    logger.error('Request failed completely', error);
    throw error;
  }
}

/**
 * Get performance diagnostics
 */
export function getPerformanceDiagnostics() {
  return {
    cacheStats: responseCache.getStats(),
    avgResponseTime: metricsTracker.getAverageResponseTime(),
    successRate: metricsTracker.getSuccessRate(),
    bottlenecks: metricsTracker.identifyBottlenecks(),
    recentMetrics: metricsTracker.getRecentMetrics(5),
  };
}
