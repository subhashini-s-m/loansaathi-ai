import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { LoanFormData } from '@/types/loan';
import { educationOptions, employmentOptions, loanPurposeOptions } from '@/data/mockData';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface EligibilityFormProps {
  initialData?: LoanFormData;
  onSubmit: (data: LoanFormData) => void;
}

const defaults: LoanFormData = {
  income: 30000,
  loanAmount: 300000,
  education: 'Graduate',
  existingLoans: 1,
  creditScore: 650,
  employmentType: 'Salaried',
  loanPurpose: 'Personal',
};

const EligibilityForm = ({ initialData, onSubmit }: EligibilityFormProps) => {
  const [form, setForm] = useState<LoanFormData>(initialData ?? defaults);
  const { t } = useLanguage();

  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  const update = <K extends keyof LoanFormData>(key: K, value: LoanFormData[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit(form); }}
      className="space-y-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="income">{t('form_income')}</Label>
          <Input
            id="income"
            type="number"
            min={0}
            value={form.income}
            onChange={e => update('income', Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="loanAmount">{t('form_loan_amount')}</Label>
          <Input
            id="loanAmount"
            type="number"
            min={0}
            value={form.loanAmount}
            onChange={e => update('loanAmount', Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t('form_education')}</Label>
          <Select value={form.education} onValueChange={v => update('education', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {educationOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('form_employment')}</Label>
          <Select value={form.employmentType} onValueChange={v => update('employmentType', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {employmentOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="creditScore">{t('form_credit_score')}</Label>
          <Input
            id="creditScore"
            type="number"
            min={300}
            max={900}
            value={form.creditScore}
            onChange={e => update('creditScore', Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="existingLoans">{t('form_existing_loans')}</Label>
          <Input
            id="existingLoans"
            type="number"
            min={0}
            value={form.existingLoans}
            onChange={e => update('existingLoans', Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('form_loan_purpose')}</Label>
          <Select value={form.loanPurpose} onValueChange={v => update('loanPurpose', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {loanPurposeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" variant="saffron" size="lg" className="w-full">
        {t('form_submit')}
        <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </form>
  );
};

export default EligibilityForm;
