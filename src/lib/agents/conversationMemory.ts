/**
 * Conversation Memory - Manages session state and collected data
 */

import type { LoanFormData } from '@/types/loan';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    intent?: string;
    extractedFields?: Partial<LoanFormData>;
    agentType?: string;
  };
}

export class ConversationMemory {
  private messages: ConversationMessage[] = [];
  private collectedData: Partial<LoanFormData> = {};
  private sessionId: string;
  private conversationContext: Map<string, any> = new Map();

  constructor(sessionId?: string) {
    this.sessionId = sessionId || `session_${Date.now()}_${Math.random()}`;
    this.loadFromSessionStorage();
  }

  /**
   * Add message to conversation history
   */
  addMessage(
    role: 'user' | 'assistant',
    content: string,
    metadata?: ConversationMessage['metadata']
  ): void {
    const message: ConversationMessage = {
      role,
      content,
      timestamp: Date.now(),
      metadata,
    };
    this.messages.push(message);
    this.saveToSessionStorage();
  }

  /**
   * Get all messages
   */
  getMessages(): ConversationMessage[] {
    return [...this.messages];
  }

  /**
   * Get recent messages (for context)
   */
  getRecentMessages(count: number = 5): ConversationMessage[] {
    return this.messages.slice(-count);
  }

  /**
   * Update collected loan data
   */
  updateCollectedData(data: Partial<LoanFormData>): void {
    this.collectedData = { ...this.collectedData, ...data };
    this.saveToSessionStorage();
  }

  /**
   * Get collected loan data
   */
  getCollectedData(): Partial<LoanFormData> {
    return { ...this.collectedData };
  }

  /**
   * Get missing required fields for eligibility check
   */
  getMissingEligibilityFields(): (keyof LoanFormData)[] {
    const requiredFields: (keyof LoanFormData)[] = [
      'monthly_income',
      'loan_amount',
      'credit_score',
      'existing_loans',
      'job_type',
    ];
    return requiredFields.filter(field => !this.collectedData[field]);
  }

  /**
   * Check if all required fields are collected
   */
  hasAllRequiredFields(): boolean {
    return this.getMissingEligibilityFields().length === 0;
  }

  /**
   * Set conversation context value
   */
  setContext(key: string, value: any): void {
    this.conversationContext.set(key, value);
    this.saveToSessionStorage();
  }

  /**
   * Get conversation context value
   */
  getContext(key: string): any {
    return this.conversationContext.get(key);
  }

  /**
   * Check if in eligibility workflow
   */
  isInEligibilityFlow(): boolean {
    return this.conversationContext.get('inEligibilityFlow') === true;
  }

  /**
   * Clear conversation (but keep collected data)
   */
  clearConversation(): void {
    this.messages = [];
    this.saveToSessionStorage();
  }

  /**
   * Reset everything
   */
  reset(): void {
    this.messages = [];
    this.collectedData = {};
    this.conversationContext.clear();
    sessionStorage.removeItem(`conversationMemory_${this.sessionId}`);
  }

  /**
   * Save to session storage
   */
  private saveToSessionStorage(): void {
    const data = {
      messages: this.messages,
      collectedData: this.collectedData,
      context: Array.from(this.conversationContext.entries()),
    };
    sessionStorage.setItem(
      `conversationMemory_${this.sessionId}`,
      JSON.stringify(data)
    );
  }

  /**
   * Load from session storage
   */
  private loadFromSessionStorage(): void {
    const stored = sessionStorage.getItem(
      `conversationMemory_${this.sessionId}`
    );
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.messages = data.messages || [];
        this.collectedData = data.collectedData || {};
        this.conversationContext = new Map(data.context || []);
      } catch (e) {
        console.error('Failed to load conversation memory:', e);
      }
    }
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

// Global singleton instance
let conversationMemoryInstance: ConversationMemory | null = null;

export function getConversationMemory(): ConversationMemory {
  if (!conversationMemoryInstance) {
    conversationMemoryInstance = new ConversationMemory();
  }
  return conversationMemoryInstance;
}

export function resetConversationMemory(): void {
  if (conversationMemoryInstance) {
    conversationMemoryInstance.reset();
    conversationMemoryInstance = null;
  }
}
