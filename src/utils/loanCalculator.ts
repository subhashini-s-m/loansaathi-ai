import type { LoanFormData, LoanResult, RiskFactor, RoadmapStep, BankRecommendation } from '@/types/loan';

// Structured logger
const logger = {
  info: (msg: string, data?: any) => console.log(`[LoanCalc] ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[LoanCalc] ${msg}`, data || ''),
  error: (msg: string, err?: any) => console.error(`[LoanCalc] ${msg}`, err || ''),
};

/**
 * Validate loan form data comprehensively
 */
function validateLoanData(data: Partial<LoanFormData>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.age || data.age < 18 || data.age > 75) errors.push('Age: 18-75 years');
  if (!data.monthly_income || data.monthly_income <= 0) errors.push('Income must be positive');
  if (!data.credit_score || data.credit_score < 300 || data.credit_score > 900) errors.push('Credit: 300-900');
  if (!data.loan_amount || data.loan_amount <= 0) errors.push('Loan must be positive');
  if (!data.loan_tenure || data.loan_tenure <= 0 || data.loan_tenure > 360) errors.push('Tenure: 1-360m');
  if (data.monthly_income && data.total_monthly_expenses && data.monthly_income < data.total_monthly_expenses) {
    errors.push('Income < expenses');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Calculate accurate EMI: [P × r × (1+r)^n] / [(1+r)^n - 1]
 */
function calculateEMI(principal: number, annualRate: number, months: number): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0 || months === 0) return principal / Math.max(months, 1);
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, months);
  const denominator = Math.pow(1 + monthlyRate, months) - 1;
  return Math.round(numerator / denominator);
}

/**
 * Calculate precise DTI ratio
 */
function calculateDTIRatio(data: LoanFormData): number {
  try {
    const existingEMI = Math.max(data.existing_loans * 4500, 0);
    const newEMI = calculateEMI(data.loan_amount, 8.5, data.loan_tenure);
    return Math.min(Math.round((existingEMI + newEMI) / data.monthly_income * 100), 150);
  } catch {
    return 50;
  }
}

/**
 * Score employment stability (0-1)
 */
function getEmploymentScore(years: number): number {
  if (years >= 10) return 1.0;
  if (years >= 5) return 0.9;
  if (years >= 2) return 0.75;
  if (years >= 1) return 0.6;
  return 0.4;
}

