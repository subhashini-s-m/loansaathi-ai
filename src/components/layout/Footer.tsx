import { Shield } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-primary">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary-foreground" />
              <span className="font-bold text-primary-foreground">NidhiSaarthi AI</span>
            </div>
            <p className="text-sm text-primary-foreground/60">
              {t('footer_desc')}
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-primary-foreground">{t('footer_innovation')}</h4>
            <ul className="space-y-1.5 text-sm text-primary-foreground/60">
              <li>{t('footer_innov1')}</li>
              <li>{t('footer_innov2')}</li>
              <li>{t('footer_innov3')}</li>
              <li>{t('footer_innov4')}</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-primary-foreground">{t('footer_compliance')}</h4>
            <ul className="space-y-1.5 text-sm text-primary-foreground/60">
              <li>{t('footer_comp1')}</li>
              <li>{t('footer_comp2')}</li>
              <li>{t('footer_comp3')}</li>
              <li>{t('footer_comp4')}</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-primary-foreground/10 pt-6 text-center text-xs text-primary-foreground/40">
          <p>⚠️ {t('footer_prototype')}</p>
          <p className="mt-1">{t('footer_copyright')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
