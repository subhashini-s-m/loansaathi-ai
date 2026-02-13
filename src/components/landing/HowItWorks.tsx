import { FileText, Brain, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  { icon: FileText, title: 'Enter Your Details', desc: 'Simple form — income, loan amount, credit info. No documents needed for initial assessment.' },
  { icon: Brain, title: 'AI Analyzes & Explains', desc: 'Our ML model predicts approval probability and transparently explains every factor behind the decision.' },
  { icon: MapPin, title: 'Get Your Roadmap', desc: 'Receive a personalized improvement plan, bank recommendations, and next steps to achieve your goal.' },
];

const HowItWorks = () => (
  <section className="bg-background py-16 md:py-24">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-12 text-center"
      >
        <h2 className="mb-3 text-3xl font-bold text-foreground">How It Works</h2>
        <p className="mx-auto max-w-lg text-muted-foreground">Three simple steps from uncertainty to clarity</p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="group relative rounded-xl border border-border bg-card p-8 shadow-card transition-all hover:shadow-elevated"
          >
            <div className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-saffron-gradient text-sm font-bold text-saffron-foreground">
              {i + 1}
            </div>
            <div className="mb-4 mt-2 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
              <step.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
