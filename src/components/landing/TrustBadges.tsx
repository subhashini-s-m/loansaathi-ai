import { Shield, Eye, Globe, Server, Mic, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const badges = [
  { icon: Shield, label: 'Privacy-First' },
  { icon: Eye, label: 'Explainable AI' },
  { icon: Globe, label: 'Multilingual' },
  { icon: Server, label: 'Scalable SaaS' },
  { icon: Mic, label: 'Voice-First' },
  { icon: Heart, label: 'Inclusive Design' },
];

const TrustBadges = () => (
  <section className="border-y border-border bg-card">
    <div className="container py-6">
      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
        {badges.map((badge, i) => (
          <motion.div
            key={badge.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-2 text-muted-foreground"
          >
            <badge.icon className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">{badge.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustBadges;
