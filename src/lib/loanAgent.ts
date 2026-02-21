/**
 * Loan Agentic AI - Conversational Eligibility Assessment
 * Features: Multi-stage questioning, comprehensive validation, error recovery, multilingual support
 */

import { calculateLoanResult } from '@/utils/loanCalculator';
import type { LoanFormData, AnalysisResult } from '@/types/loan';

// Structured logging
const logger = {
  debug: (msg: string, data?: any) => console.debug(`[Agent] ${msg}`, data || ''),
  info: (msg: string, data?: any) => console.log(`[Agent] ✓ ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[Agent] ⚠ ${msg}`, data || ''),
  error: (msg: string, err?: any) => console.error(`[Agent] ✗ ${msg}`, err || ''),
};

type StageType = 'personal' | 'employment' | 'financial' | 'loan_details' | 'assets';

interface AgentState {
  currentStage: StageType;
  collectedData: Partial<LoanFormData>;
  questionsAsked: number;
  responses: string[];
}

interface AgentResponse {
  message: string;
  isQuestion: boolean;
  stage: string;
  collectedFields: string[];
  isComplete: boolean;
  comprehensiveReport?: AnalysisResult;
}

const QUESTION_SEQUENCES = {
  personal: [
    { field: 'age', question: 'What is your age?', validator: (val: any) => val && !isNaN(val) && val > 18 && val < 70 },
    { field: 'gender', question: 'What is your gender? (Male/Female/Other)', validator: (val: any) => val && typeof val === 'string' },
    { field: 'marital_status', question: 'What is your marital status? (Single/Married/Divorced/Widowed)', validator: (val: any) => val && typeof val === 'string' },
    { field: 'education', question: 'What is your education level? (10th/12th/Graduate/Post Graduate)', validator: (val: any) => val && typeof val === 'string' },
    { field: 'location_state', question: 'Which state are you from?', validator: (val: any) => val && typeof val === 'string' },
  ],
  employment: [
    { field: 'job_type', question: 'What is your employment type? (Salaried/Self-employed/Business/Freelance)', validator: (val: any) => val && typeof val === 'string' },
    { field: 'employer_name', question: 'What is your employer/company name?', validator: (val: any) => val && typeof val === 'string' },
    { field: 'years_experience', question: 'How many years of experience do you have?', validator: (val: any) => val && !isNaN(val) && val >= 0 },
    { field: 'income_stability', question: 'How stable is your income? (Very Stable/Stable/Moderate/Unstable)', validator: (val: any) => val && typeof val === 'string' },
  ],
  financial: [
    { field: 'monthly_income', question: 'What is your monthly income (in ₹)?', validator: (val: any) => val && !isNaN(val) && val > 0 },
    { field: 'monthly_savings', question: 'How much do you save monthly (in ₹)?', validator: (val: any) => val && !isNaN(val) && val >= 0 },
    { field: 'monthly_rent', question: 'What are your monthly rent/mortgage payments (in ₹)?', validator: (val: any) => val && !isNaN(val) && val >= 0 },
    { field: 'total_monthly_expenses', question: 'What are your total monthly expenses (in ₹)?', validator: (val: any) => val && !isNaN(val) && val > 0 },
    { field: 'existing_loans', question: 'How many active loans do you currently have?', validator: (val: any) => val && !isNaN(val) && val >= 0 },
    { field: 'credit_score', question: 'What is your credit score? (300-900)', validator: (val: any) => val && !isNaN(val) && val >= 300 && val <= 900 },
    { field: 'bank_balance', question: 'What is your current bank balance (in ₹)?', validator: (val: any) => val && !isNaN(val) && val >= 0 },
  ],
  loan_details: [
    { field: 'loan_amount', question: 'How much loan do you need (in ₹)?', validator: (val: any) => val && !isNaN(val) && val > 0 },
    { field: 'loan_purpose', question: 'What is the loan purpose? (Personal/Home/Auto/Education/Business/Other)', validator: (val: any) => val && typeof val === 'string' },
    { field: 'loan_tenure', question: 'What tenure do you prefer (in months)?', validator: (val: any) => val && !isNaN(val) && val > 0 && val <= 360 },
  ],
  assets: [
    { field: 'owns_house', question: 'Do you own a house? (Yes/No)', validator: (val: any) => val !== null && typeof val === 'boolean' },
    { field: 'owns_car', question: 'Do you own a vehicle? (Yes/No)', validator: (val: any) => val !== null && typeof val === 'boolean' },
    { field: 'has_investments', question: 'Do you have investments? (Yes/No)', validator: (val: any) => val !== null && typeof val === 'boolean' },
  ],
};

export class LoanAgent {
  private state: AgentState = {
    currentStage: 'personal',
    collectedData: {},
    questionsAsked: 0,
    responses: [],
  };

