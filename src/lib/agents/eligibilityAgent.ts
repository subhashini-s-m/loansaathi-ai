/**
 * Eligibility Agent - Handles loan eligibility workflow
 */

import type { LoanFormData, AnalysisResult } from '@/types/loan';
import { calculateLoanResult } from '@/utils/loanCalculator';
import { getConversationMemory } from './conversationMemory';

interface EligibilityQuestion {
  field: keyof LoanFormData;
  question: string;
  hint: string;
  examples?: string[];
}

export class EligibilityAgent {
  private requiredFields: (keyof LoanFormData)[] = [
    'monthly_income',
    'loan_amount',
    'credit_score',
    'existing_loans',
    'job_type',
    'age',
    'loan_tenure',
  ];

  private questions: Partial<Record<keyof LoanFormData, EligibilityQuestion>> = {
    monthly_income: {
      field: 'monthly_income',
      question: 'What is your monthly income (in ₹)?',
      hint: 'Enter a number between ₹10,000 - ₹50,00,000',
      examples: ['50000', '100000', '250000'],
    },
    loan_amount: {
      field: 'loan_amount',
      question: 'How much loan do you need (in ₹)?',
      hint: 'Between ₹50,000 - ₹50,00,000',
      examples: ['500000', '1000000', '2500000'],
    },
    credit_score: {
      field: 'credit_score',
      question: 'What is your credit score? (300-900)',
      hint: 'If unknown, we can estimate based on your payment history',
      examples: ['650', '750', '800'],
    },
    existing_loans: {
      field: 'existing_loans',
      question: 'How many active loans do you currently have?',
      hint: 'Include car loans, personal loans, credit cards with pending balance',
      examples: ['0', '1', '2'],
    },
    job_type: {
      field: 'job_type',
      question: 'What is your employment type?',
      hint: 'Choose: Salaried, Self-employed, Business, or Freelance',
      examples: ['Salaried', 'Self-employed'],
    },
    age: {
      field: 'age',
      question: 'What is your age?',
      hint: 'Must be between 18-70 years',
      examples: ['25', '35', '45'],
    },
    loan_tenure: {
      field: 'loan_tenure',
      question: 'What tenure do you prefer (in months)?',
      hint: 'Typically 12-360 months (1-30 years)',
      examples: ['36', '60', '120'],
    },
    gender: {
      field: 'gender',
      question: 'What is your gender? (Male/Female/Other)',
      hint: 'This helps personalize loan recommendations',
      examples: ['Male', 'Female'],
    },
    marital_status: {
      field: 'marital_status',
      question: 'What is your marital status? (Single/Married/Divorced/Widowed)',
      hint: 'This may affect approval odds',
      examples: ['Single', 'Married'],
    },
    education: {
      field: 'education',
      question: 'What is your education level?',
      hint: 'Choose: 10th, 12th, Graduate, Post Graduate',
      examples: ['Graduate', 'Post Graduate'],
    },
    location_state: {
      field: 'location_state',
      question: 'Which state are you from?',
      hint: 'This helps with local bank matching',
      examples: ['Maharashtra', 'Karnataka', 'Delhi'],
    },
    employer_name: {
      field: 'employer_name',
      question: 'What is your company/employer name?',
      hint: 'Or your business name if self-employed',
      examples: ['Google', 'Amazon'],
    },
    years_experience: {
      field: 'years_experience',
      question: 'How many years of experience do you have in your current role?',
      hint: 'Enter 0 if less than 1 year',
      examples: ['2', '5', '10'],
    },
    monthly_savings: {
      field: 'monthly_savings',
      question: 'How much do you save monthly (in ₹)?',
      hint: 'Amount left after all expenses',
      examples: ['5000', '10000', '20000'],
    },
    monthly_rent: {
      field: 'monthly_rent',
      question: 'What are your monthly rent/mortgage payments (in ₹)?',
      hint: 'Or 0 if you own your home',
      examples: ['0', '15000', '25000'],
    },
    total_monthly_expenses: {
      field: 'total_monthly_expenses',
      question: 'What are your total monthly expenses (in ₹)?',
      hint: 'Food, utilities, rent, insurance, etc.',
      examples: ['25000', '50000', '75000'],
    },
    bank_balance: {
      field: 'bank_balance',
      question: 'What is your current bank balance (in ₹)?',
      hint: 'Approximate amount is fine',
      examples: ['50000', '100000', '500000'],
    },
    income_stability: {
      field: 'income_stability',
      question: 'How stable is your income?',
      hint: 'Choose: Very Stable, Stable, Moderate, Unstable',
      examples: ['Stable', 'Very Stable'],
    },
    loan_purpose: {
      field: 'loan_purpose',
      question: 'What is the loan purpose?',
      hint: 'Choose: Personal, Home, Auto, Education, Business',
      examples: ['Personal', 'Home'],
    },
    owns_house: {
      field: 'owns_house',
      question: 'Do you own a house? (Yes/No)',
      hint: 'This increases approval chances',
      examples: ['Yes', 'No'],
    },
    owns_car: {
      field: 'owns_car',
      question: 'Do you own a vehicle? (Yes/No)',
      hint: 'This can be used as collateral',
      examples: ['Yes', 'No'],
    },
    has_investments: {
      field: 'has_investments',
      question: 'Do you have investments? (Yes/No)',
      hint: 'Stocks, mutual funds, etc.',
      examples: ['Yes', 'No'],
    },
    location_city: {
      field: 'location_city',
      question: 'Which city are you from?',
      hint: 'Helps with local bank options',
      examples: ['Mumbai', 'Bangalore'],
    },
    family_members: {
      field: 'family_members',
      question: 'How many family members depend on you?',
      hint: 'Number of dependents',
      examples: ['1', '2', '3'],
    },
    dependent_children: {
      field: 'dependent_children',
      question: 'How many dependent children do you have?',
      hint: 'Number of children',
      examples: ['0', '1', '2'],
    },
    secondary_income: {
      field: 'secondary_income',
      question: 'Do you have secondary income? (Yes/No)',
      hint: 'Side business, rental income, etc.',
      examples: ['Yes', 'No'],
    },
    property_value: {
      field: 'property_value',
      question: 'What is the approximate value of your property (in ₹)?',
      hint: 'If you own real estate',
      examples: ['2000000', '5000000'],
    },
    car_year: {
      field: 'car_year',
      question: 'What year is your vehicle from?',
      hint: 'Year of manufacture',
      examples: ['2020', '2022'],
    },
  };

