import { motion } from 'framer-motion';
import { AlertOctagon, ArrowUpCircle } from 'lucide-react';
import type { LoanFormData } from '@/types/loan';
import { useLanguage } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

interface EligibilityGapsProps {
  formData: LoanFormData;
  approvalProbability: number;
}

interface Gap {
  messageKey: TranslationKey;
  priority: number;
}

const EligibilityGaps = ({ formData, approvalProbability }: EligibilityGapsProps) => {
  const { t } = useLanguage();

  if (approvalProbability >= 75) return null;

  const gaps: Gap[] = [];
  const fixes: string[] = [];

  const incomeRatio = formData.loanAmount / (formData.income * 12);

  if (formData.income < 25000) {
    gaps.push({ messageKey: 'gaps_income_low', priority: 1 });
    fixes.push(t('gaps_income_low'));
  }
  if (incomeRatio > 4) {
    gaps.push({ messageKey: 'gaps_ratio_high', priority: 2 });
  }
  if (formData.creditScore < 600) {
    gaps.push({ messageKey: 'gaps_credit_low', priority: 1 });
    fixes.push(t('gaps_credit_low'));
  }
  if (formData.existingLoans > 2) {
    gaps.push({ messageKey: 'gaps_existing_high', priority: 2 });
    fixes.push(t('gaps_existing_high'));
  }
  const emiEstimate = formData.loanAmount * 0.02;
  if (emiEstimate / formData.income > 0.5) {
    gaps.push({ messageKey: 'gaps_emi_high', priority: 1 });
  }

  if (gaps.length === 0) return null;

  gaps.sort((a, b) => a.priority - b.priority);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-risk-high/10">
          <AlertOctagon className="h-4 w-4 text-risk-high" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('gaps_title')}</h3>
          <p className="text-xs text-muted-foreground">{t('gaps_subtitle')}</p>
        </div>
      </div>

      <div className="space-y-2 mb-5">
        {gaps.map((gap, i) => (
          <motion.div
            key={gap.messageKey}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 + i * 0.08 }}
            className="flex items-start gap-2.5 rounded-lg border border-risk-high/20 bg-risk-high/5 p-3"
          >
            <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-risk-high" />
            <span className="text-sm text-foreground">{t(gap.messageKey)}</span>
          </motion.div>
        ))}
      </div>

      {fixes.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <ArrowUpCircle className="h-4 w-4 text-accent" />
            <h4 className="font-semibold text-foreground">{t('gaps_fix_title')}</h4>
          </div>
          <div className="space-y-2">
            {fixes.map((fix, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-lg border border-accent/20 bg-accent/5 p-3">
                <span className="mt-0.5 text-sm font-medium text-accent">{i + 1}.</span>
                <span className="text-sm text-foreground">{fix}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EligibilityGaps;
