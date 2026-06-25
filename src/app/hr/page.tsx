'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchJobs, fetchDashboardStats, type Job, type DashboardStats } from '@/lib/recruitment-api';
import { BrandedLoader } from '@/components/recruitment';

export default function HRDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchJobs().catch(() => { setBackendError(true); return []; }),
      fetchDashboardStats().catch(() => null),
    ])
      .then(([jobsData, statsData]) => {
        setJobs(jobsData);
        setStats(statsData);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeJobs = jobs.filter((j) => j.status === 'active' && !j.is_deleted);

  const statCards = [
    {
      label: 'Active Jobs',
      value: stats?.active_jobs ?? activeJobs.length,
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      ),
      accent: 'var(--blue)',
      bg: 'rgba(69, 132, 237, 0.06)',
    },
    {
      label: 'Total Applicants',
      value: jobs.reduce((sum, j) => sum + (j.applicant_count ?? 0), 0),
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      accent: 'var(--status-approved)',
      bg: 'rgba(34, 197, 94, 0.06)',
    },
    {
      label: 'Pending Review',
      value: stats?.pending_review ?? '--',
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: 'var(--status-new)',
      bg: 'rgba(245, 158, 11, 0.06)',
    },
    {
      label: 'Completed',
      value: stats?.completed ?? '--',
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: 'var(--status-completed)',
      bg: 'rgba(99, 102, 241, 0.06)',
    },
  ];

  if (loading) return <BrandedLoader text="Loading dashboard..." />;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-syne text-[28px] font-extrabold text-[var(--heading)]">Dashboard</h1>
        <p className="mt-1 text-[14px] text-[var(--body)]">Recruitment overview and quick actions</p>
      </div>

      {backendError && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800/30 dark:bg-amber-900/10">
          <div className="flex items-start gap-3">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2} className="mt-0.5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            <div>
              <div className="text-[13px] font-bold text-amber-800 dark:text-amber-400">Backend Not Connected</div>
              <p className="mt-1 text-[12px] leading-relaxed text-amber-700 dark:text-amber-500">
                The recruitment backend (FastAPI) is not running or not configured. Set the <code className="rounded bg-amber-100 px-1 py-0.5 text-[11px] dark:bg-amber-900/30">RECRUITMENT_API_URL</code> environment variable and ensure the backend is deployed. HR features require the backend to function.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#101827]"
          >
            <div className="absolute left-0 top-0 h-full w-[3px] rounded-r" style={{ background: card.accent, opacity: 0.3 }} />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[28px] font-extrabold text-[var(--heading)]" style={{ letterSpacing: '-0.02em' }}>{card.value}</div>
                <div className="mt-1 text-[12px] font-medium text-[var(--body)]">{card.label}</div>
              </div>
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: card.bg, color: card.accent }}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-5 text-[16px] font-bold text-[var(--heading)]">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: 'Post New Job',
              desc: 'Create a new job posting',
              href: '/hr/jobs/create',
              icon: (
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              ),
              color: 'var(--blue)',
            },
            {
              title: 'Manage Jobs',
              desc: 'View and edit all job posts',
              href: '/hr/jobs',
              icon: (
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              ),
              color: 'var(--status-approved)',
            },
            {
              title: 'Browse Careers',
              desc: 'See the public careers page',
              href: '/careers',
              icon: (
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              ),
              color: 'var(--orange)',
            },
            {
              title: 'Job History',
              desc: 'Restore soft-deleted jobs',
              href: '/hr/jobs/history',
              icon: (
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              color: 'var(--status-completed)',
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 transition-all hover:-translate-y-0.5 hover:border-[rgba(69,132,237,0.22)] hover:shadow-md dark:border-white/10 dark:bg-[#101827]"
            >
              <div className="absolute left-0 right-0 top-0 h-[3px] bg-[linear-gradient(90deg,var(--blue),var(--orange))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: `${action.color}12`, color: action.color }}
              >
                {action.icon}
              </div>
              <div className="text-[14px] font-bold text-[var(--heading)] group-hover:text-[var(--blue)]">{action.title}</div>
              <div className="mt-1 text-[12px] text-[var(--body)]">{action.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent jobs */}
      <div>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[var(--heading)]">Recent Jobs</h2>
          <Link href="/hr/jobs" className="text-[13px] font-semibold text-[var(--blue)] hover:underline">View All</Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] dark:border-white/10 dark:bg-[#101827]">
          {jobs.length === 0 ? (
            <div className="p-8 text-center text-[14px] text-[var(--body)]">No jobs yet. Create your first job posting.</div>
          ) : (
            jobs.filter((j) => !j.is_deleted).slice(0, 5).map((job, i) => (
              <Link
                key={job.id}
                href={`/hr/jobs/${job.id}/applicants`}
                className={`group flex items-center justify-between p-5 transition-colors hover:bg-[var(--bg-soft)] ${i < Math.min(jobs.filter((j) => !j.is_deleted).length, 5) - 1 ? 'border-b border-[var(--border)] dark:border-white/10' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ background: 'var(--blue)' }}
                  >
                    {job.title.charAt(0)}
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-[var(--heading)] group-hover:text-[var(--blue)]">{job.title}</div>
                    <div className="text-[11px] text-[var(--body)]">{job.department || 'No department'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-medium text-[var(--body)]">
                    {job.applicant_count ?? 0} applicant{(job.applicant_count ?? 0) !== 1 ? 's' : ''}
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-[10px] font-semibold"
                    style={{
                      background: job.is_closed ? 'rgba(245, 158, 11, 0.1)' : job.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: job.is_closed ? 'var(--status-new)' : job.status === 'active' ? 'var(--status-approved)' : 'var(--status-rejected)',
                    }}
                  >
                    {job.is_closed ? 'Closed' : job.status}
                  </span>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--body)" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}