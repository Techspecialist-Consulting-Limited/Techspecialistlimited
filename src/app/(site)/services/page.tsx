import type { Metadata } from 'next';
import ServicesClient from './ServicesClient';

export const metadata: Metadata = {
  title: 'Services — Advisory, Automation, Security & IT Support | TechSpecialist',
  description:
    'TechSpecialist helps organizations modernize operations, secure infrastructure, harness data, and build internal capability using Microsoft technology you already own.',
  alternates: {
    canonical: '/services',
  },
  openGraph: {
    title: 'Services — Advisory, Automation, Security & IT Support | TechSpecialist',
    description:
      'TechSpecialist helps organizations modernize operations, secure infrastructure, harness data, and build internal capability using Microsoft technology you already own.',
    type: 'website',
    url: '/services',
  },
};

export default function ServicesPage() {
  return <ServicesClient />;
}
