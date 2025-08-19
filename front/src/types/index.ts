export interface Question {
  id: string;
  text: string;
  type: 'text' | 'select' | 'multiselect' | 'textarea';
  options?: string[];
  required: boolean;
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface OnboardingStep {
  id: number;
  title: string;
  description?: string;
  questions: Question[];
  completed: boolean;
}

export interface OnboardingData {
  currentStep: number;
  steps: OnboardingStep[];
  responses: Record<string, string | string[]>;
}

export interface FeatureCard {
  title: string;
  description: string;
  icon: string;
}

export interface Statistic {
  value: string;
  label: string;
  description?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface NavigationItem {
  name: string;
  href: string;
  children?: NavigationItem[];
}
