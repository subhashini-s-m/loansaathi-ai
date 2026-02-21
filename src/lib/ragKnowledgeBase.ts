/**
 * RAG (Retrieval-Augmented Generation) Knowledge Base
 * Retrieves relevant financial and loan information to provide context for AI responses
 */

export interface KnowledgeBase {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords: string[];
  relevanceScore?: number;
}

const FINANCIAL_KNOWLEDGE_BASE: KnowledgeBase[] = [
  {
    id: 'credit_score_101',
    category: 'Credit Score',
    title: 'Understanding Credit Scores',
    content: `A credit score (300-900) reflects your creditworthiness. 
    - 750-900: Excellent credit
    - 650-749: Good credit
    - 550-649: Fair credit
    - Below 550: Poor credit
    
    Factors affecting credit score:
    - Payment history (35%)
    - Credit utilization (30%)
    - Credit mix (15%)
    - Length of credit history (10%)
    - Hard inquiries (10%)
    
    Tips to improve: Pay bills on time, reduce credit card usage, diversify credit types, and don't close old accounts.`,
    keywords: ['credit', 'score', 'creditworthiness', 'improve', '900', '550'],
  },
  {
    id: 'emi_calculation',
    category: 'EMI & Calculations',
    title: 'How EMI (Equated Monthly Installment) Works',
    content: `EMI is the fixed monthly payment towards a loan.
    
    Formula: EMI = [P × r × (1+r)^n] / [(1+r)^n - 1]
    Where: P = Principal, r = Monthly interest rate, n = Number of months
    
    Example: For a ₹10 lakh loan at 8% annual interest for 5 years (60 months):
    - Monthly interest rate = 8% / 12 = 0.67%
    - EMI ≈ ₹20,138
    
    Higher loan amount or interest rate increases EMI.
    Longer tenure reduces monthly EMI but increases total interest paid.
    
    Use EMI calculators to estimate your commitment before applying.`,
    keywords: ['emi', 'calculation', 'monthly', 'payment', 'installment', 'interest'],
  },
  {
    id: 'debt_to_income',
    category: 'Financial Health',
    title: 'Debt-to-Income Ratio Explained',
    content: `DTI ratio measures total monthly debt payments vs. gross monthly income.
    
    Formula: DTI = Total Monthly Debt Payments / Gross Monthly Income
    
    Ideal DTI: Below 36%
    Acceptable DTI: 36-50%
    High DTI: Above 50%
    
    Example: Monthly income ₹60,000, existing EMI ₹15,000, new EMI ₹12,000
    DTI = (₹15,000 + ₹12,000) / ₹60,000 = 45% (acceptable)
    
    Banks typically approve loans when DTI remains below 50%.
    To improve DTI: Increase income or reduce existing debt.`,
    keywords: ['debt', 'income', 'ratio', 'dti', 'financial', 'health'],
  },
  {
    id: 'loan_types',
    category: 'Loan Types',
    title: 'Types of Loans Available in India',
    content: `1. Personal Loans: Unsecured, flexible use, 12-60 months, interest 8-18%
    2. Home Loans: Secured by property, long tenure 15-30 years, interest 6.5-8%
    3. Auto Loans: Secured by vehicle, 24-84 months, interest 7-12%
    4. Education Loans: For higher studies, 15 years tenure, interest 6-10%
    5. Business Loans: For entrepreneurs, 3-5 years, interest 12-18%
    6. Gold Loans: Against gold, quick approval, interest 10-15%
    7. Credit Card: Revolving credit, 40-50 days interest-free period
    
    Choose based on need, repayment capacity, collateral availability, and interest rates.`,
    keywords: ['loan', 'types', 'personal', 'home', 'auto', 'education', 'business'],
  },
  {
    id: 'loan_eligibility',
    category: 'Eligibility',
    title: 'General Loan Eligibility Criteria',
    content: `Most banks require:
    1. Age: 21-65 years (some allow up to 70)
    2. Income: Minimum ₹15,000-₹25,000 monthly
    3. Credit Score: Minimum 650 (750+ preferred)
    4. Employment: Stable for minimum 2 years
    5. No defaults or legal issues
    6. Debt-to-income ratio: Below 50%
    7. Identity & address proof
    8. Bank statements (last 6-12 months)
    9. Income proof (salary slip, ITR, business docs)
    
    Self-employed may need: Last 2 years ITR, profit & loss statement, business registration.`,
    keywords: ['eligibility', 'criteria', 'requirements', 'age', 'income', 'credit'],
  },
  {
    id: 'documents_required',
    category: 'Documentation',
    title: 'Required Documents for Loan Application',
    content: `Essential documents:
    1. Identity Proof: Aadhar, PAN, Passport, Driving License
    2. Address Proof: Recent utility bill, rental agreement, property papers
    3. Income Proof: Last 3 salary slips (salaried), last 2 years ITR (self-employed)
    4. Bank Statements: 6-12 months for account stability
    5. Employment Proof: Offer letter, appointment letter (if changed recently)
    
    For home loans also need: Property documents, property valuation report, builder details
    For business loans: Business registration, partnership deed, shop registration, profit & loss statement
    
    Keep digital copies ready for faster processing.`,
    keywords: ['documents', 'required', 'proof', 'identity', 'income', 'application'],
  },
  {
    id: 'credit_history',
    category: 'Credit Basics',
    title: 'Importance of Credit History',
    content: `Credit history is a record of your borrowing and repayment behavior.
    
    Good credit history shows:
    - On-time payments
    - Responsible credit usage
    - Low default rates
    - Diverse credit types
    
    Bad credit history includes:
    - Late payments or defaults
    - High credit card balances
    - Frequent loan rejections
    - Bankruptcy or legal action
    
    Banks use credit reports from CIBIL, Experian, Equifax, and HighMark.
    Check your credit report annually at CIBIL.com (free once a year).
    Dispute errors immediately to protect your score.`,
    keywords: ['credit', 'history', 'report', 'cibil', 'payment', 'default'],
  },
  {
    id: 'interest_rates',
    category: 'Interest & Rates',
    title: 'Understanding Interest Rates on Loans',
    content: `Interest is the cost of borrowing money.
    
    Fixed Rate: Same throughout the loan tenure (predictable EMI)
    Floating Rate: Changes with market conditions (can increase/decrease)
    
    Factors affecting interest rate:
    1. Credit Score: Higher score = Lower rate
    2. Loan Type: Secured loans have lower rates than unsecured
    3. Loan Amount: Larger amounts sometimes have lower rates
    4. Tenure: Longer tenure may have higher rates
    5. Market Rates: Influenced by RBI's repo rate
    6. Bank's Policy: Competition affects rates
    
    Example: ₹5 lakh at 10% fixed for 5 years = Total interest ₹1.37 lakh
    
    Compare rates across banks before choosing - even 1% difference saves ₹50,000+.`,
    keywords: ['interest', 'rate', 'fixed', 'floating', 'cost', 'percentage'],
  },
  {
    id: 'loan_approval_factors',
    category: 'Approval',
    title: 'Factors Affecting Loan Approval',
    content: `Banks evaluate multiple factors:
    
    Financial Factors (70%):
    - Credit score & history
    - Income & stability
    - Debt-to-income ratio
    - Savings & emergency fund
    - Existing liabilities
    
    Personal Factors (20%):
    - Age & employment type
    - Job stability (minimum 2 years)
    - Education level
    - Residence stability
    
    External Factors (10%):
    - Economic conditions
    - Bank's lending policies
    - Sector-specific risks
    - Regulatory requirements
    
    To increase approval chances:
    1. Build credit score above 750
    2. Maintain stable income for 2+ years
    3. Keep DTI below 50%
    4. Save 6+ months emergency fund
    5. Apply to banks matching your profile
    6. Provide complete documentation upfront`,
    keywords: ['approval', 'chances', 'factors', 'factors', 'loan', 'eligibility'],
  },
  {
    id: 'debt_management',
    category: 'Financial Planning',
    title: 'Strategies for Debt Management',
    content: `1. Snowball Method: Pay smallest debt first, then move to larger ones (psychological wins)
    2. Avalanche Method: Pay highest interest rate debt first (saves money mathematically)
    3. Debt Consolidation: Combine multiple debts into one loan with lower interest
    4. Balance Transfer: Move high-interest credit card debt to lower-rate card
    5. Refinancing: Replace old loan with new one at better terms
    
    Best practices:
    - Create a debt payoff plan
    - Set realistic timelines
    - Avoid taking on new debt
    - Build emergency fund alongside repayment
    - Consider debt counseling if overwhelmed
    
    Avoid: Payday loans, predatory lending, missed payments.`,
    keywords: ['debt', 'management', 'strategy', 'payoff', 'consolidation', 'refinance'],
  },
];

