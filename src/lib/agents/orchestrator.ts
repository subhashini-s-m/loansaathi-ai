/**
 * Chatbot Orchestrator v2 — Agent-based router
 *
 * Architecture:
 *   User message
 *      |
 *   IntentAgent  ->  classify intent
 *      |
 *   DataExtractionAgent  ->  extract financial fields from free-form text
 *      |
 *   Router:
 *     - eligibility_check  -> EligibilityAgent (local Q&A flow, calculates score)
 *     - finance_qa / general -> LLM via Supabase chat edge function (RAG + HuggingFace)
 *     - emi_calculation     -> local EMI calc + format
 *     - credit_score_advice -> LLM with credit context
 *     - etc.
 */

import { getIntentAgent } from './intentAgent';
import { getEligibilityAgent } from './eligibilityAgent';
import { getConversationMemory } from './conversationMemory';
import { extractFinancialData, getMissingCoreFields, getQuestionForField } from './dataExtractionAgent';
import { streamChatResponse, type ChatMessage } from '@/lib/chatService';
import { calculateLoanResult } from '@/utils/loanCalculator';
import type { LoanFormData } from '@/types/loan';

export interface OrchestrationResult {
  response: string;
  agentType: 'eligibility' | 'finance' | 'general';
  /** If true, response is streamed via callback - response is empty placeholder */
  isStreaming?: boolean;
  metadata?: {
    intent?: string;
    isEligibilityComplete?: boolean;
    eligibilityReport?: any;
    collectedFields?: Partial<LoanFormData>;
    actions?: { label: string; action: string }[];
    [key: string]: any;
  };
}

type StreamCallback = (token: string) => void;
type DoneCallback = (fullText: string, metadata?: OrchestrationResult['metadata']) => void;

export class ChatbotOrchestrator {
  private intentAgent = getIntentAgent();
  private eligibilityAgent = getEligibilityAgent();
  private memory = getConversationMemory();

  /**
   * Process message - main entry point.
   * When streaming from LLM, onToken fires for each chunk and onDone when complete.
   * For local (non-LLM) responses the promise resolves with the full result.
   */
  async processMessage(
    userMessage: string,
    language: 'en' | 'hi' | 'ta' = 'en',
    onToken?: StreamCallback,
    onDone?: DoneCallback,
  ): Promise<OrchestrationResult> {
    const lang = (language === 'ta' ? 'en' : language) as 'en' | 'hi';
    const normalised = userMessage.trim().toLowerCase();

    // -- Control commands --
    if (['exit', 'stop', 'cancel'].includes(normalised)) {
      this.memory.setContext('inEligibilityFlow', false);
      this.memory.setContext('eligStarted', false);
      return mkLocal(
        lang === 'en'
          ? 'Eligibility flow stopped. Ask me anything - EMI, banks, credit score - or say "check eligibility" to restart.'
          : 'पात्रता प्रक्रिया रोक दी गई है। कुछ भी पूछें या "check eligibility" लिखें।',
        'general',
        { intent: 'general_chat' },
      );
    }
    if (['reset', 'start over', 'restart'].includes(normalised)) {
      this.memory.reset();
      return mkLocal(
        lang === 'en'
          ? 'Session reset. Tell me what you need - e.g. "I need a loan of 5 lakh".'
          : 'सत्र रीसेट। बताएं क्या चाहिए - जैसे "मुझे 5 लाख का लोन चाहिए"।',
        'general',
        { intent: 'general_chat' },
      );
    }

    // -- Memory --
    this.memory.addMessage('user', userMessage);

    // -- Extract data from the message --
    const extraction = extractFinancialData(userMessage);
    if (Object.keys(extraction.extracted).length > 0) {
      this.memory.updateCollectedData(extraction.extracted);
    }

    // -- Intent classification --
    const intent = this.intentAgent.classifyIntent(userMessage);

    // -- If already inside eligibility flow, continue it --
    if (this.memory.isInEligibilityFlow()) {
      return this.handleEligibilityFlow(userMessage, lang);
    }

    // -- Auto-detect: user sent a data dump that looks like eligibility --
    if (extraction.isEligibilityQuery && extraction.fieldsFound.length >= 2) {
      this.memory.setContext('inEligibilityFlow', true);
      return this.handleEligibilityFlow(userMessage, lang);
    }

    // -- Route by intent --
    if (intent.intent === 'eligibility_check') {
      this.memory.setContext('inEligibilityFlow', true);
      return this.handleEligibilityFlow(userMessage, lang);
    }

    if (intent.intent === 'emi_calculation') {
      const entities = this.extractEntities(userMessage);
      if (entities.loanAmount) {
        return this.localEMICalc(entities, lang);
      }
    }

    // -- For all other intents -> LLM (finance_qa, credit, bank, general, etc.) --
    return this.streamFromLLM(userMessage, language, onToken, onDone, intent.intent);
  }

