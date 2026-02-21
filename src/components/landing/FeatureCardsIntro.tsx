import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Brain, TrendingUp, Zap } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard = ({ icon, title, description, delay }: FeatureCardProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ delay, duration: 0.8, ease: 'easeOut' }}
      whileHover={{ y: -10, rotateX: 5 }}
      className="relative group"
    >
      {/* Glassmorphism Card */}
      <div className="relative h-full p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 shadow-xl hover:shadow-2xl">
        {/* Gradient background on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl" />
        </div>

        {/* Icon */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 mb-6 group-hover:from-primary/30 group-hover:to-accent/30 transition-all"
        >
          <div className="text-primary text-2xl">
            {icon}
          </div>
        </motion.div>

        {/* Title */}
        <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          {description}
        </p>

        {/* Accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ delay: delay + 0.4, duration: 0.6 }}
          className="h-1 w-12 bg-gradient-to-r from-primary to-accent rounded-full origin-left"
        />
      </div>
    </motion.div>
  );
};

const FeatureCards = () => {
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI Risk Prediction',
      description:
        'Advanced machine learning analyzes your financial profile to predict loan approval probability with 99% accuracy.',
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Loan Readiness Score',
      description:
        'Get a personalized score (0-100) showing exactly how ready you are for your ideal loan amount.',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Financial Simulation',
      description:
        'Simulate different loan scenarios and see real-time impact on your financial health.',
    },
  ];

  return (
    <section className="py-20 px-4 md:px-0">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Powerful AI Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the next generation of financial intelligence tailored for Indian borrowers
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 0.2}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
