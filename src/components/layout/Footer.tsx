import { Shield } from 'lucide-react';

const Footer = () => (
  <footer className="border-t border-border bg-primary">
    <div className="container py-10">
      <div className="grid gap-8 md:grid-cols-3">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary-foreground" />
            <span className="font-bold text-primary-foreground">LoanSaathi AI</span>
          </div>
          <p className="text-sm text-primary-foreground/60">
            AI-powered financial inclusion platform designed for transparent governance and citizen empowerment.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-primary-foreground">Innovation</h4>
          <ul className="space-y-1.5 text-sm text-primary-foreground/60">
            <li>Explainable AI for Governance</li>
            <li>Voice-first Rural Access</li>
            <li>Multilingual NLP Engine</li>
            <li>Scalable SaaS Architecture</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-primary-foreground">Compliance</h4>
          <ul className="space-y-1.5 text-sm text-primary-foreground/60">
            <li>No biometric storage</li>
            <li>Consent-based data use</li>
            <li>Privacy-first design</li>
            <li>Government-ready deployment</li>
          </ul>
        </div>
      </div>
      <div className="mt-8 border-t border-primary-foreground/10 pt-6 text-center text-xs text-primary-foreground/40">
        <p>⚠️ Prototype for demonstration — uses simulated data. Designed for real-world integration.</p>
        <p className="mt-1">© 2026 LoanSaathi AI · Built for India's Financial Inclusion</p>
      </div>
    </div>
  </footer>
);

export default Footer;
