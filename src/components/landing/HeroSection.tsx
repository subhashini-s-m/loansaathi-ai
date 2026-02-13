import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import heroImage from '@/assets/hero-illustration.jpg';

const HeroSection = () => (
  <section className="bg-hero-gradient relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(25_85%_55%/0.08),transparent_60%)]" />
    <div className="container relative py-16 md:py-24">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-4 py-1.5 text-xs font-medium text-primary-foreground/80">
            <span className="h-1.5 w-1.5 rounded-full bg-govt-green animate-pulse" />
            AI-Powered · Government-Ready · Scalable SaaS
          </div>
          <h1 className="mb-5 text-3xl font-extrabold leading-tight text-primary-foreground md:text-5xl lg:text-6xl">
            Empowering Financial Access for{' '}
            <span className="text-gradient-hero">Every Citizen</span>
            {' '}with AI
          </h1>
          <p className="mb-8 max-w-xl text-base leading-relaxed text-primary-foreground/70 md:text-lg">
            ML-driven loan eligibility prediction, explainable AI decisions, and personalized financial roadmaps — in your language, with your voice.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/eligibility">
              <Button variant="saffron" size="xl">
                Check Loan Eligibility
                <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/eligibility?demo=auto-driver">
              <Button variant="hero-outline" size="lg">
                <Users className="mr-1 h-4 w-4" />
                Try Sample Case
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hidden lg:block"
        >
          <img
            src={heroImage}
            alt="Diverse Indian citizens connected through AI-powered financial services"
            className="w-full rounded-2xl shadow-2xl"
            loading="eager"
          />
        </motion.div>
      </div>
    </div>
  </section>
);

export default HeroSection;
