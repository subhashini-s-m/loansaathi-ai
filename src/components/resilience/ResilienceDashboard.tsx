import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  RadarChart, 
  Radar,
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  Zap, 
  Heart, 
  DollarSign,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { ResilienceMetrics, ResilienceScenario, FinancialProfile } from '@/lib/resilienceEngine';
import { calculateResilienceMetrics } from '@/lib/resilienceEngine';

interface ResilienceDashboardProps {
  financialProfile: FinancialProfile;
}

export const ResilienceDashboard = ({ financialProfile }: ResilienceDashboardProps) => {
  const [selectedScenario, setSelectedScenario] = useState<ResilienceScenario>('combined');
  const [showDetails, setShowDetails] = useState(false);

  const metrics = useMemo(() => calculateResilienceMetrics(financialProfile), [financialProfile]);

  const radarData = [
    {
      category: 'Emergency Fund',
      value: Math.min(100, ((financialProfile.savings_liquid / (financialProfile.monthly_expenses * 6)) * 100)),
    },
    {
      category: 'Debt Management',
      value: Math.max(0, 100 - (financialProfile.monthly_income > 0 ? (financialProfile.debt_monthly / financialProfile.monthly_income) * 100 : 100)),
    },
    {
      category: 'Income Stability',
      value: financialProfile.job_stability === 'High' ? 90 : financialProfile.job_stability === 'Medium' ? 60 : 30,
    },
    {
      category: 'Credit Health',
      value: Math.min(100, (financialProfile.credit_score / 9)),
    },
    {
      category: 'Asset Diversification',
      value: financialProfile.investment_diversification,
    },
    {
      category: 'Insurance Coverage',
      value: financialProfile.has_insurance ? 100 : 20,
    },
  ];

  const scenarioComparison = [
    {
      scenario: 'Job Loss',
      months: metrics.scenarioResults.job_loss.survivalMonths,
      impact: metrics.scenarioResults.job_loss.impactLevel,
    },
    {
      scenario: 'Medical',
      months: metrics.scenarioResults.medical_emergency.survivalMonths,
      impact: metrics.scenarioResults.medical_emergency.impactLevel,
    },
    {
      scenario: 'Market Crash',
      months: metrics.scenarioResults.market_crash.survivalMonths,
      impact: metrics.scenarioResults.market_crash.impactLevel,
    },
    {
      scenario: 'Inflation',
      months: metrics.scenarioResults.inflation_surge.survivalMonths,
      impact: metrics.scenarioResults.inflation_surge.impactLevel,
    },
  ];

  const currentScenario = metrics.scenarioResults[selectedScenario];
  const impactColors = {
    'Low': 'bg-green-500',
    'Medium': 'bg-yellow-500',
    'High': 'bg-orange-500',
    'Critical': 'bg-red-500',
  };

  return (
    <div className="w-full space-y-6">
      {/* Main Resilience Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-2 border-saffron/20 bg-gradient-to-br from-saffron/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-saffron" />
              Financial Resilience Score
            </CardTitle>
            <CardDescription>
              Your ability to handle financial emergencies and uncertain times
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              {/* Circular Score Gauge */}
              <div className="relative h-48 w-48">
                <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  {/* Score circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#e67e22"
                    strokeWidth="8"
                    strokeDasharray={`${(metrics.resilienceScore / 100) * 283} 283`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-bold text-saffron">{metrics.resilienceScore}</span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
              </div>

              {/* Score Interpretation */}
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Your Score Interpretation</p>
                  {metrics.resilienceScore >= 75 && (
                    <p className="text-sm text-green-600">
                      🎯 <strong>Excellent</strong> - You're well-prepared for financial challenges
                    </p>
                  )}
                  {metrics.resilienceScore >= 50 && metrics.resilienceScore < 75 && (
                    <p className="text-sm text-yellow-600">
                      ⚠️ <strong>Moderate</strong> - Some areas need strengthening
                    </p>
                  )}
                  {metrics.resilienceScore < 50 && (
                    <p className="text-sm text-red-600">
                      🚨 <strong>At Risk</strong> - Immediate action recommended
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Min Survival (Worst Case)</p>
                  <p className="text-2xl font-bold text-foreground">
                    {metrics.survivalMonths} <span className="text-sm font-normal">months</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 360° Resilience Radar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              360° Resilience Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Your Profile" dataKey="value" stroke="#e67e22" fill="#e67e22" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Strengths & Risk Factors */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Strengths */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                Your Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {metrics.strengths.length > 0 ? (
                  metrics.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 text-green-600">✓</span>
                      <span className="text-muted-foreground">{strength}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">Focus on building financial strengths...</p>
                )}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Risk Factors */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-red-200 bg-red-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Risk Factors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {metrics.riskFactors.length > 0 ? (
                  metrics.riskFactors.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 text-red-600">⚠️</span>
                      <span className="text-muted-foreground">{risk}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-green-600 italic font-semibold">✓ No major risk factors detected!</p>
                )}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Stress Test Scenarios */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Stress Test Scenarios
            </CardTitle>
            <CardDescription>
              How would you survive these financial emergencies?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Scenario Buttons */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {(['job_loss', 'medical_emergency', 'market_crash', 'inflation_surge'] as const).map((scenario) => {
                const icons: Record<string, React.ReactNode> = {
                  job_loss: '💼',
                  medical_emergency: '🏥',
                  market_crash: '📉',
                  inflation_surge: '📈',
                };
                const labels: Record<string, string> = {
                  job_loss: 'Job Loss',
                  medical_emergency: 'Medical Crisis',
                  market_crash: 'Market Crash',
                  inflation_surge: 'Inflation Surge',
                };

                return (
                  <Button
                    key={scenario}
                    onClick={() => setSelectedScenario(scenario)}
                    variant={selectedScenario === scenario ? 'default' : 'outline'}
                    className={selectedScenario === scenario ? 'bg-saffron hover:bg-saffron/90' : ''}
                  >
                    <span className="mr-1">{icons[scenario]}</span>
                    {labels[scenario]}
                  </Button>
                );
              })}
            </div>

            {/* Impact Visualization */}
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={scenarioComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scenario" />
                <YAxis label={{ value: 'Survival Months', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="months" fill="#e67e22" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Current Scenario Details */}
            <Alert className={impactColors[currentScenario.impactLevel] + ' border-opacity-30'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong className="text-base">Selected Scenario Impact: {currentScenario.impactLevel}</strong>
                <p className="mt-1 text-sm">
                  You could sustain <strong>{currentScenario.survivalMonths} months</strong> under this scenario
                  {currentScenario.affectedAssets.length > 0 && (
                    <>
                      <br />
                      Affected: {currentScenario.affectedAssets.join(', ')}
                    </>
                  )}
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recovery Plans */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-blue-600" />
              Personalized Recovery Plan
            </CardTitle>
            <CardDescription className="text-blue-700">
              Step-by-step actions to recover from financial stress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.recommendations.map((rec, i) => (
                <div key={i} className="flex gap-3 rounded-lg border border-blue-200/50 bg-white p-3">
                  <span className="shrink-0 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                    {i + 1}
                  </span>
                  <p className="text-sm text-muted-foreground">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Items */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Top Priority Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.riskFactors.length > 0 ? (
                <>
                  <p className="text-sm font-semibold text-foreground">Address these to improve resilience:</p>
                  {metrics.riskFactors.slice(0, 3).map((factor, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-yellow-50 p-3">
                      <Badge className="mt-0.5 shrink-0 bg-yellow-600">Priority {i + 1}</Badge>
                      <p className="text-sm text-muted-foreground">{factor.replace(/^[⚠️✖️]+\s*/, '')}</p>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-green-600 font-semibold">✓ Your finances are well-balanced! Keep monitoring.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResilienceDashboard;