  // -----------------------------------------------
  //  ELIGIBILITY FLOW  (fully local, no LLM)
  // -----------------------------------------------

  private async handleEligibilityFlow(userMessage: string, lang: 'en' | 'hi'): Promise<OrchestrationResult> {
    const collected = this.memory.getCollectedData();

    // If this is the very first entry into the flow, return intro + first missing field
    if (!this.memory.getContext('eligStarted')) {
      this.memory.setContext('eligStarted', true);
      const missing = getMissingCoreFields(collected);
      if (missing.length === 0) {
        return this.finishEligibility(lang);
      }
      const intro = lang === 'en'
        ? '🎯 **Instant Loan Eligibility Check**\n\nI\'ll ask a few quick questions and predict your approval chances.\n\n'
        : '🎯 **तुरंत ऋण पात्रता जांच**\n\nकुछ सवाल पूछकर मैं आपकी स्वीकृति संभावना बताऊंगा।\n\n';

      const total = 7;
      const answered = total - missing.length;
      const progress = `⏳ Progress: ${answered}/${total}\n\n`;
      return mkLocal(
        intro + progress + getQuestionForField(missing[0], lang),
        'eligibility',
        { intent: 'eligibility_check', step: missing[0] },
      );
    }

    // -- Parse user's answer for the current missing field --
    const missingBefore = getMissingCoreFields(collected);
    const currentField = missingBefore[0];

    if (currentField) {
      const parsed = this.eligibilityAgent.parseInput(currentField, userMessage);
      const validation = this.eligibilityAgent.validateField(currentField, parsed);
      if (!validation.valid) {
        return mkLocal(
          (lang === 'en'
            ? `❌ ${validation.error || 'Invalid answer'}\n\n`
            : `❌ ${validation.error || 'अमान्य उत्तर'}\n\n`)
          + getQuestionForField(currentField, lang),
          'eligibility',
          { intent: 'eligibility_check', error: true },
        );
      }
      this.memory.updateCollectedData({ [currentField]: parsed } as any);
    }

    // Check remaining
    const updatedCollected = this.memory.getCollectedData();
    const missingAfter = getMissingCoreFields(updatedCollected);

    if (missingAfter.length === 0) {
      return this.finishEligibility(lang);
    }

    const total = 7;
    const answered = total - missingAfter.length;
    const progress = `⏳ Progress: ${answered}/${total}\n\n`;
    return mkLocal(
      progress + getQuestionForField(missingAfter[0], lang),
      'eligibility',
      { intent: 'eligibility_check', step: missingAfter[0], collectedFields: updatedCollected },
    );
  }

