import type { Metadata } from 'next';
import CaseStudiesClient from './CaseStudiesClient';

export const metadata: Metadata = {
  title: 'Case Studies — Real Results Across Africa | TechSpecialist',
  description:
    'Real problems, real solutions. See how TechSpecialist has helped organizations across Africa transform their operations with technology built on Microsoft tools they already own.',
  alternates: {
    canonical: '/case-studies',
  },
  openGraph: {
    title: 'Case Studies — Real Results Across Africa | TechSpecialist',
    description:
      'Real problems, real solutions. See how TechSpecialist has helped organizations across Africa transform their operations with technology built on Microsoft tools they already own.',
    type: 'website',
    url: '/case-studies',
  },
};

export default function CaseStudiesPage() {
  return <CaseStudiesClient />;
}