  /**
   * Get next required question
   */
  getNextQuestion(collectedData: Partial<LoanFormData>): EligibilityQuestion | null {
    const memory = getConversationMemory();
    
    // Check core required fields first
    for (const field of this.requiredFields) {
      if (!collectedData[field]) {
        return this.questions[field] || null;
      }
    }

    // If core fields done, ask secondary fields
    const allFields = Object.keys(this.questions) as (keyof LoanFormData)[];
    for (const field of allFields) {
      if (!collectedData[field] && !this.requiredFields.includes(field)) {
        return this.questions[field] || null;
      }
    }

    return null;
  }

  /**
   * Get missing required fields
   */
  getMissingFields(collectedData: Partial<LoanFormData>): (keyof LoanFormData)[] {
    return this.requiredFields.filter(field => !collectedData[field]);
  }

  /**
   * Check if core fields are collected
   */
  hasRequiredFields(collectedData: Partial<LoanFormData>): boolean {
    return this.requiredFields.every(field => collectedData[field] != null);
  }

  /**
   * Parse and validate user input for a field
   */
  parseInput(field: keyof LoanFormData, input: string): any {
    const booleanFields = ['owns_house', 'owns_car', 'has_investments', 'secondary_income'];
    const numberFields = [
      'monthly_income', 'loan_amount', 'credit_score', 'existing_loans',
      'age', 'loan_tenure', 'years_experience', 'monthly_savings', 'monthly_rent',
      'total_monthly_expenses', 'bank_balance', 'property_value', 'car_year',
      'family_members', 'dependent_children',
    ];

    if (booleanFields.includes(field)) {
      const lowerInput = input.toLowerCase();
      return lowerInput === 'yes' || lowerInput === 'y' || lowerInput === 'true' || lowerInput === 'haan' || lowerInput === 'हाँ';
    } else if (numberFields.includes(field)) {
      // Extract number from various formats: "50000", "50,000", "rs.50000", "50000 rupees", "₹50000"
      // Try multiple patterns
      const patterns = [
        /(?:rs\.?|\₹)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/,  // rs.10000 or ₹10000
        /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rupees?|rs\.?|र[्ु]पये?)/,  // 10000 rupees
        /(\d+(?:,\d{3})*(?:\.\d{2})?)/, // any number
      ];
      
      for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
          const numStr = match[1].replace(/,/g, '');
          const num = parseInt(numStr, 10);
          if (num > 0) return num;
        }
      }
      
      // Fallback: try parsing directly
      const num = parseInt(input.replace(/[^\d]/g, ''), 10);
      if (num > 0) return num;
      
      return NaN;
    }

    return input.trim();
  }

  /**
   * Validate parsed value
   */
  validateField(field: keyof LoanFormData, value: any): { valid: boolean; error?: string } {
    if (value == null || value === '' || Number.isNaN(value)) {
      return { valid: false, error: 'Value cannot be empty' };
    }

    switch (field) {
      case 'age':
        if (typeof value !== 'number' || Number.isNaN(value) || value < 18 || value > 70) {
          return { valid: false, error: 'Age must be between 18-70 years' };
        }
        break;
      case 'credit_score':
        if (typeof value !== 'number' || Number.isNaN(value) || value < 300 || value > 900) {
          return { valid: false, error: 'Credit score must be between 300-900' };
        }
        break;
      case 'monthly_income':
        if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
          return { valid: false, error: 'Monthly income must be a positive number' };
        }
        break;
      case 'loan_amount':
        if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
          return { valid: false, error: 'Loan amount must be a positive number' };
        }
        break;
      case 'loan_tenure':
        if (typeof value !== 'number' || Number.isNaN(value) || value < 1 || value > 360) {
          return { valid: false, error: 'Loan tenure must be between 1-360 months' };
        }
        break;
      case 'existing_loans':
        if (typeof value !== 'number' || value < 0) {
          return { valid: false, error: 'Cannot have negative loans' };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Generate eligibility report from collected data
   */
  generateEligibilityReport(data: Partial<LoanFormData>): AnalysisResult | null {
    if (!this.hasRequiredFields(data)) {
      return null;
    }

    try {
      // Use existing loan calculation logic
      const result = calculateLoanResult(data as LoanFormData);
      
      // Transform LoanResult to AnalysisResult
      return {
        approval_probability: (result as any).probability || 0.5,
        risk_category: (result as any).risk_level || 'medium',
        financial_health_score: 0.6,
        debt_to_income_ratio: 0.4,
        emi_affordability: 'Good',
        summary: (result as any).summary || 'Eligible for loan',
        factors: (result as any).risk_factors || [],
        eligibility_gaps: (result as any).eligibility_gaps || [],
        improvement_suggestions: (result as any).improvement_suggestions || [],
        roadmap: (result as any).roadmap || [],
        recommended_banks: (result as any).recommended_banks || [],
        readiness: {
          can_apply_now: true,
          wait_days: 0,
          reasons: ['All requirements met'],
        },
        documents_needed: [],
      } as AnalysisResult;
    } catch (e) {
      console.error('Error generating eligibility report:', e);
      return null;
    }
  }

  /**
   * Format question with hint
   */
  formatQuestion(question: EligibilityQuestion, progressNum?: number, totalNum?: number): string {
    let formatted = question.question;
    if (progressNum && totalNum) {
      formatted += ` (${progressNum}/${totalNum})`;
    }
    if (question.hint) {
      formatted += `\n💡 Hint: ${question.hint}`;
    }
    return formatted;
  }
}

// Singleton instance
let eligibilityAgentInstance: EligibilityAgent | null = null;

export function getEligibilityAgent(): EligibilityAgent {
  if (!eligibilityAgentInstance) {
    eligibilityAgentInstance = new EligibilityAgent();
  }
  return eligibilityAgentInstance;
}