export function calculateLoanResult(data: LoanFormData): LoanResult {
  try {
    const validation = validateLoanData(data);
    if (!validation.valid) logger.warn('Invalid data', validation.errors);

    // Calculate core metrics
    const annualIncome = data.monthly_income * 12;
    const isEducationLoan = data.loan_purpose?.toLowerCase() === 'education';
    const hasCoBorrower = !!data.co_borrower && data.co_borrower !== 'None';
    const isParentCoBorrower = data.co_borrower === 'Parent/Guardian';

    const rawIncomeRatio = data.loan_amount / annualIncome;
    const incomeRatio = isEducationLoan ? rawIncomeRatio * 0.75 : rawIncomeRatio;
    
    // For education loans, boost credit score leverage (students may have lower scores but education is lower-risk)
    let creditScore = Math.min(data.credit_score / 750, 1);
    if (isEducationLoan) {
      creditScore = Math.min(1, creditScore * 1.25); // 25% boost for education loans
    }
    
    const employmentBase = getEmploymentScore(data.years_experience);
    const empStability = isEducationLoan
      ? Math.max(0.65, employmentBase)
      : employmentBase;
    const savingsRate = Math.min(data.monthly_savings / data.monthly_income, 0.5);
    const ltiScore = Math.max(0, 1 - (incomeRatio / (isEducationLoan ? 8 : 6)));
    
    // Enhanced debt burden scoring
    let debtScore = 1.0;
    if (data.existing_loans === 0) debtScore = 1.0;
    else if (data.existing_loans === 1) debtScore = 0.85;
    else if (data.existing_loans === 2) debtScore = 0.65;
    else if (data.existing_loans === 3) debtScore = 0.45;
    else debtScore = Math.max(0.2, 0.4 - (data.existing_loans - 3) * 0.05);

    if (isEducationLoan) {
      debtScore = Math.min(1, debtScore + 0.1);
    }
    
    // Asset score contribution
    let assetScore = (
      (data.owns_house ? 0.3 : 0) +
      (data.owns_car ? 0.1 : 0) +
      (data.has_investments ? 0.2 : 0) +
      (data.bank_balance >= annualIncome ? 0.1 : 0)
    ) / 0.7;
    
    // For education loans without assets, boost LTI contribution to offset risk
    if (isEducationLoan && assetScore < 0.3) {
      assetScore = Math.max(assetScore, 0.4);
    }
    
    // Weighted probability (100% total weight)
    // For education loans, boost LTI weight (from 25 to 30) and reduce credit score weight slightly (35 to 30)
    let probability;
    if (isEducationLoan) {
      probability = Math.round(
        creditScore * 30 +
        ltiScore * 30 +  // Higher LTI weight for education (already relaxed thresholds)
        empStability * 15 +
        debtScore * 15 +
        savingsRate * 0.5 * 5 +
        assetScore * 0.5 * 5
      );
    } else {
      probability = Math.round(
        creditScore * 35 +
        ltiScore * 25 +
        empStability * 15 +
        debtScore * 15 +
        savingsRate * 0.5 * 5 +
        assetScore * 0.5 * 5
      );
    }

    // Base uplift for education loans (post-weighting)
    if (isEducationLoan) {
      probability += 10;  // Increased from 6
    }
    
    // Co-borrower uplift
    if (isEducationLoan && hasCoBorrower) {
      probability += isParentCoBorrower ? 12 : 8;  // Increased from 8/5
    }
    
    probability = Math.max(12, Math.min(96, probability));

    // Determine risk category with nuanced assessment
    let riskCategory: LoanResult['riskCategory'];
    if (probability >= 75) riskCategory = 'Low';
    else if (probability >= 55) riskCategory = 'Medium';
    else riskCategory = 'High';

    // Bank fit based on multiple factors
    const bankFit: LoanResult['bankFit'] = probability >= 65 ? 'Good' : probability >= 40 ? 'Moderate' : 'Poor';

    // Dynamic risk factors based on actual profile
    const factors: RiskFactor[] = [];
    
    // Credit score factor
    let creditLevel: 'low' | 'medium' | 'high' = 'low';
    if (data.credit_score < 600) creditLevel = 'high';
    else if (data.credit_score < 700) creditLevel = 'medium';
    
    factors.push({
      name: 'Credit Score',
      level: creditLevel,
      description: `Score: ${data.credit_score}/900 - ${creditLevel === 'low' ? '✓ Excellent' : creditLevel === 'medium' ? '⚠ Needs Work' : '✗ Critical'}`,
      improvement: data.credit_score < 700 ? 'Pay 100% on time. Keep utilization <30%. Avoid hard inquiries.' : 'Maintain payment discipline',
    });
    
    // Income & DTI factor
    const dti = calculateDTIRatio(data);
    const dtiLevel: 'low' | 'medium' | 'high' = dti < 40 ? 'low' : dti < 60 ? 'medium' : 'high';
    factors.push({
      name: 'Debt-to-Income Ratio',
      level: dtiLevel,
      description: `DTI: ${dti}% - ${dtiLevel === 'low' ? '✓ Healthy' : dtiLevel === 'medium' ? '⚠ Moderate' : '✗ High'}`,
      improvement: dti > 40 ? 'Reduce existing debt or increase income' : 'Maintain current ratio',
    });
    
    // Employment stability factor
    const empLevel: 'low' | 'medium' | 'high' = empStability >= 0.85 ? 'low' : empStability >= 0.6 ? 'medium' : 'high';
    factors.push({
      name: 'Employment Stability',
      level: empLevel,
      description: `${data.years_experience}y ${data.job_type} - ${empLevel === 'low' ? '✓ Stable' : empLevel === 'medium' ? '⚠ Developing' : '✗ Risky'}`,
      improvement: empLevel !== 'low' ? 'Build continuous employment record' : 'Keep current job',
    });
    
    // Savings & financial health
    const savingsLevel: 'low' | 'medium' | 'high' = savingsRate >= 0.3 ? 'low' : savingsRate >= 0.1 ? 'medium' : 'high';
    factors.push({
      name: 'Financial Health',
      level: savingsLevel,
      description: `Savings: ${Math.round(savingsRate * 100)}% - ${savingsLevel === 'low' ? '✓ Strong' : savingsLevel === 'medium' ? '⚠ Fair' : '✗ Weak'}`,
      improvement: savingsLevel !== 'low' ? `Target 20% monthly savings (₹${Math.round(data.monthly_income * 0.2)})` : 'Excellent financial discipline',
    });

    if (isEducationLoan) {
      factors.push({
        name: 'Co-borrower Support',
        level: hasCoBorrower ? 'low' : 'high',
        description: hasCoBorrower
          ? `Co-borrower: ${data.co_borrower} - ✓ Strong support for education loan`
          : 'No co-borrower selected - ✗ Education loans are stronger with parent/guardian support',
        improvement: hasCoBorrower
          ? 'Maintain co-borrower income and KYC documents ready for underwriting'
          : 'Add a parent/guardian co-borrower to improve education loan approval odds',
      });
    }
    
    // Generate dynamic roadmap based on profile
    const roadmap: RoadmapStep[] = [];
    let stepNum = 1;
    
    if (dti > 50) {
      roadmap.push({
        step: stepNum++,
        title: 'Reduce Debt Burden',
        description: `Pay down ₹${Math.round(data.existing_loans * 15000)} to improve DTI below 50%`,
        duration: '30-90 days',
      });
    }
    
    if (data.credit_score < 700) {
      roadmap.push({
        step: stepNum++,
        title: 'Build Credit Score',
        description: 'Timely payments, reduce utilization to <20%, diversify credit',
        duration: '60-120 days',
      });
    }
    
    if (data.monthly_savings < data.monthly_income * 0.15) {
      roadmap.push({
        step: stepNum++,
        title: 'Build Emergency Fund',
        description: `Save ₹${Math.round(data.total_monthly_expenses * 3)} (3 months expenses)`,
        duration: '45-180 days',
      });
    }

    if (isEducationLoan && !hasCoBorrower) {
      roadmap.push({
        step: stepNum++,
        title: 'Add Co-borrower for Education Loan',
        description: 'Add parent/guardian as co-borrower and keep their income proof + KYC ready',
        duration: '3-7 days',
      });
    }
    
    roadmap.push({
      step: stepNum++,
      title: 'Document Preparation',
      description: 'Gather: Pan, Aadhaar, 3mo bank statements, 3mo salary slips',
      duration: '7 days',
    });
    
    roadmap.push({
      step: stepNum,
      title: 'Apply to Bank',
      description: `Target banks with ${probability}% match score for best approval odds`,
      duration: '7-14 days',
    });
    
    // Intelligent bank recommendations based on profile
    const emi = calculateEMI(data.loan_amount, 8.5, data.loan_tenure);
    const emiAffordability = Math.round((emi / data.monthly_income) * 100);
    
    const recommendedBanks: BankRecommendation[] = [];
    
    // SBI - best for salaried/stable
    if (empStability >= 0.75 && data.credit_score >= 650) {
      recommendedBanks.push({
        name: 'State Bank of India',
        interestRate: '8.5% – 10.5%',
        matchScore: Math.min(98, probability + 8),
        features: [
          `EMI: ₹${emi}/month (${emiAffordability}% of income)`,
          'Govt employee benefits',
          'Doorstep disbursal',
          'Zero processing fee for premium',
        ],
      });
    }
    
    // BoB - good for balanced profiles
    if (probability >= 40) {
      recommendedBanks.push({
        name: 'Bank of Baroda',
        interestRate: '9.0% – 11.0%',
        matchScore: Math.min(95, probability + 3),
        features: [
          'Quick approval (3-5 days)',
          'Flexible EMI options',
          'Rural-friendly schemes',
          'Competitive interest rates',
        ],
      });
    }
    
    // PNB - alternative option
    if (probability >= 35) {
      recommendedBanks.push({
        name: 'Punjab National Bank',
        interestRate: '9.5% – 11.5%',
        matchScore: Math.max(35, probability - 8),
        features: [
          'Special schemes for farmers',
          'Business loan options',
          'Doorstep service',
          'Flexible repayment',
        ],
      });
    }
    
    // Ensure at least 2 options
    if (recommendedBanks.length < 2) {
      recommendedBanks.push({
        name: 'HDFC Bank',
        interestRate: '8.99% – 11.99%',
        matchScore: Math.max(50, probability - 5),
        features: [
          'Premium service quality',
          'Online application',
          'Instant pre-approval',
          'Multiple tenure options',
        ],
      });
    }

    return {
      approvalProbability: probability,
      riskCategory,
      bankFit,
      factors,
      roadmap,
      recommendedBanks,
    };
  } catch (error) {
    logger.error('Calculation failed', error);
    // Return safe defaults on error
    return {
      approvalProbability: 40,
      riskCategory: 'High',
      bankFit: 'Moderate',
      factors: [],
      roadmap: [],
      recommendedBanks: [],
    };
  }
}

/**
 * Recalculate with parameter overrides for what-if analysis
 */
export function recalculateWithChanges(original: LoanFormData, incomeOverride: number, loanOverride: number): number {
  try {
    const modified = { ...original, monthly_income: incomeOverride, loan_amount: loanOverride };
    return calculateLoanResult(modified).approvalProbability;
  } catch (e) {
    logger.error('Recalculation failed', e);
    return original ? calculateLoanResult(original).approvalProbability : 40;
  }}