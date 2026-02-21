import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield } from 'lucide-react';

const CTASection = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  return (
    <section className="py-24 px-4 md:px-0 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
          }}
          className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10"
        />
      </div>

      <div className="container mx-auto max-w-4xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="text-center space-y-8"
        >
          {/* Main CTA Text */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold text-foreground">
              Take Control of Your
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Financial Decisions
              </span>
            </h2>
          </motion.div>

          {/* Subtext */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Get comprehensive loan analysis, credit insights, and personalized financial roadmaps
            powered by advanced AI. Start your journey to smarter borrowing today.
          </motion.p>

          {/* Main CTA Button */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="saffron"
                size="xl"
                onClick={() => navigate('/login')}
                className="gap-2 font-bold text-lg h-14 px-10 rounded-lg shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all"
              >
                Start Free Analysis
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Trust line */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-2 pt-4 text-sm text-muted-foreground"
          >
            <Shield className="w-4 h-4 text-govt-green" />
            <span>No credit score impact • No hidden charges</span>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            variants={itemVariants}
            className="pt-8 grid md:grid-cols-3 gap-4"
          >
            {[
              '✓ AI-Powered Analysis',
              '✓ Real-Time Results',
              '✓ Expert Recommendations',
            ].map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="p-4 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all"
              >
                <p className="font-semibold text-foreground">{feature}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
