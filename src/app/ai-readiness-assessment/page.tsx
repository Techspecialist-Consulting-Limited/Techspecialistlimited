import type { Metadata } from 'next';
import AiReadinessClient from './AiReadinessClient';

export const metadata: Metadata = {
  title: 'Free AI Readiness Assessment — TechSpecialist',
  description:
    'Take our free AI readiness assessment to see how prepared your organization is to adopt AI, with a personalized report across the pillars that matter most.',
  alternates: {
    canonical: '/ai-readiness-assessment',
  },
  openGraph: {
    title: 'Free AI Readiness Assessment — TechSpecialist',
    description:
      'Take our free AI readiness assessment to see how prepared your organization is to adopt AI, with a personalized report across the pillars that matter most.',
    type: 'website',
    url: '/ai-readiness-assessment',
  },
};

export default function AIReadinessPage() {
  return <AiReadinessClient />;
}
