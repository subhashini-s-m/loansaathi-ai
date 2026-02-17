import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { AnalysisResult, BankRecommendation } from '@/types/loan';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, ExternalLink, Info, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

const LoanApplicationPage = () => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const storedResult = sessionStorage.getItem('analysisResult');
    if (storedResult) setResult(JSON.parse(storedResult));
    else navigate('/eligibility');
  }, [navigate]);

  if (!result) return null;

  const banks: BankRecommendation[] = result.recommended_banks || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/results')} className="mb-4">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Results
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-6 w-6 text-saffron" />
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t('banks_page_title')}</h1>
          </div>
          <p className="text-muted-foreground">{t('banks_page_subtitle')}</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {banks.map((bank, i) => (
            <motion.div
              key={bank.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{bank.name}</h3>
                  <Badge variant="outline" className="bg-secondary text-muted-foreground text-xs">
                    {bank.interest_rate || bank.interestRate}
                  </Badge>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{t('banks_match')}</span>
                  <span className="font-medium text-foreground">{bank.match_score || bank.matchScore}%</span>
                </div>
                <Progress value={bank.match_score || bank.matchScore} className="h-2" />
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {bank.features.map(f => (
                  <span key={f} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{f}</span>
                ))}
              </div>

              {bank.eligibility_notes && (
                <p className="text-xs text-muted-foreground mb-4 italic">{bank.eligibility_notes}</p>
              )}

              <Button
                variant="saffron"
                className="w-full"
                onClick={() => {
                  if (bank.apply_url) window.open(bank.apply_url, '_blank');
                }}
              >
                {t('banks_apply')} <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex items-start gap-2 rounded-lg bg-secondary/50 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t('banks_disclaimer')}</span>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LoanApplicationPage;
