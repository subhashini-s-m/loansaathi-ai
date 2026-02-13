import { Eye, SlidersHorizontal, Globe, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

const features: { icon: typeof Eye; titleKey: TranslationKey; descKey: TranslationKey; badgeKey: TranslationKey; badgeClass: string }[] = [
  {
    icon: Eye,
    titleKey: 'feature1_title',
    descKey: 'feature1_desc',
    badgeKey: 'feature1_badge',
    badgeClass: 'bg-saffron/10 text-saffron border-saffron/20',
  },
  {
    icon: SlidersHorizontal,
    titleKey: 'feature2_title',
    descKey: 'feature2_desc',
    badgeKey: 'feature2_badge',
    badgeClass: 'bg-accent/10 text-accent border-accent/20',
  },
  {
    icon: Globe,
    titleKey: 'feature3_title',
    descKey: 'feature3_desc',
    badgeKey: 'feature3_badge',
    badgeClass: 'bg-primary/10 text-primary border-primary/20',
  },
];

const FeatureHighlights = () => {
  const { t } = useLanguage();

  return (
    <section className="bg-secondary/40 py-16 md:py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-saffron">
            <Award className="h-4 w-4" />
            {t('features_badge')}
          </div>
          <h2 className="mb-3 text-3xl font-bold text-foreground">{t('features_title')}</h2>
          <p className="mx-auto max-w-lg text-muted-foreground">{t('features_subtitle')}</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.titleKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="rounded-xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-elevated"
            >
              <Badge variant="outline" className={`mb-4 ${f.badgeClass}`}>{t(f.badgeKey)}</Badge>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/5">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{t(f.titleKey)}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t(f.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureHighlights;
