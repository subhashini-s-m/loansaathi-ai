/**
 * Intent Agent - Classifies user intent and extracts entities
 */

type UserIntent = 
  | 'eligibility_check'
  | 'finance_qa'
  | 'emi_calculation'
  | 'credit_score_advice'
  | 'document_requirements'
  | 'bank_comparison'
  | 'financial_planning'
  | 'general_chat';

interface IntentResult {
  intent: UserIntent;
  confidence: number; // 0-1
  entities: Map<string, any>;
  reasoning: string;
}

export class IntentAgent {
  private keywords: Record<UserIntent, string[]> = {
    eligibility_check: [
      'eligible',
      'eligible',
      'qualify',
      'approval',
      'chances',
      'likelihood',
      'can i get',
      'will i get',
      'am i eligible',
      'need a loan',
      'want a loan',
      'apply for',
      'get a loan',
      'can i borrow',
      'loan approval',
      'can i qualify',
      'am i qualified',
    ],
    emi_calculation: [
      'emi',
      'monthly payment',
      'installment',
      'calculate',
      'how much',
      'monthly amount',
      'monthly cost',
      'payment schedule',
    ],
    credit_score_advice: [
      'credit score',
      'credit',
      'cibil',
      'improve',
      'increase',
      'bad credit',
      'low score',
      'credit rating',
    ],
    document_requirements: [
      'document',
      'papers',
      'required',
      'need',
      'proof',
      'verification',
      'what documents',
      'what papers',
      'documentation',
    ],
    bank_comparison: [
      'bank',
      'compare',
      'which bank',
      'best bank',
      'rate',
      'interest',
      'where to apply',
    ],
    financial_planning: [
      'budget',
      'plan',
      'save',
      'investment',
      'financial',
      'goal',
      'wealth',
      'saving',
    ],
    finance_qa: [
      'finance',
      'money',
      'loan',
      'interest',
      'rate',
      'how',
      'what',
      'why',
      'explain',
    ],
    general_chat: ['hello', 'hi', 'hey', 'thanks', 'help'],
  };

  /**
   * Classify user intent from message
   */
  classifyIntent(userMessage: string): IntentResult {
    const message = userMessage.toLowerCase().trim();

    if (['exit', 'stop', 'cancel', 'reset', 'restart', 'start over'].includes(message)) {
      return {
        intent: 'general_chat',
        confidence: 0.98,
        entities: new Map(),
        reasoning: 'Conversation control command',
      };
    }

    const hasLoanAmount = this.containsLoanAmountPhrase(message);

    // 1. Check for SPECIFIC intents first (most important)
    
    // EMI calculation - HIGHEST PRIORITY when combined with amount
    if ((message.includes('emi') || message.includes('monthly') || message.includes('installment')) && 
        (this.containsFinancialNumbers(message) || message.includes('how much'))) {
      return {
        intent: 'emi_calculation',
        confidence: 0.95,
        entities: this.extractFinancialEntities(message),
        reasoning: 'Explicit EMI calculation request with amount',
      };
    }

    // Credit score - if explicitly mentioned
    if (message.includes('credit') || message.includes('cibil')) {
      return {
        intent: 'credit_score_advice',
        confidence: 0.9,
        entities: new Map(),
        reasoning: 'Credit score related query',
      };
    }

    // Document requirements - if explicitly asked
    if ((message.includes('document') || message.includes('papers') || message.includes('proof')) &&
        (message.includes('what') || message.includes('need') || message.includes('required'))) {
      return {
        intent: 'document_requirements',
        confidence: 0.9,
        entities: new Map(),
        reasoning: 'Document requirements query',
      };
    }

    // Bank comparison - if explicitly asked
    if ((message.includes('bank') || message.includes('compare')) &&
        (message.includes('which') || message.includes('best') || message.includes('compare'))) {
      return {
        intent: 'bank_comparison',
        confidence: 0.9,
        entities: new Map(),
        reasoning: 'Bank comparison request',
      };
    }

    // Financial planning - if explicitly asked
    if (message.includes('budget') || message.includes('financial plan') || message.includes('save')) {
      return {
        intent: 'financial_planning',
        confidence: 0.85,
        entities: new Map(),
        reasoning: 'Financial planning request',
      };
    }

    // 2. Check for ELIGIBILITY ONLY when explicitly asked
    if (message.includes('eligible') || message.includes('qualify') || message.includes('can i get') || 
        message.includes('will i get') || message.includes('am i eligible') || message.includes('check eligibility') ||
        message.includes('eligibility')) {
      return {
        intent: 'eligibility_check',
        confidence: 0.9,
        entities: this.extractFinancialEntities(message),
        reasoning: 'Explicit eligibility check request',
      };
    }

    // 3. If user says they NEED/WANT a loan WITH an amount - treat as INFO/EMI request, not forced eligibility
    if (((message.includes('need') || message.includes('want') || message.includes('looking for')) &&
        message.includes('loan') &&
        this.containsFinancialNumbers(message)) || hasLoanAmount) {
      return {
        intent: 'finance_qa',
        confidence: 0.9,
        entities: this.extractFinancialEntities(message),
        reasoning: 'Loan inquiry with amount - treating as general finance Q&A',
      };
    }

    // 4. General keyword matching for other specific intents
    for (const [intent, keywords] of Object.entries(this.keywords)) {
      if (intent === 'eligibility_check') continue; // Already handled above
      
      for (const keyword of keywords) {
        if (message.includes(keyword)) {
          return {
            intent: intent as UserIntent,
            confidence: 0.8,
            entities: new Map(),
            reasoning: `Matched keyword: "${keyword}"`,
          };
        }
      }
    }

    // 5. Default to finance_qa for any other question
    return {
      intent: 'finance_qa',
      confidence: 0.5,
      entities: new Map(),
      reasoning: 'Default to general finance Q&A',
    };
  }

