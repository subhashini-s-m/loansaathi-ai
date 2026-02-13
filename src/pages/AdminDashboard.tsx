import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { motion } from 'framer-motion';
import { BarChart3, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const approvalData = [
  { name: 'Approved', value: 342, color: 'hsl(152, 50%, 42%)' },
  { name: 'Rejected', value: 158, color: 'hsl(0, 70%, 55%)' },
  { name: 'Pending', value: 67, color: 'hsl(35, 90%, 52%)' },
];

const languageData = [
  { name: 'English', users: 285 },
  { name: 'Hindi', users: 198 },
  { name: 'Tamil', users: 84 },
];

const riskData = [
  { name: 'Low Risk', value: 210, color: 'hsl(152, 50%, 42%)' },
  { name: 'Medium Risk', value: 224, color: 'hsl(35, 90%, 52%)' },
  { name: 'High Risk', value: 133, color: 'hsl(0, 70%, 55%)' },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') return null;

  const stats = [
    { icon: Users, label: t('admin_total'), value: '567', color: 'bg-primary/10 text-primary' },
    { icon: CheckCircle, label: t('admin_approved'), value: '342', color: 'bg-risk-low/10 text-risk-low' },
    { icon: XCircle, label: t('admin_rejected'), value: '158', color: 'bg-risk-high/10 text-risk-high' },
    { icon: Clock, label: t('admin_pending'), value: '67', color: 'bg-risk-medium/10 text-risk-medium' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-6 w-6 text-saffron" />
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t('admin_title')}</h1>
          </div>
          <p className="text-muted-foreground">{t('admin_subtitle')}</p>
          <Badge variant="outline" className="mt-2 bg-accent/10 text-accent border-accent/20">
            {user.email}
          </Badge>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-2 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <h3 className="mb-4 text-lg font-semibold text-foreground">{t('admin_distribution')}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={approvalData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {approvalData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <h3 className="mb-4 text-lg font-semibold text-foreground">{t('admin_language')}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={languageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip />
                  <Bar dataKey="users" fill="hsl(var(--saffron))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-border bg-card p-6 shadow-card"
        >
          <h3 className="mb-4 text-lg font-semibold text-foreground">{t('admin_risk')}</h3>
          <div className="space-y-4">
            {riskData.map(item => (
              <div key={item.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-foreground">{item.name}</span>
                  <span className="font-medium text-muted-foreground">{item.value} ({Math.round(item.value / 567 * 100)}%)</span>
                </div>
                <Progress value={item.value / 567 * 100} className="h-2" />
              </div>
            ))}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
