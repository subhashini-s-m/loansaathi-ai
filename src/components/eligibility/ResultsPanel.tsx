import ApprovalMeter from './ApprovalMeter';
import type { LoanResult } from '@/types/loan';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface ResultsPanelProps {
  result: LoanResult;
}

const ResultsPanel = ({ result }: ResultsPanelProps) => {
  const riskColor = result.riskCategory === 'Low' ? 'bg-risk-low/10 text-risk-low border-risk-low/20' :
    result.riskCategory === 'Medium' ? 'bg-risk-medium/10 text-risk-medium border-risk-medium/20' :
      'bg-risk-high/10 text-risk-high border-risk-high/20';

  const fitColor = result.bankFit === 'Good' ? 'bg-risk-low/10 text-risk-low border-risk-low/20' :
    result.bankFit === 'Moderate' ? 'bg-risk-medium/10 text-risk-medium border-risk-medium/20' :
      'bg-risk-high/10 text-risk-high border-risk-high/20';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-border bg-card p-6 shadow-elevated"
    >
      <h3 className="mb-6 text-center text-lg font-semibold text-foreground">AI Assessment Result</h3>

      <div className="flex justify-center mb-6">
        <ApprovalMeter probability={result.approvalProbability} />
      </div>

      <div className="flex justify-center gap-3">
        <Badge variant="outline" className={riskColor}>
          {result.riskCategory === 'Low' ? <CheckCircle className="mr-1 h-3 w-3" /> : <AlertTriangle className="mr-1 h-3 w-3" />}
          {result.riskCategory} Risk
        </Badge>
        <Badge variant="outline" className={fitColor}>
          <TrendingUp className="mr-1 h-3 w-3" />
          {result.bankFit} Bank Fit
        </Badge>
      </div>
    </motion.div>
  );
};

export default ResultsPanel;
