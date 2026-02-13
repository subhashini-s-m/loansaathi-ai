import { Link, useLocation } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Check Eligibility', path: '/eligibility' },
    { label: 'Privacy & Ethics', path: '/privacy' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">LoanSaathi</span>
            <span className="text-lg font-bold text-gradient-hero">AI</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(link => (
            <Link key={link.path} to={link.path}>
              <Button
                variant={location.pathname === link.path ? 'secondary' : 'ghost'}
                size="sm"
              >
                {link.label}
              </Button>
            </Link>
          ))}
          <Badge variant="outline" className="ml-3 border-saffron/30 bg-saffron/5 text-saffron">
            🧪 Demo Mode
          </Badge>
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-card p-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)}>
                <Button variant={location.pathname === link.path ? 'secondary' : 'ghost'} className="w-full justify-start">
                  {link.label}
                </Button>
              </Link>
            ))}
            <Badge variant="outline" className="mt-2 w-fit border-saffron/30 bg-saffron/5 text-saffron">
              🧪 Demo Mode (Hackathon)
            </Badge>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
