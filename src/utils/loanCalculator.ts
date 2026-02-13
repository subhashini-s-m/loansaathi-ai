import type { LoanFormData, LoanResult, RiskFactor, RoadmapStep, BankRecommendation } from '@/types/loan';

export function calculateLoanResult(data: LoanFormData): LoanResult {
  const incomeRatio = data.loanAmount / (data.income * 12);
  const creditFactor = data.creditScore / 900;
  const loanBurden = data.existingLoans > 2 ? 0.3 : data.existingLoans > 0 ? 0.7 : 1;
  const educationFactor = data.education === 'Graduate' ? 0.9 : data.education === 'Post Graduate' ? 1 : 0.6;

  let probability = Math.round(
    (creditFactor * 35 + (1 - Math.min(incomeRatio, 1)) * 25 + loanBurden * 20 + educationFactor * 20) 
  );
  probability = Math.max(10, Math.min(95, probability));

  const riskCategory: LoanResult['riskCategory'] = probability >= 65 ? 'Low' : probability >= 40 ? 'Medium' : 'High';
  const bankFit: LoanResult['bankFit'] = probability >= 60 ? 'Good' : probability >= 35 ? 'Moderate' : 'Poor';

  const factors: RiskFactor[] = [
    {
      name: 'Credit Score',
      level: data.creditScore >= 700 ? 'low' : data.creditScore >= 550 ? 'medium' : 'high',
      description: `Your credit score of ${data.creditScore} is ${data.creditScore >= 700 ? 'healthy' : data.creditScore >= 550 ? 'moderate' : 'below recommended threshold'}`,
      improvement: data.creditScore < 700 ? 'Pay bills on time and reduce credit utilization below 30%' : 'Maintain current credit habits',
    },
    {
      name: 'Income Stability',
      level: data.income >= 40000 ? 'low' : data.income >= 20000 ? 'medium' : 'high',
      description: `Monthly income of ₹${data.income.toLocaleString('en-IN')} ${data.income >= 40000 ? 'meets' : 'is below'} standard benchmarks`,
      improvement: data.income < 40000 ? 'Consider additional income sources or skill upgrades' : 'Stable income is favorable',
    },
    {
      name: 'Existing Loan Burden',
      level: data.existingLoans === 0 ? 'low' : data.existingLoans <= 2 ? 'medium' : 'high',
      description: `${data.existingLoans} active loan(s) — ${data.existingLoans > 2 ? 'high debt burden' : 'manageable'}`,
      improvement: data.existingLoans > 0 ? 'Clear small debts to improve debt-to-income ratio' : 'No existing burden — favorable',
    },
    {
      name: 'Loan-to-Income Ratio',
      level: incomeRatio < 3 ? 'low' : incomeRatio < 6 ? 'medium' : 'high',
      description: `Requested ₹${data.loanAmount.toLocaleString('en-IN')} is ${incomeRatio.toFixed(1)}x your annual income`,
      improvement: incomeRatio >= 3 ? 'Consider a smaller loan amount or increase savings' : 'Ratio is within healthy limits',
    },
  ];

  const roadmap: RoadmapStep[] = [];
  if (data.existingLoans > 0) roadmap.push({ step: roadmap.length + 1, title: 'Clear Small Debts', description: 'Pay off smallest loans first to reduce burden and improve credit mix', duration: '30–60 days' });
  if (data.creditScore < 700) roadmap.push({ step: roadmap.length + 1, title: 'Improve Credit Score', description: 'Make timely payments and keep utilization below 30%', duration: '60–90 days' });
  roadmap.push({ step: roadmap.length + 1, title: 'Build Emergency Savings', description: 'Save at least 3 months of expenses before applying', duration: '60 days' });
  roadmap.push({ step: roadmap.length + 1, title: 'Apply to Recommended Bank', description: 'Use our matched bank suggestions for highest approval chances', duration: '7–14 days' });

  const recommendedBanks: BankRecommendation[] = [
    { name: 'State Bank of India', interestRate: '8.5% – 10.5%', matchScore: Math.min(95, probability + 10), features: ['Lowest rates for govt employees', 'Flexible tenure', 'Low processing fee'] },
    { name: 'Bank of Baroda', interestRate: '9.0% – 11.0%', matchScore: Math.min(90, probability + 5), features: ['Quick disbursement', 'Rural-friendly', 'No hidden charges'] },
    { name: 'Punjab National Bank', interestRate: '9.5% – 11.5%', matchScore: Math.max(40, probability - 5), features: ['Special schemes for farmers', 'Doorstep service', 'Low collateral'] },
  ];

  return { approvalProbability: probability, riskCategory, bankFit, factors, roadmap, recommendedBanks };
}

export function recalculateWithChanges(original: LoanFormData, incomeOverride: number, loanOverride: number): number {
  const modified = { ...original, income: incomeOverride, loanAmount: loanOverride };
  return calculateLoanResult(modified).approvalProbability;
}
