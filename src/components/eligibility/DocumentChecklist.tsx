import { motion } from 'framer-motion';
import { FileCheck, CheckSquare } from 'lucide-react';
import type { LoanFormData } from '@/types/loan';
import { useLanguage } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

interface DocumentChecklistProps {
  formData: LoanFormData;
}

interface DocItem {
  key: TranslationKey;
  condition?: boolean;
}

const DocumentChecklist = ({ formData }: DocumentChecklistProps) => {
  const { t } = useLanguage();

  const baseDocs: DocItem[] = [
    { key: 'doc_aadhaar' },
    { key: 'doc_pan' },
    { key: 'doc_bank_stmt' },
    { key: 'doc_address_proof' },
    { key: 'doc_photo' },
  ];

  const conditionalDocs: DocItem[] = [
    { key: 'doc_income_proof', condition: formData.employmentType === 'Salaried' },
    { key: 'doc_itr', condition: formData.employmentType === 'Salaried' || formData.employmentType === 'Business' },
    { key: 'doc_business_reg', condition: formData.employmentType === 'Business' || formData.employmentType === 'Self Employed' },
    { key: 'doc_gst', condition: formData.employmentType === 'Business' },
    { key: 'doc_admission', condition: formData.loanPurpose === 'Education' },
    { key: 'doc_marksheets', condition: formData.loanPurpose === 'Education' || formData.employmentType === 'Student' },
    { key: 'doc_land_records', condition: formData.loanPurpose === 'Agriculture' },
    { key: 'doc_crop_details', condition: formData.loanPurpose === 'Agriculture' },
    { key: 'doc_vehicle_quote', condition: formData.loanPurpose === 'Vehicle' },
    { key: 'doc_property_docs', condition: formData.loanPurpose === 'Home' },
  ];

  const allDocs = [...baseDocs, ...conditionalDocs.filter(d => d.condition)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-saffron/10">
          <FileCheck className="h-4 w-4 text-saffron" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('docs_title')}</h3>
          <p className="text-xs text-muted-foreground">{t('docs_subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {allDocs.map((doc, i) => (
          <motion.div
            key={doc.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.05 }}
            className="flex items-center gap-2.5 rounded-lg border border-border p-3"
          >
            <CheckSquare className="h-4 w-4 shrink-0 text-accent" />
            <span className="text-sm text-foreground">{t(doc.key)}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default DocumentChecklist;
