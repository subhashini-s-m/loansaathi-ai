import { Shield, Eye, Globe, Server, Mic, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

const badges: { icon: typeof Shield; key: TranslationKey }[] = [
  { icon: Shield, key: 'trust_privacy' },
  { icon: Eye, key: 'trust_explainable' },
  { icon: Globe, key: 'trust_multilingual' },
  { icon: Server, key: 'trust_scalable' },
  { icon: Mic, key: 'trust_voice' },
  { icon: Heart, key: 'trust_inclusive' },
];

const TrustBadges = () => {
  const { t } = useLanguage();

  return (
    <section className="border-y border-border bg-card">
      <div className="container py-6">
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.key}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <badge.icon className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">{t(badge.key)}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
