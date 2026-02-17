
-- Create loan applications table
CREATE TABLE public.loan_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  -- Personal Profile
  age INTEGER,
  gender TEXT,
  marital_status TEXT,
  family_members INTEGER,
  dependent_children INTEGER,
  location_city TEXT,
  location_state TEXT,
  education TEXT,
  -- Employment
  job_type TEXT,
  employer_name TEXT,
  years_experience INTEGER,
  monthly_income NUMERIC,
  income_stability TEXT,
  secondary_income BOOLEAN DEFAULT false,
  -- Financial
  monthly_savings NUMERIC,
  existing_loans INTEGER,
  total_monthly_expenses NUMERIC,
  credit_score INTEGER,
  bank_balance NUMERIC,
  has_investments BOOLEAN DEFAULT false,
  -- Assets
  owns_house BOOLEAN DEFAULT false,
  owns_car BOOLEAN DEFAULT false,
  car_year INTEGER,
  property_value NUMERIC,
  has_health_insurance BOOLEAN DEFAULT false,
  has_life_insurance BOOLEAN DEFAULT false,
  has_vehicle_insurance BOOLEAN DEFAULT false,
  -- Loan Request
  loan_amount NUMERIC,
  loan_purpose TEXT,
  loan_tenure INTEGER,
  has_collateral BOOLEAN DEFAULT false,
  -- Metadata
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analysis results table
CREATE TABLE public.analysis_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES public.loan_applications(id) ON DELETE CASCADE NOT NULL,
  approval_probability NUMERIC,
  risk_category TEXT,
  financial_health_score NUMERIC,
  debt_to_income_ratio NUMERIC,
  emi_affordability TEXT,
  ai_explanation JSONB,
  factors JSONB,
  roadmap JSONB,
  recommended_banks JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required for this prototype)
CREATE POLICY "Allow public insert on loan_applications" ON public.loan_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on loan_applications" ON public.loan_applications FOR SELECT USING (true);

CREATE POLICY "Allow public insert on analysis_results" ON public.analysis_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on analysis_results" ON public.analysis_results FOR SELECT USING (true);

CREATE POLICY "Allow public insert on chat_messages" ON public.chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on chat_messages" ON public.chat_messages FOR SELECT USING (true);
