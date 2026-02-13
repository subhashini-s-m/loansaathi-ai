import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, User, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleLogin = (role: 'citizen' | 'admin') => {
    if (login(email, password, role)) {
      toast({ title: role === 'admin' ? t('login_admin') : t('login_citizen'), description: `Welcome, ${email}` });
      navigate(role === 'admin' ? '/admin' : '/eligibility');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-foreground">{t('login_title')}</h1>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <Tabs defaultValue="citizen">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="citizen" className="flex-1">
                  <User className="mr-1.5 h-4 w-4" />
                  {t('login_citizen')}
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex-1">
                  <Lock className="mr-1.5 h-4 w-4" />
                  {t('login_admin')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="citizen">
                <p className="mb-4 text-sm text-muted-foreground">{t('login_citizen_desc')}</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="citizen-email">{t('login_email')}</Label>
                    <Input id="citizen-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="citizen@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="citizen-pass">{t('login_password')}</Label>
                    <Input id="citizen-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <Button variant="saffron" className="w-full" onClick={() => handleLogin('citizen')}>
                    {t('login_signin')}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="admin">
                <p className="mb-4 text-sm text-muted-foreground">{t('login_admin_desc')}</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">{t('login_email')}</Label>
                    <Input id="admin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@nidhisaarthi.gov.in" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-pass">{t('login_password')}</Label>
                    <Input id="admin-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <Button variant="saffron" className="w-full" onClick={() => handleLogin('admin')}>
                    {t('login_signin')}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default LoginPage;
