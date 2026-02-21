import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, X, Sparkles, MessageSquare, TrendingUp } from 'lucide-react';
import { useState } from 'react';

const HeroSection = () => {
  const navigate = useNavigate();
  const [showFeatures, setShowFeatures] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
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

  const textVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8 },
    },
  };

  const floatingVariants = {
    animate: {
      y: [0, -15, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
      },
    },
  };

  const productFeatures = [
    {
      title: "Instant Eligibility Check",
      description: "Analyze your financial profile in under 30 seconds. Get a detailed assessment of your loan readiness and personalized recommendations.",
      icon: Sparkles,
      highlight: "30-second analysis"
    },
    {
      title: "AI Financial Advisor",
      description: "Chat with our intelligent financial advisor in English, Hindi, or Tamil. Get personalized guidance on loans, credit, and financial planning.",
      icon: MessageSquare,
      highlight: "Multilingual support"
    },
    {
      title: "Comprehensive Insights",
      description: "Understand your financial health with detailed breakdowns of eligibility factors, improvement suggestions, and actionable next steps.",
      icon: TrendingUp,
      highlight: "Explainable results"
    },
  ];

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-4 md:px-0 overflow-hidden">
        {/* Subtle premium background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />

          {/* Subtle animated glow - top right */}
          <motion.div
            animate={{
              opacity: [0.08, 0.15, 0.08],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
            }}
            className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl"
          />

          {/* Subtle animated glow - bottom left */}
          <motion.div
            animate={{
              opacity: [0.06, 0.12, 0.06],
              scale: [1, 1.08, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              delay: 2,
            }}
            className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl"
          />

          {/* Subtle dot pattern */}
          <div className="absolute inset-0 opacity-3">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }} />
          </div>
        </div>

        {/* Main content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-5xl mx-auto text-center space-y-10"
        >
          {/* Product Logo & Name */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-xl font-black text-white">L</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">NidhiSaarthi</h2>
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-tight">
              <motion.span
                className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0%", "100%", "0%"],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                }}
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                Know Your Loan
              </motion.span>
              <motion.span
                className="block text-foreground mt-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                Future Today
              </motion.span>
            </h1>
          </motion.div>

          {/* Enhanced subheading */}
          <motion.div variants={textVariants} className="space-y-4">
            <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
              Get instant loan eligibility assessment with <span className="font-semibold text-foreground">AI-powered insights</span>. Know exactly where you stand and what it takes to get approved.
            </p>
          </motion.div>

          {/* CTA Buttons with enhanced styling */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
          >
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Button
                variant="saffron"
                size="lg"
                onClick={() => setShowFeatures(true)}
                className="w-full gap-3 font-bold text-base h-14 px-8 rounded-xl shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 group"
              >
                <span>Register Now</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/login')}
                className="w-full gap-2 font-semibold text-base h-14 px-8 border-primary/40 hover:border-primary/80 hover:bg-primary/5 rounded-xl transition-all duration-300"
              >
                Sign In
              </Button>
            </motion.div>
          </motion.div>

          {/* Trust indicators */}
          <motion.div variants={textVariants} className="pt-8 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/5 border border-primary/20"
              >
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span>No credit card needed</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/5 border border-primary/20"
              >
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span>Instant analysis (30s)</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Fixed scroll indicator - positioned lower */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 -ml-12 z-20 pointer-events-none"
        >
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest text-center whitespace-nowrap">Scroll to explore</p>
            <div className="w-5 h-8 border border-primary/30 rounded-full flex items-start justify-center p-1.5 hover:border-primary/50 transition-colors">
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-0.5 h-1.5 bg-primary rounded-full"
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Showcase Modal */}
      <AnimatePresence>
        {showFeatures && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowFeatures(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-background border border-primary/20 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with gradient background */}
              <div className="relative p-8 border-b border-primary/10 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10">
                <button
                  onClick={() => setShowFeatures(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="pr-8">
                  <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Explore Our Features
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Step {currentFeature + 1} of {productFeatures.length}
                  </p>
                </div>
              </div>

              {/* Feature Content with better animations */}
              <div className="p-8 md:p-12 min-h-96 flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentFeature}
                    initial={{ opacity: 0, x: 30, rotateX: -10 }}
                    animate={{ opacity: 1, x: 0, rotateX: 0 }}
                    exit={{ opacity: 0, x: -30, rotateX: 10 }}
                    transition={{ duration: 0.4, type: "spring" }}
                    className="space-y-8"
                    style={{ perspective: 1000 }}
                  >
                    {/* Icon with enhanced animation */}
                    <motion.div
                      initial={{ scale: 0, rotateZ: -180 }}
                      animate={{ scale: 1, rotateZ: 0 }}
                      transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 100 }}
                      whileHover={{ scale: 1.1, rotateZ: 5 }}
                    >
                      {(() => {
                        const Icon = productFeatures[currentFeature].icon;
                        return (
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/25 via-primary/10 to-accent/20 flex items-center justify-center shadow-lg shadow-primary/20">
                            <motion.div
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Icon className="w-10 h-10 text-primary" />
                            </motion.div>
                          </div>
                        );
                      })()}
                    </motion.div>

                    {/* Title & Description with stagger */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {productFeatures[currentFeature].title}
                      </h3>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        {productFeatures[currentFeature].description}
                      </p>
                    </motion.div>

                    {/* Enhanced highlight badge */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      whileHover={{ scale: 1.05 }}
                      className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-accent/20 to-accent/10 border border-accent/40 w-fit shadow-lg shadow-accent/10"
                    >
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <Sparkles className="w-5 h-5 text-accent" />
                      </motion.div>
                      <span className="text-sm font-semibold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                        {productFeatures[currentFeature].highlight}
                      </span>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>

                {/* Animated progress indicators */}
                <div className="flex gap-2 mt-12 items-center">
                  {productFeatures.map((_, idx) => (
                    <motion.div
                      key={idx}
                      className="rounded-full transition-all bg-gradient-to-r from-primary to-accent"
                      initial={{ height: 4, width: 8 }}
                      animate={{
                        height: idx === currentFeature ? 4 : 4,
                        width: idx === currentFeature ? 32 : 8,
                        opacity: idx === currentFeature ? 1 : 0.3
                      }}
                      transition={{ duration: 0.3 }}
                      onMouseEnter={() => setCurrentFeature(idx)}
                    />
                  ))}
                </div>
              </div>

              {/* Footer Actions with enhanced styling */}
              <div className="p-8 border-t border-primary/10 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 flex items-center justify-between">
                <motion.button
                  whileHover={{ scale: currentFeature > 0 ? 1.05 : 1 }}
                  whileTap={{ scale: currentFeature > 0 ? 0.95 : 1 }}
                  onClick={() => currentFeature > 0 && setCurrentFeature(currentFeature - 1)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    currentFeature === 0
                      ? 'text-muted-foreground opacity-40 cursor-not-allowed'
                      : 'text-foreground hover:bg-primary/15 border border-primary/20'
                  }`}
                  disabled={currentFeature === 0}
                >
                  ← Back
                </motion.button>

                {currentFeature === productFeatures.length - 1 ? (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => {
                        setShowFeatures(false);
                        navigate('/login');
                      }}
                      className="gap-2 font-semibold h-12 px-8 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30"
                    >
                      Register Now
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentFeature(currentFeature + 1)}
                      className="gap-2 font-semibold h-12 px-8 hover:bg-primary/10 border-primary/30"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HeroSection;
