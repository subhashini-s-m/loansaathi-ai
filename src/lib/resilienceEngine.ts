// Financial Resilience Score & Stress Test Engine
// A unique feature that analyzes financial stability and survival under adverse scenarios

export type ResilienceScenario = 'job_loss' | 'medical_emergency' | 'market_crash' | 'inflation_surge' | 'combined';

export type ResilienceMetrics = {
  resilienceScore: number; // 0-100
  survivalMonths: number;
  riskFactors: string[];
  strengths: string[];
  recommendations: string[];
  scenarioResults: Record<ResilienceScenario, {
    survivalMonths: number;
    impactLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    affectedAssets: string[];
    recoveryTime: number;
  }>;
};

export interface FinancialProfile {
  monthly_income: number;
  monthly_expenses: number;
  savings_liquid: number; // emergency fund
  investments: number;
  property_value: number;
  debt_monthly: number; // EMI + other obligations
  credit_score: number;
  existing_loans: number;
  job_stability: 'High' | 'Medium' | 'Low'; // based on job type and experience
  age: number;
  dependents: number;
  has_insurance: boolean;
  investment_diversification: number; // 0-100
}

export function calculateResilienceScore(profile: FinancialProfile): number {
  let score = 50; // base score

  // Emergency Fund Coverage (0-20 points)
  const emergencyMonths = profile.monthly_expenses > 0 
    ? profile.savings_liquid / profile.monthly_expenses 
    : 0;
  if (emergencyMonths >= 12) score += 20;
  else if (emergencyMonths >= 6) score += 15;
  else if (emergencyMonths >= 3) score += 10;
  else if (emergencyMonths >= 1) score += 5;

  // Debt-to-Income Ratio (0-20 points)
  const dtiRatio = profile.monthly_income > 0 
    ? (profile.debt_monthly / profile.monthly_income) * 100 
    : 100;
  if (dtiRatio <= 30) score += 20;
  else if (dtiRatio <= 40) score += 15;
  else if (dtiRatio <= 50) score += 10;
  else if (dtiRatio <= 60) score += 5;

  // Income Stability (0-15 points)
  if (profile.job_stability === 'High') score += 15;
  else if (profile.job_stability === 'Medium') score += 10;
  else if (profile.job_stability === 'Low') score += 5;

  // Credit Health (0-15 points)
  if (profile.credit_score >= 750) score += 15;
  else if (profile.credit_score >= 700) score += 12;
  else if (profile.credit_score >= 650) score += 8;
  else if (profile.credit_score >= 600) score += 4;

  // Asset Diversification (0-15 points)
  score += (profile.investment_diversification / 100) * 15;

  // Insurance Coverage (0-15 points)
  if (profile.has_insurance) {
    score += 15;
  } else if (profile.dependents > 0) {
    score -= 5; // penalty for dependents without insurance
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function simulateStressTest(
  profile: FinancialProfile,
  scenario: ResilienceScenario
): { survivalMonths: number; impactLevel: 'Low' | 'Medium' | 'High' | 'Critical'; affectedAssets: string[] } {
  let remainingAssets = profile.savings_liquid + (profile.investments * 0.8) + (profile.property_value * 0.3);
  let monthlyObligation = profile.monthly_expenses + profile.debt_monthly;
  let affectedAssets: string[] = [];

  switch (scenario) {
    case 'job_loss':
      // Lose 100% of income
      monthlyObligation = profile.monthly_expenses * 1.1 + profile.debt_monthly; // Slight increase due to stress
      affectedAssets = ['Income', 'Emergency Fund'];
      break;

    case 'medical_emergency':
      // Lose 30% of savings immediately + 15% additional monthly expenses
      remainingAssets *= 0.7;
      monthlyObligation += profile.monthly_expenses * 0.15;
      affectedAssets = ['Liquid Savings', 'Investments (20% loss)'];
      break;

    case 'market_crash':
      // Lose 40% of investments
      remainingAssets -= profile.investments * 0.4;
      monthlyObligation *= 1.05; // slight increase
      affectedAssets = ['Investments (40% loss)'];
      break;

    case 'inflation_surge':
      // 20% increase in expenses for 6 months
      monthlyObligation *= 1.2;
      affectedAssets = ['Spending Power', 'Real Income'];
      break;

    case 'combined':
      // All scenarios at once (worst case)
      remainingAssets = (profile.savings_liquid * 0.5) + (profile.investments * 0.3);
      monthlyObligation = (profile.monthly_expenses * 1.35) + profile.debt_monthly;
      affectedAssets = ['Income', 'Investments', 'Savings', 'Purchasing Power'];
      break;
  }

  const survivalMonths = monthlyObligation > 0 ? Math.floor(remainingAssets / monthlyObligation) : 0;
  
  let impactLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  if (survivalMonths >= 12) impactLevel = 'Low';
  else if (survivalMonths >= 6) impactLevel = 'Medium';
  else if (survivalMonths >= 2) impactLevel = 'High';
  else impactLevel = 'Critical';

  return { survivalMonths: Math.max(0, survivalMonths), impactLevel, affectedAssets };
}

export function identifyRiskFactors(profile: FinancialProfile): string[] {
  const factors: string[] = [];

  const emergencyMonths = profile.monthly_expenses > 0 
    ? profile.savings_liquid / profile.monthly_expenses 
    : 0;
  if (emergencyMonths < 3) {
    factors.push('⚠️ Low emergency fund - less than 3 months of expenses');
  }

  const dtiRatio = profile.monthly_income > 0 
    ? (profile.debt_monthly / profile.monthly_income) * 100 
    : 100;
  if (dtiRatio > 50) {
    factors.push('⚠️ High debt burden - DTI ratio above 50%');
  }

  if (profile.credit_score < 650) {
    factors.push('⚠️ Low credit score - limited borrowing options');
  }

  if (profile.job_stability === 'Low') {
    factors.push('⚠️ Income instability - consider backup income sources');
  }

  if (!profile.has_insurance && profile.dependents > 0) {
    factors.push('⚠️ No insurance with dependents - major vulnerability');
  }

  if (profile.investment_diversification < 30) {
    factors.push('⚠️ Low investment diversification - concentration risk');
  }

  if (profile.existing_loans > 3) {
    factors.push('⚠️ Multiple loans - complexity and obligation risk');
  }

  return factors;
}

export function identifyStrengths(profile: FinancialProfile): string[] {
  const strengths: string[] = [];

  const emergencyMonths = profile.monthly_expenses > 0 
    ? profile.savings_liquid / profile.monthly_expenses 
    : 0;
  if (emergencyMonths >= 6) {
    strengths.push('✅ Strong emergency fund - ' + Math.round(emergencyMonths) + ' months coverage');
  }

  const dtiRatio = profile.monthly_income > 0 
    ? (profile.debt_monthly / profile.monthly_income) * 100 
    : 100;
  if (dtiRatio < 35) {
    strengths.push('✅ Healthy debt-to-income ratio - comfortable debt management');
  }

  if (profile.credit_score >= 750) {
    strengths.push('✅ Excellent credit score - access to best rates');
  }

  if (profile.job_stability === 'High') {
    strengths.push('✅ Stable income - low job loss risk');
  }

  if (profile.has_insurance) {
    strengths.push('✅ Insurance coverage - financial protection in place');
  }

  if (profile.investment_diversification >= 60) {
    strengths.push('✅ Diversified investments - reduced concentration risk');
  }

  return strengths;
}

export function generateRecoveryPlan(profile: FinancialProfile, scenario: ResilienceScenario): string[] {
  const recommendations: string[] = [];

  switch (scenario) {
    case 'job_loss':
      recommendations.push('💡 Activate emergency fund immediately - pace monthly withdrawals');
      recommendations.push('💡 Contact lenders for forbearance/restructuring options');
      recommendations.push('💡 Prioritize fixed debt obligations first (secured loans, EMIs)');
      recommendations.push('💡 Consider gig/freelance work to bridge income gap');
      recommendations.push('💡 Defer non-essential expenses and investments');
      break;

    case 'medical_emergency':
      recommendations.push('💡 Use emergency fund first - preserve investments if possible');
      recommendations.push('💡 Check insurance claim eligibility and process quickly');
      recommendations.push('💡 Negotiate payment plans with medical providers');
      recommendations.push('💡 Avoid high-interest debt (credit cards) for medical costs');
      recommendations.push('💡 Rebuild emergency fund within 6 months post-recovery');
      break;

    case 'market_crash':
      recommendations.push('💡 Do not panic-sell investments - maintain long-term strategy');
      recommendations.push('💡 Opportunity to buy quality assets at discount if possible');
      recommendations.push('💡 Review portfolio diversification - rebalance if needed');
      recommendations.push('💡 Focus on regular investment contributions (rupee cost averaging)');
      recommendations.push('💡 Ensure debt obligations are not compromised');
      break;

    case 'inflation_surge':
      recommendations.push('💡 Renegotiate fixed-rate loans to lock in better rates');
      recommendations.push('💡 Shift investments towards inflation-resistant assets (TIPS, real estate)');
      recommendations.push('💡 Increase focus on income growth to outpace inflation');
      recommendations.push('💡 Optimize expense categories impacted most by inflation');
      recommendations.push('💡 Consider wage negotiations or career advancement');
      break;

    case 'combined':
      recommendations.push('💡 IMMEDIATE: Activate emergency fund and suspend all new debt');
      recommendations.push('💡 WEEK 1: Communicate with all lenders about temporary difficulties');
      recommendations.push('💡 WEEK 1-2: Secure temporary income or credit line as backup');
      recommendations.push('💡 MONTH 1: Restructure all obligations with 6+ months runway');
      recommendations.push('💡 MONTH 2+: Begin rebuilding emergency fund and normalizing spending');
      break;
  }

  return recommendations;
}

export function calculateResilienceMetrics(profile: FinancialProfile): ResilienceMetrics {
  const resilienceScore = calculateResilienceScore(profile);
  const riskFactors = identifyRiskFactors(profile);
  const strengths = identifyStrengths(profile);

  const scenarioResults: Record<ResilienceScenario, any> = {};
  const scenarios: ResilienceScenario[] = ['job_loss', 'medical_emergency', 'market_crash', 'inflation_surge', 'combined'];
  
  let minSurvivalMonths = Infinity;

  for (const scenario of scenarios) {
    const result = simulateStressTest(profile, scenario);
    const recoveryPlan = generateRecoveryPlan(profile, scenario);
    
    scenarioResults[scenario] = {
      ...result,
      recoveryTime: Math.ceil(result.survivalMonths * 1.5), // estimated time to full recovery
    };

    if (result.survivalMonths < minSurvivalMonths) {
      minSurvivalMonths = result.survivalMonths;
    }
  }

  const recommendations = generateRecoveryPlan(profile, 'combined');

  return {
    resilienceScore,
    survivalMonths: Math.max(1, minSurvivalMonths),
    riskFactors,
    strengths,
    recommendations,
    scenarioResults,
  };
}
