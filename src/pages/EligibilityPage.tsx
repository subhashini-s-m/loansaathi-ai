import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import EligibilityForm from '@/components/eligibility/EligibilityForm';
import ResultsPanel from '@/components/eligibility/ResultsPanel';
import ExplainableAI from '@/components/eligibility/ExplainableAI';
import WhatIfSimulator from '@/components/eligibility/WhatIfSimulator';
import RoadmapSection from '@/components/eligibility/RoadmapSection';
import BankRecommendations from '@/components/eligibility/BankRecommendations';
import DocumentChecklist from '@/components/eligibility/DocumentChecklist';
import EligibilityGaps from '@/components/eligibility/EligibilityGaps';
import ReadinessIndicator from '@/components/eligibility/ReadinessIndicator';
import { calculateLoanResult } from '@/utils/loanCalculator';
import { sampleCases } from '@/data/mockData';
import type { LoanFormData, LoanResult } from '@/types/loan';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

const EligibilityPage = () => {
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState<LoanResult | null>(null);
  const [formData, setFormData] = useState<LoanFormData | undefined>(undefined);
  const { t } = useLanguage();

  const demoId = searchParams.get('demo');
  const sampleCase = demoId ? sampleCases.find(c => c.id === demoId) : null;

  useEffect(() => {
    if (sampleCase) {
      setFormData(sampleCase.formData);
      const r = calculateLoanResult(sampleCase.formData);
      setResult(r);
    }
  }, [demoId]);

  const handleSubmit = (data: LoanFormData) => {
    setFormData(data);
    setResult(calculateLoanResult(data));
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
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

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 text-lg font-semibold text-foreground">{t('elig_form_title')}</h2>
              <EligibilityForm initialData={formData} onSubmit={handleSubmit} />
            </div>
          </div>

          <div className="lg:col-span-2">
            {result ? (
              <ResultsPanel result={result} />
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
                <div>
                  <Brain className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                  <p className="text-muted-foreground">{t('elig_empty_text')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {result && formData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10 space-y-8"
          >
            <ExplainableAI factors={result.factors} />

            <EligibilityGaps formData={formData} approvalProbability={result.approvalProbability} />

            <div className="grid gap-8 lg:grid-cols-2">
              <WhatIfSimulator originalData={formData} originalProbability={result.approvalProbability} />
              <RoadmapSection steps={result.roadmap} />
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <DocumentChecklist formData={formData} />
              <ReadinessIndicator formData={formData} approvalProbability={result.approvalProbability} />
            </div>

            <BankRecommendations banks={result.recommendedBanks} />
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default EligibilityPage;
