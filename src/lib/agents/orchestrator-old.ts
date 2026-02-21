/**
 * Chatbot Orchestrator - Routes messages to appropriate agents
 */

import { getIntentAgent } from './intentAgent';
import { getEligibilityAgent } from './eligibilityAgent';
import { getFinanceAdvisorAgent } from './financeAdvisorAgent';
import { getConversationMemory } from './conversationMemory';
import type { LoanFormData, AnalysisResult } from '@/types/loan';

interface OrchestrationResult {
  response: string;
  agentType: 'eligibility' | 'finance' | 'general';
  metadata?: {
    intent?: string;
    eligibilityReport?: AnalysisResult;
    collectedFields?: Partial<LoanFormData>;
    isEligibilityComplete?: boolean;
  };
}

export class ChatbotOrchestrator {
  private intentAgent = getIntentAgent();
  private eligibilityAgent = getEligibilityAgent();
  private financeAdvisor = getFinanceAdvisorAgent();
  private memory = getConversationMemory();

  /**
   * Process user message and route to appropriate agent
   */
  async processMessage(userMessage: string, language: 'en' | 'hi' | 'ta' = 'en'): Promise<OrchestrationResult> {
    // Normalize language to supported values
    const supportedLanguage = (language === 'ta' ? 'en' : language) as 'en' | 'hi';
    
    try {
      // Classify intent FIRST - don't force eligibility
      const intentResult = this.intentAgent.classifyIntent(userMessage);
      const collectedData = this.memory.getCollectedData();
      
      // Add user message to memory
      this.memory.addMessage('user', userMessage, {
        intent: intentResult.intent,
      });

      // Check if in eligibility flow, but ONLY continue if no other intent detected
      const isInEligibilityFlow = this.memory.isInEligibilityFlow();

      // Route based on DETECTED INTENT (not forced workflow)
      if (intentResult.intent === 'emi_calculation') {
        return this.handleEMICalculation(userMessage, supportedLanguage);
      } 
      
      if (intentResult.intent === 'credit_score_advice') {
        return this.handleCreditAdvice(userMessage, supportedLanguage);
      }
      
      if (intentResult.intent === 'document_requirements') {
        return this.handleDocumentRequirements(userMessage, supportedLanguage);
      }
      
      if (intentResult.intent === 'bank_comparison') {
        return this.handleBankComparison(userMessage, supportedLanguage);
      }
      
      if (intentResult.intent === 'financial_planning') {
        return this.handleFinancialPlanning(userMessage, supportedLanguage);
      }

      // For eligibility check - only if explicitly asked OR continuing flow
      if (intentResult.intent === 'eligibility_check' || (isInEligibilityFlow && intentResult.intent === 'finance_qa')) {
        this.extractLoanAmountFromMessage(userMessage, collectedData);
        return this.handleEligibilityFlow(userMessage, supportedLanguage);
      }

      // Default: handle as finance Q&A or general chat
      return this.handleFinanceQuery(userMessage, 'finance_qa', supportedLanguage);
    } catch (error) {
      console.error('Orchestrator error:', error);
      return {
        response: '❌ Sorry, I encountered an error. Please try again.',
        agentType: 'general',
      };
    }
  }

  /**
   * Handle simple queries (EMI, credit advice, etc.) without eligibility flow
   */
  private async handleSimpleQuery(userMessage: string, intent: string, language: 'en' | 'hi' = 'en'): Promise<OrchestrationResult> {
    const memory = this.memory;
    memory.addMessage('user', userMessage, { intent });

    switch (intent) {
      case 'emi_calculation':
        return this.handleEMICalculation(userMessage, language);
      
      case 'credit_score_advice':
        return this.handleCreditAdvice(userMessage, language);
      
      case 'document_requirements':
        return this.handleDocumentRequirements(userMessage, language);
      
      case 'bank_comparison':
        return this.handleBankComparison(userMessage, language);
      
      case 'financial_planning':
        return this.handleFinancialPlanning(userMessage, language);
      
      default:
        return this.handleGeneralChat(userMessage, language);
    }
  }

