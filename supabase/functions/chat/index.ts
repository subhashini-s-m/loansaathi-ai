// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

type Lang = "en" | "hi" | "ta";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type EligibilitySlots = {
  monthly_income?: number;
  monthly_expenses?: number;
  loan_amount?: number;
  credit_score?: number;
  existing_loans?: number;
  existing_emi_amount?: number;
  job_type?: "Salaried" | "Self-employed" | "Business" | "Freelance";
  employment_stability?: "High" | "Medium" | "Low";
  dependents?: number;
  age?: number;
  loan_tenure?: number;
};

type KnowledgeDoc = {
  id: string;
  title: string;
  category: string;
  content: string;
  keywords: string[];
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const KNOWLEDGE_BASE: KnowledgeDoc[] = [
  {
    id: "credit-score-band",
    title: "Credit score ranges and impact",
    category: "Credit Score",
    content:
      "Credit score in India is usually 300-900. 750+ is strong for approval and better rates. 650-749 can get approval but often with stricter terms. Below 650 may need guarantor, collateral, or score improvement actions.",
    keywords: ["credit", "score", "cibil", "approval", "interest", "750", "650"],
  },
  {
    id: "dti-rule",
    title: "Debt-to-income thresholds",
    category: "Eligibility",
    content:
      "Debt-to-income ratio (DTI) = total monthly debt obligations divided by monthly income. Most lenders prefer DTI under 40%, and many can still consider up to 50% based on profile strength.",
    keywords: ["dti", "debt", "income", "obligation", "ratio", "eligibility"],
  },
  {
    id: "emi-basics",
    title: "EMI planning principles",
    category: "EMI",
    content:
      "EMI depends on principal, rate, and tenure. Shorter tenure raises monthly EMI but lowers total interest paid. Longer tenure lowers monthly EMI but increases total interest cost.",
    keywords: ["emi", "tenure", "principal", "interest", "monthly", "loan"],
  },
  {
    id: "documents-core",
    title: "Common loan documents",
    category: "Documents",
    content:
      "Core documents include identity proof, address proof, PAN, income proof (salary slips/ITR), and recent bank statements. Additional documents vary by loan type and lender policy.",
    keywords: ["documents", "pan", "kyc", "itr", "salary", "bank statement"],
  },
  {
    id: "improve-approval",
    title: "How to improve approval odds",
    category: "Approval",
    content:
      "Improve repayment track record, reduce credit utilization, clear overdue dues, avoid multiple hard inquiries in short periods, and keep employment/income proof consistent.",
    keywords: ["approval", "improve", "repayment", "utilization", "hard inquiry", "dues"],
  },
  {
    id: "secured-vs-unsecured",
    title: "Secured vs unsecured loans",
    category: "Loan Types",
    content:
      "Secured loans are backed by collateral and often have lower rates. Unsecured loans have faster processing but typically higher rates and stricter credit requirements.",
    keywords: ["secured", "unsecured", "collateral", "rate", "processing"],
  },
  {
    id: "home-loan-notes",
    title: "Home loan practical notes",
    category: "Home Loan",
    content:
      "Home loans usually offer longer tenures and lower rates than personal loans, but require property and legal verification documents. Processing times can vary by builder profile and title clarity.",
    keywords: ["home loan", "property", "legal", "verification", "builder", "tenure"],
  },
  {
    id: "business-loan-notes",
    title: "Business loan practical notes",
    category: "Business Loan",
    content:
      "Business loan underwriting may evaluate cash flow, GST returns, banking turnover, and business vintage. Clean filing discipline and stable receivables improve chances.",
    keywords: ["business loan", "gst", "turnover", "cash flow", "vintage"],
  },
];

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "to", "of", "and", "or", "for", "with", "on", "at", "in", "by", "how", "what", "when", "where", "why", "i", "you", "my", "me", "we", "our", "loan", "please",
]);

const langInstructions: Record<Lang, string> = {
  en: "Respond in English.",
  hi: "Respond entirely in Hindi (Devanagari script) unless user asks for English.",
  ta: "Respond entirely in Tamil unless user asks for English.",
};

const ELIGIBILITY_FIELDS: Array<keyof EligibilitySlots> = [
  "monthly_income",
  "monthly_expenses",
  "loan_amount",
  "credit_score",
  "existing_loans",
  "existing_emi_amount",
  "job_type",
  "employment_stability",
  "dependents",
  "age",
  "loan_tenure",
];

function normalizeJobType(input: string): EligibilitySlots["job_type"] | undefined {
  const text = input.toLowerCase();
  if (text.includes("salaried") || text.includes("salary")) return "Salaried";
  if (text.includes("self") || text.includes("self-employed")) return "Self-employed";
  if (text.includes("business") || text.includes("owner")) return "Business";
  if (text.includes("freelance") || text.includes("freelancer")) return "Freelance";
  return undefined;
}

