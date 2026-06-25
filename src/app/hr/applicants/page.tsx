'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchJobs, fetchApplicants, type Job } from '@/lib/recruitment-api';
import { StatusBadge, ScoreCircle, BrandedLoader, EmptyState } from '@/components/recruitment';

interface ApplicantWithMeta {
  id: string;
  job_id: string;
  candidate_name: string;
  candidate_email: string;
  status: string;
  stage: number;
  job_title: string;
  overall_score: number | null;
  created_at: string;
}

export default function AllApplicantsPage() {
  const [applicants, setApplicants] = useState<ApplicantWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const jobs: Job[] = await fetchJobs();
        if (cancelled) return;
        const all: ApplicantWithMeta[] = [];

        const results = await Promise.allSettled(
          jobs.map(async (job) => {
            const apps = await fetchApplicants(job.id);
            apps.forEach((app) =>
              all.push({
                id: app.id,
                job_id: app.job_id,
                candidate_name: app.candidate_name,
                candidate_email: app.candidate_email,
                status: app.status,
                stage: app.stage,
                job_title: job.title,
                overall_score: app.screening_result?.overall_score ?? null,
                created_at: app.created_at,
              }),
            );
          }),
        );

        const failures = results.filter((r) => r.status === 'rejected');
        if (failures.length > 0 && all.length === 0) {
          setError('Failed to load applicant data. The backend may be unavailable.');
        }

        all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        if (!cancelled) setApplicants(all);
      } catch {
        if (!cancelled) setError('Failed to load applicant data. The backend may be unavailable.');
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = applicants.filter((a) => {
    if (search) {
      const q = search.toLowerCase();
      if (!a.candidate_name.toLowerCase().includes(q) && !a.candidate_email.toLowerCase().includes(q) && !a.job_title.toLowerCase().includes(q)) return false;
    }
    if (statusFilter && a.status !== statusFilter) return false;
    return true;
  });

  const statuses = [...new Set(applicants.map((a) => a.status))].sort();

  if (loading) return <BrandedLoader text="Loading applicants..." />;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-syne text-[28px] font-extrabold text-[var(--heading)]">All Applicants</h1>
        <p className="mt-1 text-[14px] text-[var(--body)]">
          {applicants.length} applicant{applicants.length !== 1 ? 's' : ''} across all positions
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800/30 dark:bg-red-900/10">
          <div className="flex items-start gap-3">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2} className="mt-0.5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
            <div>
              <div className="text-[13px] font-bold text-red-800 dark:text-red-400">Unable to load applicants</div>
              <p className="mt-1 text-[12px] leading-relaxed text-red-700 dark:text-red-500">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!error && applicants.length === 0 ? (
        <EmptyState
          icon={
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
          title="No Applicants Yet"
          description="Applicants will appear here once candidates start applying to your job postings."
        />
      ) : (
        <>
          {/* Filter bar */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 gap-3">
              <div className="relative flex-1 sm:max-w-xs">
                <svg
                  width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--body)" strokeWidth={2}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="search"
                  placeholder="Search by name, email, or position..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] py-[11px] pl-9 pr-4 text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-[11px] text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
              >
                <option value="">All Statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <p className="text-[12px] text-[var(--body)]">
              {filtered.length} of {applicants.length} shown
            </p>
          </div>

          {/* Applicants grid */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-8 text-center dark:border-white/10 dark:bg-[#101827]">
              <p className="text-[14px] text-[var(--body)]">No applicants match your filters. Try adjusting your search.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((app, i) => (
                <Link
                  key={app.id}
                  href={`/hr/applicants/${app.id}`}
                  className="group relative block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(69,132,237,0.22)] hover:shadow-lg dark:border-white/10 dark:bg-[#101827]"
                  style={{ animation: `cardSlideIn 0.4s ease ${i * 0.05}s both` }}
                >
                  <div className="absolute left-0 right-0 top-0 h-[3px] bg-[linear-gradient(90deg,var(--blue),var(--orange))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                          style={{ background: 'var(--blue)' }}
                        >
                          {app.candidate_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-semibold text-[var(--heading)]">{app.candidate_name}</div>
                          <div className="truncate text-[11px] text-[var(--body)]">{app.candidate_email}</div>
                        </div>
                      </div>
                      {app.overall_score !== null && (
                        <ScoreCircle score={app.overall_score} size={40} strokeWidth={3} showLabel={false} />
                      )}
                    </div>
                    <div className="mb-3">
                      <span className="rounded-full bg-[rgba(69,132,237,0.08)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--blue)]">
                        {app.job_title}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <StatusBadge status={app.status} />
                      <span className="text-[10px] text-[var(--body)]">
                        {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}