  /**
   * Handle EMI calculation queries
   */
  private handleEMICalculation(userMessage: string, language: 'en' | 'hi' = 'en'): OrchestrationResult {
    const values = ragDetector.extractNumericValues(userMessage);
    
    if (!values.loan_amount) {
      const prompt = language === 'en'
        ? 'To calculate EMI, I need a few details:\n\n💰 What is the loan amount (in ₹)?\n📊 What is the interest rate (% per annum)?\n⏳ What is the loan tenure (in months)?\n\nExample: "Calculate EMI for ₹100000 at 9% for 60 months"'
        : 'EMI निकालने के लिए मुझे कुछ विवरण चाहिए।';
      
      const response = this.financeAdvisor.generateEMIExplanation({
        loan_amount: 0,
        tenure: 0,
        interest_rate: 9
      });

      return {
        response: prompt,
        agentType: 'finance',
        metadata: { intent: 'emi_calculation' }
      };
    }

    // Calculate with provided values
    const tenure = values.tenure || 60;
    const interestRate = values.interest_rate || 9;
    
    const response = this.financeAdvisor.generateEMIExplanation({
      loan_amount: values.loan_amount,
      tenure,
      interest_rate: interestRate
    });

    this.memory.addMessage('assistant', response);
    return {
      response,
      agentType: 'finance',
      metadata: { intent: 'emi_calculation' }
    };
  }

  /**
   * Handle credit score improvement queries
   */
  private handleCreditAdvice(userMessage: string, language: 'en' | 'hi' = 'en'): OrchestrationResult {
    const creditScore = ragDetector.extractNumericValues(userMessage).interest_rate || 650;
    
    const response = this.financeAdvisor.generateCreditScoreAdvice(creditScore, language);
    this.memory.addMessage('assistant', response);

    return {
      response,
      agentType: 'finance',
      metadata: { intent: 'credit_score_advice' }
    };
  }

  /**
   * Handle document requirement queries
   */
  private handleDocumentRequirements(userMessage: string, language: 'en' | 'hi' = 'en'): OrchestrationResult {
    const response = this.financeAdvisor.generateDocumentAdvice('personal_loan', language);
    this.memory.addMessage('assistant', response);

    return {
      response,
      agentType: 'finance',
      metadata: { intent: 'document_requirements' }
    };
  }

  /**
   * Handle bank comparison queries
   */
  private handleBankComparison(userMessage: string, language: 'en' | 'hi' = 'en'): OrchestrationResult {
    const response = language === 'en'
      ? '🏦 **Top Banks for Personal Loans**\n\n' +
        '1. **HDFC Bank** - 8.5% to 12% p.a.\n' +
        '   ✓ Processing: 2-3 days\n' +
        '   ✓ Loan: ₹25,000 to ₹40,00,000\n\n' +
        '2. **ICICI Bank** - 8.65% to 12.5% p.a.\n' +
        '   ✓ Processing: 2-3 days\n' +
        '   ✓ Loan: ₹25,000 to ₹50,00,000\n\n' +
        '3. **Axis Bank** - 8.5% to 13.5% p.a.\n' +
        '   ✓ Processing: 3-5 days\n' +
        '   ✓ Loan: ₹25,000 to ₹35,00,000\n\n' +
        '💡 **Recommendation**: Compare rates and choose based on your credit score and requirements.'
      : 'व्यक्तिगत ऋण के लिए शीर्ष बैंकों की तुलना के लिए कृपया अपनी साख स्कोर प्रदान करें।';

    this.memory.addMessage('assistant', response);
    return {
      response,
      agentType: 'finance',
      metadata: { intent: 'bank_comparison' }
    };
  }

