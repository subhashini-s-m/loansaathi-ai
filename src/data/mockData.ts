import type { SampleCase } from '@/types/loan';

export const sampleCases: SampleCase[] = [
  {
    id: 'auto-driver',
    title: 'Auto Rickshaw Driver',
    emoji: '🛺',
    description: 'Ramesh, 42, drives an auto in Chennai. Wants ₹2,00,000 to buy a new auto.',
    formData: {
      income: 18000,
      loanAmount: 200000,
      education: '10th Pass',
      existingLoans: 1,
      creditScore: 520,
      employmentType: 'Self Employed',
      loanPurpose: 'Vehicle',
    },
  },
  {
    id: 'student',
    title: 'Engineering Student',
    emoji: '🎓',
    description: 'Priya, 21, studying B.Tech in Hyderabad. Needs ₹5,00,000 for tuition fees.',
    formData: {
      income: 12000,
      loanAmount: 500000,
      education: 'Graduate',
      existingLoans: 0,
      creditScore: 680,
      employmentType: 'Student',
      loanPurpose: 'Education',
    },
  },
  {
    id: 'farmer',
    title: 'Small-Scale Farmer',
    emoji: '🌾',
    description: 'Suresh, 55, owns 2 acres in Punjab. Needs ₹3,00,000 for farming equipment.',
    formData: {
      income: 22000,
      loanAmount: 300000,
      education: '10th Pass',
      existingLoans: 2,
      creditScore: 480,
      employmentType: 'Self Employed',
      loanPurpose: 'Agriculture',
    },
  },
];

export const educationOptions = ['10th Pass', '12th Pass', 'Graduate', 'Post Graduate'];
export const employmentOptions = ['Salaried', 'Self Employed', 'Business', 'Student', 'Retired'];
export const loanPurposeOptions = ['Personal', 'Home', 'Vehicle', 'Education', 'Agriculture', 'Business'];
