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
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleLogin = async (role: 'citizen' | 'admin') => {
    if (!email || !password) {
      toast({ title: 'Error', description: 'Please enter email and password', variant: 'destructive' });
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password, role);
      toast({ title: 'Success', description: `Welcome, ${email}` });
      navigate('/');
    } catch (error) {
      toast({ title: 'Login failed', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
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
            <Tabs defaultValue="signin">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="signin" className="flex-1">
                  <Lock className="mr-1.5 h-4 w-4" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="flex-1">
                  <User className="mr-1.5 h-4 w-4" />
                  Register
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <p className="mb-4 text-sm text-muted-foreground">Sign in to your LoansAathi account</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input id="signin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-pass">Password</Label>
                    <Input id="signin-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <Button variant="saffron" className="w-full" onClick={() => handleLogin('citizen')} disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="register">
                <p className="mb-4 text-sm text-muted-foreground">Create your LoansAathi account</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input id="register-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-pass">Password</Label>
                    <Input id="register-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <Button variant="saffron" className="w-full" onClick={() => handleLogin('citizen')} disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Register'}
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