  /**
   * Handle financial planning queries
   */
  private handleFinancialPlanning(userMessage: string, language: 'en' | 'hi' = 'en'): OrchestrationResult {
    const response = language === 'en'
      ? '📊 **Financial Planning Tips**\n\n' +
        '1. **Emergency Fund** - 6 months of expenses\n' +
        '2. **Debt Management** - Keep debt-to-income < 40%\n' +
        '3. **Savings Goal** - 20-30% of monthly income\n' +
        '4. **Investment** - Start with safe options (FD, MF)\n' +
        '5. **Insurance** - Cover health and life\n\n' +
        '💡 **Next Step**: Start eligibility check to find best loan option!'
      : 'वित्तीय योजना के लिए कृपया अपनी आय और खर्चों का विवरण प्रदान करें।';

    this.memory.addMessage('assistant', response);
    return {
      response,
      agentType: 'finance',
      metadata: { intent: 'financial_planning' }
    };
  }

  /**
   * Detect if message is a loan request
   */
  private detectLoanRequest(message: string): boolean {
    const lowerMsg = message.toLowerCase();
    const loanKeywords = ['loan', 'credit', 'borrow', 'lending', 'personal loan', 'home loan', 'car loan', 'business loan'];
    const hasLoanKeyword = loanKeywords.some(keyword => lowerMsg.includes(keyword));
    
    // Also check for amount mentions (like "rs.10000" or "10000 rupees")
    const amountPattern = /(\d+|rupees?|rs\.?|र[्ु]पये?)/i;
    const hasAmount = amountPattern.test(message);
    
    return hasLoanKeyword || (hasAmount && loanKeywords.some(k => lowerMsg.includes(k)));
  }

  /**
   * Extract loan amount from user message
   */
  private extractLoanAmountFromMessage(message: string, collectedData: Partial<LoanFormData>): void {
    // Pattern to match amounts like: "10000", "rs.10000", "₹10000", "10000 rupees"
    const amountPattern = /(?:rs\.?|\₹)\s*(\d+(?:,\d{3})*)|(\d+(?:,\d{3})*)\s*(?:rupees?|rs\.?|र[्ु]पये?)/i;
    const match = message.match(amountPattern);
    
    if (match) {
      const amountStr = (match[1] || match[2]).replace(/,/g, '');
      const amount = parseInt(amountStr, 10);
      if (amount > 0) {
        this.memory.updateCollectedData({ loan_amount: amount });
      }
    }
  }