  private stageOrder: Array<StageType> = [
    'personal',
    'employment',
    'financial',
    'loan_details',
    'assets',
  ];

  constructor() {
    this.state = {
      currentStage: 'personal',
      collectedData: {},
      questionsAsked: 0,
      responses: [],
    };
  }

  /**
   * Get current state
   */
  getState(): AgentState {
    return { ...this.state };
  }

  /**
   * Process user input and advance conversation
   */
  processInput(input: string, language: 'en' | 'hi' | 'ta' = 'en'): AgentResponse {
    // Get current question sequence
    const stageQuestions = QUESTION_SEQUENCES[this.state.currentStage];

    // Find which question we're on
    const questionsInStage = Object.keys(this.state.collectedData).filter(k =>
      stageQuestions.some(q => q.field === k)
    ).length;

    if (questionsInStage < stageQuestions.length) {
      // Still have questions in this stage
      const currentQuestion = stageQuestions[questionsInStage];

      // Validate input
      if (currentQuestion.validator(input)) {
        // Parse and store response
        const parsedValue = this.parseInput(currentQuestion.field, input);
        (this.state.collectedData as any)[currentQuestion.field] = parsedValue;
        this.state.responses.push(input);

        // Check if stage is complete
        const completedInStage = Object.keys(this.state.collectedData).filter(k =>
          stageQuestions.some(q => q.field === k)
        ).length;

        if (completedInStage === stageQuestions.length) {
          // Move to next stage
          const currentStageIndex = this.stageOrder.indexOf(this.state.currentStage);
          if (currentStageIndex < this.stageOrder.length - 1) {
            this.state.currentStage = this.stageOrder[currentStageIndex + 1];
            return this.getNextQuestion(language);
          } else {
            // All stages complete
            return this.generateReport(language);
          }
        }

        // Get next question in same stage
        return this.getNextQuestion(language);
      } else {
        // Invalid input - ask again with validation message
        return {
          message: this.getValidationMessage(currentQuestion.field, language),
          isQuestion: true,
          stage: this.state.currentStage,
          collectedFields: Object.keys(this.state.collectedData),
          isComplete: false,
        };
      }
    }

    // No more questions in current stage - move to next
    const currentStageIndex = this.stageOrder.indexOf(this.state.currentStage);
    if (currentStageIndex < this.stageOrder.length - 1) {
      this.state.currentStage = this.stageOrder[currentStageIndex + 1];
      return this.getNextQuestion(language);
    }

    return this.generateReport(language);
  }

  /**
   * Get next question for current stage
   */
  private getNextQuestion(language: 'en' | 'hi' | 'ta'): AgentResponse {
    const stageQuestions = QUESTION_SEQUENCES[this.state.currentStage];
    const questionsAnswered = Object.keys(this.state.collectedData).filter(k =>
      stageQuestions.some(q => q.field === k)
    ).length;

    if (questionsAnswered < stageQuestions.length) {
      const nextQuestion = stageQuestions[questionsAnswered];
      const progressText = `(${questionsAnswered + 1}/${stageQuestions.length})`;

      return {
        message: `${nextQuestion.question} ${progressText}`,
        isQuestion: true,
        stage: this.state.currentStage,
        collectedFields: Object.keys(this.state.collectedData),
        isComplete: false,
      };
    }

    return this.generateReport(language);
  }

  /**
   * Parse input based on field type
   */
  private parseInput(field: string, input: string): any {
    const booleanFields = ['owns_house', 'owns_car', 'has_investments'];
    const numberFields = ['age', 'years_experience', 'monthly_income', 'monthly_savings', 'monthly_rent', 'total_monthly_expenses', 'existing_loans', 'credit_score', 'bank_balance', 'loan_amount', 'loan_tenure'];

    if (booleanFields.includes(field)) {
      return input.toLowerCase() === 'yes' || input.toLowerCase() === 'y';
    } else if (numberFields.includes(field)) {
      return parseInt(input, 10);
    }

    return input;
  }

