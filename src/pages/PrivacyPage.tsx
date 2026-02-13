import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Shield, EyeOff, Lock, UserCheck, Scale, Server } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

const principles: { icon: typeof Shield; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: EyeOff, titleKey: 'privacy_no_bio', descKey: 'privacy_no_bio_desc' },
  { icon: Lock, titleKey: 'privacy_no_surv', descKey: 'privacy_no_surv_desc' },
  { icon: Shield, titleKey: 'privacy_no_dark', descKey: 'privacy_no_dark_desc' },
  { icon: Scale, titleKey: 'privacy_explain', descKey: 'privacy_explain_desc' },
  { icon: UserCheck, titleKey: 'privacy_consent', descKey: 'privacy_consent_desc' },
  { icon: Server, titleKey: 'privacy_govt', descKey: 'privacy_govt_desc' },
];

const PrivacyPage = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-3xl text-center mb-12"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">{t('privacy_title')}</h1>
          <p className="text-muted-foreground">
            {t('privacy_subtitle')}
          </p>
        </motion.div>

        <div className="mx-auto max-w-3xl grid gap-5 sm:grid-cols-2">
          {principles.map((p, i) => (
            <motion.div
              key={p.titleKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <p.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="mb-1.5 font-semibold text-foreground">{t(p.titleKey)}</h3>
              <p className="text-sm text-muted-foreground">{t(p.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPage;
