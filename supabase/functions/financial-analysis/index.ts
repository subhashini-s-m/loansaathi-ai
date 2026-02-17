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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

    // Calculate key financial metrics
    const annualIncome = monthlyIncome * 12;
    const estimatedEMI = loanAmount / loanTenure;
    const dti = monthlyIncome > 0 ? ((monthlyExpenses + (existingLoans * estimatedEMI * 0.3)) / monthlyIncome * 100) : 100;
    const emiToIncome = monthlyIncome > 0 ? (estimatedEMI / monthlyIncome * 100) : 100;
    const loanToIncome = annualIncome > 0 ? (loanAmount / annualIncome) : 99;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome * 100) : 0;
    
    // Financial health score (0-100)
    let healthScore = 50;
    if (creditScore >= 750) healthScore += 15;
    else if (creditScore >= 650) healthScore += 8;
    else if (creditScore < 500) healthScore -= 15;
    if (dti < 30) healthScore += 10;
    else if (dti > 50) healthScore -= 10;
    if (savingsRate > 20) healthScore += 8;
    if (ownsHouse) healthScore += 5;
    if (hasInvestments) healthScore += 5;
    if (hasCollateral) healthScore += 7;
    if (yearsExperience > 5) healthScore += 5;
    if (existingLoans > 3) healthScore -= 10;
    healthScore = Math.max(10, Math.min(95, healthScore));

    const langInstruction = language === 'hi' ? 'Respond entirely in Hindi.' : language === 'ta' ? 'Respond entirely in Tamil.' : 'Respond in English.';

    const systemPrompt = `You are NidhiSaarthi AI, a government-grade financial analysis engine for India's financial inclusion program. ${langInstruction}

You MUST return a valid JSON object with this exact structure:
{
  "approval_probability": <number 0-100>,
  "risk_category": "<Low|Medium|High>",
  "financial_health_score": ${healthScore},
  "debt_to_income_ratio": ${dti.toFixed(1)},
  "emi_affordability": "<Comfortable|Stretched|Unaffordable>",
  "summary": "<2-3 sentence overall assessment>",
  "factors": [
    {"name": "<factor>", "level": "<low|medium|high>", "description": "<explanation>", "improvement": "<actionable advice>", "impact_percent": <number>}
  ],
  "eligibility_gaps": [
    {"gap": "<what's stopping approval>", "severity": "<critical|moderate|minor>", "fix": "<how to fix>"}
  ],
  "improvement_suggestions": [
    {"action": "<what to do>", "impact": "<+X% approval>", "timeline": "<timeframe>"}
  ],
  "roadmap": [
    {"step": <number>, "title": "<step title>", "description": "<details>", "duration": "<timeframe>"}
  ],
  "recommended_banks": [
    {"name": "<bank>", "interest_rate": "<rate range>", "match_score": <0-100>, "features": ["<feature>"], "apply_url": "<url>", "eligibility_notes": "<notes>"}
  ],
  "readiness": {
    "can_apply_now": <boolean>,
    "wait_days": <number>,
    "reasons": ["<reason>"]
  },
  "documents_needed": ["<document>"]
}

Be precise and data-driven. Use the actual numbers provided. Include 4-6 risk factors, 3-5 gaps, 4-6 improvement suggestions, 3-5 roadmap steps, and 5 bank recommendations (SBI, HDFC, ICICI, Axis Bank, Bajaj Finance).`;

    const userPrompt = `Analyze this loan application:

PERSONAL: Age ${age}, Gender: ${formData.gender || 'Not specified'}, Marital: ${formData.marital_status || 'Not specified'}, Family: ${formData.family_members || 0} members, ${formData.dependent_children || 0} dependents, Location: ${formData.location_city || ''} ${formData.location_state || ''}, Education: ${formData.education || 'Not specified'}

EMPLOYMENT: Job Type: ${formData.job_type || 'Not specified'}, Employer: ${formData.employer_name || 'Not specified'}, Experience: ${yearsExperience} years, Monthly Income: ₹${monthlyIncome.toLocaleString()}, Income Stability: ${formData.income_stability || 'Not specified'}, Secondary Income: ${formData.secondary_income ? 'Yes' : 'No'}

FINANCIAL: Monthly Savings: ₹${monthlySavings.toLocaleString()}, Existing Loans: ${existingLoans}, Monthly Expenses: ₹${monthlyExpenses.toLocaleString()}, Credit Score: ${creditScore}, Bank Balance: ₹${bankBalance.toLocaleString()}, Investments: ${hasInvestments ? 'Yes' : 'No'}

ASSETS: Owns House: ${ownsHouse ? 'Yes' : 'No'}, Owns Car: ${formData.owns_car ? 'Yes' : 'No'}, Property Value: ₹${propertyValue.toLocaleString()}, Health Insurance: ${formData.has_health_insurance ? 'Yes' : 'No'}, Life Insurance: ${formData.has_life_insurance ? 'Yes' : 'No'}

LOAN REQUEST: Amount: ₹${loanAmount.toLocaleString()}, Purpose: ${formData.loan_purpose || 'Personal'}, Tenure: ${loanTenure} months, Collateral: ${hasCollateral ? 'Yes' : 'No'}

CALCULATED METRICS: DTI: ${dti.toFixed(1)}%, EMI-to-Income: ${emiToIncome.toFixed(1)}%, Loan-to-Annual-Income: ${loanToIncome.toFixed(1)}x, Savings Rate: ${savingsRate.toFixed(1)}%, Financial Health: ${healthScore}/100`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
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
    const content = aiResult.choices?.[0]?.message?.content || "";
    
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
      // Fallback with rule-based analysis
      analysisJson = {
        approval_probability: healthScore,
        risk_category: healthScore >= 65 ? 'Low' : healthScore >= 40 ? 'Medium' : 'High',
        financial_health_score: healthScore,
        debt_to_income_ratio: parseFloat(dti.toFixed(1)),
        emi_affordability: emiToIncome < 30 ? 'Comfortable' : emiToIncome < 50 ? 'Stretched' : 'Unaffordable',
        summary: `Based on your financial profile with a credit score of ${creditScore} and monthly income of ₹${monthlyIncome.toLocaleString()}, your loan eligibility has been assessed.`,
        factors: [
          { name: "Credit Score", level: creditScore >= 700 ? "low" : creditScore >= 550 ? "medium" : "high", description: `Credit score of ${creditScore}`, improvement: "Maintain timely payments", impact_percent: 35 },
          { name: "Income Stability", level: monthlyIncome >= 40000 ? "low" : monthlyIncome >= 20000 ? "medium" : "high", description: `Monthly income ₹${monthlyIncome.toLocaleString()}`, improvement: "Consider additional income sources", impact_percent: 25 },
          { name: "Debt Burden", level: existingLoans === 0 ? "low" : existingLoans <= 2 ? "medium" : "high", description: `${existingLoans} existing loans`, improvement: "Clear small debts first", impact_percent: 20 },
          { name: "Loan-to-Income", level: loanToIncome < 3 ? "low" : loanToIncome < 6 ? "medium" : "high", description: `${loanToIncome.toFixed(1)}x annual income`, improvement: "Consider reducing loan amount", impact_percent: 20 },
        ],
        eligibility_gaps: [],
        improvement_suggestions: [],
        roadmap: [
          { step: 1, title: "Review Current Debts", description: "Assess and plan debt reduction", duration: "1 week" },
          { step: 2, title: "Build Savings", description: "Save 3 months of expenses", duration: "60 days" },
          { step: 3, title: "Apply to Recommended Bank", description: "Use our matched suggestions", duration: "7-14 days" },
        ],
        recommended_banks: [
          { name: "State Bank of India", interest_rate: "8.5% – 10.5%", match_score: Math.min(95, healthScore + 10), features: ["Lowest rates", "Government backed"], apply_url: "https://sbi.co.in/web/personal-banking/loans", eligibility_notes: "Suitable for government employees" },
          { name: "HDFC Bank", interest_rate: "9.0% – 11.5%", match_score: Math.min(90, healthScore + 5), features: ["Quick processing", "Digital first"], apply_url: "https://www.hdfcbank.com/personal/borrow", eligibility_notes: "Good for salaried professionals" },
          { name: "ICICI Bank", interest_rate: "9.0% – 11.0%", match_score: Math.min(85, healthScore), features: ["Flexible tenure", "Pre-approved offers"], apply_url: "https://www.icicibank.com/personal-banking/loans", eligibility_notes: "Competitive rates for high credit scores" },
          { name: "Axis Bank", interest_rate: "9.5% – 12.0%", match_score: Math.max(40, healthScore - 5), features: ["Low documentation", "Online tracking"], apply_url: "https://www.axisbank.com/retail/loans", eligibility_notes: "Good for self-employed" },
          { name: "Bajaj Finance", interest_rate: "10.0% – 14.0%", match_score: Math.max(35, healthScore - 10), features: ["NBFC flexibility", "Fast disbursement"], apply_url: "https://www.bajajfinserv.in/personal-loan", eligibility_notes: "Higher approval for lower credit scores" },
        ],
        readiness: {
          can_apply_now: healthScore >= 60,
          wait_days: healthScore >= 60 ? 0 : healthScore >= 40 ? 30 : 60,
          reasons: healthScore < 60 ? ["Improve credit score", "Reduce debt burden"] : ["Profile meets basic criteria"],
        },
        documents_needed: ["Aadhaar Card", "PAN Card", "Bank Statement (6 months)", "Income Proof"],
      };
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