/**
 * Retrieve relevant knowledge base entries based on query
 */
export function retrieveRelevantKnowledge(query: string, limit: number = 3): KnowledgeBase[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);

  // Score each knowledge base entry
  const scored = FINANCIAL_KNOWLEDGE_BASE.map(kb => {
    let score = 0;

    // Keywords match
    kb.keywords.forEach(keyword => {
      queryWords.forEach(word => {
        if (keyword.includes(word) || word.includes(keyword)) {
          score += 10;
        }
      });
    });

    // Title match
    if (kb.title.toLowerCase().includes(queryLower)) {
      score += 15;
    }

    // Content match
    queryWords.forEach(word => {
      if (kb.content.toLowerCase().includes(word)) {
        score += 2;
      }
    });

    return { ...kb, relevanceScore: score };
  });

  // Sort by relevance and return top matches
  return scored
    .filter(kb => kb.relevanceScore! > 0)
    .sort((a, b) => b.relevanceScore! - a.relevanceScore!)
    .slice(0, limit);
}

/**
 * Generate RAG context for LLM prompt
 * This context is injected into the system prompt to ground responses
 */
export function generateRAGContext(query: string, language: 'en' | 'hi' | 'ta' = 'en'): string {
  const relevantDocs = retrieveRelevantKnowledge(query, 2);

  if (relevantDocs.length === 0) {
    return '';
  }

  const context = relevantDocs
    .map(doc => `\n## ${doc.title}\n${doc.content}`)
    .join('\n---');

  const headers = {
    en: 'Reference Financial Information',
    hi: 'संदर्भ वित्तीय जानकारी',
    ta: 'குறிப்பு நிதி தகவல்',
  };

  return `\n\n[${headers[language]}]\n${context}`;
}

/**
 * Get all available knowledge categories
 */
export function getKnowledgeCategories(): string[] {
  return [...new Set(FINANCIAL_KNOWLEDGE_BASE.map(kb => kb.category))];
}

/**
 * Get knowledge base entries by category
 */
export function getKnowledgeByCategory(category: string): KnowledgeBase[] {
  return FINANCIAL_KNOWLEDGE_BASE.filter(kb => kb.category === category);
}
