import type { RoadmapStep } from '@/types/loan';
import { motion } from 'framer-motion';
import { Route } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface RoadmapSectionProps {
  steps: RoadmapStep[];
}

const RoadmapSection = ({ steps }: RoadmapSectionProps) => {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Route className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('roadmap_title')}</h3>
          <p className="text-xs text-muted-foreground">{t('roadmap_subtitle')}</p>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.step}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            className="flex gap-4"
          >
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {s.step}
              </div>
              {i < steps.length - 1 && <div className="mt-1 h-full w-0.5 bg-border" />}
            </div>
            <div className="pb-4">
              <h4 className="font-semibold text-foreground">{s.title}</h4>
              <p className="text-sm text-muted-foreground">{s.description}</p>
              <span className="mt-1 inline-block rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                ⏱ {s.duration}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default RoadmapSection;
