'use client';

import { startTransition, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function CareerDetail() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadJob(id: string | string[] | undefined) {
    if (!id || Array.isArray(id)) return;
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        setJob(data);
      } else {
        setJob(null);
      }
    } catch (error) {
      console.error('Error loading job:', error);
      setJob(null);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    startTransition(() => { loadJob(params.id); });
  }, [params.id]);

  const handleApply = () => {
    if (job?.status === 'closed') return;
    router.push(`/apply?id=${params.id}`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: job?.title,
          text: job?.description,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#4584ed] border-t-transparent mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-[#2f2f2f] dark:text-white mb-4">Job Not Found</h2>
          <Link href="/careers" className="text-[#4584ed] hover:underline">← Back to Careers</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* PAGE HEADER */}
      <header className="border-b border-gray-200 bg-white px-4 py-20 dark:border-white/10 dark:bg-[#0b1020] sm:px-6 lg:px-8 lg:py-24" style={{ marginTop: '64px' }}>
        <div className="mx-auto max-w-6xl">
          <Link href="/careers" className="mb-4 inline-flex items-center gap-2 text-sm text-[#5f6368] hover:text-[#4584ed]">
            ← Back to Careers
          </Link>
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-[#4584ed]">{job.department}</div>
          <h1 className="font-serif text-4xl font-normal leading-tight tracking-[-0.03em] text-[#2f2f2f] dark:text-white sm:text-5xl">
            {job.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-3">
            {job.status === 'closed' && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900 dark:text-red-300">
                Closed
              </span>
            )}
            <span className="rounded-full bg-[#f7f9fc] px-3 py-1 text-xs font-semibold text-[#5f6368] dark:bg-gray-700 dark:text-gray-300">
              {job.location}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              job.type?.toLowerCase() === 'full-time'
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
            }`}>
              {job.type || 'Full-time'}
            </span>
            <span className="rounded-full bg-[#f7f9fc] px-3 py-1 text-xs font-semibold text-[#5f6368] dark:bg-gray-700 dark:text-gray-300">
              {job.department}
            </span>
          </div>
          {job.description && (
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#5f6368] dark:text-gray-300">
              {job.description}
            </p>
          )}
        </div>
      </header>

      {/* DETAIL CONTENT */}
      <main className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_300px]">
          {/* Main Content */}
          <div>
            {job.requirements && job.requirements.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-6 text-2xl font-bold text-[#2f2f2f] dark:text-white">Requirements</h2>
                <ul className="space-y-3">
                  {job.requirements.map((req: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-[#5f6368] dark:text-gray-300">
                      <span className="mt-1 text-[#4584ed] font-bold">✓</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {job.responsibilities && job.responsibilities.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-6 text-2xl font-bold text-[#2f2f2f] dark:text-white">Responsibilities</h2>
                <ul className="space-y-3">
                  {job.responsibilities.map((resp: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-[#5f6368] dark:text-gray-300">
                      <span className="mt-1 text-[#4584ed] font-bold">✓</span>
                      {resp}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {job.benefits && job.benefits.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-6 text-2xl font-bold text-[#2f2f2f] dark:text-white">Benefits</h2>
                <ul className="space-y-3">
                  {job.benefits.map((benefit: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-[#5f6368] dark:text-gray-300">
                      <span className="mt-1 text-[#4584ed] font-bold">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-[100px]">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-[#101827]">
              <h3 className="mb-4 text-lg font-bold text-[#2f2f2f] dark:text-white">Job Summary</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f6368] dark:text-gray-400">Department</div>
                  <div className="mt-1 text-sm text-[#2f2f2f] dark:text-white">{job.department}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f6368] dark:text-gray-400">Location</div>
                  <div className="mt-1 text-sm text-[#2f2f2f] dark:text-white">{job.location}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f6368] dark:text-gray-400">Type</div>
                  <div className="mt-1 text-sm text-[#2f2f2f] dark:text-white">{job.type || 'Full-time'}</div>
                </div>
              </div>
              <button
                onClick={handleApply}
                disabled={job.status === 'closed'}
                className="mt-6 w-full rounded-lg bg-[#4584ed] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(69,132,237,0.3)] transition hover:bg-[#2d65c4] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none disabled:hover:translate-y-0"
              >
                {job.status === 'closed' ? 'Applications Closed' : 'Apply Now →'}
              </button>
              <button
                onClick={handleShare}
                className="mt-3 w-full rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-[#5f6368] transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Share Position
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
