import { Link, useLocation } from 'react-router-dom';
import { Shield, Menu, X, LogIn, LogOut, Globe } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Language } from '@/i18n/translations';

const languageOptions: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();

  const navLinks = [
    { label: t('nav_home'), path: '/' },
    { label: t('nav_eligibility'), path: '/eligibility' },
    { label: t('nav_chat') || 'Chat', path: '/chat' },
    { label: t('nav_privacy'), path: '/privacy' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">NidhiSaarthi</span>
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

          {user?.role === 'admin' && (
            <Link to="/admin">
              <Button variant={location.pathname === '/admin' ? 'secondary' : 'ghost'} size="sm">
                {t('nav_admin')}
              </Button>
            </Link>
          )}

          <div className="ml-2 flex items-center gap-0.5 rounded-lg border border-border bg-secondary/50 p-0.5">
            {languageOptions.map(opt => (
              <button
                key={opt.code}
                onClick={() => setLanguage(opt.code)}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  language === opt.code
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={opt.label}
              >
                <span className="mr-1">{opt.flag}</span>
                {opt.label}
              </button>
            ))}
          </div>

          {user ? (
            <Button variant="ghost" size="sm" className="ml-2" onClick={logout}>
              <LogOut className="mr-1 h-4 w-4" />
              {t('nav_logout')}
            </Button>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="sm" className="ml-2">
                <LogIn className="mr-1 h-4 w-4" />
                {t('nav_login')}
              </Button>
            </Link>
          )}
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

            {user?.role === 'admin' && (
              <Link to="/admin" onClick={() => setMobileOpen(false)}>
                <Button variant={location.pathname === '/admin' ? 'secondary' : 'ghost'} className="w-full justify-start">
                  {t('nav_admin')}
                </Button>
              </Link>
            )}

            {user ? (
              <Button variant="ghost" className="w-full justify-start" onClick={() => { logout(); setMobileOpen(false); }}>
                <LogOut className="mr-1 h-4 w-4" />
                {t('nav_logout')}
              </Button>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <LogIn className="mr-1 h-4 w-4" />
                  {t('nav_login')}
                </Button>
              </Link>
            )}

            <div className="mt-2 flex items-center gap-1">
              {languageOptions.map(opt => (
                <button
                  key={opt.code}
                  onClick={() => setLanguage(opt.code)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors border ${
                    language === opt.code
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'text-muted-foreground border-border hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
