export interface LoanFormData {
  // Personal Profile
  age: number;
  gender: string;
  marital_status: string;
  family_members: number;
  dependent_children: number;
  location_city: string;
  location_state: string;
  education: string;
  // Employment
  job_type: string;
  employer_name: string;
  years_experience: number;
  monthly_income: number;
  income_stability: string;
  secondary_income: boolean;
  // Financial
  monthly_savings: number;
  monthly_rent: number;
  existing_loans: number;
  total_monthly_expenses: number;
  credit_score: number;
  bank_balance: number;
  has_investments: boolean;
  // Assets
  owns_house: boolean;
  owns_car: boolean;
  car_year: number;
  property_value: number;
  has_health_insurance: boolean;
  has_life_insurance: boolean;
  has_vehicle_insurance: boolean;
  // Loan Request
  loan_amount: number;
  loan_purpose: string;
  co_borrower: string;
  loan_tenure: number;
  has_collateral: boolean;
}

// Legacy types kept for backward compat
export interface RiskFactor {
  name: string;
  level: 'low' | 'medium' | 'high';
  description: string;
  improvement: string;
  impact_percent?: number;
}

export interface RoadmapStep {
  step: number;
  title: string;
  description: string;
  duration: string;
}

export interface BankRecommendation {
  name: string;
  logo?: string;
  interest_rate?: string;
  interestRate?: string;
  match_score?: number;
  matchScore?: number;
  features: string[];
  apply_url?: string;
  eligibility_notes?: string;
}

export interface EligibilityGap {
  gap: string;
  severity: 'critical' | 'moderate' | 'minor';
  fix: string;
}

export interface ImprovementSuggestion {
  action: string;
  impact: string;
  timeline: string;
}

export interface AnalysisResult {
  approval_probability: number;
  risk_category: string;
  financial_health_score: number;
  debt_to_income_ratio: number;
  emi_affordability: string;
  summary: string;
  factors: RiskFactor[];
  eligibility_gaps: EligibilityGap[];
  improvement_suggestions: ImprovementSuggestion[];
  roadmap: RoadmapStep[];
  recommended_banks: BankRecommendation[];
  readiness: {
    can_apply_now: boolean;
    wait_days: number;
    reasons: string[];
  };
  documents_needed: string[];
}

export interface LoanResult {
  approvalProbability: number;
  riskCategory: 'Low' | 'Medium' | 'High';
  bankFit: 'Good' | 'Moderate' | 'Poor';
  factors: RiskFactor[];
  roadmap: RoadmapStep[];
  recommendedBanks: BankRecommendation[];
}

export interface SampleCase {
  id: string;
  title: string;
  emoji: string;
  description: string;
  formData: Partial<LoanFormData>;
}
