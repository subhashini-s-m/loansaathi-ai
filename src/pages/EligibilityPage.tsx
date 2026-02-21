import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import EligibilityForm from '@/components/eligibility/EligibilityForm';
import { sampleCases } from '@/data/mockData';
import type { LoanFormData } from '@/types/loan';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const EligibilityPage = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState<LoanFormData | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const demoId = searchParams.get('demo');
  const sampleCase = demoId ? sampleCases.find(c => c.id === demoId) : null;

  useEffect(() => {
    if (sampleCase) {
      setFormData(sampleCase.formData as LoanFormData);
    } else {
      // Try to load pre-filled data from chat
      const chatDataStr = sessionStorage.getItem('eligibility_chat_data');
      if (chatDataStr) {
        try {
          const chatData = JSON.parse(chatDataStr);
          // Pre-fill form with chat data
          setFormData((prev) => ({
            ...prev,
            monthly_income: chatData.monthly_income || prev?.monthly_income,
            loan_amount: chatData.loan_amount || prev?.loan_amount,
            credit_score: chatData.credit_score || prev?.credit_score,
            job_type: chatData.job_type || prev?.job_type,
          } as LoanFormData));
          // Clear sessionStorage so it doesn't apply on next visit
          sessionStorage.removeItem('eligibility_chat_data');
        } catch (e) {
          console.error('Error parsing chat eligibility data:', e);
        }
      }
    }
  }, [demoId]);

  const handleSubmit = async (data: LoanFormData) => {
    setIsSubmitting(true);
    try {
      // Generate session ID
      const sessionId = crypto.randomUUID();
      
      // Save application to database
      const { data: appData, error: appError } = await supabase
        .from('loan_applications')
        .insert({
          session_id: sessionId,
          age: data.age,
          gender: data.gender,
          marital_status: data.marital_status,
          family_members: data.family_members,
          dependent_children: data.dependent_children,
          location_city: data.location_city,
          location_state: data.location_state,
          education: data.education,
          job_type: data.job_type,
          employer_name: data.employer_name,
          years_experience: data.years_experience,
          monthly_income: data.monthly_income,
          income_stability: data.income_stability,
          secondary_income: data.secondary_income,
          monthly_savings: data.monthly_savings,
          existing_loans: data.existing_loans,
          total_monthly_expenses: data.total_monthly_expenses,
          credit_score: data.credit_score,
          bank_balance: data.bank_balance,
          has_investments: data.has_investments,
          owns_house: data.owns_house,
          owns_car: data.owns_car,
          car_year: data.car_year,
          property_value: data.property_value,
          has_health_insurance: data.has_health_insurance,
          has_life_insurance: data.has_life_insurance,
          has_vehicle_insurance: data.has_vehicle_insurance,
          loan_amount: data.loan_amount,
          loan_purpose: data.loan_purpose,
          loan_tenure: data.loan_tenure,
          has_collateral: data.has_collateral,
          language: language,
        })
        .select()
        .single();

      if (appError) throw appError;

      // Call AI analysis
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('financial-analysis', {
        body: { formData: data, language },
      });

      if (analysisError) throw analysisError;

      // Save analysis results
      if (appData) {
        await supabase.from('analysis_results').insert({
          application_id: appData.id,
          approval_probability: analysisData.approval_probability,
          risk_category: analysisData.risk_category,
          financial_health_score: analysisData.financial_health_score,
          debt_to_income_ratio: analysisData.debt_to_income_ratio,
          emi_affordability: analysisData.emi_affordability,
          ai_explanation: analysisData,
          factors: analysisData.factors,
          roadmap: analysisData.roadmap,
          recommended_banks: analysisData.recommended_banks,
        });
      }

      // Store in sessionStorage and navigate to results
      sessionStorage.setItem('analysisResult', JSON.stringify(analysisData));
      sessionStorage.setItem('formData', JSON.stringify(data));
      navigate('/results');
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Error',
        description: error.message || 'Failed to analyze your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-6 w-6 text-saffron" />
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t('elig_title')}</h1>
          </div>
          <p className="text-muted-foreground">{t('elig_subtitle')}</p>
          {sampleCase && (
            <Badge variant="outline" className="mt-2 bg-saffron/10 text-saffron border-saffron/20">
              📋 {t('elig_sample_label')}: {sampleCase.title} — {sampleCase.description}
            </Badge>
          )}
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold text-foreground">{t('elig_form_title')}</h2>
            {isSubmitting ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-saffron mb-4" />
                <p className="text-lg font-medium text-foreground">{t('result_analyzing')}</p>
                <p className="text-sm text-muted-foreground mt-2">This may take 10-15 seconds...</p>
              </div>
            ) : (
              <EligibilityForm initialData={formData} onSubmit={handleSubmit} />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EligibilityPage;
