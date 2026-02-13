import type { RiskFactor } from '@/types/loan';
import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/i18n/LanguageContext';

interface ExplainableAIProps {
  factors: RiskFactor[];
}

const ExplainableAI = ({ factors }: ExplainableAIProps) => {
  const { t } = useLanguage();

  const levelConfig = {
    high: { icon: AlertCircle, color: 'bg-risk-high/10 border-risk-high/20', dot: 'bg-risk-high', label: t('xai_high'), badgeClass: 'bg-risk-high/10 text-risk-high border-risk-high/20' },
    medium: { icon: AlertTriangle, color: 'bg-risk-medium/10 border-risk-medium/20', dot: 'bg-risk-medium', label: t('xai_medium'), badgeClass: 'bg-risk-medium/10 text-risk-medium border-risk-medium/20' },
    low: { icon: CheckCircle, color: 'bg-risk-low/10 border-risk-low/20', dot: 'bg-risk-low', label: t('xai_low'), badgeClass: 'bg-risk-low/10 text-risk-low border-risk-low/20' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-saffron/10">
          <Lightbulb className="h-4 w-4 text-saffron" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('xai_title')}</h3>
          <p className="text-xs text-muted-foreground">{t('xai_subtitle')}</p>
        </div>
      </div>

      <div className="space-y-3">
        {factors.map((f, i) => {
          const cfg = levelConfig[f.level];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className={`rounded-lg border p-4 ${cfg.color}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" style={{ color: `hsl(var(--risk-${f.level}))` }} />
                  <span className="font-medium text-foreground">{f.name}</span>
                </div>
                <Badge variant="outline" className={cfg.badgeClass}>{cfg.label}</Badge>
              </div>
              <p className="mb-1.5 text-sm text-muted-foreground">{f.description}</p>
              <p className="text-sm font-medium text-foreground/80">💡 {f.improvement}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ExplainableAI;