function parsePrimaryNumber(input: string): number | undefined {
  const match = input.match(/(?:₹|rs\.?\s*)?\s*(\d{1,3}(?:,\d{2,3})+|\d+)/i);
  if (!match?.[1]) return undefined;
  const parsed = Number.parseInt(match[1].replace(/,/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseTenureMonths(input: string): number | undefined {
  const lower = input.toLowerCase();
  const num = parsePrimaryNumber(lower);
  if (!num) return undefined;
  if (lower.includes("year")) return num * 12;
  if (lower.includes("month")) return num;
  if (num >= 12 && num <= 360) return num;
  return undefined;
}

function isEligibilityIntent(text: string): boolean {
  return /(check\s*eligib|eligib|am\s*i\s*eligible|loan\s*approval|need\s*(a\s*)?loan|want\s*(a\s*)?loan|can\s*i\s*get\s*loan|instant\s*eligibility)/i.test(text);
}

function hasLoanConversationSignal(text: string): boolean {
  return /(loan|borrow|emi|interest|approval|apply|personal\s*loan|home\s*loan|business\s*loan|how\s*much\s*loan)/i.test(text);
}

function hasStrongProfileSignal(slots: EligibilitySlots): boolean {
  const present = ELIGIBILITY_FIELDS.filter((field) => slots[field] !== undefined);
  const hasCoreCombo = slots.monthly_income !== undefined && (slots.loan_amount !== undefined || slots.credit_score !== undefined);
  return present.length >= 2 || hasCoreCombo;
}

function isPlainNumberInput(text: string): boolean {
  return /^\s*(?:₹|rs\.?)?\s*\d{1,3}(?:,\d{2,3})*\s*$/.test(text) || /^\s*\d+\s*$/.test(text);
}

function getMissingEligibilityField(slots: EligibilitySlots): keyof EligibilitySlots | undefined {
  return ELIGIBILITY_FIELDS.find((field) => slots[field] === undefined);
}

function upsertSlotFromMessage(slots: EligibilitySlots, text: string) {
  const lower = text.toLowerCase();
  const num = parsePrimaryNumber(text);

  if ((lower.includes("income") || lower.includes("salary")) && num && num >= 8000) {
    slots.monthly_income = num;
  }

  if ((lower.includes("expense") || lower.includes("spend") || lower.includes("rent")) && num && num >= 1000) {
    slots.monthly_expenses = num;
  }

  if ((lower.includes("loan") || lower.includes("borrow") || lower.includes("need")) && num && num >= 50000) {
    slots.loan_amount = num;
  }

  if ((lower.includes("credit") || lower.includes("cibil")) && num && num >= 300 && num <= 900) {
    slots.credit_score = num;
  }

  if (lower.includes("existing loan") || lower.includes("active loan") || lower.includes("current loan") || lower.includes("ongoing emi")) {
    if (/(none|no\s+loan|zero)/i.test(lower)) {
      slots.existing_loans = 0;
    } else if (num !== undefined && num >= 0 && num <= 20) {
      slots.existing_loans = num;
    }
  }

  if ((lower.includes("emi") || lower.includes("obligation") || lower.includes("monthly debt")) && num && num >= 0) {
    slots.existing_emi_amount = num;
  }

  const inferredJobType = normalizeJobType(lower);
  if (inferredJobType) {
    slots.job_type = inferredJobType;
  }

  if (/high|secure|stable|permanent|strong/.test(lower)) {
    slots.employment_stability = "High";
  } else if (/low|risky|temporary|contract|weak/.test(lower)) {
    slots.employment_stability = "Low";
  } else if (/medium|moderate|uncertain/.test(lower)) {
    slots.employment_stability = "Medium";
  }

  if (lower.includes("depend")) {
    const depNum = parsePrimaryNumber(text);
    if (depNum !== undefined && depNum >= 0 && depNum <= 20) {
      slots.dependents = depNum;
    }
  }

  if ((lower.includes("age") || lower.includes("years old") || lower.includes("i am") || lower.includes("i'm")) && num && num >= 18 && num <= 70) {
    slots.age = num;
  }

  if (lower.includes("tenure") || lower.includes("month") || lower.includes("year")) {
    const months = parseTenureMonths(lower);
    if (months && months >= 12 && months <= 360) {
      slots.loan_tenure = months;
    }
  }
}

function assignPlainValueToMissingField(slots: EligibilitySlots, text: string) {
  const missing = getMissingEligibilityField(slots);
  if (!missing) return;
  const num = parsePrimaryNumber(text);
  if (!num) return;

  if (missing === "monthly_income" && num >= 8000 && num <= 10000000) slots.monthly_income = num;
  if (missing === "monthly_expenses" && num >= 1000 && num <= 10000000) slots.monthly_expenses = num;
  if (missing === "loan_amount" && num >= 50000 && num <= 50000000) slots.loan_amount = num;
  if (missing === "credit_score" && num >= 300 && num <= 900) slots.credit_score = num;
  if (missing === "existing_loans" && num >= 0 && num <= 20) slots.existing_loans = num;
  if (missing === "existing_emi_amount" && num >= 0 && num <= 500000) slots.existing_emi_amount = num;
  if (missing === "dependents" && num >= 0 && num <= 20) slots.dependents = num;
  if (missing === "age" && num >= 18 && num <= 70) slots.age = num;
  if (missing === "loan_tenure" && num >= 12 && num <= 360) slots.loan_tenure = num;
}

function extractEligibilitySlots(messages: ChatMessage[]): EligibilitySlots {
  const slots: EligibilitySlots = {};

  for (const msg of messages) {
    if (msg.role !== "user") continue;
    upsertSlotFromMessage(slots, msg.content);
    if (isPlainNumberInput(msg.content)) {
      assignPlainValueToMissingField(slots, msg.content);
    }
  }

  return slots;
}

function shouldRunEligibilityFlow(messages: ChatMessage[], latestUserText: string, slots: EligibilitySlots): boolean {
  const triggeredNow = isEligibilityIntent(latestUserText);
  const triggeredBefore = messages.some((m) => m.role === "user" && isEligibilityIntent(m.content));
  const inFlowByAssistant = messages.some((m) => m.role === "assistant" && /Eligibility Check Assistant/i.test(m.content));
  const incomplete = getMissingEligibilityField(slots) !== undefined;
  const conversationalProfileSignal = hasLoanConversationSignal(latestUserText) && hasStrongProfileSignal(slots);
  return triggeredNow || ((triggeredBefore || inFlowByAssistant || conversationalProfileSignal) && incomplete);
}

function buildEligibilityQuestion(field: keyof EligibilitySlots, language: Lang): string {
  const questions = {
    en: {
      monthly_income: "💰 What is your monthly take-home income in ₹? (e.g., 50000)",
      monthly_expenses: "🧾 What are your total monthly expenses in ₹? (rent, bills, etc.)",
      loan_amount: "💳 How much loan amount do you need in ₹? (e.g., 500000)",
      credit_score: "📊 What is your credit/CIBIL score? (300-900, e.g., 750)",
      existing_loans: "📋 How many active loans or EMIs do you currently have? (e.g., 1 or 2)",
      existing_emi_amount: "📌 What is your total monthly EMI/loan obligation in ₹? (e.g., 8000)",
      job_type: "💼 What is your job type? (Salaried / Self-employed / Business / Freelance)",
      employment_stability: "🧭 How stable is your income? (High / Medium / Low)",
      dependents: "👨‍👩‍👧 How many dependents rely on your income? (e.g., 2)",
      age: "🎂 What is your age? (e.g., 30)",
      loan_tenure: "⏳ Preferred loan tenure in months? (e.g., 36, 60, or 84)",
    },
    hi: {
      monthly_income: "💰 आपकी मासिक इन-हैंड आय ₹ में कितनी है? (जैसे 50000)",
      monthly_expenses: "🧾 आपके कुल मासिक खर्च ₹ में कितने हैं? (किराया, बिल आदि)",
      loan_amount: "💳 आपको ₹ में कितना लोन चाहिए? (जैसे 500000)",
      credit_score: "📊 आपका क्रेडिट/CIBIL स्कोर क्या है? (300-900, जैसे 750)",
      existing_loans: "📋 अभी आपके कितने सक्रिय लोन/EMI चल रहे हैं? (जैसे 1 या 2)",
      existing_emi_amount: "📌 आपकी कुल मासिक EMI/loan obligation ₹ में कितनी है? (जैसे 8000)",
      job_type: "💼 आपका जॉब टाइप क्या है? (Salaried / Self-employed / Business / Freelance)",
      employment_stability: "🧭 आपकी आय कितनी स्थिर है? (High / Medium / Low)",
      dependents: "👨‍👩‍👧 आपकी आय पर कितने लोग निर्भर हैं? (जैसे 2)",
      age: "🎂 आपकी उम्र क्या है? (जैसे 30)",
      loan_tenure: "⏳ पसंदीदा लोन अवधि महीनों में? (जैसे 36, 60, 84)",
    },
    ta: {
      monthly_income: "💰 உங்கள் மாத வருவாய் ₹ எவ்வளவு? (எ.கா, 50000)",
      monthly_expenses: "🧾 உங்கள் மொத்த மாத செலவுகள் ₹ எவ்வளவு? (வாடகை, bills போன்றவை)",
      loan_amount: "💳 ₹ எவ்வளவு கடன் வேண்டும்? (எ.கா, 500000)",
      credit_score: "📊 உங்கள் CIBIL/கிரெடிட் ஸ்கோர் என்ன? (300-900, எ.கா, 750)",
      existing_loans: "📋 இப்போது எத்தனை active loan/EMI உள்ளது? (எ.கா, 1 அல்லது 2)",
      existing_emi_amount: "📌 உங்கள் மொத்த monthly EMI/loan obligation ₹ எவ்வளவு? (எ.கா, 8000)",
      job_type: "💼 உங்கள் வேலை வகை? (Salaried / Self-employed / Business / Freelance)",
      employment_stability: "🧭 உங்கள் வருமானம் எவ்வளவு நிலையானது? (High / Medium / Low)",
      dependents: "👨‍👩‍👧 உங்கள் வருமானத்தை எத்தனை பேர் சார்ந்திருக்கிறார்கள்? (எ.கா, 2)",
      age: "🎂 உங்கள் வயது என்ன? (எ.கா, 30)",
      loan_tenure: "⏳ கடன் காலம் (மாதங்களில்)? (36, 60, 84)",
    },
  } as const;

  return questions[language][field];
}

function isContextSwitch(latestUserText: string, eligibilitySlots: EligibilitySlots): boolean {
  // Check if user is asking something completely unrelated to eligibility
  const isAsking = /\?\s*$/.test(latestUserText.trim());
  if (!isAsking) return false;

  const eligibilityKeywords = /income|loan|salary|credit|score|cibil|emi|tenure|job|age|existing|obligation|amount|borrow/i;
  const hasEligibilityKeyword = eligibilityKeywords.test(latestUserText);
  
  // If asking a question with no eligibility keywords, it might be a context switch
  return !hasEligibilityKeyword;
}

function calculateEligibility(slots: EligibilitySlots) {
  const income = slots.monthly_income ?? 0;
  const expenses = slots.monthly_expenses ?? 0;
  const amount = slots.loan_amount ?? 0;
  const score = slots.credit_score ?? 650;
  const loans = slots.existing_loans ?? 0;
  const tenure = slots.loan_tenure ?? 60;
  const monthlyRate = 0.11 / 12;
  const emi = tenure > 0
    ? Math.round((amount * monthlyRate * (1 + monthlyRate) ** tenure) / ((1 + monthlyRate) ** tenure - 1 || 1))
    : 0;
  const existingBurden = slots.existing_emi_amount ?? loans * 4000;
  const dti = income > 0 ? Math.round(((emi + existingBurden) / income) * 100) : 100;
  const surplus = income - expenses - existingBurden - emi;
  const expenseRatio = income > 0 ? expenses / income : 1;
  const annualIncome = income * 12;
  const loanToIncome = annualIncome > 0 ? amount / annualIncome : 0;

  let finalScore = 50;
  if (score >= 750) finalScore += 18;
  else if (score >= 700) finalScore += 12;
  else if (score >= 650) finalScore += 6;
  else finalScore -= 10;

  if (dti <= 35) finalScore += 15;
  else if (dti <= 45) finalScore += 8;
  else if (dti <= 55) finalScore += 0;
  else finalScore -= 12;

  if (income >= 100000) finalScore += 10;
  else if (income >= 50000) finalScore += 6;
  else if (income >= 25000) finalScore += 2;
  else finalScore -= 8;

  if ((slots.job_type ?? "Salaried") === "Salaried") finalScore += 5;
  if (loans === 0) finalScore += 4;
  if ((slots.age ?? 30) < 23 || (slots.age ?? 30) > 58) finalScore -= 3;

  if (expenseRatio <= 0.5) finalScore += 6;
  else if (expenseRatio <= 0.7) finalScore += 2;
  else if (expenseRatio >= 0.85) finalScore -= 6;

  if (surplus < 0) finalScore -= 12;
  else if (surplus < income * 0.1) finalScore -= 4;
  else finalScore += 4;

  if (loanToIncome > 8) finalScore -= 8;
  else if (loanToIncome > 6) finalScore -= 4;
  else if (loanToIncome > 0) finalScore += 2;

  if (slots.employment_stability === "High") finalScore += 6;
  else if (slots.employment_stability === "Medium") finalScore += 2;
  else if (slots.employment_stability === "Low") finalScore -= 6;

  if ((slots.dependents ?? 0) >= 4) finalScore -= 6;
  else if ((slots.dependents ?? 0) >= 2) finalScore -= 2;

  const probability = Math.max(8, Math.min(95, finalScore));
  const risk = probability >= 75 ? "Low" : probability >= 55 ? "Medium" : "High";
  const verdict = probability >= 70 && dti <= 45 && surplus >= 0
    ? "Likely Eligible"
    : probability >= 55 && dti <= 55
      ? "Borderline"
      : "Unlikely";

  return { probability, risk, emi, dti, surplus, verdict };
}

function buildSimpleEligibilityReport(slots: EligibilitySlots, language: Lang): string {
  const { probability, risk, emi, dti, surplus, verdict } = calculateEligibility(slots);

  if (language === "hi") {
    return `✅ **आपका Quick Eligibility Report**\n\n🧭 **Eligibility Verdict:** ${verdict}\n📊 **Approval Chances:** ${probability}%\n🎯 **Risk Level:** ${risk}\n💰 **Est. Monthly EMI:** ₹${emi.toLocaleString("en-IN")}\n📉 **Est. Monthly Surplus:** ₹${surplus.toLocaleString("en-IN")}\n\n📌 **आपकी Profile:**\nIncome: ₹${(slots.monthly_income ?? 0).toLocaleString("en-IN")} | Expenses: ₹${(slots.monthly_expenses ?? 0).toLocaleString("en-IN")} | Loan: ₹${(slots.loan_amount ?? 0).toLocaleString("en-IN")} | EMI: ₹${(slots.existing_emi_amount ?? 0).toLocaleString("en-IN")}\nScore: ${slots.credit_score ?? "N/A"} | Type: ${slots.job_type ?? "N/A"} | Stability: ${slots.employment_stability ?? "N/A"} | Dependents: ${slots.dependents ?? "N/A"}\n\n🔘 **[GET_DETAILED_REPORT]** - बेहतर विश्लेषण के लिए - **[CLICK_FOR_DETAILS]**\nया बस पूछने लगो - "मुझे अपनी approval chances को बेहतर बनाने में मदद करो" या कोई और सवाल।`;
  }

  if (language === "ta") {
    return `✅ **உங்கள் Quick Eligibility Report**\n\n🧭 **Eligibility Verdict:** ${verdict}\n📊 **Approval Chances:** ${probability}%\n🎯 **Risk Level:** ${risk}\n💰 **Est. Monthly EMI:** ₹${emi.toLocaleString("en-IN")}\n📉 **Est. Monthly Surplus:** ₹${surplus.toLocaleString("en-IN")}\n\n📌 **உங்கள் Profile:**\nIncome: ₹${(slots.monthly_income ?? 0).toLocaleString("en-IN")} | Expenses: ₹${(slots.monthly_expenses ?? 0).toLocaleString("en-IN")} | Loan: ₹${(slots.loan_amount ?? 0).toLocaleString("en-IN")} | EMI: ₹${(slots.existing_emi_amount ?? 0).toLocaleString("en-IN")}\nScore: ${slots.credit_score ?? "N/A"} | Type: ${slots.job_type ?? "N/A"} | Stability: ${slots.employment_stability ?? "N/A"} | Dependents: ${slots.dependents ?? "N/A"}\n\n🔘 **[GET_DETAILED_REPORT]** - மேலும் விவரங்களுக்கு - **[CLICK_FOR_DETAILS]**\nஅல்லது கேட்டுகொள்ளுங்கள் - "என் approval chances-ஐ எப்படி மேம்படுத்தலாம்?" அல்லது வேறு எதாவது.`;
  }

  return `✅ **Your Quick Eligibility Report**\n\n🧭 **Eligibility Verdict:** ${verdict}\n📊 **Approval Chances:** ${probability}%\n🎯 **Risk Level:** ${risk}\n💰 **Est. Monthly EMI:** ₹${emi.toLocaleString("en-IN")}\n📉 **Est. Monthly Surplus:** ₹${surplus.toLocaleString("en-IN")}\n\n📌 **Your Profile:**\nIncome: ₹${(slots.monthly_income ?? 0).toLocaleString("en-IN")} | Expenses: ₹${(slots.monthly_expenses ?? 0).toLocaleString("en-IN")} | Loan: ₹${(slots.loan_amount ?? 0).toLocaleString("en-IN")} | EMI: ₹${(slots.existing_emi_amount ?? 0).toLocaleString("en-IN")}\nScore: ${slots.credit_score ?? "N/A"} | Type: ${slots.job_type ?? "N/A"} | Stability: ${slots.employment_stability ?? "N/A"} | Dependents: ${slots.dependents ?? "N/A"}\n\n🔘 **[GET_DETAILED_REPORT]** - For deeper analysis - **[CLICK_FOR_DETAILS]**\nOr just ask - "How can I improve my approval chances?" or any other question.`;
}

function buildEligibilityResultText(slots: EligibilitySlots, language: Lang): string {
  const { probability, risk, emi, dti, surplus, verdict } = calculateEligibility(slots);

  const recommendations: string[] = [];
  if ((slots.credit_score ?? 650) < 700) recommendations.push("Improve CIBIL above 700 for better approval odds and rates.");
  if (dti > 45) recommendations.push("Reduce obligations or choose longer tenure to keep DTI under 40-45%.");
  if (surplus < 0) recommendations.push("Increase monthly surplus by cutting expenses or increasing income.");
  if ((slots.employment_stability ?? "Medium") === "Low") recommendations.push("Show stable income proofs or add a co-applicant.");
  if ((slots.existing_loans ?? 0) > 1) recommendations.push("Consider closing small active loans before applying.");
  if ((slots.monthly_income ?? 0) < 30000) recommendations.push("Add co-applicant or show stable secondary income.");

  const topSuggestions = recommendations.slice(0, 3);

  if (language === "hi") {
    return `🎯 **Eligibility Check Assistant — Detailed Result**\n\n✅ आपकी प्रोफाइल का विस्तृत मूल्यांकन तैयार है:\n- **Eligibility Verdict:** ${verdict}\n- **Approval Probability:** ${probability}%\n- **Risk Band:** ${risk}\n- **Estimated EMI:** ₹${emi.toLocaleString("en-IN")} / month\n- **Estimated DTI:** ${dti}%\n- **Estimated Monthly Surplus:** ₹${surplus.toLocaleString("en-IN")}\n\n📌 **प्रोफाइल सारांश**\n- Monthly Income: ₹${(slots.monthly_income ?? 0).toLocaleString("en-IN")}\n- Monthly Expenses: ₹${(slots.monthly_expenses ?? 0).toLocaleString("en-IN")}\n- Loan Amount: ₹${(slots.loan_amount ?? 0).toLocaleString("en-IN")}\n- Monthly EMI: ₹${(slots.existing_emi_amount ?? 0).toLocaleString("en-IN")}\n- Credit Score: ${slots.credit_score ?? "N/A"}\n- Job Type: ${slots.job_type ?? "N/A"}\n- Income Stability: ${slots.employment_stability ?? "N/A"}\n- Dependents: ${slots.dependents ?? "N/A"}\n\n🛠️ **सुधार सुझाव**\n${topSuggestions.length ? topSuggestions.map((s, i) => `${i + 1}. ${s}`).join("\n") : "1. आपकी प्रोफाइल अच्छी है, अब दस्तावेज़ तैयार रखें।"}\n\n⚠️ अंतिम मंजूरी, ब्याज दर और राशि बैंक की विस्तृत जांच पर निर्भर करेगी।`;
  }

  if (language === "ta") {
    return `🎯 **Eligibility Check Assistant — Detailed Result**\n\n✅ உங்கள் விस்தரண தகுதி மதிப்பீடு தயாராக உள்ளது:\n- **Eligibility Verdict:** ${verdict}\n- **Approval Probability:** ${probability}%\n- **Risk Band:** ${risk}\n- **Estimated EMI:** ₹${emi.toLocaleString("en-IN")} / month\n- **Estimated DTI:** ${dti}%\n- **Estimated Monthly Surplus:** ₹${surplus.toLocaleString("en-IN")}\n\n📌 **Profile Summary**\n- Monthly Income: ₹${(slots.monthly_income ?? 0).toLocaleString("en-IN")}\n- Monthly Expenses: ₹${(slots.monthly_expenses ?? 0).toLocaleString("en-IN")}\n- Loan Amount: ₹${(slots.loan_amount ?? 0).toLocaleString("en-IN")}\n- Monthly EMI: ₹${(slots.existing_emi_amount ?? 0).toLocaleString("en-IN")}\n- Credit Score: ${slots.credit_score ?? "N/A"}\n- Job Type: ${slots.job_type ?? "N/A"}\n- Income Stability: ${slots.employment_stability ?? "N/A"}\n- Dependents: ${slots.dependents ?? "N/A"}\n\n🛠️ **Improvement Tips**\n${topSuggestions.length ? topSuggestions.map((s, i) => `${i + 1}. ${s}`).join("\n") : "1. உங்கள் profile நல்லது. ஆவணங்களை தயார் நிலையில் வைத்திருங்கள்."}\n\n⚠️ இறுதி ஒப்புதல் மற்றும் வட்டி விகிதம் lender verification-ஐ பொறுத்தது.`;
  }

  return `🎯 **Eligibility Check Assistant — Detailed Result**\n\n✅ Your detailed eligibility assessment is ready:\n- **Eligibility Verdict:** ${verdict}\n- **Approval Probability:** ${probability}%\n- **Risk Band:** ${risk}\n- **Estimated EMI:** ₹${emi.toLocaleString("en-IN")} / month\n- **Estimated DTI:** ${dti}%\n- **Estimated Monthly Surplus:** ₹${surplus.toLocaleString("en-IN")}\n\n📌 **Profile Summary**\n- Monthly Income: ₹${(slots.monthly_income ?? 0).toLocaleString("en-IN")}\n- Monthly Expenses: ₹${(slots.monthly_expenses ?? 0).toLocaleString("en-IN")}\n- Loan Amount: ₹${(slots.loan_amount ?? 0).toLocaleString("en-IN")}\n- Monthly EMI: ₹${(slots.existing_emi_amount ?? 0).toLocaleString("en-IN")}\n- Credit Score: ${slots.credit_score ?? "N/A"}\n- Job Type: ${slots.job_type ?? "N/A"}\n- Income Stability: ${slots.employment_stability ?? "N/A"}\n- Dependents: ${slots.dependents ?? "N/A"}\n\n🛠️ **Best Next Steps**\n${topSuggestions.length ? topSuggestions.map((s, i) => `${i + 1}. ${s}`).join("\n") : "1. Your profile looks healthy. Keep documents ready and compare offers."}\n\n⚠️ Final sanction, pricing, and approved amount depend on lender verification.`;
}

function buildEligibilityFlowReply(slots: EligibilitySlots, language: Lang): { text: string; isComplete: boolean } {
  const missing = getMissingEligibilityField(slots);
  if (!missing) {
    return { text: buildSimpleEligibilityReport(slots, language), isComplete: true };
  }

  const filledCount = ELIGIBILITY_FIELDS.filter((field) => slots[field] !== undefined).length;
  const progressText = language === "hi"
    ? `\n\n⏳ प्रगति: ${filledCount}/${ELIGIBILITY_FIELDS.length}`
    : language === "ta"
      ? `\n\n⏳ முன்னேற்றம்: ${filledCount}/${ELIGIBILITY_FIELDS.length}`
      : `\n\n⏳ Progress: ${filledCount}/${ELIGIBILITY_FIELDS.length}`;

  const preface = language === "hi"
    ? "🎯 **Eligibility Check Assistant**\nमैं आपकी जानकारी लेकर तुरंत पात्रता आकलन कर रहा हूँ।"
    : language === "ta"
      ? "🎯 **Eligibility Check Assistant**\nஉங்கள் தகவல்களை வைத்து உடனடி தகுதி மதிப்பீடு செய்கிறேன்."
      : "🎯 **Eligibility Check Assistant**\nI’m running a conversational eligibility check and will guide you step-by-step.";

  return {
    text: `${preface}${progressText}\n\n${buildEligibilityQuestion(missing, language)}`,
    isComplete: false,
  };
}

// Resilience Assessment Functions
type ResilienceSlots = {
  monthly_income?: number;
  monthly_expenses?: number;
  emergency_savings?: number;
  existing_debt_monthly?: number;
  credit_score?: number;
  employment_stability?: "High" | "Medium" | "Low";
  dependents?: number;
  financial_goal?: string;
};

const RESILIENCE_FIELDS: Array<keyof ResilienceSlots> = [
  "monthly_income",
  "monthly_expenses",
  "emergency_savings",
  "existing_debt_monthly",
  "credit_score",
  "employment_stability",
  "dependents",
  "financial_goal",
];

function getMissingResilienceField(slots: ResilienceSlots): keyof ResilienceSlots | undefined {
  return RESILIENCE_FIELDS.find((field) => slots[field] === undefined);
}

function buildResilienceQuestion(field: keyof ResilienceSlots, language: Lang): string {
  const questions = {
    en: {
      monthly_income: "💰 Let's start with your financial snapshot. What is your approximate monthly income (after taxes)? (e.g., 50000)",
      monthly_expenses: "📊 And what are your regular monthly expenses? (e.g., 30000)",
      emergency_savings: "🏦 How much do you have saved as an emergency fund? (e.g., 100000)",
      existing_debt_monthly: "📋 What is your total monthly debt obligation (EMIs, loans, credit cards)? (e.g., 8000)",
      credit_score: "⭐ What is your credit score? (300-900, e.g., 720)",
      employment_stability: "💼 How would you describe your job security? (High / Medium / Low)",
      dependents: "👨‍👩‍👧 How many people depend on your income? (e.g., 2)",
      financial_goal: "🎯 What is your main financial goal right now? (e.g., Personal loan, Home loan, Business loan, or Just checking resilience)",
    },
    hi: {
      monthly_income: "💰 आइए आपकी financial situation से शुरुआत करें। आपकी monthly income (करों के बाद) लगभग कितनी है? (जैसे 50000)",
      monthly_expenses: "📊 और आपके regular monthly खर्च कितने हैं? (जैसे 30000)",
      emergency_savings: "🏦 आपके पास emergency fund के रूप में कितना पैसा बचा है? (जैसे 100000)",
      existing_debt_monthly: "📋 आपकी कुल monthly debt obligation (EMIs, loans, credit cards) कितनी है? (जैसे 8000)",
      credit_score: "⭐ आपका credit score क्या है? (300-900, जैसे 720)",
      employment_stability: "💼 आप अपनी नौकरी की सुरक्षा को कैसे देखते हैं? (High / Medium / Low)",
      dependents: "👨‍👩‍👧 आपकी आय पर कितने लोग निर्भर हैं? (जैसे 2)",
      financial_goal: "🎯 अभी आपका मुख्य financial लक्ष्य क्या है? (जैसे Personal loan, Home loan, Business loan, या सिर्फ resilience check)",
    },
    ta: {
      monthly_income: "💰 உங்கள் financial situation-ஐ தொடங்குவோம். உங்கள் மாத வருமானம் (வரிக்குப் பிறகு) சுமாரு எவ்வளவு? (எ.கா, 50000)",
      monthly_expenses: "📊 உங்கள் regular மாத செலவுகள் எவ்வளவு? (எ.கா, 30000)",
      emergency_savings: "🏦 Emergency fund-ஆக உங்களிடம் எவ்வளவு பணம் உள்ளது? (எ.கா, 100000)",
      existing_debt_monthly: "📋 உங்கள் மொத்த monthly debt obligation (EMIs, loans, credit cards) எவ்வளவு? (எ.கா, 8000)",
      credit_score: "⭐ உங்கள் credit score என்ன? (300-900, எ.கா, 720)",
      employment_stability: "💼 உங்கள் வேலை பாதுகாப்பை எப்படி பார்க்கிறீர்கள்? (High / Medium / Low)",
      dependents: "👨‍👩‍👧 உங்கள் வருமானத்தை எவ்வளவு மக்கள் சார்ந்திருக்கிறார்கள்? (எ.கா, 2)",
      financial_goal: "🎯 இப்போது உங்கள் முக்கிய financial லक्ष्य என்ன? (எ.கா, Personal loan, Home loan, Business loan, அல்லது Resilience check மட்டுமே)",
    },
  };

  return questions[language][field];
}

function extractResilienceSlots(messages: ChatMessage[]): ResilienceSlots {
  const slots: ResilienceSlots = {};

  for (const msg of messages) {
    if (msg.role !== "user") continue;
    
    const text = msg.content;
    const lower = text.toLowerCase();

    // Parse numeric values
    const num = parsePrimaryNumber(text);

    if ((lower.includes("income") || lower.includes("salary")) && num && num >= 5000) {
      slots.monthly_income = num;
    }
    if ((lower.includes("expense") || lower.includes("spend")) && num && num >= 2000) {
      slots.monthly_expenses = num;
    }
    if ((lower.includes("saving") || lower.includes("emergency") || lower.includes("fund")) && num && num >= 0) {
      slots.emergency_savings = num;
    }
    if ((lower.includes("debt") || lower.includes("emi") || lower.includes("obligation")) && num && num >= 0) {
      slots.existing_debt_monthly = num;
    }
    if ((lower.includes("credit") || lower.includes("score")) && num && num >= 300 && num <= 900) {
      slots.credit_score = num;
    }
    if (lower.includes("depend")) {
      const depNum = parsePrimaryNumber(text);
      if (depNum !== undefined && depNum >= 0 && depNum <= 20) {
        slots.dependents = depNum;
      }
    }

    // Parse categorical values
    if (/high|secure|stable|permanent|strong/.test(lower)) {
      slots.employment_stability = "High";
    } else if (/low|risky|temporary|contract|weak/.test(lower)) {
      slots.employment_stability = "Low";
    } else if (/medium|moderate|uncertain/.test(lower)) {
      slots.employment_stability = "Medium";
    }

    // Parse goal
    if (/personal/.test(lower)) {
      slots.financial_goal = "Personal loan";
    } else if (/home|property|house/.test(lower)) {
      slots.financial_goal = "Home loan";
    } else if (/business|mudra|self-employed/.test(lower)) {
      slots.financial_goal = "Business loan";
    } else if (/resilience|emergency|stress|check|health/.test(lower)) {
      slots.financial_goal = "Financial resilience check";
    }
  }

  return slots;
}

function isResilienceIntent(text: string): boolean {
  return /(resilience|resilient|stress test|emergency|can i afford|rainy day|financial cushion|backup|safety net|how long can i manage|financial health|worst case)/i.test(text);
}

function shouldRunResilienceFlow(messages: ChatMessage[], latestUserText: string, slots: ResilienceSlots): boolean {
  const triggeredNow = isResilienceIntent(latestUserText);
  const triggeredBefore = messages.some((m) => m.role === "user" && isResilienceIntent(m.content));
  const inFlowByAssistant = messages.some((m) => m.role === "assistant" && /Resilience Assessment|Financial Resilience/.test(m.content));
  const incomplete = getMissingResilienceField(slots) !== undefined;

  return triggeredNow || ((triggeredBefore || inFlowByAssistant) && incomplete);
}

function buildResilienceFlowReply(slots: ResilienceSlots, language: Lang): { text: string; isComplete: boolean } {
  const missing = getMissingResilienceField(slots);
  if (!missing) {
    // All collected - trigger dashboard
    return { 
      text: language === "hi" 
        ? "✅ आपकी जानकारी सभी complete है! अब मैं आपका detailed resilience analysis दिखाता हूँ..."
        : language === "ta"
          ? "✅ உங்கள் தகவல் complete! இப்போது உங்கள் resilience analysis காட்டுகிறேன்..."
          : "✅ Perfect! I have all the information. Let me calculate your financial resilience...",
      isComplete: true 
    };
  }

  const filledCount = RESILIENCE_FIELDS.filter((field) => slots[field] !== undefined).length;
  const progressText = language === "hi"
    ? `\n\n⏳ Progress: ${filledCount}/${RESILIENCE_FIELDS.length} fields`
    : language === "ta"
      ? `\n\n⏳ முன்னேற்றம்: ${filledCount}/${RESILIENCE_FIELDS.length} fields`
      : `\n\n⏳ Progress: ${filledCount}/${RESILIENCE_FIELDS.length} fields`;

  const preface = language === "hi"
    ? "🛡️ **Financial Resilience Assessment**\nमैं आपकी financial resilience को समझने के लिए कुछ प्रश्न पूछूंगा।"
    : language === "ta"
      ? "🛡️ **Financial Resilience Assessment**\nஉங்கள் financial resilience-ஐ புரிய சில கேள்விகள் கேட்சேன்."
      : "🛡️ **Financial Resilience Assessment**\nI'll ask you a few questions to understand your financial resilience.";

  return {
    text: `${preface}${progressText}\n\n${buildResilienceQuestion(missing, language)}`,
    isComplete: false,
  };
}
  const encoder = new TextEncoder();
  const words = text.split(/(\s+)/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const token of words) {
    if ((current + token).length > 60) {
      chunks.push(current);
      current = token;
    } else {
      current += token;
    }
  }
  if (current) chunks.push(current);

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `event: rag\ndata: ${JSON.stringify({
            usedDocs: ragDocs.map((doc) => ({ id: doc.id, title: doc.title, category: doc.category })),
          })}\n\n`,
        ),
      );

      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(toOpenAIStreamingChunk(chunk)));
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function tokenize(input: string): string[] {
  return normalizeWhitespace(input.toLowerCase())
    .split(/[^a-z0-9₹%]+/g)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function expandTokens(tokens: string[]): string[] {
  const expanded = new Set(tokens);
  const synonymMap: Record<string, string[]> = {
    cibil: ["credit", "score"],
    emi: ["installment", "monthly"],
    dti: ["debt", "income", "ratio"],
    docs: ["documents", "kyc"],
    approval: ["eligible", "eligibility", "approve"],
    tenure: ["duration", "months", "years"],
  };

  for (const token of tokens) {
    const synonyms = synonymMap[token];
    if (synonyms) {
      synonyms.forEach((word) => expanded.add(word));
    }
  }

  return [...expanded];
}

function scoreDocument(doc: KnowledgeDoc, queryTokens: string[]): number {
  if (queryTokens.length === 0) {
    return 0;
  }

  const title = doc.title.toLowerCase();
  const content = doc.content.toLowerCase();
  const keywords = doc.keywords.map((word) => word.toLowerCase());

  let score = 0;

  for (const token of queryTokens) {
    if (keywords.some((kw) => kw.includes(token) || token.includes(kw))) {
      score += 14;
    }
    if (title.includes(token)) {
      score += 8;
    }
    if (content.includes(token)) {
      score += 3;
    }
  }

  return score;
}

function retrieveContext(query: string, maxDocs = 4): KnowledgeDoc[] {
  const tokens = expandTokens(tokenize(query));

  const ranked = KNOWLEDGE_BASE
    .map((doc) => ({ doc, score: scoreDocument(doc, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxDocs)
    .map((entry) => entry.doc);

  return ranked;
}

function formatRagContext(docs: KnowledgeDoc[]): string {
  if (docs.length === 0) {
    return "";
  }

  return docs
    .map((doc) => `- ${doc.title} [${doc.category}]\n${doc.content}`)
    .join("\n\n");
}

function toOpenAIStreamingChunk(text: string): string {
  return `data: ${JSON.stringify({
    id: crypto.randomUUID(),
    object: "chat.completion.chunk",
    choices: [{ delta: { content: text }, index: 0, finish_reason: null }],
  })}\n\n`;
}

async function streamHuggingFaceToSSE(
  source: ReadableStream<Uint8Array>,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
) {
  const reader = source.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) {
        line = line.slice(0, -1);
      }

      if (!line.startsWith("data:")) {
        continue;
      }

      const payload = line.slice(5).trim();

      if (!payload || payload === "[DONE]") {
        continue;
      }

      try {
        const parsed = JSON.parse(payload);
        const tokenText = parsed?.token?.text ?? parsed?.generated_text ?? "";

        if (tokenText) {
          controller.enqueue(encoder.encode(toOpenAIStreamingChunk(tokenText)));
        }

        if (parsed?.details?.finish_reason) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          return;
        }
      } catch {
        continue;
      }
    }
  }

  if (buffer.trim().length > 0) {
    try {
      const raw = JSON.parse(buffer.trim());
      const fallbackText = raw?.generated_text ?? "";
      if (fallbackText) {
        controller.enqueue(encoder.encode(toOpenAIStreamingChunk(fallbackText)));
      }
    } catch {
      // no-op
    }
  }

  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => null);
    const inputMessages = Array.isArray(body?.messages) ? body.messages : [];
    const language: Lang = body?.language === "hi" || body?.language === "ta" ? body.language : "en";
    const inputMode: "text" | "voice" = body?.inputMode === "voice" ? "voice" : "text";

    if (inputMessages.length === 0) {
      return new Response(JSON.stringify({ error: "messages are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const HUGGING_FACE_TOKEN = Deno.env.get("HUGGING_FACE_TOKEN");
    if (!HUGGING_FACE_TOKEN) {
      throw new Error("HUGGING_FACE_TOKEN is not configured");
    }

    const cleanMessages: ChatMessage[] = inputMessages
      .filter((msg: any) => typeof msg?.content === "string" && (msg?.role === "user" || msg?.role === "assistant" || msg?.role === "system"))
      .map((msg: any) => ({ role: msg.role, content: normalizeWhitespace(msg.content) }))
      .filter((msg: ChatMessage) => msg.content.length > 0)
      .slice(-20);

    const latestUserText = [...cleanMessages].reverse().find((msg) => msg.role === "user")?.content ?? "";
    const ragDocs = retrieveContext(latestUserText, 4);
    const ragContext = formatRagContext(ragDocs);

    const eligibilitySlots = extractEligibilitySlots(cleanMessages);
    const runEligibilityAgent = shouldRunEligibilityFlow(cleanMessages, latestUserText, eligibilitySlots);
    const isSwitch = isContextSwitch(latestUserText, eligibilitySlots);

    // If in eligibility flow and not a context switch, run eligibility
    if (runEligibilityAgent && !isSwitch) {
      const eligibilityReply = buildEligibilityFlowReply(eligibilitySlots, language);
      const eligibilityStream = streamTextAsSSE(eligibilityReply.text, ragDocs);

      return new Response(eligibilityStream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }
    
    // Check for resilience/stress test intent
    const resilienceSlots = extractResilienceSlots(cleanMessages);
    const runResilienceAgent = shouldRunResilienceFlow(cleanMessages, latestUserText, resilienceSlots);

    // If user asks for resilience check, run resilience flow
    if (runResilienceAgent) {
      const resilienceReply = buildResilienceFlowReply(resilienceSlots, language);
      const resilienceStream = streamTextAsSSE(resilienceReply.text, ragDocs);

      return new Response(resilienceStream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }
    
    // If context switch detected during eligibility, answer the question first
    // then optionally suggest returning to eligibility
    if (isSwitch && runEligibilityAgent) {
      // User asked something different - handle via LLM but can still be in eligibility mode
      // Fall through to normal LLM response below
    }

    const systemPrompt = [
      "You are NidhiSaarthi AI, a friendly and knowledgeable Indian financial advisor committed to helping users make smart loan and credit decisions.",
      "",
      "PERSONALITY & TONE:",
      "- Professional yet approachable, never robotic or corporate",
      "- Empathetic to financial concerns; acknowledge challenges before offering solutions",
      "- Use conversational language with warm, encouraging tone",
      "- Include practical examples relevant to Indian financial landscape",
      "- Be concise but never dismissive; brevity + substance",
      "",
      "CORE PRINCIPLES:",
      "1. ACCURACY: Ground every answer strictly in the provided RAG knowledge base or user conversation.",
      "2. HONESTY: Never invent interest rates, bank processes, or eligibility guarantees. Always qualify claims with \"typically\" or \"generally\".",
      "3. HELPFULNESS: Address the user's underlying need, not just surface question. Ask clarifying follow-ups if context is unclear.",
      "4. RELEVANCE: Reference earlier conversation points to show continuity. Build on what user has already shared.",
      "5. SAFETY: Never pretend to be an official bank service. Always remind users of final verification need.",
      "",
      "RESPONSE STRUCTURE:",
      "- Lead with the most relevant insight or answer",
      "- Use bullet points or numbered lists for clarity",
      "- Include a practical next step when relevant",
      "- Always add one clarifying question if you need more context",
      "- For financial figures, always include a brief disclaimer: \"*Subject to final bank verification*\"",
      "",
      langInstructions[language],
      "",
      "CONTEXT AWARENESS:",
      "- Remember and reference earlier conversation points naturally",
      "- Recognize if user is in eligibility flow vs. general loan question vs. credit advice",
      "- Adapt depth: simple queries get simple answers, complex profiles get detailed analysis",
      "",
      inputMode === "voice" ? "VOICE MODE: Keep responses short (under 60 words), friendly, and read-aloud natural. Prefer simple sentences. Pause-friendly breaks." : "TEXT MODE: Provide well-structured, actionable guidance with examples. Use formatting for clarity.",
      "",
      ragContext ? `RAG KNOWLEDGE CONTEXT:\n${ragContext}` : "No matching financial knowledge found - ask clarifying follow-up.",
    ].join("\n\n");

    const conversationText = cleanMessages
      .map((msg) => `${msg.role === "user" ? "User" : msg.role === "assistant" ? "Assistant" : "System"}: ${msg.content}`)
      .join("\n");

    const prompt = `${systemPrompt}\n\n${conversationText}\nAssistant:`;

    const hfResponse = await fetch("https://api-inference.huggingface.co/models/DragonLLM/Llama-Open-Finance-8B", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 512,
          temperature: 0.7,
          top_p: 0.95,
          top_k: 50,
          repetition_penalty: 1.1,
          presence_penalty: 0.6,
          return_full_text: false,
          stream: true,
        },
      }),
    });

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text().catch(() => "Unknown upstream error");
      console.error("DragonLLM upstream error", hfResponse.status, errorText);

      const status = hfResponse.status === 429 ? 429 : 500;
      const error = hfResponse.status === 429
        ? "Rate limit exceeded. Please retry in a few seconds."
        : "AI service unavailable. Please try again.";

      return new Response(JSON.stringify({ error }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(
              `event: rag\ndata: ${JSON.stringify({
                usedDocs: ragDocs.map((doc) => ({ id: doc.id, title: doc.title, category: doc.category })),
              })}\n\n`,
            ),
          );

          if (!hfResponse.body) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }

          await streamHuggingFaceToSSE(hfResponse.body, controller, encoder);
          controller.close();
        } catch (error) {
          console.error("SSE stream failed", error);
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: "Streaming failed" })}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("chat function error", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
