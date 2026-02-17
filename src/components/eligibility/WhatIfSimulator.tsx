import { useState, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import type { LoanFormData } from '@/types/loan';
import { recalculateWithChanges } from '@/utils/loanCalculator';
import { motion } from 'framer-motion';
import { SlidersHorizontal, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/i18n/LanguageContext';

interface WhatIfSimulatorProps {
  originalData: LoanFormData;
  originalProbability: number;
}

const WhatIfSimulator = ({ originalData, originalProbability }: WhatIfSimulatorProps) => {
  const [income, setIncome] = useState(originalData.monthly_income);
  const [loanAmount, setLoanAmount] = useState(originalData.loan_amount);
  const { t } = useLanguage();

  const newProbability = useMemo(
    () => recalculateWithChanges(originalData, income, loanAmount),
    [originalData, income, loanAmount]
  );

  const diff = newProbability - originalProbability;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
          <SlidersHorizontal className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('whatif_title')}</h3>
          <p className="text-xs text-muted-foreground">{t('whatif_subtitle')}</p>
        </div>
        <Badge variant="outline" className="ml-auto bg-accent/10 text-accent border-accent/20">{t('whatif_interactive')}</Badge>
      </div>

      <div className="space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>{t('whatif_income')}</Label>
            <span className="text-sm font-semibold text-foreground">₹{income.toLocaleString('en-IN')}</span>
          </div>
          <Slider
            value={[income]}
            onValueChange={([v]) => setIncome(v)}
            min={5000}
            max={200000}
            step={1000}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>{t('whatif_loan')}</Label>
            <span className="text-sm font-semibold text-foreground">₹{loanAmount.toLocaleString('en-IN')}</span>
          </div>
          <Slider
            value={[loanAmount]}
            onValueChange={([v]) => setLoanAmount(v)}
            min={10000}
            max={2000000}
            step={10000}
          />
        </div>

        <div className="rounded-lg border border-border bg-secondary/50 p-4 text-center">
          <p className="mb-1 text-sm text-muted-foreground">{t('whatif_updated')}</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-bold text-foreground">{newProbability}%</span>
            {diff !== 0 && (
              <span className={`flex items-center gap-0.5 text-sm font-medium ${diff > 0 ? 'text-risk-low' : 'text-risk-high'}`}>
                <TrendingUp className={`h-4 w-4 ${diff < 0 ? 'rotate-180' : ''}`} />
                {diff > 0 ? '+' : ''}{diff}%
              </span>
            )}
          </div>
          {income !== originalData.monthly_income && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t('whatif_if_income')} ₹{income.toLocaleString('en-IN')} → {t('whatif_approval_becomes')} {newProbability}%
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default WhatIfSimulator;
