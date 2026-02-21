/**
 * Data Extraction Agent - Intelligently extracts financial data from user messages
 * Handles large messages where users dump all their info at once.
 */

import type { LoanFormData } from '@/types/loan';

interface ExtractionResult {
  extracted: Partial<LoanFormData>;
  /** Fields successfully parsed */
  fieldsFound: string[];
  /** Whether the message looks like a loan eligibility query */
  isEligibilityQuery: boolean;
  /** Original text stripped of extracted data for context */
  remainingIntent: string;
}

/**
 * Extract structured financial data from a free-form user message.
 * Handles formats like:
 *   "I earn 50000 per month, age 28, want 5 lakh loan, CIBIL is 720, salaried..."
 */
export function extractFinancialData(message: string): ExtractionResult {
  const data: Partial<LoanFormData> = {};
  const fieldsFound: string[] = [];
  const lower = message.toLowerCase();

  // --- INCOME ---
  const incomePatterns = [
    /(?:i\s+(?:earn|make|get))\s*(?:₹|rs\.?\s*)?(\d[\d,]*)/i,
    /(?:(?:monthly|my)\s+)?(?:income|salary|earning)\s*(?:is|=|:)?\s*(?:₹|rs\.?\s*)?(\d[\d,]*)/i,
    /(?:₹|rs\.?\s*)(\d[\d,]*)\s*(?:per\s+month|monthly|p\.?m\.?|\/month|salary|income)/i,
    /(?:salary|income|earn(?:ing)?)\s*(?:of\s+)?(?:₹|rs\.?\s*)?(\d[\d,]*)/i,
  ];
  for (const pat of incomePatterns) {
    const m = lower.match(pat);
    if (m) {
      const val = parseIndianNumber(m[1]);
      if (val >= 5000 && val <= 50000000) { data.monthly_income = val; fieldsFound.push('monthly_income'); break; }
    }
  }

  // --- LOAN AMOUNT ---
  const loanPatterns = [
    /(?:loan\s*(?:of|for|amount)?)\s*(?:₹|rs\.?\s*)?(\d[\d,]*)\s*(?:lakh|lac)?/i,
    /(?:need|want|borrow|require)\s*(?:₹|rs\.?\s*)?(\d[\d,]*)\s*(?:lakh|lac)?/i,
    /(?:₹|rs\.?\s*)(\d[\d,]*)\s*(?:lakh|lac)?\s*(?:loan|personal\s*loan|home\s*loan)/i,
    /(\d[\d,]*)\s*(?:lakh|lac)\s*(?:loan|rupees?)?/i,
  ];
  for (const pat of loanPatterns) {
    const m = lower.match(pat);
    if (m) {
      let val = parseIndianNumber(m[1]);
      if (lower.includes('lakh') || lower.includes('lac')) val *= 100000;
      if (val >= 10000 && val <= 100000000) { data.loan_amount = val; fieldsFound.push('loan_amount'); break; }
    }
  }

  // --- CREDIT / CIBIL SCORE ---
  const creditPatterns = [
    /(?:cred(?:it)?\s*score|cibil)\s*(?:is|=|:)?\s*(\d{3})/i,
    /(\d{3})\s*(?:cred(?:it)?\s*score|cibil)/i,
    /(?:score\s*(?:is|of)\s*)(\d{3})/i,
  ];
  for (const pat of creditPatterns) {
    const m = lower.match(pat);
    if (m) {
      const val = parseInt(m[1]);
      if (val >= 300 && val <= 900) { data.credit_score = val; fieldsFound.push('credit_score'); break; }
    }
  }

  // --- AGE ---
  const agePatterns = [
    /(?:age|aged?)\s*(?:is|=|:)?\s*(\d{2})/i,
    /(?:i\s*(?:am|'m))\s*(\d{2})\s*(?:years?|yrs?|y\.?o\.?)?/i,
    /(\d{2})\s*(?:years?\s*old|yrs?\s*old)/i,
  ];
  for (const pat of agePatterns) {
    const m = lower.match(pat);
    if (m) {
      const val = parseInt(m[1]);
      if (val >= 18 && val <= 75) { data.age = val; fieldsFound.push('age'); break; }
    }
  }

  // --- JOB TYPE ---
  if (/salaried|government\s*(?:job|employee)|private\s*(?:job|sector)/i.test(lower)) {
    data.job_type = 'Salaried'; fieldsFound.push('job_type');
  } else if (/self[- ]?employed/i.test(lower)) {
    data.job_type = 'Self-employed'; fieldsFound.push('job_type');
  } else if (/business|entrepreneur|owner/i.test(lower)) {
    data.job_type = 'Business'; fieldsFound.push('job_type');
  } else if (/freelanc/i.test(lower)) {
    data.job_type = 'Freelance'; fieldsFound.push('job_type');
  }

  // --- EXISTING LOANS ---
  const loanCountPatterns = [
    /(\d+)\s*(?:existing|active|current|running)\s*(?:loans?|emi)/i,
    /(?:existing|active|current)\s*(?:loans?|emi)\s*(?:is|=|:)?\s*(\d+)/i,
    /(?:no|zero|0)\s*(?:existing|active|current)?\s*(?:loans?|emi|debt)/i,
  ];
  for (const pat of loanCountPatterns) {
    const m = lower.match(pat);
    if (m) {
      if (/no|zero/.test(m[0].toLowerCase())) {
        data.existing_loans = 0; fieldsFound.push('existing_loans'); break;
      }
      const val = parseInt(m[1] || m[2]);
      if (val >= 0 && val <= 20) { data.existing_loans = val; fieldsFound.push('existing_loans'); break; }
    }
  }

  // --- LOAN TENURE ---
  const tenurePatterns = [
    /(\d+)\s*(?:months?|yrs?|years?)\s*(?:tenure|term|period|loan)/i,
    /(?:tenure|term|period)\s*(?:of|is|=|:)?\s*(\d+)\s*(?:months?|yrs?|years?)?/i,
  ];
  for (const pat of tenurePatterns) {
    const m = lower.match(pat);
    if (m) {
      let val = parseInt(m[1] || m[2]);
      if (/years?|yrs?/.test(m[0].toLowerCase())) val *= 12;
      if (val >= 6 && val <= 360) { data.loan_tenure = val; fieldsFound.push('loan_tenure'); break; }
    }
  }

  // --- EXPERIENCE ---
  const expPatterns = [
    /(\d+)\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp|work)/i,
    /(?:experience|working\s+for)\s*(?:of\s+)?(\d+)\s*(?:years?|yrs?)/i,
  ];
  for (const pat of expPatterns) {
    const m = lower.match(pat);
    if (m) {
      const val = parseInt(m[1] || m[2]);
      if (val >= 0 && val <= 50) { data.years_experience = val; fieldsFound.push('years_experience'); break; }
    }
  }

  // --- MONTHLY SAVINGS ---
  const savingsPatterns = [
    /(?:save|savings?)\s*(?:₹|rs\.?\s*)?(\d[\d,]*)\s*(?:per\s*month|monthly|p\.?m\.?)?/i,
    /(?:monthly\s+)?(?:savings?)\s*(?:is|=|:)?\s*(?:₹|rs\.?\s*)?(\d[\d,]*)/i,
  ];
  for (const pat of savingsPatterns) {
    const m = lower.match(pat);
    if (m) {
      const val = parseIndianNumber(m[1] || m[2]);
      if (val >= 0 && val <= 10000000) { data.monthly_savings = val; fieldsFound.push('monthly_savings'); break; }
    }
  }

  // --- MONTHLY EXPENSES ---
  const expensePatterns = [
    /(?:expense|spend|spending)\s*(?:₹|rs\.?\s*)?(\d[\d,]*)\s*(?:per\s*month|monthly)?/i,
    /(?:expenses?|total\s*expenses?)\s*(?:is|=|:)?\s*(?:₹|rs\.?\s*)?(\d[\d,]*)/i,
  ];
  for (const pat of expensePatterns) {
    const m = lower.match(pat);
    if (m) {
      const val = parseIndianNumber(m[1] || m[2]);
      if (val >= 1000 && val <= 10000000) { data.total_monthly_expenses = val; fieldsFound.push('total_monthly_expenses'); break; }
    }
  }

  // --- LOAN PURPOSE ---
  if (/personal\s*loan/i.test(lower)) { data.loan_purpose = 'Personal'; fieldsFound.push('loan_purpose'); }
  else if (/home\s*loan|house\s*loan|housing\s*loan/i.test(lower)) { data.loan_purpose = 'Home'; fieldsFound.push('loan_purpose'); }
  else if (/car\s*loan|auto\s*loan|vehicle\s*loan/i.test(lower)) { data.loan_purpose = 'Auto'; fieldsFound.push('loan_purpose'); }
  else if (/education\s*loan|study\s*loan/i.test(lower)) { data.loan_purpose = 'Education'; fieldsFound.push('loan_purpose'); }
  else if (/business\s*loan/i.test(lower)) { data.loan_purpose = 'Business'; fieldsFound.push('loan_purpose'); }

  // --- EDUCATION ---
  if (/post\s*graduat/i.test(lower)) { data.education = 'Post Graduate'; fieldsFound.push('education'); }
  else if (/graduat/i.test(lower)) { data.education = 'Graduate'; fieldsFound.push('education'); }
  else if (/12th|12 th|hsc|inter/i.test(lower)) { data.education = '12th'; fieldsFound.push('education'); }
  else if (/10th|10 th|ssc|matric/i.test(lower)) { data.education = '10th'; fieldsFound.push('education'); }

  // --- GENDER ---
  if (/\b(male|man)\b/i.test(lower) && !/\bfemale\b/i.test(lower)) { data.gender = 'Male'; fieldsFound.push('gender'); }
  else if (/\b(female|woman)\b/i.test(lower)) { data.gender = 'Female'; fieldsFound.push('gender'); }

  // --- MARITAL STATUS ---
  if (/\bmarried\b/i.test(lower) && !/\bunmarried\b/i.test(lower)) { data.marital_status = 'Married'; fieldsFound.push('marital_status'); }
  else if (/\bsingle\b|\bunmarried\b/i.test(lower)) { data.marital_status = 'Single'; fieldsFound.push('marital_status'); }

  // --- BOOLEAN ASSETS ---
  if (/(?:own|have)\s*(?:a\s+)?(?:house|home|property|flat)/i.test(lower)) { data.owns_house = true; fieldsFound.push('owns_house'); }
  if (/(?:own|have)\s*(?:a\s+)?(?:car|vehicle|bike)/i.test(lower)) { data.owns_car = true; fieldsFound.push('owns_car'); }
  if (/(?:have|hold)\s*(?:investments?|mutual\s*funds?|stocks?|fd|fixed\s*deposit)/i.test(lower)) { data.has_investments = true; fieldsFound.push('has_investments'); }

  // --- DETECT IF THIS IS AN ELIGIBILITY QUERY ---
  const eligibilitySignals = [
    /eligib/i, /approv/i, /qualify/i, /can\s*i\s*get/i, /will\s*i\s*get/i,
    /check.*loan/i, /loan.*check/i, /am\s*i\s*eligible/i, /chances/i,
  ];
  const hasEligibilitySignal = eligibilitySignals.some(p => p.test(lower));
  // Also consider it an eligibility query if user provided 3+ financial fields
  const isDataDump = fieldsFound.length >= 3;
  const isEligibilityQuery = hasEligibilitySignal || isDataDump;

  return {
    extracted: data,
    fieldsFound,
    isEligibilityQuery,
    remainingIntent: message,
  };
}

function parseIndianNumber(str: string): number {
  if (!str) return 0;
  return parseInt(str.replace(/,/g, ''), 10) || 0;
}

/**
 * Get list of missing core fields needed for eligibility check
 */
export function getMissingCoreFields(data: Partial<LoanFormData>): (keyof LoanFormData)[] {
  const coreFields: (keyof LoanFormData)[] = [
    'monthly_income', 'loan_amount', 'credit_score', 'existing_loans',
    'job_type', 'age', 'loan_tenure',
  ];
  return coreFields.filter(f => data[f] == null || data[f] === undefined);
}

/**
 * Format a question asking for a missing field
 */
export function getQuestionForField(field: keyof LoanFormData, lang: 'en' | 'hi' = 'en'): string {
  const questions: Record<string, { en: string; hi: string }> = {
    monthly_income: {
      en: '💰 What is your monthly income (in ₹)? *(e.g., 50000)*',
      hi: '💰 आपकी मासिक आय कितनी है (₹ में)? *(जैसे 50000)*',
    },
    loan_amount: {
      en: '💳 How much loan do you need (in ₹)? *(e.g., 500000 or "5 lakh")*',
      hi: '💳 आपको कितना लोन चाहिए (₹ में)? *(जैसे 500000 या "5 लाख")*',
    },
    credit_score: {
      en: '📊 What is your credit/CIBIL score? *(300-900, e.g., 750)*',
      hi: '📊 आपका क्रेडिट/CIBIL स्कोर क्या है? *(300-900, जैसे 750)*',
    },
    existing_loans: {
      en: '📋 How many active loans do you currently have? *(e.g., 0, 1, 2)*',
      hi: '📋 अभी आपके कितने लोन चल रहे हैं? *(जैसे 0, 1, 2)*',
    },
    job_type: {
      en: '💼 What is your employment type? *(Salaried / Self-employed / Business / Freelance)*',
      hi: '💼 आपकी नौकरी का प्रकार? *(Salaried / Self-employed / Business / Freelance)*',
    },
    age: {
      en: '🎂 What is your age? *(18-70)*',
      hi: '🎂 आपकी उम्र क्या है? *(18-70)*',
    },
    loan_tenure: {
      en: '⏳ Preferred loan tenure in months? *(e.g., 36, 60, 120)*',
      hi: '⏳ लोन का पसंदीदा समय (महीनों में)? *(जैसे 36, 60, 120)*',
    },
  };

  return questions[field]?.[lang] || questions[field]?.en || `Please provide your ${field.replace(/_/g, ' ')}`;
}
