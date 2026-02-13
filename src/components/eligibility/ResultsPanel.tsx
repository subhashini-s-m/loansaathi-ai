import ApprovalMeter from './ApprovalMeter';
import type { LoanResult } from '@/types/loan';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface ResultsPanelProps {
  result: LoanResult;
}

const ResultsPanel = ({ result }: ResultsPanelProps) => {
  const { t } = useLanguage();

  const riskColor = result.riskCategory === 'Low' ? 'bg-risk-low/10 text-risk-low border-risk-low/20' :
    result.riskCategory === 'Medium' ? 'bg-risk-medium/10 text-risk-medium border-risk-medium/20' :
      'bg-risk-high/10 text-risk-high border-risk-high/20';

  const fitColor = result.bankFit === 'Good' ? 'bg-risk-low/10 text-risk-low border-risk-low/20' :
    result.bankFit === 'Moderate' ? 'bg-risk-medium/10 text-risk-medium border-risk-medium/20' :
      'bg-risk-high/10 text-risk-high border-risk-high/20';

  const riskLabel = result.riskCategory === 'Low' ? t('result_low') :
    result.riskCategory === 'Medium' ? t('result_medium') : t('result_high');

  const fitLabel = result.bankFit === 'Good' ? t('result_good') :
    result.bankFit === 'Moderate' ? t('result_moderate') : t('result_poor');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-border bg-card p-6 shadow-elevated"
    >
      <h3 className="mb-6 text-center text-lg font-semibold text-foreground">{t('elig_result_title')}</h3>

      <div className="flex justify-center mb-6">
        <ApprovalMeter probability={result.approvalProbability} />
      </div>

      <div className="flex justify-center gap-3">
        <Badge variant="outline" className={riskColor}>
          {result.riskCategory === 'Low' ? <CheckCircle className="mr-1 h-3 w-3" /> : <AlertTriangle className="mr-1 h-3 w-3" />}
          {riskLabel} {t('result_risk')}
        </Badge>
        <Badge variant="outline" className={fitColor}>
          <TrendingUp className="mr-1 h-3 w-3" />
          {fitLabel} {t('result_bank_fit')}
        </Badge>
      </div>
    </motion.div>
  );
};

export default ResultsPanel;
