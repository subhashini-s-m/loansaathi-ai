/**
 * Finance Advisor Agent - Handles finance Q&A using structured prompts
 */

interface FinanceContext {
  userProfile?: {
    age?: number;
    income?: number;
    creditScore?: number;
  };
  recentQuestions?: string[];
}

export class FinanceAdvisorAgent {
  private systemPrompts = {
    en: `You are NidhiSaarthi AI, a professional financial advisor specializing in:
- Loan eligibility and products
- EMI calculations
- Credit score improvement
- Financial planning
- Government financial schemes

IMPORTANT RULES:
1. Always be factual and avoid speculation
2. If asked about specific loan approval, ask for details needed for calculation
3. Provide practical, actionable advice
4. Include relevant eligibility requirements
5. Mention that actual approval depends on bank's full evaluation
6. For calculations, ask for all required inputs
7. Be conversational but professional
8. Use examples with realistic Indian financial context (₹, EMI, tenure in months)
9. Avoid recommending specific financial products beyond loan types
10. Always mention consulting with bank officials for final decisions

FINANCIAL CALCULATION EXAMPLES:
- EMI = [P × R × (1+R)^N] / [(1+R)^N - 1] where P=principal, R=monthly rate, N=months
- DTI Ratio = Total Monthly Debt / Monthly Income (should be < 60%)
- LTI Ratio = Loan Amount / Annual Income (should be < 48 months)`,
    
    hi: `आप NidhiSaarthi AI हैं, एक पेशेवर वित्तीय सलाहकार जो विशेष रूप से निम्नलिखित में हैं:
- ऋण पात्रता और उत्पाद
- EMI गणना
- क्रेडिट स्कोर में सुधार
- वित्तीय योजना
- सरकारी वित्तीय योजनाएं

महत्वपूर्ण नियम:
1. हमेशा तथ्यात्मक रहें और अनुमान से बचें
2. यदि विशिष्ट ऋण अनुमोदन के बारे में पूछा जाए, तो गणना के लिए आवश्यक विवरण मांगें
3. व्यावहारिक, कार्यान्वयन योग्य सलाह प्रदान करें
4. प्रासंगिक पात्रता आवश्यकताओं का उल्लेख करें
5. यह सलाह दें कि वास्तविक अनुमोदन बैंक के पूर्ण मूल्यांकन पर निर्भर करता है`,
  };

  /**
   * Generate system prompt for finance advice
   */
  getSystemPrompt(language: 'en' | 'hi' = 'en'): string {
    return this.systemPrompts[language] || this.systemPrompts.en;
  }

  /**
   * Create context-aware prompt for specific questions
   */
  createContextualPrompt(
    userMessage: string,
    context: FinanceContext,
    language: 'en' | 'hi' = 'en'
  ): string {
    let prompt = this.getSystemPrompt(language);

    // Add user context if available
    if (context.userProfile) {
      if (language === 'en') {
        prompt += `\n\nUSER CONTEXT:
- Age: ${context.userProfile.age || 'Not provided'}
- Monthly Income: ${context.userProfile.income ? `₹${context.userProfile.income}` : 'Not provided'}
- Credit Score: ${context.userProfile.creditScore || 'Not provided'}`;
      } else {
        prompt += `\n\nउपयोगकर्ता संदर्भ:
- आयु: ${context.userProfile.age || 'प्रदान नहीं की गई'}
- मासिक आय: ${context.userProfile.income ? `₹${context.userProfile.income}` : 'प्रदान नहीं की गई'}
- क्रेडिट स्कोर: ${context.userProfile.creditScore || 'प्रदान नहीं की गई'}`;
      }
    }

    return prompt;
  }

  /**
   * Generate EMI explanation
   */
  generateEMIExplanation(
    principalAmount: number,
    interestRate: number,
    tenureMonths: number,
    language: 'en' | 'hi' = 'en'
  ): string {
    const monthlyRate = interestRate / 100 / 12;
    const emi =
      (principalAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);

    const totalAmount = emi * tenureMonths;
    const totalInterest = totalAmount - principalAmount;

    if (language === 'en') {
      return `📊 **EMI CALCULATION SUMMARY**

💰 Loan Amount: ₹${principalAmount.toLocaleString('en-IN')}
📈 Annual Interest Rate: ${interestRate}%
⏱️ Loan Tenure: ${tenureMonths} months (${(tenureMonths / 12).toFixed(1)} years)

**Monthly EMI: ₹${Math.round(emi).toLocaleString('en-IN')}**

Total Amount Payable: ₹${Math.round(totalAmount).toLocaleString('en-IN')}
Total Interest: ₹${Math.round(totalInterest).toLocaleString('en-IN')}

**Key Points:**
- This is an approximate calculation
- Actual EMI may vary based on bank policies
- Prepayment penalties may apply
- Interest rate depends on your credit profile
- Consider your monthly budget before applying`;
    } else {
      return `📊 **EMI गणना सारांश**

💰 ऋण राशि: ₹${principalAmount.toLocaleString('en-IN')}
📈 वार्षिक ब्याज दर: ${interestRate}%
⏱️ ऋण अवधि: ${tenureMonths} महीने (${(tenureMonths / 12).toFixed(1)} वर्ष)

**मासिक EMI: ₹${Math.round(emi).toLocaleString('en-IN')}**

कुल देय राशि: ₹${Math.round(totalAmount).toLocaleString('en-IN')}
कुल ब्याज: ₹${Math.round(totalInterest).toLocaleString('en-IN')}

**मुख्य बिंदु:**
- यह एक अनुमानित गणना है
- वास्तविक EMI बैंक की नीति के आधार पर भिन्न हो सकता है
- पूर्व भुगतान दंड लागू हो सकते हैं`;
    }
  }

