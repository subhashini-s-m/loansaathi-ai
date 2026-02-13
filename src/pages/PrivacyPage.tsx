import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Shield, EyeOff, Lock, UserCheck, Scale, Server } from 'lucide-react';
import { motion } from 'framer-motion';

const principles = [
  { icon: EyeOff, title: 'No Biometric Storage', desc: 'We never collect, store, or process biometric data of any kind.' },
  { icon: Lock, title: 'No Surveillance', desc: 'No tracking, no profiling, no behavioral surveillance beyond the assessment.' },
  { icon: Shield, title: 'No Dark Patterns', desc: 'Transparent UI design with clear actions — no manipulative interfaces.' },
  { icon: Scale, title: 'Explainable Decisions', desc: 'Every AI decision comes with a human-readable explanation of all factors.' },
  { icon: UserCheck, title: 'Consent-Based Data Use', desc: 'Data is processed only with explicit user consent and never shared with third parties.' },
  { icon: Server, title: 'Government-Ready Deployment', desc: 'Designed for sovereign cloud hosting with full data residency compliance.' },
];

const PrivacyPage = () => (
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
        <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">Privacy, Ethics & Governance</h1>
        <p className="text-muted-foreground">
          LoanSaathi AI is designed with the highest standards of privacy and ethical AI governance — ready for deployment in government infrastructure.
        </p>
      </motion.div>

      <div className="mx-auto max-w-3xl grid gap-5 sm:grid-cols-2">
        {principles.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <p.icon className="h-5 w-5 text-accent" />
            </div>
            <h3 className="mb-1.5 font-semibold text-foreground">{p.title}</h3>
            <p className="text-sm text-muted-foreground">{p.desc}</p>
          </motion.div>
        ))}
      </div>
    </main>
    <Footer />
  </div>
);

export default PrivacyPage;
