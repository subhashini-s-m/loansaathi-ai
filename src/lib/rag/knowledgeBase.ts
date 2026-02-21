/**
 * Financial Knowledge Base - For RAG System
 */

export const financialKnowledgeBase = {
  emi_calculation: {
    keywords: ['emi', 'monthly payment', 'installment', 'calculate', 'payment schedule', 'how much will i pay'],
    intent: 'emi_calculation',
    handler: 'financeAdvisor.generateEMIExplanation',
    response_type: 'structured_calculation'
  },
  
  credit_score_improvement: {
    keywords: ['credit score', 'improve', 'increase', 'cibil', 'low score', 'bad credit', 'credit rating'],
    intent: 'credit_score_advice',
    handler: 'financeAdvisor.generateCreditScoreAdvice',
    response_type: 'strategy_list'
  },
  
  document_requirements: {
    keywords: ['document', 'papers', 'proof', 'required', 'need', 'verification', 'what to submit'],
    intent: 'document_requirements',
    handler: 'financeAdvisor.generateDocumentAdvice',
    response_type: 'checklist'
  },
  
  bank_comparison: {
    keywords: ['bank', 'compare', 'which', 'best', 'rates', 'interest', 'offers', 'where to apply'],
    intent: 'bank_comparison',
    handler: 'financeAdvisor.bankComparison',
    response_type: 'comparison'
  },
  
  loan_eligibility: {
    keywords: ['eligible', 'qualify', 'approval', 'chances', 'will i get', 'can i get', 'am i eligible', 'check eligibility'],
    intent: 'eligibility_check',
    handler: 'eligibilityAgent.startFlow',
    response_type: 'workflow'
  },
  
  financial_planning: {
    keywords: ['plan', 'budget', 'save', 'investment', 'wealth', 'goal', 'retirement', 'financial advice'],
    intent: 'financial_planning',
    handler: 'financeAdvisor.financialPlanning',
    response_type: 'advice'
  }
};

/**
 * Enhanced Intent Detection with RAG scoring
 */
export class RAGIntentDetector {
  /**
   * Score a message against all intents
   */
  scoreMessage(message: string): Array<{ intent: string; score: number; handler: string }> {
    const lowerMsg = message.toLowerCase();
    const scores: Array<{ intent: string; score: number; handler: string }> = [];
    
    for (const [intentName, intentData] of Object.entries(financialKnowledgeBase)) {
      let score = 0;
      
      // Check keyword matches
      for (const keyword of intentData.keywords) {
        if (lowerMsg.includes(keyword)) {
          score += 1.0; // Full point for exact keyword match
        }
      }
      
      // Contextual scoring
      if (intentData.intent === 'emi_calculation' && /(\d+|amount|loan|rupees?|rs\.?)/i.test(message)) {
        score += 0.5; // Bonus for amount mention with EMI keywords
      }
      
      if (intentData.intent === 'eligibility_check' && /check|assess|approve|qualify/i.test(message)) {
        score += 0.3; // Bonus for assessment-related words
      }
      
      if (score > 0) {
        scores.push({
          intent: intentData.intent,
          score,
          handler: intentData.handler
        });
      }
    }
    
    // Sort by score (highest first)
    return scores.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Get best intent match
   */
  getBestIntent(message: string): { intent: string; score: number; handler: string } | null {
    const scores = this.scoreMessage(message);
    return scores.length > 0 ? scores[0] : null;
  }
  
  /**
   * Detect if message is a simple question (not eligibility flow)
   */
  isSimpleQuestion(message: string): boolean {
    const bestMatch = this.getBestIntent(message);
    if (!bestMatch) return false;
    
    // If best match is not eligibility_check and score is significant, it's a simple question
    return bestMatch.intent !== 'eligibility_check' && bestMatch.score >= 1.0;
  }
  
  /**
   * Extract numeric values (loan amount, EMI values, etc.)
   */
  extractNumericValues(message: string): { [key: string]: number } {
    const values: { [key: string]: number } = {};
    
    // Loan amount patterns
    const amountPattern = /(?:loan|amount|need|borrow)[\s:]+(?:rs\.?|\₹)?\s*(\d+(?:,\d{3})*)/i;
    const amountMatch = message.match(amountPattern);
    if (amountMatch) {
      values.loan_amount = parseInt(amountMatch[1].replace(/,/g, ''), 10);
    }
    
    // Interest rate pattern
    const ratePattern = /(?:rate|interest)[\s:]+(\d+(?:\.\d{1,2})?)\s*%/i;
    const rateMatch = message.match(ratePattern);
    if (rateMatch) {
      values.interest_rate = parseFloat(rateMatch[1]);
    }
    
    // Tenure pattern
    const tenurePattern = /(?:month|tenure|duration)[\s:]+(\d+)/i;
    const tenureMatch = message.match(tenurePattern);
    if (tenureMatch) {
      values.tenure = parseInt(tenureMatch[1], 10);
    }
    
    return values;
  }
}

export const ragDetector = new RAGIntentDetector();