  private finishEligibility(lang: 'en' | 'hi'): OrchestrationResult {
    this.memory.setContext('inEligibilityFlow', false);
    this.memory.setContext('eligStarted', false);

    const collected = this.memory.getCollectedData();

    const fullData: LoanFormData = {
      age: collected.age ?? 30,
      gender: collected.gender ?? 'Male',
      marital_status: collected.marital_status ?? 'Single',
      family_members: collected.family_members ?? 1,
      dependent_children: collected.dependent_children ?? 0,
      location_city: collected.location_city ?? '',
      location_state: collected.location_state ?? '',
      education: collected.education ?? 'Graduate',
      job_type: collected.job_type ?? 'Salaried',
      employer_name: collected.employer_name ?? '',
      years_experience: collected.years_experience ?? 2,
      monthly_income: collected.monthly_income ?? 30000,
      income_stability: collected.income_stability ?? 'Stable',
      secondary_income: collected.secondary_income ?? false,
      monthly_savings: collected.monthly_savings ?? Math.round((collected.monthly_income ?? 30000) * 0.15),
      monthly_rent: collected.monthly_rent ?? 0,
      existing_loans: collected.existing_loans ?? 0,
      total_monthly_expenses: collected.total_monthly_expenses ?? Math.round((collected.monthly_income ?? 30000) * 0.5),
      credit_score: collected.credit_score ?? 650,
      bank_balance: collected.bank_balance ?? Math.round((collected.monthly_income ?? 30000) * 2),
      has_investments: collected.has_investments ?? false,
      owns_house: collected.owns_house ?? false,
      owns_car: collected.owns_car ?? false,
      car_year: collected.car_year ?? 2020,
      property_value: collected.property_value ?? 0,
      has_health_insurance: collected.has_health_insurance ?? false,
      has_life_insurance: collected.has_life_insurance ?? false,
      has_vehicle_insurance: collected.has_vehicle_insurance ?? false,
      loan_amount: collected.loan_amount ?? 500000,
      loan_purpose: collected.loan_purpose ?? 'Personal',
      co_borrower: collected.co_borrower ?? 'None',
      loan_tenure: collected.loan_tenure ?? 60,
      has_collateral: collected.has_collateral ?? false,
    };

    const result = calculateLoanResult(fullData);
    const prob = result.approvalProbability;
    const status = prob >= 70 ? (lang === 'en' ? 'HIGHLY ELIGIBLE' : 'अत्यधिक पात्र')
      : prob >= 50 ? (lang === 'en' ? 'MODERATELY ELIGIBLE' : 'मध्यम पात्र')
      : (lang === 'en' ? 'LOW ELIGIBILITY' : 'कम पात्रता');

    const emi = this.calcEMI(fullData.loan_amount, 0.09 / 12, fullData.loan_tenure);

    const response = lang === 'en'
      ? `✅ **Your Instant Eligibility Report**

📊 **Approval Probability:** ${prob}%
🎯 **Status:** ${status}
🔰 **Risk Level:** ${result.riskCategory}

💰 **Loan Summary:**
• Loan Amount: ₹${fmt(fullData.loan_amount)}
• Monthly EMI: ₹${fmt(emi)} (at ~9%)
• Tenure: ${fullData.loan_tenure} months

👤 **Your Profile:**
• Income: ₹${fmt(fullData.monthly_income)}/month
• Credit Score: ${fullData.credit_score}
• Employment: ${fullData.job_type}
• Existing Loans: ${fullData.existing_loans}

${result.factors.length > 0 ? '📋 **Key Factors:**\n' + result.factors.slice(0, 4).map(f => `• ${f.name}: ${f.description}`).join('\n') : ''}

${prob >= 70 ? '🏦 **Recommended Banks:** ' + result.recommendedBanks.slice(0, 3).map(b => b.name).join(', ') : '🛠️ **Tip:** ' + (result.factors.find(f => f.level === 'high')?.improvement || 'Improve your credit score and reduce existing debt.')}

Would you like a **detailed report** or want to **continue chatting**?`
      : `✅ **आपकी तुरंत पात्रता रिपोर्ट**

📊 **स्वीकृति संभावना:** ${prob}%
🎯 **स्थिति:** ${status}

💰 **ऋण सारांश:**
• ऋण राशि: ₹${fmt(fullData.loan_amount)}
• मासिक EMI: ₹${fmt(emi)} (लगभग 9%)

👤 **प्रोफ़ाइल:**
• आय: ₹${fmt(fullData.monthly_income)}/महीना
• क्रेडिट स्कोर: ${fullData.credit_score}
• रोजगार: ${fullData.job_type}

क्या आप **विस्तृत रिपोर्ट** चाहते हैं या **चैट जारी** रखना चाहते हैं?`;

    const analysisResult = {
      approval_probability: prob,
      risk_category: result.riskCategory,
      financial_health_score: Math.round(prob * 0.9),
      debt_to_income_ratio: fullData.total_monthly_expenses / fullData.monthly_income,
      emi_affordability: emi < fullData.monthly_income * 0.4 ? 'Good' : emi < fullData.monthly_income * 0.6 ? 'Moderate' : 'Stretched',
      summary: `Approval probability ${prob}%. ${result.riskCategory} risk.`,
      factors: result.factors,
      eligibility_gaps: [],
      improvement_suggestions: [],
      roadmap: result.roadmap,
      recommended_banks: result.recommendedBanks,
      readiness: {
        can_apply_now: prob >= 55,
        wait_days: prob >= 55 ? 0 : 30,
        reasons: prob >= 55 ? ['Profile meets basic criteria'] : ['Consider improving credit score or reducing debt'],
      },
      documents_needed: ['PAN Card', 'Aadhaar Card', 'Salary Slips (3 months)', 'Bank Statements (6 months)', 'Address Proof'],
    };

    this.memory.addMessage('assistant', response);

    return {
      response,
      agentType: 'eligibility',
      metadata: {
        intent: 'eligibility_check',
        isEligibilityComplete: true,
        eligibilityReport: analysisResult,
        collectedFields: fullData,
        actions: [
          { label: '📄 Get Detailed Report', action: 'detailed_report' },
          { label: '💬 Continue in Chat', action: 'continue_chat' },
        ],
      },
    };
  }