  /**
   * Handle eligibility flow
   */
  private async handleEligibilityFlow(userMessage: string, language: 'en' | 'hi' = 'en'): Promise<OrchestrationResult> {
    const memory = this.memory;
    let collectedData = memory.getCollectedData();

    // If not in eligibility flow, start it
    if (!memory.isInEligibilityFlow()) {
      memory.setContext('inEligibilityFlow', true);
      
      // Extract loan amount if present in first message
      this.extractLoanAmountFromMessage(userMessage, collectedData);
      collectedData = memory.getCollectedData();

      const intro =
        language === 'en'
          ? '🎯 **Instant Loan Eligibility Check**\n\nI\'ll help you get instant eligibility insights! Let me ask you a few quick questions.\n\n'
          : '🎯 **तुरंत ऋण पात्रता जांच**\n\nमैं आपको तुरंत पात्रता अंतर्दृष्टि प्राप्त करने में मदद करूंगा!\n\n';

      const missingFields = this.eligibilityAgent.getMissingFields(collectedData);
      const firstQuestion = this.eligibilityAgent.getNextQuestion(collectedData);
      
      if (firstQuestion) {
        const questionText = this.eligibilityAgent.formatQuestion(firstQuestion, 1, missingFields.length);
        const fullResponse = `${intro}${questionText}`;
        this.memory.addMessage('assistant', fullResponse);
        
        return {
          response: fullResponse,
          agentType: 'eligibility',
          metadata: {
            intent: 'eligibility_check',
            collectedFields: collectedData,
          },
        };
      }
    }

    // In eligibility flow - try to extract and store field
    
    // Try to extract amount if not already collected
    if (!collectedData.loan_amount) {
      this.extractLoanAmountFromMessage(userMessage, collectedData);
      collectedData = memory.getCollectedData();
    }
    
    const missingFields = this.eligibilityAgent.getMissingFields(collectedData);
    
    if (missingFields.length === 0) {
      // All fields collected - generate report
      memory.setContext('inEligibilityFlow', false);
      return this.generateEligibilityReport(collectedData, language);
    }

    // Get current question
    const currentQuestion = this.eligibilityAgent.getNextQuestion(collectedData);
    if (!currentQuestion) {
      memory.setContext('inEligibilityFlow', false);
      return this.generateEligibilityReport(collectedData, language);
    }

    // Try to parse input
    try {
      // Skip if the input is just rejections/negations (NO, NO NO, nope, etc.)
      const lowerInput = userMessage.toLowerCase().trim();
      if (lowerInput === 'no' || lowerInput === 'nope' || lowerInput === 'no no' || lowerInput === 'n') {
        const errorMsg = language === 'en' 
          ? `❌ Please provide a valid response for: ${currentQuestion.question}\n\n💡 Example values: ${currentQuestion.examples?.join(', ')}`
          : `❌ कृपया सही प्रतिक्रिया दें\n\n💡 उदाहरण: ${currentQuestion.examples?.join(', ')}`;
        return {
          response: errorMsg,
          agentType: 'eligibility',
          metadata: {
            intent: 'eligibility_check',
            collectedFields: collectedData,
          },
        };
      }
      
      const parsedValue = this.eligibilityAgent.parseInput(currentQuestion.field, userMessage);
      const validation = this.eligibilityAgent.validateField(currentQuestion.field, parsedValue);

      if (!validation.valid) {
        const hint = language === 'en' ? 'Please try again.' : 'कृपया पुनः प्रयास करें।';
        const examples = currentQuestion.examples ? `\n📝 Examples: ${currentQuestion.examples.join(', ')}` : '';
        const errorMsg = `❌ ${validation.error}\n\n💡 ${hint}${examples}\n\n${currentQuestion.question}`;
        return {
          response: errorMsg,
          agentType: 'eligibility',
          metadata: {
            intent: 'eligibility_check',
            collectedFields: collectedData,
          },
        };
      }

      // Store field
      collectedData = {
        ...collectedData,
        [currentQuestion.field]: parsedValue,
      };
      this.memory.updateCollectedData(collectedData);

      // Check if done
      const remainingFields = this.eligibilityAgent.getMissingFields(collectedData);
      if (remainingFields.length === 0) {
        memory.setContext('inEligibilityFlow', false);
        return this.generateEligibilityReport(collectedData, language);
      }

      // Ask next question
      const nextQuestion = this.eligibilityAgent.getNextQuestion(collectedData);
      if (nextQuestion) {
        const totalRequired = 7; // 7 required fields
        const answered = totalRequired - remainingFields.length;
        const progressEmoji = answered === totalRequired ? '✨' : '⏳';
        const questionText = this.eligibilityAgent.formatQuestion(
          nextQuestion,
          answered,
          totalRequired
        );
        
        const response = `✅ Great! Thanks for that.\n\n${progressEmoji} **Progress: ${answered}/${totalRequired}**\n\n${questionText}`;
        this.memory.addMessage('assistant', response);
        
        return {
          response,
          agentType: 'eligibility',
          metadata: {
            intent: 'eligibility_check',
            collectedFields: collectedData,
          },
        };
      }

      memory.setContext('inEligibilityFlow', false);
      return this.generateEligibilityReport(collectedData, language);
    } catch (e) {
      const errorMsg = language === 'en' 
        ? '❌ Sorry, I couldn\'t understand that. Could you please rephrase?' 
        : '❌ माफ करें, मैं यह समझ नहीं पाया। क्या आप दोबारा कह सकते हैं?';
      return {
        response: errorMsg,
        agentType: 'eligibility',
        metadata: {
          intent: 'eligibility_check',
          collectedFields: collectedData,
        },
      };
    }
  }

