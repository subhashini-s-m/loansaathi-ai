import { Eye, SlidersHorizontal, Globe, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Eye,
    title: 'Explainable AI Dashboard',
    desc: '"Why was my loan rejected?" — every decision transparently broken down into understandable risk factors with actionable improvement steps.',
    badge: 'Core Innovation',
    badgeClass: 'bg-saffron/10 text-saffron border-saffron/20',
  },
  {
    icon: SlidersHorizontal,
    title: 'What-If Simulator',
    desc: 'Slide income up, loan amount down — see your approval probability change in real-time. AI-powered financial planning for citizens.',
    badge: 'Unique Feature',
    badgeClass: 'bg-accent/10 text-accent border-accent/20',
  },
  {
    icon: Globe,
    title: 'Multilingual & Voice Mode',
    desc: 'English, Hindi, Tamil — with voice input for low-literacy users. Designed for rural-first accessibility and nationwide inclusivity.',
    badge: 'Accessibility',
    badgeClass: 'bg-primary/10 text-primary border-primary/20',
  },
];

const FeatureHighlights = () => (
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
          Hackathon Innovation Highlights
        </div>
        <h2 className="mb-3 text-3xl font-bold text-foreground">What Makes LoanSaathi AI Different</h2>
        <p className="mx-auto max-w-lg text-muted-foreground">Combining Explainable AI, financial simulation, and multilingual access for true inclusion</p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 }}
            className="rounded-xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-elevated"
          >
            <Badge variant="outline" className={`mb-4 ${f.badgeClass}`}>{f.badge}</Badge>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/5">
              <f.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">{f.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeatureHighlights;
