/**
 * Comprehensive Form Validation
 * Centralized validation rules with detailed error messages
 */

import { LoanFormData } from '@/types/loan';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validate individual form fields
 */
export const fieldValidators = {
  age: (value: any): ValidationError | null => {
    if (!value) return { field: 'age', message: 'Age is required', severity: 'error' };
    const age = parseInt(value, 10);
    if (isNaN(age) || age < 18) return { field: 'age', message: 'Must be at least 18 years', severity: 'error' };
    if (age > 75) return { field: 'age', message: 'Must be less than 75 years', severity: 'error' };
    return null;
  },

  credit_score: (value: any): ValidationError | null => {
    if (!value && value !== 0) return { field: 'credit_score', message: 'Credit score is required', severity: 'error' };
    const score = parseInt(value, 10);
    if (isNaN(score) || score < 300) return { field: 'credit_score', message: 'Minimum credit score is 300', severity: 'error' };
    if (score > 900) return { field: 'credit_score', message: 'Maximum credit score is 900', severity: 'error' };
    if (score < 550) return { field: 'credit_score', message: 'Score below 550 may face rejection', severity: 'warning' };
    return null;
  },

  monthly_income: (value: any): ValidationError | null => {
    if (!value) return { field: 'monthly_income', message: 'Monthly income is required', severity: 'error' };
    const income = parseInt(value, 10);
    if (isNaN(income) || income <= 0) return { field: 'monthly_income', message: 'Income must be positive', severity: 'error' };
    if (income < 15000) return { field: 'monthly_income', message: 'Income too low (typically ₹15k minimum)', severity: 'warning' };
    if (income > 50000000) return { field: 'monthly_income', message: 'Income seems unusually high', severity: 'warning' };
    return null;
  },

  loan_amount: (value: any): ValidationError | null => {
    if (!value) return { field: 'loan_amount', message: 'Loan amount is required', severity: 'error' };
    const amount = parseInt(value, 10);
    if (isNaN(amount) || amount <= 0) return { field: 'loan_amount', message: 'Loan amount must be positive', severity: 'error' };
    if (amount < 50000) return { field: 'loan_amount', message: 'Minimum loan amount is ₹50,000', severity: 'error' };
    if (amount > 50000000) return { field: 'loan_amount', message: 'Maximum loan amount is ₹5 crore', severity: 'error' };
    return null;
  },

  loan_tenure: (value: any): ValidationError | null => {
    if (!value) return { field: 'loan_tenure', message: 'Tenure is required', severity: 'error' };
    const tenure = parseInt(value, 10);
    if (isNaN(tenure) || tenure <= 0) return { field: 'loan_tenure', message: 'Tenure must be positive', severity: 'error' };
    if (tenure < 12) return { field: 'loan_tenure', message: 'Minimum tenure is 12 months', severity: 'error' };
    if (tenure > 360) return { field: 'loan_tenure', message: 'Maximum tenure is 30 years', severity: 'error' };
    return null;
  },

  existing_loans: (value: any): ValidationError | null => {
    if (value === null || value === undefined) return null; // Optional
    const loans = parseInt(value, 10);
    if (isNaN(loans) || loans < 0) return { field: 'existing_loans', message: 'Must be 0 or positive', severity: 'error' };
    if (loans > 10) return { field: 'existing_loans', message: 'Too many existing loans (typically max 5)', severity: 'warning' };
    return null;
  },

  employment_type: (value: any): ValidationError | null => {
    const validTypes = ['Salaried', 'Self-employed', 'Business', 'Freelance'];
    if (!value) return { field: 'job_type', message: 'Employment type is required', severity: 'error' };
    if (!validTypes.includes(value)) return { field: 'job_type', message: `Must be one of: ${validTypes.join(', ')}`, severity: 'error' };
    return null;
  },

  education: (value: any): ValidationError | null => {
    const validEducation = ['10th', '12th', 'Graduate', 'Post Graduate'];
    if (!value) return { field: 'education', message: 'Education is required', severity: 'error' };
    if (!validEducation.includes(value)) return { field: 'education', message: `Must be one of: ${validEducation.join(', ')}`, severity: 'error' };
    return null;
  },
};

/**
 * Comprehensive form validation
 */
export function validateLoanForm(data: Partial<LoanFormData>): {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate each field
  Object.entries(fieldValidators).forEach(([field, validator]) => {
    const error = validator(data[field as keyof typeof fieldValidators]);
    if (error) {
      if (error.severity === 'error') errors.push(error);
      else warnings.push(error);
    }
  });

  // Cross-field validation
  if (data.monthly_income && data.loan_amount) {
    const ratio = data.loan_amount / (data.monthly_income * 12);
    if (ratio > 8) {
      errors.push({
        field: 'loan_amount',
        message: `Loan-to-income ratio too high (${ratio.toFixed(1)}x). Try lower amount.`,
        severity: 'error',
      });
    } else if (ratio > 6) {
      warnings.push({
        field: 'loan_amount',
        message: `Loan-to-income ratio is high (${ratio.toFixed(1)}x). May affect approval.`,
        severity: 'warning',
      });
    }
  }

  if (data.monthly_income && data.total_monthly_expenses && data.monthly_income < data.total_monthly_expenses) {
    errors.push({
      field: 'total_monthly_expenses',
      message: 'Expenses cannot exceed income',
      severity: 'error',
    });
  }

  if (data.monthly_income && data.monthly_savings && data.monthly_savings > data.monthly_income * 0.7) {
    warnings.push({
      field: 'monthly_savings',
      message: 'Savings exceed 70% of income (verify accuracy)',
      severity: 'warning',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get field-specific validation message
 */
export function getFieldError(field: keyof typeof fieldValidators, value: any): string | null {
  const error = fieldValidators[field](value);
  return error ? error.message : null;
}

/**
 * Validate specific form section
 */
export function validateFormSection(
  section: 'personal' | 'employment' | 'financial' | 'loan_details',
  data: Partial<LoanFormData>
): { valid: boolean; errors: ValidationError[] } {
  const fieldsBySection: Record<string, Array<keyof typeof fieldValidators>> = {
    personal: ['age', 'education'],
    employment: ['employment_type'],
    financial: ['credit_score', 'monthly_income', 'existing_loans'],
    loan_details: ['loan_amount', 'loan_tenure'],
  };

  const fields = fieldsBySection[section] || [];
  const errors: ValidationError[] = [];

  fields.forEach(field => {
    const validator = fieldValidators[field];
    if (validator) {
      const error = validator(data[field as keyof LoanFormData]);
      if (error) errors.push(error);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
