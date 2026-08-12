import type { Metadata } from 'next';
import ConsultationClient from './ConsultationClient';

export const metadata: Metadata = {
  title: 'Book a Consultation — TechSpecialist',
  description:
    'Book a discovery call with TechSpecialist to discuss digital transformation, AI adoption, security, and IT support for your organization.',
  alternates: {
    canonical: '/consultation',
  },
  openGraph: {
    title: 'Book a Consultation — TechSpecialist',
    description:
      'Book a discovery call with TechSpecialist to discuss digital transformation, AI adoption, security, and IT support for your organization.',
    type: 'website',
    url: '/consultation',
  },
};

export default function ConsultationPage() {
  return <ConsultationClient />;
}