  /**
   * Generate eligibility report
   */
  private generateEligibilityReport(data: Partial<LoanFormData>, language: 'en' | 'hi' = 'en'): OrchestrationResult {
    try {
      const report = this.eligibilityAgent.generateEligibilityReport(data);

      if (!report) {
        const errorMsg = language === 'en' ? 'Unable to generate report.' : 'रिपोर्ट जनरेट करने में विफल।';
        return {
          response: errorMsg,
          agentType: 'eligibility',
          metadata: {
            isEligibilityComplete: false,
          },
        };
      }

      // Format report for display
      const reportText = this.formatEligibilityReport(report, language);
      
      // Exit eligibility flow
      this.memory.setContext('inEligibilityFlow', false);

      this.memory.addMessage('assistant', reportText, {
        intent: 'eligibility_check',
      });

      return {
        response: reportText,
        agentType: 'eligibility',
        metadata: {
          intent: 'eligibility_check',
          eligibilityReport: report,
          collectedFields: data,
          isEligibilityComplete: true,
        },
      };
    } catch (e) {
      console.error('Error generating report:', e);
      return {
        response: 'Error generating report',
        agentType: 'eligibility',
      };
    }
  }

  /**
   * Format eligibility report for display
   */
  private formatEligibilityReport(report: AnalysisResult, language: 'en' | 'hi' = 'en'): string {
    const probability = Math.round((report.approval_probability || 0) * 100);
    const readiness = Math.round((report.financial_health_score || 0) * 100);
    const stress = Math.round((report.debt_to_income_ratio || 0) * 100);

    if (language === 'en') {
      const recommendations = report.improvement_suggestions?.slice(0, 3) || [];
      return `✅ **LOAN ELIGIBILITY REPORT**

📊 **Approval Probability: ${probability}%**
${this.getApprovalEmoji(probability)} ${this.getApprovalText(probability)}

🎯 **Financial Health Score: ${readiness}%**
${readiness >= 70 ? '✅ Excellent' : readiness >= 50 ? '⚠️ Good' : '❌ Needs Work'}

⚡ **Debt-to-Income Ratio: ${stress}%**
${stress <= 30 ? '✅ Comfortable' : stress <= 60 ? '⚠️ Manageable' : '❌ High Risk'}

📝 **Key Insights:**
${recommendations.length > 0 
  ? recommendations.map((r, i) => `${i + 1}. ${r.action}`).join('\n')
  : '1. Your financial profile looks good'}

**Next Steps:**
- 📋 Get Detailed Report
- 💬 Continue in Chat`;
    } else {
      return `✅ **ऋण पात्रता रिपोर्ट**

📊 **स्वीकृति संभावना: ${probability}%**
🎯 **वित्तीय स्वास्थ्य स्कोर: ${readiness}%**
⚡ **ऋण तनाव सूचकांक: ${stress}%**`;
    }
  }

  /**
   * Get approval emoji
   */
  private getApprovalEmoji(probability: number): string {
    if (probability >= 80) return '🟢';
    if (probability >= 60) return '🟡';
    if (probability >= 40) return '🟠';
    return '🔴';
  }

  /**
   * Get approval text
   */
  private getApprovalText(probability: number): string {
    if (probability >= 80) return 'Very High - Likely to be approved';
    if (probability >= 60) return 'High - Good chance of approval';
    if (probability >= 40) return 'Moderate - Possible with improvements';
    return 'Low - Needs significant improvements';
  }

