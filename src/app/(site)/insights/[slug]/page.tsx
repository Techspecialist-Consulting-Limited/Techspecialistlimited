import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getBlogPost } from '@/data/blog';
import BlogDetailClient from './BlogDetailClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return {
    title: `${post.title} — TechSpecialist Insights`,
    description: post.metaDescription,
    keywords: post.keywords,
    alternates: {
      canonical: `/insights/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      type: 'article',
      url: `/insights/${post.slug}`,
      images: [{ url: post.heroImage }],
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getBlogPost(slug)) notFound();

  return <BlogDetailClient />;
}
