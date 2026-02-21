import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { LoanFormData } from '@/types/loan';
import { ArrowRight, User, Briefcase, IndianRupee, Car, FileText } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface EligibilityFormProps {
  initialData?: Partial<LoanFormData>;
  onSubmit: (data: LoanFormData) => void;
}

const defaults: LoanFormData = {
  age: 30,
  gender: 'Male',
  marital_status: 'Single',
  family_members: 3,
  dependent_children: 0,
  location_city: '',
  location_state: '',
  education: 'Graduate',
  job_type: 'Salaried',
  employer_name: '',
  years_experience: 3,
  monthly_income: 30000,
  income_stability: 'Stable',
  secondary_income: false,
  monthly_savings: 5000,
  monthly_rent: 8000,
  existing_loans: 1,
  total_monthly_expenses: 15000,
  credit_score: 650,
  bank_balance: 50000,
  has_investments: false,
  owns_house: false,
  owns_car: false,
  car_year: 2020,
  property_value: 0,
  has_health_insurance: false,
  has_life_insurance: false,
  has_vehicle_insurance: false,
  loan_amount: 300000,
  loan_purpose: 'Personal',
  co_borrower: 'None',
  loan_tenure: 60,
  has_collateral: false,
};

const educationOptions = ['10th Pass', '12th Pass', 'Graduate', 'Post Graduate', 'Doctorate'];
const jobTypeOptions = ['Government', 'Salaried', 'Self Employed', 'Business', 'Student', 'Retired'];
const incomeStabilityOptions = ['Very Stable', 'Stable', 'Moderate', 'Unstable'];
const genderOptions = ['Male', 'Female', 'Other'];
const maritalOptions = ['Single', 'Married', 'Divorced', 'Widowed'];
const loanPurposeOptions = ['Personal', 'Home', 'Vehicle', 'Education', 'Agriculture', 'Business', 'Medical', 'Debt Consolidation'];
const coBorrowerOptions = ['None', 'Parent/Guardian', 'Spouse', 'Sibling', 'Other'];
const stateOptions = ['Andhra Pradesh', 'Bihar', 'Delhi', 'Gujarat', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal', 'Other'];

const SectionTitle = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-saffron/10">
      <Icon className="h-3.5 w-3.5 text-saffron" />
    </div>
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
  </div>
);

