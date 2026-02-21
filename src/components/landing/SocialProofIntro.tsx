import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const StatCounter = ({ end, suffix }: { end: number; suffix: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const duration = 2000;
      const progress = Math.min(elapsed / duration, 1);

      setCount(Math.floor(end * progress));

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [end]);

  return <span>{count}{suffix}</span>;
};

const SocialProof = () => {
  const stats = [
    { value: 98, suffix: '%', label: 'Accuracy Rate', description: 'AI predictions' },
    { value: 50, suffix: 'K+', label: 'Users Analyzed', description: 'Across India' },
    { value: 99, suffix: '%', label: 'Instant Analysis', description: 'Real-time decisions' },
  ];

  return (
    <section className="py-20 px-4 md:px-0">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Trusted by Thousands
          </h2>
          <p className="text-lg text-muted-foreground">
            LoanSaathi AI delivers results users can trust
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.8 }}
              viewport={{ once: true }}
              className="relative group"
            >
              {/* Card */}
              <div className="p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all text-center">
                {/* Number with animation */}
                <motion.div
                  className="text-5xl md:text-6xl font-bold text-gradient-hero mb-2"
                  initial={{ scale: 0.5, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.2 + 0.2, duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <StatCounter end={stat.value} suffix={stat.suffix} />
                </motion.div>

                {/* Label */}
                <p className="text-lg font-semibold text-foreground mb-1">
                  {stat.label}
                </p>

                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-6"
        >
          {[
            'Compliant with RBI guidelines',
            'Data encrypted with military-grade security',
            'No impact on credit score',
            'Multi-language support',
          ].map((badge, index) => (
            <div key={index} className="flex items-center gap-3 p-4 rounded-lg border border-white/5 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CheckCircle2 className="w-5 h-5 text-govt-green shrink-0" />
              <span className="text-foreground font-medium">{badge}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProof;
