'use client';

import { startTransition, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchJob, type Job } from '@/lib/recruitment-api';
import { supabase } from '@/lib/supabase';
import { BrandedLoader, EmptyState } from '@/components/recruitment';

export default function CareerDetailClient() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadJob(id: string | string[] | undefined) {
    if (!id || Array.isArray(id)) return;
    // Try FastAPI first, fall back to Supabase
    try {
      const data = await fetchJob(id);
      setJob(data);
      setIsLoading(false);
      return;
    } catch { /* FastAPI unavailable */ }

    try {
      if (supabase) {
        const { data, error } = await supabase.from('jobs').select('*').eq('id', id).single();
        if (!error && data) { setJob(data as Job); setIsLoading(false); return; }
      }
    } catch { /* Supabase also unavailable */ }

    setJob(null);
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
        await navigator.share({ title: job?.title, text: job?.description, url: window.location.href });
      } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <BrandedLoader text="Loading position..." />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          }
          title="Position Not Found"
          description="This position may have been removed or is no longer available."
          action={{ label: 'Browse All Positions', onClick: () => router.push('/careers') }}
        />
      </div>
    );
  }

  const parseList = (val: unknown): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.split('\n').filter(Boolean);
    return [];
  };

  const requirements = parseList(job.requirements);

  return (
    <div>
      {/* Header */}
      <header
        className="relative border-b border-[var(--border)] bg-[var(--bg-soft)] px-6 pb-12 pt-28 dark:border-white/10 dark:bg-white/[0.03] lg:px-8 lg:pb-16 lg:pt-32"
      >
        {/* Dot grid pattern */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(69, 132, 237, 0.055) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative mx-auto max-w-[1280px]">
          <Link
            href="/careers"
            className="mb-6 inline-flex items-center gap-2 text-[13px] font-medium text-[var(--body)] transition-colors hover:text-[var(--blue)]"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Careers
          </Link>

          {job.department && (
            <span className="mb-4 inline-block rounded-full bg-[rgba(69,132,237,0.08)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--blue)]">
              {job.department}
            </span>
          )}

          <h1 className="section-title mb-4" style={{ maxWidth: 700 }}>
            {job.title}
          </h1>

          <div className="flex flex-wrap gap-2">
            {job.status === 'closed' && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-[10px] font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                Applications Closed
              </span>
            )}
            {job.location && (
              <span className="rounded-full bg-[var(--bg)] px-3 py-1 text-[10px] font-semibold text-[var(--body)] dark:bg-white/5">
                {job.location}
              </span>
            )}
            {job.type && (
              <span className={`rounded-full px-3 py-1 text-[10px] font-semibold ${
                job.type?.toLowerCase() === 'full-time'
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}>
                {job.type}
              </span>
            )}
          </div>

          {job.description && (
            <p className="mt-5 max-w-2xl text-[16px] leading-7 text-[var(--body)]">
              {job.description}
            </p>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="px-6 py-12 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[1fr_320px]">
          {/* Main Content */}
          <div>
            {requirements.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-6 font-syne text-xl font-bold text-[var(--heading)]">Requirements</h2>
                <ul className="space-y-3">
                  {requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-3 text-[14px] leading-relaxed text-[var(--body)]">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--blue)" strokeWidth={2.5} className="mt-0.5 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {req}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-[100px] lg:self-start">
            <div
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]"
              style={{ boxShadow: 'var(--shadow-md)' }}
            >
              <h3 className="mb-5 font-syne text-[16px] font-bold text-[var(--heading)]">Job Summary</h3>

              <div className="space-y-4">
                {[
                  { label: 'Department', value: job.department },
                  { label: 'Location', value: job.location },
                  { label: 'Type', value: job.type || 'Full-time' },
                  { label: 'Posted', value: job.created_at ? new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined },
                ].filter(item => item.value).map((item) => (
                  <div key={item.label}>
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">{item.label}</div>
                    <div className="mt-1 text-[14px] font-medium text-[var(--heading)]">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="my-5 h-px bg-[var(--border)]" />

              <button
                onClick={handleApply}
                disabled={job.status === 'closed'}
                className="btn-primary w-full text-center disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                style={{ display: 'block' }}
              >
                {job.status === 'closed' ? 'Applications Closed' : 'Apply Now'}
              </button>

              <button
                onClick={handleShare}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-[var(--border)] px-6 py-3 text-[13px] font-semibold text-[var(--body)] transition-all hover:border-[var(--blue)] hover:text-[var(--blue)] dark:border-white/10"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
                Share Position
              </button>
            </div>

            {/* AI Process info */}
            <div
              className="mt-4 rounded-xl p-4"
              style={{
                background: 'rgba(69, 132, 237, 0.04)',
                border: '1px solid rgba(69, 132, 237, 0.12)',
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 rounded-lg p-2"
                  style={{ background: 'rgba(69, 132, 237, 0.08)' }}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--blue)" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <div>
                  <div className="text-[12px] font-bold text-[var(--heading)]">AI-Powered Process</div>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--body)]">
                    Your application will be reviewed using our AI-assisted screening, followed by a voice-based AI interview.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