  /**
   * Extract financial entities from message
   */
  private extractFinancialEntities(message: string): Map<string, any> {
    const entities = new Map();

    // Extract numbers (potential income, loan amount, etc.)
    const numberMatches = message.match(/\d+(?:,\d{3})*(?:\.\d+)?/g) || [];
    if (numberMatches.length > 0) {
      entities.set('numbers', numberMatches.map(n => parseInt(n.replace(/,/g, ''), 10)));
    }

    // Extract employment type
    const employmentTypes = ['salaried', 'self-employed', 'freelance', 'business'];
    for (const type of employmentTypes) {
      if (message.includes(type)) {
        entities.set('job_type', type);
        break;
      }
    }

    // Extract loan purpose
    const loanPurposes = ['personal', 'home', 'auto', 'education', 'business'];
    for (const purpose of loanPurposes) {
      if (message.includes(purpose)) {
        entities.set('loan_purpose', purpose);
        break;
      }
    }

    return entities;
  }

  /**
   * Check if message contains financial numbers
   */
  private containsFinancialNumbers(message: string): boolean {
    return /\d+(?:,\d{3})*(?:\.\d+)?/.test(message);
  }

  private containsLoanAmountPhrase(message: string): boolean {
    return /(?:loan\s*(?:of|for)?\s*(?:₹|rs\.?\s*)?\d+)|(\d+\s*(?:lakh|lakhs|k|thousand|crore))/i.test(message);
  }

  /**
   * Get intent display name
   */
  getIntentName(intent: UserIntent): string {
    const names: Record<UserIntent, string> = {
      eligibility_check: 'Loan Eligibility Check',
      finance_qa: 'Financial Question',
      emi_calculation: 'EMI Calculation',
      credit_score_advice: 'Credit Score Advice',
      document_requirements: 'Document Requirements',
      bank_comparison: 'Bank Comparison',
      financial_planning: 'Financial Planning',
      general_chat: 'General Chat',
    };
    return names[intent];
  }
}

// Singleton instance
let intentAgentInstance: IntentAgent | null = null;

export function getIntentAgent(): IntentAgent {
  if (!intentAgentInstance) {
    intentAgentInstance = new IntentAgent();
  }
  return intentAgentInstance;
}
