// Resilience Assessment Slot Definitions
// Extract one field at a time for conversational resilience checking

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

function buildResilienceQuestion(field: keyof ResilienceSlots, language: "en" | "hi" | "ta"): string {
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
      financial_goal: "🎯 இப்போது உங்கள் முக்கிய financial লக்ష்य என்ன? (எ.கா, Personal loan, Home loan, Business loan, அல்லது Resilience check மட்டுமே)",
    },
  };

  return questions[language][field];
}

function parseResilienceInput(text: string, field: keyof ResilienceSlots): any {
  const lower = text.toLowerCase();
  const num = parsePrimaryNumber(text);

  if (field === "monthly_income" && num && num >= 5000 && num <= 50000000) {
    return num;
  }
  if (field === "monthly_expenses" && num && num >= 2000 && num <= 5000000) {
    return num;
  }
  if (field === "emergency_savings" && num && num >= 0 && num <= 100000000) {
    return num;
  }
  if (field === "existing_debt_monthly" && num && num >= 0 && num <= 1000000) {
    return num;
  }
  if (field === "credit_score" && num && num >= 300 && num <= 900) {
    return num;
  }
  if (field === "employment_stability") {
    if (/high|secure|stable|permanent|saaf/.test(lower)) return "High";
    if (/low|risky|temporary|contract|unstable/.test(lower)) return "Low";
    return "Medium";
  }
  if (field === "dependents" && num && num >= 0 && num <= 20) {
    return num;
  }
  if (field === "financial_goal") {
    if (/personal/.test(lower)) return "Personal loan";
    if (/home|property/.test(lower)) return "Home loan";
    if (/business|mudra/.test(lower)) return "Business loan";
    if (/resilience|emergency|stress test/.test(lower)) return "Financial resilience check";
    return text.trim();
  }

  return undefined;
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

function buildResilienceFlowReply(slots: ResilienceSlots, language: "en" | "hi" | "ta"): { text: string; isComplete: boolean } {
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
