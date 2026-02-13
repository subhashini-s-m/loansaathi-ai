import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/landing/HeroSection';
import TrustBadges from '@/components/landing/TrustBadges';
import HowItWorks from '@/components/landing/HowItWorks';
import FeatureHighlights from '@/components/landing/FeatureHighlights';
import SampleCases from '@/components/landing/SampleCases';

const Index = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main>
      <HeroSection />
      <TrustBadges />
      <HowItWorks />
      <FeatureHighlights />
      <SampleCases />
    </main>
    <Footer />
  </div>
);

export default Index;