  /**
   * Handle finance queries
   */
  private async handleFinanceQuery(userMessage: string, intent: string, language: 'en' | 'hi' = 'en'): Promise<OrchestrationResult> {
    // Extract loan amount if present in the message
    const collectedData = this.memory.getCollectedData();
    this.extractLoanAmountFromMessage(userMessage, collectedData);
    
    // If user mentioned a loan amount, give them ACTUAL INFORMATION
    if (collectedData.loan_amount && collectedData.loan_amount > 0) {
      const loanAmount = collectedData.loan_amount;
      
      // Calculate EMI at different rates
      const calculateEMI = (principal: number, ratePerMonth: number, months: number) => {
        if (ratePerMonth === 0) return Math.round(principal / months);
        const emi = (principal * ratePerMonth * Math.pow(1 + ratePerMonth, months)) / 
                    (Math.pow(1 + ratePerMonth, months) - 1);
        return Math.round(emi);
      };
      
      const ratePerMonth = 0.0075; // 9% annual = 0.75% monthly
      const emi60Months = calculateEMI(loanAmount, ratePerMonth, 60);
      const emi48Months = calculateEMI(loanAmount, ratePerMonth, 48);
      const emi36Months = calculateEMI(loanAmount, ratePerMonth, 36);
      
      // Eligibility insights based on amount
      let eligibilityInsight = '';
      if (loanAmount <= 300000) {
        eligibilityInsight = language === 'en'
          ? '✅ **Tier 1 Loan** - Easiest approval for most banks\n   👤 Minimal credit requirement (~650+)\n   ⏱️ Faster processing (1-2 days)'
          : '✅ **स्तर 1 ऋण** - अधिकांश बैंकों के लिए आसान अनुमोदन';
      } else if (loanAmount <= 1000000) {
        eligibilityInsight = language === 'en'
          ? '⚡ **Tier 2 Loan** - Moderate approval probability\n   👤 Credit requirement (~700+)\n   📄 Standard documentation needed'
          : '⚡ **स्तर 2 ऋण** - मध्यम अनुमोदन संभावना';
      } else {
        eligibilityInsight = language === 'en'
          ? '🔍 **Tier 3 Loan** - Requires strong financial profile\n   👤 High credit requirement (~750+)\n   📋 Detailed income verification needed'
          : '🔍 **स्तर 3 ऋण** - मजबूत वित्तीय प्रोफ़ाइल आवश्यक';
      }
      
      // Determine suitable income
      const recommendedMonthlyIncome = Math.round(loanAmount / 36 * 1.2); // DTI ~40%
      const requiredMonthlyIncome = Math.round(loanAmount / 36 / 0.4); // For ~40% DTI
      
      const response = language === 'en'
        ? `✨ **Perfect! Loan Amount: ₹${loanAmount.toLocaleString('en-IN')}**\n\n📊 **EMI BREAKDOWN (9% Interest Rate):**\n• 60 months: ₹${emi60Months.toLocaleString('en-IN')}/month (Total: ₹${(emi60Months * 60).toLocaleString('en-IN')})\n• 48 months: ₹${emi48Months.toLocaleString('en-IN')}/month (Total: ₹${(emi48Months * 48).toLocaleString('en-IN')})\n• 36 months: ₹${emi36Months.toLocaleString('en-IN')}/month (Total: ₹${(emi36Months * 36).toLocaleString('en-IN')})\n\n💰 **ELIGIBILITY INSIGHTS:**\n${eligibilityInsight}\n\n📈 **RECOMMENDED PROFILE:**\n• Monthly Income: ₹${recommendedMonthlyIncome.toLocaleString('en-IN')}+\n• Credit Score: 700+\n• Employment: 2+ years stable\n\n🏦 **SUGGESTED BANKS:**\n1. **HDFC Bank** - Rate: 9-11%, Processing: 2-3 days\n2. **Axis Bank** - Rate: 9.5-12%, Processing: 1-2 days\n3. **ICICI Bank** - Rate: 10-12.5%, Processing: 2-3 days\n\n📋 **NEXT STEPS:**\n1️⃣ Check your exact credit score (Get free CIBIL score)\n2️⃣ Prepare documents (ID, Address, Income proof, Bank statements)\n3️⃣ Compare rates across banks\n4️⃣ Apply online or visit branch\n\n💡 **Want to proceed?** Tell me:\n   • Your monthly income\n   • Your credit score\n   • Preferred tenure (36/48/60 months)`
        : `✨ **बिल्कुल! ऋण राशि: ₹${loanAmount.toLocaleString('en-IN')}**\n\n📊 **EMI विवरण (9% ब्याज दर):**\n• 60 महीने: ₹${emi60Months.toLocaleString('en-IN')}/माह\n• 48 महीने: ₹${emi48Months.toLocaleString('en-IN')}/माह\n• 36 महीने: ₹${emi36Months.toLocaleString('en-IN')}/माह\n\n💰 **पात्रता अंतर्दृष्टि:**\n${eligibilityInsight}\n\n🏦 **सुझाए गए बैंक:**\n1. HDFC - दर 9-11%\n2. Axis - दर 9.5-12%\n3. ICICI - दर 10-12.5%`;
      
      this.memory.addMessage('assistant', response);
      this.memory.updateCollectedData({ loan_amount: loanAmount });
      
      return {
        response,
        agentType: 'finance',
        metadata: { intent },
      };
    } else {
      // No amount mentioned - ask for it
      const response = language === 'en'
        ? `👋 **Hello! Welcome to NidhiSaarthi AI** 🎯\n\nI'm your personal loan advisor. To give you accurate information, I need to know:\n\n💰 **How much loan do you need?**\n\nExamples:\n• "I need ₹3,00,000"\n• "I want 5 lakh rupees"\n• "500000 for my wedding"\n\nOnce you tell me the amount, I'll instantly show you:\n✅ Exact EMI calculations\n✅ Your eligibility tier\n✅ Best banks for you\n✅ Required documents\n✅ Approval timeline\n\n**What amount do you need?**`
        : `👋 **नमस्ते! NidhiSaarthi AI में आपका स्वागत है** 🎯\n\nमैं आपका व्यक्तिगत ऋण सलाहकार हूं। सटीक जानकारी देने के लिए मुझे यह बताएं:\n\n💰 **आपको कितना ऋण चाहिए?**\n\nउदाहरण:\n• "मुझे 3 लाख चाहिए"\n• "मुझे 5 लाख रुपये चाहिए"\n• "शादी के लिए 5,00,000"\n\n**राशि बताएं:**`;
      
      this.memory.addMessage('assistant', response);
      return {
        response,
        agentType: 'finance',
        metadata: { intent },
      };
    }
  }

