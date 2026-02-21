import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { formData, language } = await req.json();
    const HUGGING_FACE_TOKEN = Deno.env.get("HUGGING_FACE_TOKEN");
    if (!HUGGING_FACE_TOKEN) throw new Error("HUGGING_FACE_TOKEN is not configured");

    // Rule-based financial scoring
    const monthlyIncome = formData.monthly_income || 0;
    const loanAmount = formData.loan_amount || 0;
    const creditScore = formData.credit_score || 0;
    const existingLoans = formData.existing_loans || 0;
    const monthlyExpenses = formData.total_monthly_expenses || 0;
    const monthlySavings = formData.monthly_savings || 0;
    const loanTenure = formData.loan_tenure || 60;
    const age = formData.age || 30;
    const yearsExperience = formData.years_experience || 0;
    const bankBalance = formData.bank_balance || 0;
    const hasCollateral = formData.has_collateral || false;
    const ownsHouse = formData.owns_house || false;
    const hasInvestments = formData.has_investments || false;
    const propertyValue = formData.property_value || 0;
    const coBorrowerCategory = formData.co_borrower || 'None';
    const isEducationLoan = (formData.loan_purpose || '').toLowerCase() === 'education';
    const hasCoBorrower = coBorrowerCategory !== 'None';

    // Calculate key financial metrics
    const langInstruction = language === 'hi' ? 'Respond entirely in Hindi.' : language === 'ta' ? 'Respond entirely in Tamil.' : 'Respond in English.';

    const systemPrompt = `You are NidhiSaarthi AI, a strict and professional government-grade financial analysis engine for India's financial inclusion program. ${langInstruction}

CRITICAL: Be STRICT in your assessment. Analyze all provided data comprehensively and predict outcomes based on standard banking criteria in India.

APPROVAL PROBABILITY GUIDELINES (BE STRICT):
- 80-100%: EXCELLENT - Credit 750+, DTI <30%, Savings >20%, Zero/minimal debt, Stable high income
- 60-79%: GOOD - Credit 700+, DTI <40%, Savings >15%, Limited debt, Stable income
- 40-59%: FAIR - Credit 650+, DTI <50%, Some savings, Moderate debt, Regular income
- 20-39%: POOR - Credit <650 OR DTI >50% OR High debt OR Low savings
- 0-19%: VERY POOR - Multiple red flags, high risk profile

CALCULATION GUIDELINES:
- DTI (Debt-to-Income) = (Monthly Expenses + Existing Loan EMIs) / Monthly Income × 100
- EMI = Loan Amount / Tenure (months)
- EMI-to-Income = EMI / Monthly Income × 100
- Loan-to-Income = Loan Amount / Annual Income
- Savings Rate = Monthly Savings / Monthly Income × 100
- Financial Health Score: Calculate 0-100 based on all factors (Credit 35%, Debt Mgmt 25%, Savings 15%, Income 10%, Assets 10%, Existing Loans 5%)
- For education loans, a valid co-borrower (especially Parent/Guardian) should improve approval odds compared to no co-borrower.
- Do NOT evaluate education loans with the same strictness as unsecured personal loans for early-career students.

You MUST return a valid JSON object with this exact structure:
{
  "approval_probability": <number 0-100 - BE STRICT, analyze comprehensively>,
  "risk_category": "<Low|Medium|High>",
  "financial_health_score": <calculated 0-100>,
  "debt_to_income_ratio": <calculated DTI>,
  "emi_affordability": "<Comfortable|Stretched|Unaffordable>",
  "summary": "<Honest 2-3 sentence assessment with specific reasons for low/high probability>",
  "factors": [
    {"name": "<factor>", "level": "<low|medium|high>", "description": "<specific explanation with numbers>", "improvement": "<detailed actionable advice>", "impact_percent": <number>}
  ],
  "eligibility_gaps": [
    {"gap": "<specific issue blocking approval>", "severity": "<critical|moderate|minor>", "fix": "<concrete step-by-step solution>"}
  ],
  "improvement_suggestions": [
    {"action": "<specific actionable step>", "impact": "<realistic improvement estimate>", "timeline": "<realistic timeframe>"}
  ],
  "roadmap": [
    {"step": <number>, "title": "<clear milestone>", "description": "<detailed action plan>", "duration": "<realistic timeline>"}
  ],
  "recommended_banks": [
    {"name": "<bank>", "logo": "<logo_url>", "interest_rate": "<current rate range>", "match_score": <0-100>, "features": ["<feature>"], "apply_url": "<official url>", "eligibility_notes": "<specific criteria>"}
  ],
  "readiness": {
    "can_apply_now": <boolean - be conservative>,
    "wait_days": <number - realistic wait time>,
    "reasons": ["<specific concrete reasons>"]
  },
  "documents_needed": ["<document>"]
}

BANKS TO RECOMMEND (use official 2026 data):
1. State Bank of India - 8.30%-10.20% - Best for govt employees & high credit scores
2. HDFC Bank - 8.80%-11.50% - Best for salaried professionals
3. ICICI Bank - 8.85%-11.25% - Best for high credit scores (720+)
4. Axis Bank - 9.00%-12.00% - Flexible for self-employed
5. Kotak Mahindra Bank - 8.70%-11.00% - Premium banking for high earners
6. Punjab National Bank - 8.40%-10.50% - Good for PSU employees
7. Bank of Baroda - 8.55%-10.75% - Government backing, competitive rates
8. IDFC First Bank - 9.25%-12.50% - Digital-first, quick processing
9. Bajaj Finance - 10.00%-14.50% - NBFC, higher approval for lower scores
10. Tata Capital - 9.75%-13.75% - Good for self-employed

Include bank logos: Use format "https://logo.clearbit.com/{domain}" (e.g., https://logo.clearbit.com/sbi.co.in)

Be BRUTALLY HONEST in assessments. If someone has poor credit or high debt, tell them clearly why they won't get approved and what they MUST fix.`;

    const userPrompt = `Analyze this loan application:

PERSONAL: Age ${age}, Gender: ${formData.gender || 'Not specified'}, Marital: ${formData.marital_status || 'Not specified'}, Family: ${formData.family_members || 0} members, ${formData.dependent_children || 0} dependents, Location: ${formData.location_city || ''} ${formData.location_state || ''}, Education: ${formData.education || 'Not specified'}

EMPLOYMENT: Job Type: ${formData.job_type || 'Not specified'}, Employer: ${formData.employer_name || 'Not specified'}, Experience: ${yearsExperience} years, Monthly Income: ₹${monthlyIncome.toLocaleString()}, Income Stability: ${formData.income_stability || 'Not specified'}, Secondary Income: ${formData.secondary_income ? 'Yes' : 'No'}

FINANCIAL: Monthly Savings: ₹${monthlySavings.toLocaleString()}, Existing Loans: ${existingLoans}, Monthly Expenses: ₹${monthlyExpenses.toLocaleString()}, Credit Score: ${creditScore}, Bank Balance: ₹${bankBalance.toLocaleString()}, Investments: ${hasInvestments ? 'Yes' : 'No'}

ASSETS: Owns House: ${ownsHouse ? 'Yes' : 'No'}, Owns Car: ${formData.owns_car ? 'Yes' : 'No'}, Property Value: ₹${propertyValue.toLocaleString()}, Health Insurance: ${formData.has_health_insurance ? 'Yes' : 'No'}, Life Insurance: ${formData.has_life_insurance ? 'Yes' : 'No'}

LOAN REQUEST: Amount: ₹${loanAmount.toLocaleString()}, Purpose: ${formData.loan_purpose || 'Personal'}, Co-borrower: ${coBorrowerCategory}, Tenure: ${loanTenure} months, Collateral: ${hasCollateral ? 'Yes' : 'No'}

Analyze this application comprehensively and provide detailed assessment with calculated metrics.`;

    const prompt = `${systemPrompt}\n\nUser: ${userPrompt}\nAssistant:`;

    const response = await fetch("https://api-inference.huggingface.co/models/DragonLLM/Llama-Open-Finance-8B", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 2000,
          temperature: 0.5,
          top_p: 0.9,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service credits exhausted. Please contact administrator." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI analysis failed");
    }

    const aiResult = await response.json();
    const content = Array.isArray(aiResult) ? aiResult[0]?.generated_text || "" : aiResult.generated_text || "";
    
    // Extract JSON from response
    let analysisJson;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisJson = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON in response");
      }
    } catch {
      console.error("Failed to parse AI response:", content);
      // Fallback with STRICT rule-based analysis - calculate metrics here
      const annualIncome = monthlyIncome * 12;
      const estimatedEMI = loanAmount / loanTenure;
      const dti = monthlyIncome > 0 ? ((monthlyExpenses + (existingLoans * estimatedEMI * 0.3)) / monthlyIncome * 100) : 100;
      const emiToIncome = monthlyIncome > 0 ? (estimatedEMI / monthlyIncome * 100) : 100;
      const loanToIncome = annualIncome > 0 ? (loanAmount / annualIncome) : 99;
      const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome * 100) : 0;
      
      // Calculate health score for fallback
      let healthScore = 30;
      if (creditScore >= 750) healthScore += 35;
      else if (creditScore >= 700) healthScore += 28;
      else if (creditScore >= 650) healthScore += 20;
      else if (creditScore >= 600) healthScore += 12;
      else if (creditScore >= 550) healthScore += 5;
      else healthScore -= 10;
      
      if (dti < 25) healthScore += 25;
      else if (dti < 35) healthScore += 18;
      else if (dti < 45) healthScore += 10;
      else if (dti > 60) healthScore -= 15;
      
      if (savingsRate > 25) healthScore += 15;
      else if (savingsRate > 15) healthScore += 10;
      else if (savingsRate > 5) healthScore += 5;
      else healthScore -= 5;
      
      if (yearsExperience > 5 && monthlyIncome > 50000) healthScore += 10;
      else if (yearsExperience > 3 && monthlyIncome > 30000) healthScore += 6;
      else if (yearsExperience > 1) healthScore += 3;
      
      if (hasCollateral) healthScore += 10;
      else if (ownsHouse) healthScore += 6;
      else if (hasInvestments) healthScore += 4;
      
      if (existingLoans === 0) healthScore += 5;
      else if (existingLoans <= 1) healthScore += 2;
      else if (existingLoans > 3) healthScore -= 10;
      
      if (emiToIncome > 50) healthScore -= 15;
      else if (emiToIncome > 40) healthScore -= 8;
      
      if (loanToIncome > 5) healthScore -= 12;
      else if (loanToIncome > 4) healthScore -= 6;

      if (isEducationLoan && hasCoBorrower) {
        healthScore += coBorrowerCategory === 'Parent/Guardian' ? 10 : 7;
      } else if (isEducationLoan && !hasCoBorrower) {
        healthScore -= 5;
      }
      
      healthScore = Math.max(5, Math.min(95, healthScore));
      
      const strictApprovalProb = Math.max(5, Math.min(95, healthScore - 5)); // Even stricter
      
      // Generate detailed gaps based on metrics
      const gaps = [];
      if (creditScore < 650) gaps.push({ gap: `Credit score of ${creditScore} is below recommended minimum (650+)`, severity: "critical", fix: "Pay all bills on time for 6+ months, clear any defaults, keep credit utilization below 30%" });
      if (dti > 45) gaps.push({ gap: `Debt-to-Income ratio of ${dti.toFixed(1)}% exceeds safe limit (40%)`, severity: "critical", fix: "Reduce monthly expenses by ₹${Math.round((monthlyIncome * (dti - 40) / 100))}, clear small debts first" });
      if (savingsRate < 10) gaps.push({ gap: `Low savings rate (${savingsRate.toFixed(1)}%) indicates poor financial discipline`, severity: "moderate", fix: "Build emergency fund of 3-6 months expenses before applying" });
      if (existingLoans > 2) gaps.push({ gap: `${existingLoans} existing loans show high debt burden`, severity: "moderate", fix: "Consolidate or clear at least 2 loans before new application" });
      if (emiToIncome > 40) gaps.push({ gap: `Proposed EMI would consume ${emiToIncome.toFixed(1)}% of income (max recommended: 40%)`, severity: "critical", fix: "Reduce loan amount or extend tenure to lower EMI" });
      if (loanToIncome > 4) gaps.push({ gap: `Loan amount is ${loanToIncome.toFixed(1)}x your annual income (max: 4x)`, severity: "moderate", fix: "Consider requesting a lower loan amount" });
      if (yearsExperience < 2) gaps.push({ gap: "Limited work experience (${yearsExperience} years)", severity: "minor", fix: "Wait until 2+ years of stable employment" });
      if (isEducationLoan && !hasCoBorrower) gaps.push({ gap: "Education loan without co-borrower weakens underwriting strength", severity: "moderate", fix: "Add a parent/guardian co-borrower with stable income and KYC documents" });
      
      // Generate specific improvements
      const improvements = [];
      if (creditScore < 750) improvements.push({ action: `Improve credit score from ${creditScore} to 750+`, impact: `+${Math.round((750 - creditScore) * 0.1)}% approval`, timeline: "6-12 months" });
      if (dti > 35) improvements.push({ action: `Reduce DTI from ${dti.toFixed(1)}% to below 35%`, impact: "+10-15% approval", timeline: "3-6 months" });
      if (savingsRate < 15) improvements.push({ action: "Build savings to 15%+ of income", impact: "+5-8% approval", timeline: "3-6 months" });
      if (existingLoans > 0) improvements.push({ action: `Clear ${Math.min(existingLoans, 2)} existing loan(s)`, impact: "+8-12% approval", timeline: "6-12 months" });
      if (!ownsHouse && !hasCollateral) improvements.push({ action: "Acquire assets or provide collateral", impact: "+5-10% approval", timeline: "12+ months" });
      if (isEducationLoan && !hasCoBorrower) improvements.push({ action: "Add parent/guardian as co-borrower", impact: "+6-12% approval", timeline: "1-2 weeks" });
      
      analysisJson = {
        approval_probability: strictApprovalProb,
        risk_category: strictApprovalProb >= 60 ? 'Low' : strictApprovalProb >= 35 ? 'Medium' : 'High',
        financial_health_score: healthScore,
        debt_to_income_ratio: parseFloat(dti.toFixed(1)),
        emi_affordability: emiToIncome < 30 ? 'Comfortable' : emiToIncome < 45 ? 'Stretched' : 'Unaffordable',
        summary: strictApprovalProb < 40 
          ? `Your application faces ${gaps.length} significant challenge(s). Credit score (${creditScore}) and DTI ratio (${dti.toFixed(1)}%) need improvement. Current approval probability is low at ${strictApprovalProb}%.`
          : strictApprovalProb < 65
          ? `Your profile shows moderate strength with credit score ${creditScore} and ₹${monthlyIncome.toLocaleString()} monthly income, but ${gaps.length > 0 ? 'some areas need attention' : 'improvements would help'}. Approval probability: ${strictApprovalProb}%.`
          : `Strong financial profile with credit score ${creditScore}, healthy DTI of ${dti.toFixed(1)}%, and good savings discipline. High approval probability at ${strictApprovalProb}%.`,
        factors: [
          { name: "Credit Score", level: creditScore >= 720 ? "low" : creditScore >= 650 ? "medium" : "high", description: `Current score: ${creditScore}/900 (Industry avg: 715)`, improvement: creditScore < 750 ? "Pay bills on time, maintain credit utilization <30%, check credit report for errors" : "Maintain current discipline", impact_percent: 35 },
          { name: "Debt Management", level: dti < 35 ? "low" : dti < 50 ? "medium" : "high", description: `DTI ratio: ${dti.toFixed(1)}% (Safe limit: 40%)`, improvement: dti > 40 ? `Reduce monthly obligations by ₹${Math.round(monthlyIncome * (dti - 35) / 100)}` : "Well managed", impact_percent: 25 },
          { name: "Income Stability", level: monthlyIncome >= 50000 && yearsExperience >= 3 ? "low" : monthlyIncome >= 25000 ? "medium" : "high", description: `₹${monthlyIncome.toLocaleString()}/month with ${yearsExperience}yr experience`, improvement: "Build secondary income streams, complete 3+ years current job", impact_percent: 20 },
          { name: "Savings Discipline", level: savingsRate >= 20 ? "low" : savingsRate >= 10 ? "medium" : "high", description: `Saving ${savingsRate.toFixed(1)}% of income (Recommended: 20%+)`, improvement: `Increase monthly savings by ₹${Math.round(monthlyIncome * (0.20 - savingsRate/100))}`, impact_percent: 15 },
          { name: "Loan Burden", level: existingLoans === 0 ? "low" : existingLoans <= 2 ? "medium" : "high", description: `${existingLoans} active loans`, improvement: existingLoans > 0 ? "Clear smallest loans first, avoid new credit" : "Excellent - no existing loans", impact_percent: 5 },
          ...(isEducationLoan ? [{
            name: "Education Loan Co-borrower",
            level: hasCoBorrower ? "low" : "high",
            description: hasCoBorrower ? `Co-borrower: ${coBorrowerCategory} (improves lender confidence)` : "No co-borrower provided for education loan",
            improvement: hasCoBorrower ? "Keep co-borrower income proof and KYC ready" : "Add parent/guardian as co-borrower",
            impact_percent: 10,
          }] : []),
        ],
        eligibility_gaps: gaps.slice(0, 5),
        improvement_suggestions: improvements.slice(0, 6),
        roadmap: gaps.length > 2 ? [
          { step: 1, title: "Address Critical Issues", description: gaps.filter(g => g.severity === "critical").map(g => g.fix).join("; ") || "Focus on credit score and debt reduction", duration: "3-6 months" },
          { step: 2, title: "Build Financial Buffer", description: "Save 3 months of expenses, reduce DTI below 35%, maintain payment discipline", duration: "3-4 months" },
          { step: 3, title: "Strengthen Profile", description: "Improve credit score to 720+, gather all required documents, compare bank offerings", duration: "2-3 months" },
          { step: 4, title: "Apply Strategically", description: "Apply to 2-3 pre-approved banks simultaneously, start with highest match score", duration: "2-4 weeks" },
        ] : [
          { step: 1, title: "Final Document Check", description: "Gather all required documents: Aadhaar, PAN, 6-month bank statements, income proof, address proof", duration: "1 week" },
          { step: 2, title: "Compare Bank Offers", description: "Get pre-approval from top 3 matched banks, compare interest rates and terms", duration: "1-2 weeks" },
          { step: 3, title: "Submit Application", description: "Apply to highest match bank first, maintain clean credit during processing", duration: "2-3 weeks" },
        ],
        recommended_banks: [
          { name: "State Bank of India", logo: "https://logo.clearbit.com/sbi.co.in", interest_rate: "8.30% – 10.20%", match_score: Math.min(95, healthScore + (creditScore >= 720 ? 15 : 5)), features: ["Lowest rates in India", "Government backed", "72-month tenure"], apply_url: "https://sbi.co.in/web/personal-banking/loans/personal-loan", eligibility_notes: creditScore >= 700 ? "Excellent match - high approval chance" : "Requires credit score 700+" },
          { name: "HDFC Bank", logo: "https://logo.clearbit.com/hdfcbank.com", interest_rate: "8.80% – 11.50%", match_score: Math.min(92, healthScore + (monthlyIncome >= 40000 ? 12 : 3)), features: ["Quick processing", "Digital-first", "Pre-approved offers"], apply_url: "https://www.hdfcbank.com/personal/borrow/popular-loans/personal-loan", eligibility_notes: "Best for salaried professionals with 2+ years experience" },
          { name: "ICICI Bank", logo: "https://logo.clearbit.com/icicibank.com", interest_rate: "8.85% – 11.25%", match_score: Math.min(88, healthScore + (creditScore >= 720 ? 10 : 0)), features: ["Flexible tenure", "Instant approval", "No hidden charges"], apply_url: "https://www.icicibank.com/personal-banking/loans/personal-loan", eligibility_notes: creditScore >= 720 ? "Strong match" : "Prefers credit score 720+" },
          { name: "Kotak Mahindra Bank", logo: "https://logo.clearbit.com/kotak.com", interest_rate: "8.70% – 11.00%", match_score: Math.min(85, healthScore + (monthlyIncome >= 50000 ? 10 : 0)), features: ["Premium service", "Competitive rates", "Digital account"], apply_url: "https://www.kotak.com/en/personal-banking/loans/personal-loan.html", eligibility_notes: "Best for high-income professionals (₹50k+/month)" },
          { name: "Axis Bank", logo: "https://logo.clearbit.com/axisbank.com", interest_rate: "9.00% – 12.00%", match_score: Math.max(35, healthScore - 2), features: ["Self-employed friendly", "Low documentation", "Online tracking"], apply_url: "https://www.axisbank.com/retail/loans/personal-loan", eligibility_notes: "Good for self-employed and business owners" },
          { name: "Punjab National Bank", logo: "https://logo.clearbit.com/pnbindia.in", interest_rate: "8.40% – 10.50%", match_score: Math.min(82, healthScore + 5), features: ["PSU benefits", "Government rates", "Flexible terms"], apply_url: "https://www.pnbindia.in/en/ui/Personal-Loan.aspx", eligibility_notes: "Excellent for PSU/government employees" },
          { name: "IDFC First Bank", logo: "https://logo.clearbit.com/idfcfirstbank.com", interest_rate: "9.25% – 12.50%", match_score: Math.max(40, healthScore - 5), features: ["Digital-first", "Quick disbursal", "Paperless process"], apply_url: "https://www.idfcfirstbank.com/personal-banking/loans/personal-loan", eligibility_notes: "Fast processing for salaried individuals" },
          { name: "Bajaj Finance", logo: "https://logo.clearbit.com/bajajfinserv.in", interest_rate: "10.00% – 14.50%", match_score: Math.max(30, healthScore - 8), features: ["NBFC flexibility", "Fast approval", "Flexible eligibility"], apply_url: "https://www.bajajfinserv.in/personal-loan", eligibility_notes: creditScore < 650 ? "Good option for lower credit scores" : "Higher rates, but easier approval" },
        ].sort((a, b) => b.match_score - a.match_score).slice(0, 6),
        readiness: {
          can_apply_now: strictApprovalProb >= 55 && gaps.filter(g => g.severity === "critical").length === 0,
          wait_days: strictApprovalProb >= 55 ? 0 : gaps.filter(g => g.severity === "critical").length > 0 ? 90 : 30,
          reasons: strictApprovalProb < 55 ? gaps.slice(0, 3).map(g => g.gap) : ["Profile meets minimum criteria for application"],
        },
        documents_needed: ["Aadhaar Card", "PAN Card", "Last 6 months bank statement", "Salary slips (last 3 months)", "Form 16 / ITR", "Address proof", "Passport size photo"],
      };
    }

    if (isEducationLoan && analysisJson) {
      const currentProb = Number(analysisJson.approval_probability || 0);
      const baseFloor = hasCoBorrower
        ? (coBorrowerCategory === 'Parent/Guardian' ? 65 : 60)  // Much higher floor with co-borrower
        : 50;  // Higher floor even without co-borrower
      
      // Apply education-loan specific uplift to LLM-generated probability
      const educationBoost = hasCoBorrower 
        ? (coBorrowerCategory === 'Parent/Guardian' ? 15 : 10)
        : 8;
      
      const boostedProb = Math.round(Math.min(92, Math.max(currentProb + educationBoost, baseFloor)));

      analysisJson.approval_probability = boostedProb;
      analysisJson.risk_category = boostedProb >= 70 ? 'Low' : boostedProb >= 50 ? 'Medium' : 'High';

      if (Array.isArray(analysisJson.factors)) {
        analysisJson.factors = [
          ...analysisJson.factors,
          {
            name: 'Education Loan Context',
            level: hasCoBorrower ? 'low' : 'medium',
            description: hasCoBorrower
              ? `Education loan with ${coBorrowerCategory} co-borrower support - significantly improves approval odds`
              : 'Education loan assessed with student-focused criteria (lower income bar for early-career consideration)',
            improvement: hasCoBorrower
              ? 'Ensure co-borrower income and employment documentation is complete'
              : 'Adding a parent/guardian co-borrower can boost approval to 65%+',
            impact_percent: hasCoBorrower ? 15 : 8,
          },
        ];
      }

      if (typeof analysisJson.summary === 'string' && analysisJson.summary.length > 0) {
        analysisJson.summary += hasCoBorrower
          ? ` [EDUCATION LOAN] With co-borrower (${coBorrowerCategory}), approval likelihood is strong for education financing.`
          : ' [EDUCATION LOAN] Student-focused assessment applied; approval odds can be substantially improved by adding a parent/guardian co-borrower.';
      }

      if (analysisJson.readiness && typeof analysisJson.readiness === 'object') {
        if (boostedProb >= 50) {
          analysisJson.readiness.can_apply_now = true;
          analysisJson.readiness.wait_days = 0;
        }
      }
    }

    return new Response(JSON.stringify(analysisJson), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("financial-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Analysis failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