  /**
   * Get validation error message
   */
  private getValidationMessage(field: string, language: 'en' | 'hi' | 'ta'): string {
    const hints = {
      en: {
        age: 'Please enter a valid age between 18 and 70 years',
        gender: 'Please choose from: Male, Female, or Other',
        marital_status: 'Please choose from: Single, Married, Divorced, or Widowed',
        education: 'Please choose from: 10th, 12th, Graduate, or Post Graduate',
        location_state: 'Please enter a valid state name',
        job_type: 'Please choose from: Salaried, Self-employed, Business, or Freelance',
        employer_name: 'Please enter your company or employer name',
        years_experience: 'Please enter the number of years (must be 0 or positive)',
        income_stability: 'Please choose from: Very Stable, Stable, Moderate, or Unstable',
        monthly_income: 'Please enter a valid monthly income amount (in ₹)',
        monthly_savings: 'Please enter a valid savings amount (in ₹)',
        monthly_rent: 'Please enter a valid rent/mortgage amount (in ₹)',
        total_monthly_expenses: 'Please enter your total monthly expenses (in ₹)',
        existing_loans: 'Please enter the number of active loans (must be 0 or positive)',
        credit_score: 'Please enter a credit score between 300 and 900',
        bank_balance: 'Please enter your bank balance (in ₹)',
        loan_amount: 'Please enter the loan amount needed (in ₹)',
        loan_purpose: 'Please choose from: Personal, Home, Auto, Education, Business, or Other',
        loan_tenure: 'Please enter tenure in months (1-360)',
        owns_house: 'Please answer with Yes or No',
        owns_car: 'Please answer with Yes or No',
        has_investments: 'Please answer with Yes or No',
      },
      hi: {
        age: 'कृपया 18 से 70 वर्ष के बीच की वैध आयु दर्ज करें',
        gender: 'कृपया चुनें: पुरुष, महिला, या अन्य',
        marital_status: 'कृपया चुनें: अविवाहित, विवाहित, तलाकशुदा, या विधवा',
        credit_score: 'कृपया 300 से 900 के बीच क्रेडिट स्कोर दर्ज करें',
        monthly_income: 'कृपया एक वैध मासिक आय राशि दर्ज करें',
      },
      ta: {
        age: 'தயவுசெய்து 18 முதல் 70 வயதுக்கு இடையில் உள்ள செல்லுபடியாகும் வயதை உள்ளிடவும்',
        gender: 'தயவுசெய்து தேர்ந்தெடுக்கவும்: ஆண், பெண், அல்லது பிறர்',
        monthly_income: 'தயவுசெய்து செல்லுபடியாகும் மாதாந்த வருமான தொகையை உள்ளிடவும்',
      },
    };

    // Get the appropriate hint
    const langHints = hints[language] || hints.en;
    const hint = (langHints as any)[field] || `Please provide a valid ${field}`;
    
    // Get the original question to ask again
    const stageQuestions = QUESTION_SEQUENCES[this.state.currentStage];
    const currentQuestion = stageQuestions.find(q => q.field === field);
    
    if (currentQuestion) {
      const errorMessages = {
        en: `❌ ${hint}\n\n${currentQuestion.question}`,
        hi: `❌ ${hint}\n\n${currentQuestion.question}`,
        ta: `❌ ${hint}\n\n${currentQuestion.question}`,
      };
      return errorMessages[language];
    }

    return `❌ ${hint}`;
  }

