import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import HeroSectionIntro from '@/components/landing/HeroSectionIntro';
import FeatureCardsIntro from '@/components/landing/FeatureCardsIntro';
import SocialProofIntro from '@/components/landing/SocialProofIntro';
import CTASectionIntro from '@/components/landing/CTASectionIntro';
import { motion } from 'framer-motion';

const IntroPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-background overflow-hidden"
    >
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full filter blur-3xl animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <HeroSectionIntro />
        <FeatureCardsIntro />
        <SocialProofIntro />
        <CTASectionIntro />
        
        {/* Footer */}
        <footer className="border-t border-border/40 bg-background/80 backdrop-blur-sm py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground">
              © 2026 LoanSaathi AI. All rights reserved. | 
              <a href="#" className="ml-2 hover:text-primary transition-colors">Privacy Policy</a> | 
              <a href="#" className="ml-2 hover:text-primary transition-colors">Terms of Service</a>
            </p>
          </div>
        </footer>
      </div>
    </motion.div>
  );
};

export default IntroPage;
