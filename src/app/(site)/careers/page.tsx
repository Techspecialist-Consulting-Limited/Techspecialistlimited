import type { Metadata } from 'next';
import CareersClient from './CareersClient';

export const metadata: Metadata = {
  title: 'Careers — Join TechSpecialist',
  description:
    'Explore open positions at TechSpecialist and help organizations across Africa modernize operations, secure infrastructure, and build internal capability on Microsoft technology.',
  alternates: {
    canonical: '/careers',
  },
  openGraph: {
    title: 'Careers — Join TechSpecialist',
    description:
      'Explore open positions at TechSpecialist and help organizations across Africa modernize operations, secure infrastructure, and build internal capability on Microsoft technology.',
    type: 'website',
    url: '/careers',
  },
};

export default function CareersPage() {
  return <CareersClient />;
}
