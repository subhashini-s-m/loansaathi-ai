import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sampleCases } from '@/data/mockData';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';

const SampleCases = () => {
  const { t } = useLanguage();

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold text-foreground">{t('samples_title')}</h2>
          <p className="mx-auto max-w-lg text-muted-foreground">{t('samples_subtitle')}</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {sampleCases.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated"
            >
              <div className="mb-3 text-4xl">{c.emoji}</div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{c.title}</h3>
              <p className="mb-5 flex-1 text-sm text-muted-foreground">{c.description}</p>
              <Link to={`/eligibility?demo=${c.id}`}>
                <Button variant="outline" className="w-full border-saffron text-saffron hover:bg-saffron/10 hover:border-saffron font-semibold">
                  {t('samples_try')}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SampleCases;