  /**
   * Generate comprehensive report
   */
  private generateReport(language: 'en' | 'hi' | 'ta'): AgentResponse {
    // Fill in defaults for missing fields
    const completeData: LoanFormData = {
      age: (this.state.collectedData.age as number) || 30,
      gender: (this.state.collectedData.gender as string) || 'Male',
      marital_status: (this.state.collectedData.marital_status as string) || 'Married',
      family_members: 1,
      dependent_children: 0,
      education: (this.state.collectedData.education as string) || 'Graduate',
      location_city: 'Mumbai',
      location_state: (this.state.collectedData.location_state as string) || 'Maharashtra',
      job_type: (this.state.collectedData.job_type as string) || 'Salaried',
      employer_name: (this.state.collectedData.employer_name as string) || 'Private Company',
      years_experience: (this.state.collectedData.years_experience as number) || 2,
      income_stability: (this.state.collectedData.income_stability as string) || 'Stable',
      secondary_income: false,
      monthly_income: (this.state.collectedData.monthly_income as number) || 50000,
      monthly_savings: (this.state.collectedData.monthly_savings as number) || 10000,
      monthly_rent: (this.state.collectedData.monthly_rent as number) || 8000,
      total_monthly_expenses: (this.state.collectedData.total_monthly_expenses as number) || 25000,
      existing_loans: (this.state.collectedData.existing_loans as number) || 0,
      credit_score: (this.state.collectedData.credit_score as number) || 650,
      bank_balance: (this.state.collectedData.bank_balance as number) || 100000,
      has_investments: (this.state.collectedData.has_investments as boolean) || false,
      owns_house: (this.state.collectedData.owns_house as boolean) || false,
      property_value: 0,
      owns_car: (this.state.collectedData.owns_car as boolean) || false,
      car_year: 0,
      has_health_insurance: false,
      has_life_insurance: false,
      has_vehicle_insurance: false,
      loan_amount: (this.state.collectedData.loan_amount as number) || 300000,
      loan_purpose: (this.state.collectedData.loan_purpose as string) || 'Personal',
      co_borrower: (this.state.collectedData.co_borrower as string) || 'None',
      loan_tenure: (this.state.collectedData.loan_tenure as number) || 60,
      has_collateral: false,
    };

    const loanResult = calculateLoanResult(completeData);
    const approvalProb = loanResult.approvalProbability;

    const comprehensiveReport: AnalysisResult = {
      approval_probability: approvalProb,
      risk_category: loanResult.riskCategory,
      financial_health_score: Math.round((approvalProb / 95) * 100),
      debt_to_income_ratio: Math.round(
        (((this.state.collectedData.existing_loans as number) || 0) * 5000) /
          ((this.state.collectedData.monthly_income as number) || 50000) * 100
      ),
      emi_affordability: loanResult.bankFit === 'Good' ? 'High' : loanResult.bankFit === 'Moderate' ? 'Moderate' : 'Low',
      summary: this.getAssessmentSummary(approvalProb, language),
      factors: loanResult.factors,
      roadmap: loanResult.roadmap,
      recommended_banks: loanResult.recommendedBanks,
      eligibility_gaps: [],
      improvement_suggestions: [],
      readiness: {
        can_apply_now: approvalProb >= 40,
        wait_days: approvalProb < 40 ? 30 : 0,
        reasons: approvalProb >= 40 ? ['✓ Ready to apply'] : ['⚠ Wait 30 days to improve profile'],
      },
      documents_needed: ['PAN Card', 'Aadhaar', 'Bank Statements (3 months)', 'Salary Slips (3 months)'],
    };

    const messages = {
      en: `✅ **Assessment Complete!**\n\n📊 **Approval Probability:** ${approvalProb}%\n🎯 **Risk Level:** ${loanResult.riskCategory}\n💪 **Financial Health:** ${comprehensiveReport.financial_health_score}/100\n💰 **EMI Affordability:** ${comprehensiveReport.emi_affordability}`,
      hi: `✅ **आकलन पूर्ण!**\n\n📊 **स्वीकृति की संभावना:** ${approvalProb}%\n🎯 **जोखिम स्तर:** ${loanResult.riskCategory}\n💪 **वित्तीय स्वास्थ्य:** ${comprehensiveReport.financial_health_score}/100\n💰 **EMI सामर्थ्य:** ${comprehensiveReport.emi_affordability}`,
      ta: `✅ **மதிப்பீடு முடிந்தது!**\n\n📊 **அனுமதி நிகழ்தகவு:** ${approvalProb}%\n🎯 **ஜோக்கிம் நிலை:** ${loanResult.riskCategory}\n💪 **நிதி ஆரோக்கியம்:** ${comprehensiveReport.financial_health_score}/100\n💰 **EMI சமர்த்தம்:** ${comprehensiveReport.emi_affordability}`,
    };

    return {
      message: messages[language],
      isQuestion: false,
      stage: 'complete',
      collectedFields: Object.keys(this.state.collectedData),
      isComplete: true,
      comprehensiveReport,
    };
  }

  /**
   * Get assessment summary
   */
  private getAssessmentSummary(probability: number, language: 'en' | 'hi' | 'ta'): string {
    const summaries = {
      en: probability >= 70
        ? 'Excellent! You have a strong loan profile. Apply now to maximize chances.'
        : probability >= 50
        ? 'Good profile. You are likely to be approved. Consider applying soon.'
        : probability >= 30
        ? 'Fair profile. Improve credit score and income to increase chances.'
        : 'Needs work. Focus on savings and credit score improvement before applying.',
      hi: probability >= 70
        ? 'बहुत अच्छा! आपके पास एक मजबूत ऋण प्रोफाइल है। अभी आवेदन करें।'
        : probability >= 50
        ? 'अच्छा प्रोफाइल। आपको स्वीकृति मिलने की संभावना है।'
        : probability >= 30
        ? 'सामान्य प्रोफाइल। क्रेडिट स्कोर बढ़ाएं।'
        : 'सुधार की जरूरत है। आवेदन से पहले बचत बढ़ाएं।',
      ta: probability >= 70
        ? 'அருமை! உங்களுக்கு வலுவான கடன் சுயவிவரம் உள்ளது.'
        : probability >= 50
        ? 'நல்ல சுயவிவரம். அனுமதி பெற உங்களுக்கு நல்ல வாய்ப்பு உள்ளது.'
        : probability >= 30
        ? 'சாதாரண சுயவிவரம். சிறிய உন்னয்নம் கொண்டு வாய்ப்பு அதிகரிக்கலாம்.'
        : 'முன் சுधार தேவை। முடிந்தளவு பணத் திறன் வளர்த்துகொள்ளுங்கள்।',
    };

    return summaries[language];
  }
}
