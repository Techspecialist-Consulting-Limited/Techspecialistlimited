import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCaseStudy } from '@/data/case-studies';
import CaseStudyDetailClient from './CaseStudyDetailClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const cs = getCaseStudy(id);
  if (!cs) return {};

  return {
    title: `${cs.title} — TechSpecialist Case Study`,
    description: cs.summary,
    alternates: {
      canonical: `/case-studies/${cs.id}`,
    },
    openGraph: {
      title: cs.title,
      description: cs.summary,
      type: 'article',
      url: `/case-studies/${cs.id}`,
      images: [{ url: cs.heroImage }],
    },
  };
}

export default async function CaseStudyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!getCaseStudy(id)) notFound();

  return <CaseStudyDetailClient />;
}
