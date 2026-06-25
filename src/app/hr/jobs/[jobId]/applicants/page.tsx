'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApplicants, fetchJob, type Application, type Job } from '@/lib/recruitment-api';
import { StatusBadge, ScoreCircle, BrandedLoader, EmptyState } from '@/components/recruitment';

export default function ApplicantPipelinePage() {
  const { jobId } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const loadData = useCallback(async () => {
    if (!jobId || Array.isArray(jobId)) return;
    try {
      const [jobData, apps] = await Promise.all([fetchJob(jobId), fetchApplicants(jobId)]);
      setJob(jobData);
      setApplicants(apps);
    } catch { /* empty */ }
    setLoading(false);
  }, [jobId]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await loadData();
      if (!cancelled) {
        pollingRef.current = setInterval(loadData, 8000);
      }
    };
    run();
    return () => { cancelled = true; if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [loadData]);

  const hasScreeningInProgress = applicants.some((a) => a.status === 'pending' && !a.screening_result);

  if (loading) return <BrandedLoader text="Loading applicants..." />;

  return (
    <div>
      <Link
        href="/hr/jobs"
        className="mb-6 inline-flex items-center gap-2 text-[13px] font-medium text-[var(--body)] transition-colors hover:text-[var(--blue)]"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
        Back to Jobs
      </Link>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-syne text-[28px] font-extrabold text-[var(--heading)]">{job?.title || 'Applicants'}</h1>
          <p className="mt-1 text-[14px] text-[var(--body)]">{applicants.length} applicant{applicants.length !== 1 ? 's' : ''}</p>
        </div>
        {hasScreeningInProgress && (
          <div className="flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold" style={{ background: 'rgba(59, 130, 246, 0.08)', color: 'var(--status-screening)' }}>
            <div className="h-2 w-2 rounded-full" style={{ background: 'var(--status-screening)', animation: 'breathe 2s ease-in-out infinite' }} />
            AI screening in progress
          </div>
        )}
      </div>

      {applicants.length === 0 ? (
        <EmptyState
          icon={<svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
          title="No Applicants Yet"
          description="Applicants will appear here once candidates start applying."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {applicants.map((app, i) => {
            const sr = app.screening_result;
            return (
              <Link
                key={app.id}
                href={`/hr/applicants/${app.id}`}
                className="group relative block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(69,132,237,0.22)] hover:shadow-lg dark:border-white/10 dark:bg-[#101827]"
                style={{ animation: `cardSlideIn 0.4s ease ${i * 0.06}s both` }}
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
                    {sr && <ScoreCircle score={sr.overall_score} size={40} strokeWidth={3} showLabel={false} />}
                  </div>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={app.status} />
                    <span className="flex items-center gap-1 text-[12px] font-semibold text-[var(--blue)] opacity-0 transition-opacity group-hover:opacity-100">
                      View Details
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}