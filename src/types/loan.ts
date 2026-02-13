export interface LoanFormData {
  income: number;
  loanAmount: number;
  education: string;
  existingLoans: number;
  creditScore: number;
  employmentType: string;
  loanPurpose: string;
}

export interface RiskFactor {
  name: string;
  level: 'low' | 'medium' | 'high';
  description: string;
  improvement: string;
}

export interface RoadmapStep {
  step: number;
  title: string;
  description: string;
  duration: string;
}

export interface BankRecommendation {
  name: string;
  interestRate: string;
  matchScore: number;
  features: string[];
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
  formData: LoanFormData;
}
