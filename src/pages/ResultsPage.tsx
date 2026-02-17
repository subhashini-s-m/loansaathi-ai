import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ApprovalMeter from '@/components/eligibility/ApprovalMeter';
import ExplainableAI from '@/components/eligibility/ExplainableAI';
import WhatIfSimulator from '@/components/eligibility/WhatIfSimulator';
import RoadmapSection from '@/components/eligibility/RoadmapSection';
import DocumentChecklist from '@/components/eligibility/DocumentChecklist';
import EligibilityGaps from '@/components/eligibility/EligibilityGaps';
import ReadinessIndicator from '@/components/eligibility/ReadinessIndicator';
import type { LoanFormData, AnalysisResult } from '@/types/loan';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, ArrowRight, TrendingUp, Shield, Calculator } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

const ResultsPage = () => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [formData, setFormData] = useState<LoanFormData | null>(null);
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const storedResult = sessionStorage.getItem('analysisResult');
    const storedForm = sessionStorage.getItem('formData');
    if (storedResult) setResult(JSON.parse(storedResult));
    if (storedForm) setFormData(JSON.parse(storedForm));
    if (!storedResult) navigate('/eligibility');
  }, [navigate]);

  if (!result || !formData) return null;

  const prob = result.approval_probability;
  const riskCategory = result.risk_category || (prob >= 65 ? 'Low' : prob >= 40 ? 'Medium' : 'High');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-6 w-6 text-saffron" />
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t('elig_result_title')}</h1>
          </div>
        </motion.div>

        {/* Main Result Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-6 shadow-card mb-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="flex flex-col items-center justify-center">
              <ApprovalMeter probability={prob} />
              <p className="mt-2 text-sm text-muted-foreground">{t('result_approval')}</p>
            </div>
            <div className="lg:col-span-2 space-y-4">
              {result.summary && (
                <div className="rounded-lg bg-secondary/50 p-4">
                  <h3 className="text-sm font-semibold mb-2 text-foreground">{t('result_summary')}</h3>
                  <p className="text-sm text-muted-foreground">{result.summary}</p>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-border p-3 text-center">
                  <Shield className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">{t('result_risk')}</p>
                  <p className={`font-bold ${riskCategory === 'Low' ? 'text-risk-low' : riskCategory === 'Medium' ? 'text-risk-medium' : 'text-risk-high'}`}>{riskCategory}</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">{t('result_financial_health')}</p>
                  <p className="font-bold text-foreground">{result.financial_health_score}/100</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <Calculator className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">{t('result_dti')}</p>
                  <p className="font-bold text-foreground">{result.debt_to_income_ratio}%</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <Shield className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">{t('result_emi')}</p>
                  <p className={`font-bold ${result.emi_affordability === 'Comfortable' ? 'text-risk-low' : result.emi_affordability === 'Stretched' ? 'text-risk-medium' : 'text-risk-high'}`}>{result.emi_affordability}</p>
                </div>
              </div>
              <Button variant="saffron" size="lg" onClick={() => navigate('/apply')} className="w-full sm:w-auto">
                {t('result_view_banks')} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Explainable AI */}
        {result.factors && result.factors.length > 0 && (
          <div className="mb-8">
            <ExplainableAI factors={result.factors} />
          </div>
        )}

        {/* Gaps + What-If */}
        <div className="grid gap-8 lg:grid-cols-2 mb-8">
          <EligibilityGaps formData={formData} approvalProbability={prob} />
          <WhatIfSimulator originalData={formData} originalProbability={prob} />
        </div>

        {/* Roadmap */}
        {result.roadmap && result.roadmap.length > 0 && (
          <div className="mb-8">
            <RoadmapSection steps={result.roadmap} />
          </div>
        )}

        {/* Docs + Readiness */}
        <div className="grid gap-8 lg:grid-cols-2 mb-8">
          <DocumentChecklist formData={formData} />
          <ReadinessIndicator formData={formData} approvalProbability={prob} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResultsPage;
