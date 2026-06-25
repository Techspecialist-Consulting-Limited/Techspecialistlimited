'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchDeletedJobs, restoreJob, type Job } from '@/lib/recruitment-api';
import { BrandedLoader, EmptyState } from '@/components/recruitment';

export default function JobHistoryPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchDeletedJobs();
        if (!cancelled) setJobs(data);
      } catch {
        if (!cancelled) setJobs([]);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleRestore = async (jobId: string) => {
    setRestoring(jobId);
    try {
      await restoreJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch { /* ignore */ }
    setRestoring(null);
  };

  if (loading) return <BrandedLoader text="Loading job history..." />;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-syne text-[28px] font-extrabold text-[var(--heading)]">Job History</h1>
          <p className="mt-1 text-[14px] text-[var(--body)]">Soft-deleted job postings — restore them to make them active again</p>
        </div>
        <Link href="/hr/jobs" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-5 py-[11px] text-[13px] font-bold text-[var(--body)] transition-all hover:-translate-y-0.5 hover:border-[var(--blue)] hover:text-[var(--blue)] dark:border-white/10">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          Back to Jobs
        </Link>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon={
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
          title="No Deleted Jobs"
          description="No job postings have been soft-deleted yet. Deleted jobs will appear here."
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="group relative flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 transition-all hover:shadow-md dark:border-white/10 dark:bg-[#101827]"
            >
              <div className="absolute left-0 top-0 h-full w-[3px] rounded-r bg-[var(--status-rejected)] opacity-30" />
              <div className="flex items-center gap-4 pl-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(239,68,68,0.1)] text-sm font-bold text-[var(--status-rejected)]">
                  {job.title.charAt(0)}
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[var(--heading)]">{job.title}</div>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-[var(--body)]">
                    <span>{job.applicant_count ?? 0} applicant{(job.applicant_count ?? 0) !== 1 ? 's' : ''}</span>
                    {job.created_at && (
                      <>
                        <span className="opacity-40">·</span>
                        <span>Deleted {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[rgba(239,68,68,0.1)] px-3 py-1 text-[10px] font-semibold text-[var(--status-rejected)]">Deleted</span>
                <button
                  onClick={() => handleRestore(job.id)}
                  disabled={restoring === job.id}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--blue)] px-4 py-2 text-[12px] font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
                >
                  {restoring === job.id ? (
                    <>Restoring...</>
                  ) : (
                    <>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                      Restore
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}