  // -----------------------------------------------
  //  LLM STREAMING  (via Supabase edge function)
  // -----------------------------------------------

  private async streamFromLLM(
    userMessage: string,
    language: 'en' | 'hi' | 'ta',
    onToken?: StreamCallback,
    onDone?: DoneCallback,
    intent?: string,
  ): Promise<OrchestrationResult> {
    const recentMessages = this.memory.getRecentMessages(10);
    const chatMessages: ChatMessage[] = recentMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    if (!chatMessages.length || chatMessages[chatMessages.length - 1].content !== userMessage) {
      chatMessages.push({ role: 'user', content: userMessage });
    }

    if (onToken && onDone) {
      // Streaming mode
      return new Promise<OrchestrationResult>((resolve) => {
        resolve({
          response: '',
          agentType: 'finance',
          isStreaming: true,
          metadata: { intent: intent || 'finance_qa' },
        });

        streamChatResponse(chatMessages, language as 'en' | 'hi' | 'ta', {
          onToken: (token) => onToken(token),
          onDone: (fullText) => {
            this.memory.addMessage('assistant', fullText);
            onDone(fullText, { intent: intent || 'finance_qa' });
          },
          onError: (_error) => {
            const fallback = this.localFallback(userMessage, (language === 'ta' ? 'en' : language) as 'en' | 'hi');
            this.memory.addMessage('assistant', fallback);
            onDone(fallback, { intent: intent || 'finance_qa', error: true });
          },
        });
      });
    }

    // Non-streaming mode (fallback)
    return new Promise<OrchestrationResult>((resolve) => {
      streamChatResponse(chatMessages, language as 'en' | 'hi' | 'ta', {
        onToken: () => {},
        onDone: (finalText) => {
          this.memory.addMessage('assistant', finalText);
          resolve({
            response: finalText,
            agentType: 'finance',
            metadata: { intent: intent || 'finance_qa' },
          });
        },
        onError: (_error) => {
          const fallback = this.localFallback(userMessage, (language === 'ta' ? 'en' : language) as 'en' | 'hi');
          this.memory.addMessage('assistant', fallback);
          resolve({
            response: fallback,
            agentType: 'finance',
            metadata: { intent: intent || 'finance_qa', error: true },
          });
        },
      });
    });
  }

  // -----------------------------------------------
  //  LOCAL EMI CALCULATOR
  // -----------------------------------------------

  private localEMICalc(entities: any, lang: 'en' | 'hi'): OrchestrationResult {
    const amount = entities.loanAmount;
    const rate = (entities.interestRate || 9) / 100 / 12;
    const tenure = entities.tenure || 60;
    const emi = this.calcEMI(amount, rate, tenure);
    const totalPayable = emi * tenure;
    const totalInterest = totalPayable - amount;

    const response = lang === 'en'
      ? `📊 **EMI Calculation**

💰 **Loan:** ₹${fmt(amount)} | **Rate:** ${(rate * 12 * 100).toFixed(1)}% | **Tenure:** ${tenure} months

💵 **Monthly EMI: ₹${fmt(emi)}**
• Total Payable: ₹${fmt(totalPayable)}
• Total Interest: ₹${fmt(totalInterest)}
• Interest as % of Principal: ${((totalInterest / amount) * 100).toFixed(1)}%

💡 EMI should be less than 40% of your monthly income for comfortable repayment.`
      : `📊 **EMI गणना**

💰 **ऋण:** ₹${fmt(amount)} | **दर:** ${(rate * 12 * 100).toFixed(1)}% | **अवधि:** ${tenure} महीने

💵 **मासिक EMI: ₹${fmt(emi)}**
• कुल राशि: ₹${fmt(totalPayable)} | कुल ब्याज: ₹${fmt(totalInterest)}`;

    this.memory.addMessage('assistant', response);
    return { response, agentType: 'finance', metadata: { intent: 'emi_calculation' } };
  }

  // -----------------------------------------------
  //  LOCAL FALLBACK (when LLM is unavailable)
  // -----------------------------------------------

