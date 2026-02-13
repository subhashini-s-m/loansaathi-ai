import { motion } from 'framer-motion';
import { Clock, ShieldCheck, Info } from 'lucide-react';
import type { LoanFormData } from '@/types/loan';
import { useLanguage } from '@/i18n/LanguageContext';

interface ReadinessIndicatorProps {
  formData: LoanFormData;
  approvalProbability: number;
}

const ReadinessIndicator = ({ formData, approvalProbability }: ReadinessIndicatorProps) => {
  const { t } = useLanguage();

  let waitDays = 0;
  const reasons: string[] = [];

  if (formData.creditScore < 550) {
    waitDays = Math.max(waitDays, 90);
    reasons.push(t('ready_reason_credit'));
  } else if (formData.creditScore < 650) {
    waitDays = Math.max(waitDays, 60);
    reasons.push(t('ready_reason_credit'));
  }

  if (formData.existingLoans > 2) {
    waitDays = Math.max(waitDays, 60);
    reasons.push(t('ready_reason_loans'));
  }

  const emiEstimate = formData.loanAmount * 0.02;
  if (emiEstimate / formData.income > 0.5) {
    waitDays = Math.max(waitDays, 30);
    reasons.push(t('ready_reason_emi'));
  }

  if (formData.income < 20000) {
    waitDays = Math.max(waitDays, 60);
    reasons.push(t('ready_reason_savings'));
  }

  const isReady = waitDays === 0 && approvalProbability >= 50;

  const waitLabel = waitDays >= 90 ? t('ready_wait_90') :
    waitDays >= 60 ? t('ready_wait_60') :
    waitDays >= 30 ? t('ready_wait_30') :
    t('ready_now');

  const statusColor = isReady
    ? 'border-risk-low/20 bg-risk-low/5'
    : 'border-risk-medium/20 bg-risk-medium/5';

  const iconColor = isReady ? 'text-risk-low' : 'text-risk-medium';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Clock className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('ready_title')}</h3>
          <p className="text-xs text-muted-foreground">{t('ready_subtitle')}</p>
        </div>
      </div>

      <div className={`rounded-lg border p-4 mb-4 ${statusColor}`}>
        <div className="flex items-center gap-2 mb-2">
          {isReady ? (
            <ShieldCheck className={`h-5 w-5 ${iconColor}`} />
          ) : (
            <Clock className={`h-5 w-5 ${iconColor}`} />
          )}
          <span className="font-semibold text-foreground">{waitLabel}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {isReady ? t('ready_now_desc') : reasons[0]}
        </p>
      </div>

      {!isReady && reasons.length > 1 && (
        <div className="space-y-2 mb-4">
          {reasons.slice(1).map((reason, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-0.5 text-xs">•</span>
              <span>{reason}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>{t('ready_prevent')}</span>
      </div>
    </motion.div>
  );
};

export default ReadinessIndicator;
