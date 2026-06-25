'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchJobs, updateJob, softDeleteJob, type Job } from '@/lib/recruitment-api';
import { StatusBadge, BrandedLoader, EmptyState } from '@/components/recruitment';

export default function HRJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchJobs();
        if (!cancelled) setJobs(data.filter((j) => !j.is_deleted));
      } catch {
        if (!cancelled) setJobs([]);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleToggleClose = async (job: Job) => {
    setToggling(job.id);
    try {
      const updated = await updateJob(job.id, { is_closed: !job.is_closed });
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    } catch { /* ignore */ }
    setToggling(null);
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to soft-delete this job? Applications will still be accessible from the history page.')) return;
    setDeleting(jobId);
    try {
      await softDeleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch { /* ignore */ }
    setDeleting(null);
  };

  const filtered = search
    ? jobs.filter((j) => j.title.toLowerCase().includes(search.toLowerCase()) || j.department?.toLowerCase().includes(search.toLowerCase()))
    : jobs;

  if (loading) return <BrandedLoader text="Loading jobs..." />;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-syne text-[28px] font-extrabold text-[var(--heading)]">Jobs</h1>
          <p className="mt-1 text-[14px] text-[var(--body)]">Manage your job postings</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/hr/jobs/history" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-5 py-[11px] text-[13px] font-bold text-[var(--body)] transition-all hover:-translate-y-0.5 hover:border-[var(--blue)] hover:text-[var(--blue)] dark:border-white/10">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            History
          </Link>
          <Link href="/hr/jobs/create" className="inline-flex items-center gap-2 rounded-xl bg-[var(--blue)] px-5 py-[11px] text-[13px] font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Create Job
          </Link>
        </div>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon={<svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>}
          title="No Jobs Yet"
          description="Create your first job posting to start receiving applications."
          action={{ label: 'Create Job', onClick: () => window.location.href = '/hr/jobs/create' }}
        />
      ) : (
        <>
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-xs">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--body)" strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="search"
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] py-[11px] pl-9 pr-4 text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
              />
            </div>
          </div>

          {/* Jobs grid */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((job, i) => (
              <div
                key={job.id}
                className="group relative block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(69,132,237,0.22)] hover:shadow-lg dark:border-white/10 dark:bg-[#101827]"
                style={{ animation: `cardSlideIn 0.4s ease ${i * 0.06}s both` }}
              >
                <div className="absolute left-0 right-0 top-0 h-[3px] bg-[linear-gradient(90deg,var(--blue),var(--orange))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <Link href={`/hr/jobs/${job.id}/applicants`}>
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                        style={{ background: 'var(--blue)' }}
                      >
                        {job.title.charAt(0)}
                      </div>
                    </Link>
                    <StatusBadge status={job.is_closed ? 'closed' : job.status} />
                  </div>
                  <Link href={`/hr/jobs/${job.id}/applicants`}>
                    <h3 className="mb-1 text-[15px] font-bold text-[var(--heading)] group-hover:text-[var(--blue)]">{job.title}</h3>
                    {job.description && (
                      <p className="mb-3 line-clamp-2 text-[12px] leading-relaxed text-[var(--body)]">{job.description}</p>
                    )}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2">
                    {job.department && (
                      <span className="rounded-full bg-[rgba(69,132,237,0.08)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--blue)]">
                        {job.department}
                      </span>
                    )}
                    {job.location && (
                      <span className="rounded-full bg-[var(--bg-soft)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--body)] dark:bg-white/5">
                        {job.location}
                      </span>
                    )}
                    <span className="rounded-full bg-[rgba(34,197,94,0.08)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--status-approved)]">
                      {job.applicant_count ?? 0} applicant{(job.applicant_count ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 dark:border-white/10">
                    <span className="text-[10px] text-[var(--body)]">
                      {job.created_at ? new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.preventDefault(); handleToggleClose(job); }}
                        disabled={toggling === job.id}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-[10px] font-semibold text-[var(--body)] transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)] disabled:opacity-50 dark:border-white/10"
                        title={job.is_closed ? 'Open this job for applications' : 'Close this job (hide from careers)'}
                      >
                        {job.is_closed ? 'Open' : 'Close'}
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); handleDelete(job.id); }}
                        disabled={deleting === job.id}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-[10px] font-semibold text-[var(--status-rejected)] transition-colors hover:border-red-300 hover:bg-red-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-red-900/20"
                        title="Soft-delete this job"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-8 text-center dark:border-white/10 dark:bg-[#101827]">
              <p className="text-[14px] text-[var(--body)]">No jobs match your search.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}