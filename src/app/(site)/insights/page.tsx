import type { Metadata } from 'next';
import InsightsClient from './InsightsClient';

export const metadata: Metadata = {
  title: 'Insights — Industry Insights for Digital Leaders | TechSpecialist',
  description:
    'Thought leadership for C-suite executives navigating digital transformation, AI adoption, and security strategy. Practical insights from hundreds of implementation projects across Africa.',
  alternates: {
    canonical: '/insights',
  },
  openGraph: {
    title: 'Insights — Industry Insights for Digital Leaders | TechSpecialist',
    description:
      'Thought leadership for C-suite executives navigating digital transformation, AI adoption, and security strategy. Practical insights from hundreds of implementation projects across Africa.',
    type: 'website',
    url: '/insights',
  },
};

export default function InsightsPage() {
  return <InsightsClient />;
}