  /**
   * Generate credit score improvement advice
   */
  generateCreditScoreAdvice(currentScore: number, language: 'en' | 'hi' = 'en'): string {
    if (language === 'en') {
      let advice = '📈 **CREDIT SCORE IMPROVEMENT STRATEGY**\n\n';

      if (currentScore < 600) {
        advice += `Your current score (${currentScore}) is below average. Here's your action plan:\n\n`;
        advice += `**URGENT (Next 1-2 months):**
1. ✅ Pay all bills on time - Set automatic reminders
2. ✅ Pay down credit card balances - Target < 30% utilization
3. ✅ Check CIBIL report for errors - Dispute inaccuracies
4. ✅ Reduce loan applications - Stop making hard inquiries

**SHORT TERM (3-6 months):**
5. Maintain low credit utilization
6. Diversify credit mix (cards, personal loans, auto loans)
7. Clear any collections or defaults
8. Contact creditors to negotiate on old debts`;
      } else if (currentScore < 700) {
        advice += `Your current score (${currentScore}) is fair. Improvement possible:\n\n`;
        advice += `1. 📌 Maintain consistent payment history
2. 📌 Keep credit cards active but use sparingly
3. 📌 Aim for <30% credit utilization
4. 📌 Avoid multiple loan applications
5. 📌 Check report annually for errors`;
      } else if (currentScore < 750) {
        advice += `Your current score (${currentScore}) is good. To reach excellent:\n\n`;
        advice += `1. ✨ Keep perfect payment record
2. ✨ Maintain low credit utilization (<10%)
3. ✨ Keep old accounts active (credit history length matters)
4. ✨ Use credit cards regularly but pay full balance`;
      } else {
        advice += `🎉 Your current score (${currentScore}) is excellent! 
You should qualify for premium loan rates. Maintain:
- Perfect payment history
- Low credit utilization
- Regular monitoring`;
      }

      return advice;
    } else {
      // Hindi version
      let advice = '📈 **क्रेडिट स्कोर सुधार रणनीति**\n\n';
      if (currentScore < 600) {
        advice += `आपका वर्तमान स्कोर (${currentScore}) औसत से नीचे है।\n`;
        advice += `आवश्यक कदम:
1. सभी बिलों का समय पर भुगतान करें
2. क्रेडिट कार्ड का कम उपयोग करें
3. CIBIL रिपोर्ट की जांच करें
4. नए ऋण के लिए आवेदन रोकें`;
      }
      return advice;
    }
  }

  /**
   * Generate document requirement advice
   */
  generateDocumentAdvice(loanType: string, language: 'en' | 'hi' = 'en'): string {
    const documents = {
      personal: {
        en: ['Identity Proof (Aadhar/PAN/Passport)', 'Address Proof (Recent utility bills)', 'Bank Statements (Last 6 months)', 'Income Proof (Salary slip/IT returns)', 'Employment Letter'],
        hi: ['पहचान प्रमाण (आधार/PAN/पासपोर्ट)', 'पता प्रमाण (हाल की बिल)', 'बैंक विवरण (पिछले 6 महीने)', 'आय प्रमाण (वेतन पर्ची/IT रिटर्न)', 'रोजगार पत्र'],
      },
      home: {
        en: ['All of Personal + Property documents', 'Property papers', 'Property valuation report', 'NOC from society', 'Insurance certificate'],
        hi: ['सभी व्यक्तिगत दस्तावेज + संपत्ति दस्तावेज', 'संपत्ति के कागज', 'संपत्ति मूल्यांकन रिपोर्ट'],
      },
    };

    const docList = documents[loanType as keyof typeof documents]?.[language as 'en' | 'hi'] || documents.personal[language as 'en' | 'hi'];

    const title = language === 'en' ? '📋 REQUIRED DOCUMENTS' : '📋 आवश्यक दस्तावेज';
    return `${title}\n\n${docList.map((doc, i) => `${i + 1}. ${doc}`).join('\n')}`;
  }
}

// Singleton instance
let financeAdvisorInstance: FinanceAdvisorAgent | null = null;

export function getFinanceAdvisorAgent(): FinanceAdvisorAgent {
  if (!financeAdvisorInstance) {
    financeAdvisorInstance = new FinanceAdvisorAgent();
  }
  return financeAdvisorInstance;
}