  /**
   * Handle general chat
   */
  private async handleGeneralChat(userMessage: string, language: 'en' | 'hi' = 'en'): Promise<OrchestrationResult> {
    const response =
      language === 'en'
        ? `👋 Hello! I'm NidhiSaarthi AI, your financial assistant.\n\nI can help you with:\n✅ Instant Loan Eligibility Check\n✅ EMI Calculations\n✅ Credit Score Advice\n✅ Financial Planning\n\nWhat would you like to know?`
        : `👋 नमस्ते! मैं NidhiSaarthi AI हूं, आपका वित्तीय सहायक।\n\nमैं आपकी मदद कर सकता हूं:\n✅ तुरंत ऋण पात्रता जांच\n✅ EMI गणना\n✅ क्रेडिट स्कोर सलाह\n✅ वित्तीय योजना`;

    this.memory.addMessage('assistant', response);
    return {
      response,
      agentType: 'general',
    };
  }

  /**
   * Get current memory state
   */
  getMemory() {
    return this.memory;
  }

  /**
   * Reset conversation
   */
  resetConversation() {
    this.memory.reset();
  }
}

// Singleton instance
let orchestratorInstance: ChatbotOrchestrator | null = null;

export function getChatbotOrchestrator(): ChatbotOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new ChatbotOrchestrator();
  }
  return orchestratorInstance;
}

export function resetChatbotOrchestrator(): void {
  if (orchestratorInstance) {
    orchestratorInstance.resetConversation();
    orchestratorInstance = null;
  }
}
