'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getHREmail } from '@/lib/auth';
import {
  fetchJobs,
  fetchDashboardStats,
  fetchPendingDecisions,
  fetchPipelineAnalytics,
  fetchHrUsers,
  type Job,
  type DashboardStats,
  type PendingDecision,
} from '@/lib/recruitment-api';
import { BrandedLoader } from '@/components/recruitment';

const RECOMMENDATION_STYLE: Record<string, { label: string; color: string }> = {
  highly_recommended: { label: 'Highly Recommended', color: 'var(--score-high)' },
  strong_yes: { label: 'Highly Recommended', color: 'var(--score-high)' },
  recommended: { label: 'Recommended', color: 'var(--blue)' },
  yes: { label: 'Recommended', color: 'var(--blue)' },
  consider: { label: 'Consider', color: 'var(--score-mid)' },
  no: { label: 'Not Recommended', color: 'var(--status-rejected)' },
  not_recommended: { label: 'Not Recommended', color: 'var(--status-rejected)' },
  strong_no: { label: 'Not Recommended', color: 'var(--status-rejected)' },
};

const ROLE_PURPLE = '#7c5cff';

interface PipelineTotals {
  applied: number;
  screened: number;
  shortlisted: number;
  interviewed: number;
}

function initialsOf(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function HRDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingDecisions, setPendingDecisions] = useState<PendingDecision[]>([]);
  const [pipeline, setPipeline] = useState<PipelineTotals | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchJobs().catch(() => { setBackendError(true); return []; }),
      fetchDashboardStats().catch(() => null),
      fetchPendingDecisions().catch(() => []),
      fetchPipelineAnalytics().catch(() => null),
      fetchHrUsers().catch(() => []),
    ])
      .then(([jobsData, statsData, decisionsData, pipelineData, users]) => {
        setJobs(jobsData);
        setStats(statsData);
        setPendingDecisions(decisionsData);
        if (pipelineData) {
          setPipeline(pipelineData.pipeline.reduce(
            (acc, p) => ({
              applied: acc.applied + p.total_applications,
              screened: acc.screened + p.screened,
              shortlisted: acc.shortlisted + p.shortlisted,
              interviewed: acc.interviewed + p.interviewed,
            }),
            { applied: 0, screened: 0, shortlisted: 0, interviewed: 0 },
          ));
        }
        const email = getHREmail();
        const me = users.find((u) => u.email.toLowerCase() === email?.toLowerCase());
        setDisplayName((me?.name || email || '').split(' ')[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeJobs = jobs.filter((j) => j.status === 'active' && !j.is_deleted);
  const matchingJobs = search.trim()
    ? jobs.filter((j) => !j.is_deleted && j.title.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 6)
    : [];

  const statCards = [
    {
      label: 'Active Jobs',
      value: stats?.active_jobs ?? activeJobs.length,
      color: 'var(--blue)',
      bg: 'rgba(69, 132, 237, 0.1)',
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      ),
    },
    {
      label: 'Total Applicants',
      value: jobs.reduce((sum, j) => sum + (j.applicant_count ?? 0), 0),
      color: ROLE_PURPLE,
      bg: 'rgba(124, 92, 255, 0.1)',
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      label: 'Pending Review',
      value: stats?.pending_review ?? '—',
      color: 'var(--status-new)',
      bg: 'rgba(245, 158, 11, 0.1)',
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Completed',
      value: stats?.completed ?? '—',
      color: 'var(--status-approved)',
      bg: 'rgba(34, 197, 94, 0.1)',
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const pipelineStages = pipeline ? [
    { label: 'Applied', value: pipeline.applied, color: 'var(--blue)' },
    { label: 'Screening', value: pipeline.screened, color: ROLE_PURPLE },
    { label: 'Shortlisted', value: pipeline.shortlisted, color: 'var(--status-new)' },
    { label: 'Interviewed', value: pipeline.interviewed, color: 'var(--status-assessment)' },
    { label: 'Hired', value: stats?.hired ?? 0, color: 'var(--status-approved)' },
  ] : null;
  const pipelineIcons = [
    <svg key="a" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
    <svg key="b" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
    <svg key="c" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
    <svg key="d" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75" /></svg>,
    <svg key="e" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  ];

  // Order deliberately keeps green and amber non-adjacent around the donut (validated via
  // dataviz's palette checker — that exact pair sits below the colorblind-safe separation
  // floor, so segment order is the cheap fix, on top of the mandatory labels below).
  const scoreBuckets = stats ? [
    { label: 'High Potential (70-100)', value: stats.score_high, color: 'var(--score-high)' },
    { label: 'Low Potential (0-39)', value: stats.score_low, color: 'var(--score-low)' },
    { label: 'Medium Potential (40-69)', value: stats.score_medium, color: 'var(--score-mid)' },
    { label: 'Not Scored', value: stats.score_unscored, color: '#94a3b8' },
  ] : [];
  const scoreTotal = scoreBuckets.reduce((sum, b) => sum + b.value, 0);

  const quickActions = [
    { title: 'Post New Job', desc: 'Create a new job posting', href: '/hr/jobs/create', color: 'var(--blue)', bg: 'rgba(69,132,237,0.1)', icon: <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> },
    { title: 'Manage Jobs', desc: 'View and edit all job posts', href: '/hr/jobs', color: 'var(--status-approved)', bg: 'rgba(34,197,94,0.1)', icon: <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25" /></svg> },
    { title: 'Schedule Interview', desc: 'Schedule candidate interviews', href: '/hr/interviews', color: ROLE_PURPLE, bg: 'rgba(124,92,255,0.1)', icon: <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75" /></svg> },
    { title: 'Browse Careers', desc: 'See the public careers page', href: '/careers', color: 'var(--orange)', bg: 'rgba(239,101,38,0.1)', icon: <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" /></svg> },
  ];

  if (loading) return <BrandedLoader text="Loading dashboard..." />;

  return (
    <div>
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-[var(--heading)]" style={{ fontFamily: "'Roboto Slab', sans-serif" }}>
            {displayName ? `Welcome back, ${displayName}` : 'Dashboard'}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--body)]">Here&apos;s what&apos;s happening with your recruitment pipeline today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--body)" strokeWidth={2} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              placeholder="Search jobs..."
              className="w-[190px] rounded-full border border-[var(--border)] bg-[var(--bg)] py-2.5 pl-9 pr-4 text-[13px] text-[var(--heading)] outline-none transition-all focus:w-[240px] focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5 sm:w-[220px]"
            />
            {searchFocused && matchingJobs.length > 0 && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-[280px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)] shadow-lg dark:border-white/10 dark:bg-[#101827]">
                {matchingJobs.map((j) => (
                  <Link key={j.id} href={`/hr/jobs/${j.id}/applicants`} className="block px-4 py-2.5 text-[12.5px] text-[var(--heading)] transition-colors hover:bg-[var(--bg-soft)] dark:hover:bg-white/5">
                    {j.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <a
            href="#pending-decisions"
            className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--body)] transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)] dark:border-white/10"
            aria-label={`${pendingDecisions.length} pending decisions`}
          >
            <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
            {pendingDecisions.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white" style={{ background: 'var(--status-rejected)' }}>
                {pendingDecisions.length}
              </span>
            )}
          </a>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--blue), ' + ROLE_PURPLE + ')' }}>
            {displayName ? displayName.charAt(0).toUpperCase() : 'H'}
          </div>
        </div>
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
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#101827]"
            style={{ animation: `cardSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s both`, boxShadow: `0 2px 12px ${card.color}14` }}
          >
            <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div className="text-[26px] font-extrabold text-[var(--heading)]" style={{ letterSpacing: '-0.02em' }}>{card.value}</div>
            <div className="mt-0.5 text-[12px] font-medium text-[var(--body)]">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Pipeline + AI Screening Overview */}
      <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div
          className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 dark:border-white/10 dark:bg-[#101827]"
          style={{ animation: 'cardSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) 0.15s both' }}
        >
          <div className="mb-5 flex items-center justify-between">
            <span className="text-[13px] font-bold text-[var(--heading)]">Recruitment Pipeline</span>
            <Link href="/hr/analytics" className="text-[12px] font-semibold text-[var(--blue)] hover:underline">Full Analytics</Link>
          </div>
          {pipelineStages && (
            <>
              <div className="mb-5 flex items-start justify-between">
                {pipelineStages.map((stage, i) => (
                  <div key={stage.label} className="flex flex-1 items-start">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: `${stage.color}18`, color: stage.color }}>
                        {pipelineIcons[i]}
                      </div>
                      <div>
                        <div className="text-[17px] font-extrabold leading-none text-[var(--heading)]" style={{ letterSpacing: '-0.02em' }}>{stage.value}</div>
                        <div className="mt-1 text-[10.5px] font-medium text-[var(--body)]">{stage.label}</div>
                      </div>
                    </div>
                    {i < pipelineStages.length - 1 && (
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="var(--border)" strokeWidth={2.5} className="mt-4 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                    )}
                  </div>
                ))}
              </div>
              {/* Layered funnel bar: each stage is a full-height, left-aligned bar sized to its
                  share of Applied, painted in stage order so narrower later-stage bars sit visibly
                  on top of the wider earlier-stage bars beneath them — not concatenated segments,
                  which would sum past 100% and silently clip. */}
              <div className="relative h-2 overflow-hidden rounded-full" style={{ background: 'var(--bg-soft)' }}>
                {pipelineStages.map((stage) => (
                  <div
                    key={stage.label}
                    className="absolute inset-y-0 left-0 transition-all duration-500"
                    style={{ width: `${pipeline!.applied > 0 ? (stage.value / pipeline!.applied) * 100 : 0}%`, background: stage.color }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-start justify-between">
                {pipelineStages.map((stage) => (
                  <span key={stage.label} className="flex-1 text-center text-[10px] font-semibold text-[var(--body)] first:text-left last:text-right">
                    {pipeline!.applied > 0 ? Math.round((stage.value / pipeline!.applied) * 100) : 0}%
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* AI Screening Overview donut — color choice: reuses the site's existing score-high/mid/low
            semantics (green/amber/red) for consistency with ScoreCircle elsewhere, rather than a
            fresh palette. The validator flagged a real green/amber CVD-adjacency risk at this exact
            pairing; mitigated with mandatory direct labels + legend (never color-only) rather than
            forking a second status palette just for this one chart. */}
        <div
          className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 dark:border-white/10 dark:bg-[#101827]"
          style={{ animation: 'cardSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) 0.2s both' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[13px] font-bold text-[var(--heading)]">AI Screening Overview</span>
          </div>
          <div className="flex items-center gap-5">
            <div className="relative h-[104px] w-[104px] flex-shrink-0">
              <svg width="104" height="104" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="52" cy="52" r="44" fill="none" stroke="var(--bg-soft)" strokeWidth="12" />
                {(() => {
                  const circumference = 2 * Math.PI * 44;
                  let offset = 0;
                  return scoreBuckets.filter((b) => b.value > 0).map((b) => {
                    const len = scoreTotal > 0 ? (b.value / scoreTotal) * circumference : 0;
                    const seg = (
                      <circle
                        key={b.label}
                        cx="52" cy="52" r="44" fill="none"
                        stroke={b.color}
                        strokeWidth="12"
                        strokeDasharray={`${Math.max(0, len - 2)} ${circumference - len + 2}`}
                        strokeDashoffset={-offset}
                        strokeLinecap="round"
                      />
                    );
                    offset += len;
                    return seg;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[19px] font-extrabold text-[var(--heading)]" style={{ letterSpacing: '-0.02em' }}>{stats?.avg_score ?? '—'}</span>
                <span className="text-[9px] font-medium text-[var(--body)]">Avg. Score</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {scoreBuckets.map((b) => (
                <div key={b.label} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[10.5px] text-[var(--body)]">
                    <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: b.color }} />
                    {b.label}
                  </span>
                  <span className="text-[11px] font-bold text-[var(--heading)]">{b.value}</span>
                </div>
              ))}
            </div>
          </div>
          {(stats?.score_high ?? 0) + (stats?.score_medium ?? 0) + (stats?.score_low ?? 0) > 0 && (
            <div className="mt-4 rounded-xl px-3.5 py-3 text-[11px] leading-relaxed text-[var(--body)]" style={{ background: 'var(--bg-soft)' }}>
              AI has screened {(stats?.score_high ?? 0) + (stats?.score_medium ?? 0) + (stats?.score_low ?? 0)} candidate{((stats?.score_high ?? 0) + (stats?.score_medium ?? 0) + (stats?.score_low ?? 0)) !== 1 ? 's' : ''} based on CV analysis and role matching.
            </div>
          )}
        </div>
      </div>

      {/* Pending Team Decisions + Quick Actions */}
      <div className="mb-9 grid gap-5 lg:grid-cols-[1fr_360px]" id="pending-decisions">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-[var(--heading)]">Pending Team Decisions</h2>
              <p className="mt-0.5 text-[11.5px] text-[var(--body)]">Candidates who finished their AI interview and are waiting on a call.</p>
            </div>
            {pendingDecisions.length > 0 && (
              <span className="flex-shrink-0 rounded-full bg-[rgba(69,132,237,0.1)] px-3 py-1 text-[11px] font-semibold text-[var(--blue)]">
                {pendingDecisions.length} awaiting
              </span>
            )}
          </div>
          {pendingDecisions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-[13px] text-[var(--body)]">
              No pending decisions right now — nice and clear.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingDecisions.slice(0, 5).map((d, i) => {
                const rec = d.overall_recommendation ? RECOMMENDATION_STYLE[d.overall_recommendation.toLowerCase()] : null;
                return (
                  <Link
                    key={d.application_id}
                    href={`/hr/applicants/${d.application_id}`}
                    className="group flex items-start gap-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[rgba(124,92,255,0.3)] hover:shadow-md dark:border-white/10 dark:bg-[#101827]"
                    style={{ animation: `cardSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) ${0.25 + i * 0.04}s both` }}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold" style={{ background: `${ROLE_PURPLE}18`, color: ROLE_PURPLE }}>
                      {initialsOf(d.candidate_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-[13.5px] font-semibold text-[var(--heading)]">{d.candidate_name}</div>
                          <div className="truncate text-[11px] text-[var(--body)]">{d.job_title}</div>
                        </div>
                        {d.score !== null && (
                          <span className="flex-shrink-0 rounded-full bg-[var(--bg-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--heading)] dark:bg-white/5">
                            {Math.round(d.score)}/100
                          </span>
                        )}
                      </div>
                      {rec && (
                        <span
                          className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em]"
                          style={{ background: `${rec.color}14`, color: rec.color }}
                        >
                          {rec.label}
                        </span>
                      )}
                      {d.interview_summary && (
                        <p className="mt-1.5 line-clamp-1 text-[11.5px] leading-relaxed text-[var(--body)]">{d.interview_summary}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="mb-4 text-[15px] font-bold text-[var(--heading)]">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#101827]"
              >
                <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110" style={{ background: action.bg, color: action.color }}>
                  {action.icon}
                </div>
                <div className="text-[12.5px] font-bold text-[var(--heading)]">{action.title}</div>
                <div className="mt-0.5 text-[10.5px] leading-snug text-[var(--body)]">{action.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent jobs */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[var(--heading)]">Recent Jobs</h2>
          <Link href="/hr/jobs" className="text-[13px] font-semibold text-[var(--blue)] hover:underline">View All</Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] dark:border-white/10 dark:bg-[#101827]">
          {jobs.length === 0 ? (
            <div className="p-8 text-center text-[14px] text-[var(--body)]">No jobs yet. Create your first job posting.</div>
          ) : (
            jobs.filter((j) => !j.is_deleted).slice(0, 5).map((job, i, arr) => (
              <Link
                key={job.id}
                href={`/hr/jobs/${job.id}/applicants`}
                className={`group flex items-center justify-between gap-4 p-4 transition-colors duration-150 hover:bg-[var(--bg-soft)] dark:hover:bg-white/[0.04] ${i < arr.length - 1 ? 'border-b border-[var(--border)] dark:border-white/10' : ''}`}
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[13px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--blue), ' + ROLE_PURPLE + ')' }}
                  >
                    {job.title.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-semibold text-[var(--heading)] group-hover:text-[var(--blue)]">{job.title}</div>
                    <div className="truncate text-[11px] text-[var(--body)]">{job.department || 'No department'}</div>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <span className="hidden text-[11px] font-medium text-[var(--body)] sm:inline">
                    {job.applicant_count ?? 0} applicant{(job.applicant_count ?? 0) !== 1 ? 's' : ''}
                  </span>
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                    style={{
                      background: job.is_closed ? 'rgba(245, 158, 11, 0.1)' : job.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: job.is_closed ? 'var(--status-new)' : job.status === 'active' ? 'var(--status-approved)' : 'var(--status-rejected)',
                    }}
                  >
                    {job.is_closed ? 'Closed' : job.status}
                  </span>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--body)" strokeWidth={2} className="hidden sm:block">
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