const EligibilityForm = ({ initialData, onSubmit }: EligibilityFormProps) => {
  const [form, setForm] = useState<LoanFormData>({ ...defaults, ...initialData });
  const { t } = useLanguage();

  useEffect(() => {
    if (initialData) setForm(prev => ({ ...prev, ...initialData }));
  }, [initialData]);

  const update = <K extends keyof LoanFormData>(key: K, value: LoanFormData[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit(form); }}
      className="space-y-2"
    >
      {/* Personal Profile */}
      <SectionTitle icon={User} title={t('form_section_personal')} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="age">{t('form_age')} *</Label>
          <Input id="age" type="number" min={18} max={80} required value={form.age} onChange={e => update('age', Number(e.target.value))} placeholder="Required" />
        </div>
        <div className="space-y-1.5">
          <Label>{t('form_gender')}</Label>
          <Select value={form.gender} onValueChange={v => update('gender', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{genderOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t('form_marital')}</Label>
          <Select value={form.marital_status} onValueChange={v => update('marital_status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{maritalOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="familyMembers">{t('form_family')}</Label>
          <Input id="familyMembers" type="number" min={1} value={form.family_members} onChange={e => update('family_members', Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dependents">{t('form_dependents')}</Label>
          <Input id="dependents" type="number" min={0} value={form.dependent_children} onChange={e => update('dependent_children', Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label>{t('form_education')}</Label>
          <Select value={form.education} onValueChange={v => update('education', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{educationOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="city">{t('form_city')}</Label>
          <Input id="city" value={form.location_city} onChange={e => update('location_city', e.target.value)} placeholder="e.g., Mumbai" />
        </div>
        <div className="space-y-1.5">
          <Label>{t('form_state')}</Label>
          <Select value={form.location_state} onValueChange={v => update('location_state', v)}>
            <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
            <SelectContent>{stateOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Employment */}
      <SectionTitle icon={Briefcase} title={t('form_section_employment')} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t('form_job_type')}</Label>
          <Select value={form.job_type} onValueChange={v => update('job_type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{jobTypeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="employer">{t('form_employer')}</Label>
          <Input id="employer" value={form.employer_name} onChange={e => update('employer_name', e.target.value)} placeholder="Company name" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="experience">{t('form_experience')}</Label>
          <Input id="experience" type="number" min={0} value={form.years_experience} onChange={e => update('years_experience', Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label>{t('form_income_stability')}</Label>
          <Select value={form.income_stability} onValueChange={v => update('income_stability', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{incomeStabilityOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={form.secondary_income} onCheckedChange={v => update('secondary_income', v)} />
        <Label>{t('form_secondary_income')}</Label>
      </div>

      {/* Financial */}
      <SectionTitle icon={IndianRupee} title={t('form_section_financial')} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="monthlyIncome">{t('form_income')} *</Label>
          <Input id="monthlyIncome" type="number" min={0} required value={form.monthly_income} onChange={e => update('monthly_income', Number(e.target.value))} placeholder="Required" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="savings">{t('form_savings')} *</Label>
          <Input id="savings" type="number" min={0} required value={form.monthly_savings} onChange={e => update('monthly_savings', Number(e.target.value))} placeholder="Required" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rent">Monthly Rent *</Label>
          <Input id="rent" type="number" min={0} required value={form.monthly_rent} onChange={e => update('monthly_rent', Number(e.target.value))} placeholder="Required" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="expenses">{t('form_expenses')} *</Label>
          <Input id="expenses" type="number" min={0} required value={form.total_monthly_expenses} onChange={e => update('total_monthly_expenses', Number(e.target.value))} placeholder="Required" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="existingLoans">{t('form_existing_loans')} *</Label>
          <Input id="existingLoans" type="number" min={0} required value={form.existing_loans} onChange={e => update('existing_loans', Number(e.target.value))} placeholder="Required" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="creditScore">{t('form_credit_score')} *</Label>
          <Input id="creditScore" type="number" min={300} max={900} required value={form.credit_score} onChange={e => update('credit_score', Number(e.target.value))} placeholder="Required" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="bankBalance">{t('form_bank_balance')} *</Label>
          <Input id="bankBalance" type="number" min={0} required value={form.bank_balance} onChange={e => update('bank_balance', Number(e.target.value))} placeholder="Required" />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Switch checked={form.has_investments} onCheckedChange={v => update('has_investments', v)} />
          <Label>{t('form_investments')}</Label>
        </div>
      </div>

      {/* Assets */}
      <SectionTitle icon={Car} title={t('form_section_assets')} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3">
          <Switch checked={form.owns_house} onCheckedChange={v => update('owns_house', v)} />
          <Label>{t('form_owns_house')}</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={form.owns_car} onCheckedChange={v => update('owns_car', v)} />
          <Label>{t('form_owns_car')}</Label>
        </div>
        {form.owns_car && (
          <div className="space-y-1.5">
            <Label htmlFor="carYear">{t('form_car_year')}</Label>
            <Input id="carYear" type="number" min={1990} max={2026} value={form.car_year} onChange={e => update('car_year', Number(e.target.value))} />
          </div>
        )}
      </div>
      {form.owns_house && (
        <div className="space-y-1.5">
          <Label htmlFor="propertyValue">{t('form_property_value')}</Label>
          <Input id="propertyValue" type="number" min={0} value={form.property_value} onChange={e => update('property_value', Number(e.target.value))} />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3">
          <Switch checked={form.has_health_insurance} onCheckedChange={v => update('has_health_insurance', v)} />
          <Label>{t('form_health_ins')}</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={form.has_life_insurance} onCheckedChange={v => update('has_life_insurance', v)} />
          <Label>{t('form_life_ins')}</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={form.has_vehicle_insurance} onCheckedChange={v => update('has_vehicle_insurance', v)} />
          <Label>{t('form_vehicle_ins')}</Label>
        </div>
      </div>

      {/* Loan Details */}
      <SectionTitle icon={FileText} title={t('form_section_loan')} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="loanAmount">{t('form_loan_amount')} *</Label>
          <Input id="loanAmount" type="number" min={0} required value={form.loan_amount} onChange={e => update('loan_amount', Number(e.target.value))} placeholder="Required" />
        </div>
        <div className="space-y-1.5">
          <Label>{t('form_loan_purpose')}</Label>
          <Select value={form.loan_purpose} onValueChange={v => update('loan_purpose', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{loanPurposeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tenure">{t('form_tenure')}</Label>
          <Input id="tenure" type="number" min={6} max={360} value={form.loan_tenure} onChange={e => update('loan_tenure', Number(e.target.value))} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>{t('form_co_borrower')}</Label>
        <Select value={form.co_borrower} onValueChange={v => update('co_borrower', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{coBorrowerOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <Switch checked={form.has_collateral} onCheckedChange={v => update('has_collateral', v)} />
        <Label>{t('form_collateral')}</Label>
      </div>

      <Button type="submit" variant="saffron" size="lg" className="w-full mt-4">
        {t('form_submit')}
        <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </form>
  );
};

export default EligibilityForm;
