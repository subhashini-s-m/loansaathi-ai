import type { BankRecommendation } from '@/types/loan';
import { motion } from 'framer-motion';
import { Building2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/i18n/LanguageContext';

interface BankRecommendationsProps {
  banks: BankRecommendation[];
}

const BankRecommendations = ({ banks }: BankRecommendationsProps) => {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
          <Building2 className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('banks_title')}</h3>
          <p className="text-xs text-muted-foreground">{t('banks_subtitle')}</p>
        </div>
      </div>

      <div className="space-y-4">
        {banks.map((bank, i) => (
          <motion.div
            key={bank.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.1 }}
            className="rounded-lg border border-border p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">{bank.name}</span>
              </div>
              <Badge variant="outline" className="bg-secondary text-muted-foreground">
                {bank.interestRate}
              </Badge>
            </div>
            <div className="mb-2">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t('banks_match')}</span>
                <span className="font-medium text-foreground">{bank.matchScore}%</span>
              </div>
              <Progress value={bank.matchScore} className="h-2" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {bank.features.map(f => (
                <span key={f} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{f}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>{t('banks_disclaimer')}</span>
      </div>
    </motion.div>
  );
};

export default BankRecommendations;