  private localFallback(msg: string, lang: 'en' | 'hi'): string {
    const lower = msg.toLowerCase();

    if (lower.includes('credit') || lower.includes('cibil')) {
      return lang === 'en'
        ? `📈 **Credit Score Tips**\n\n1. Pay all bills on time (biggest factor — 35%)\n2. Keep credit utilization below 30%\n3. Don't close old accounts\n4. Avoid multiple loan applications\n5. Check your CIBIL report at www.cibil.com\n\n**Ranges:** 750+ Excellent | 700-749 Good | 650-699 Fair | <650 Poor`
        : `📈 **क्रेडिट स्कोर सुधार**\n\n1. समय पर बिल भुगतान करें\n2. क्रेडिट कार्ड का 30% से कम उपयोग करें\n3. पुराने खाते बंद न करें\n4. एक साथ कई लोन न लें`;
    }

    if (lower.includes('document') || lower.includes('papers')) {
      return lang === 'en'
        ? `📋 **Documents for Loan**\n\n• PAN Card & Aadhaar\n• Salary slips (3 months)\n• Bank statements (6 months)\n• Address proof\n• Employment letter\n\n*Self-employed:* GST returns, business registration`
        : `📋 **लोन दस्तावेज़**\n\n• पैन और आधार\n• सैलरी स्लिप (3 महीने)\n• बैंक स्टेटमेंट (6 महीने)\n• पता प्रमाण`;
    }

    if (lower.includes('bank') || lower.includes('compare')) {
      return lang === 'en'
        ? `🏦 **Top Banks for Personal Loans**\n\n1. **SBI** — 9-13% rate, best for govt employees\n2. **HDFC** — 9-11%, fast processing\n3. **Axis** — 9.5-12%, quick approvals\n4. **ICICI** — 10-12.5%, great for existing customers`
        : `🏦 **शीर्ष बैंक**\n\n1. SBI — 9-13%\n2. HDFC — 9-11%\n3. Axis — 9.5-12%\n4. ICICI — 10-12.5%`;
    }

    return lang === 'en'
      ? `👋 I'm **NidhiSaarthi AI**. I can help with:\n\n✅ Loan eligibility — say "check eligibility"\n💰 EMI calculations — say "calculate EMI for 5 lakh"\n📈 Credit score tips — say "improve credit"\n🏦 Bank comparison — say "compare banks"\n📋 Documents — say "what documents needed"\n\nWhat would you like help with?`
      : `👋 मैं **NidhiSaarthi AI** हूं। मैं मदद कर सकता हूं:\n\n✅ पात्रता जांच — "check eligibility" लिखें\n💰 EMI गणना — "5 लाख का EMI निकालें"\n📈 क्रेडिट स्कोर — "क्रेडिट कैसे सुधारें"\n🏦 बैंक तुलना — "बैंक तुलना करें"`;
  }

  // -----------------------------------------------
  //  HELPERS
  // -----------------------------------------------

  private calcEMI(p: number, r: number, n: number): number {
    if (r === 0 || n === 0) return Math.round(p / Math.max(n, 1));
    return Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  }

  private extractEntities(msg: string): any {
    const entities: any = {};
    const amountMatch = msg.match(/(?:₹|rs\.?)\s*(\d+(?:,\d{3})*)|(\d+(?:,\d{3})*)\s*(?:rupees?|rs\.?|lakh|lac|हज़ार)?/i);
    if (amountMatch) {
      const s = (amountMatch[1] || amountMatch[2]).replace(/,/g, '');
      let amount = parseInt(s);
      if (/lakh|lac/i.test(msg)) amount *= 100000;
      if (amount > 10000) entities.loanAmount = amount;
    }
    const tenureMatch = msg.match(/(\d+)\s*(?:months?|माह)/i);
    if (tenureMatch) entities.tenure = parseInt(tenureMatch[1]);
    const rateMatch = msg.match(/(\d+\.?\d*)\s*%/);
    if (rateMatch) entities.interestRate = parseFloat(rateMatch[1]);
    return entities;
  }
}

// -- Helpers --

function fmt(n: number): string {
  return n.toLocaleString('en-IN');
}

function mkLocal(
  response: string,
  agentType: OrchestrationResult['agentType'],
  metadata?: OrchestrationResult['metadata'],
): OrchestrationResult {
  return { response, agentType, metadata };
}

// -- Singleton --

let orchestratorInstance: ChatbotOrchestrator | null = null;

export function getChatbotOrchestrator(): ChatbotOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new ChatbotOrchestrator();
  }
  return orchestratorInstance;
}

export function resetChatbotOrchestrator(): void {
  if (orchestratorInstance) {
    orchestratorInstance = null;
  }
}
