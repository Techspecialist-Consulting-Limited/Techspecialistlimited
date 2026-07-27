'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  fetchAnalyticsOverview,
  fetchInterviewAnalytics,
  fetchPipelineAnalytics,
  fetchTimeToHire,
  fetchTrends,
  type AnalyticsOverview,
  type InterviewAnalytics,
  type PipelineAnalytics,
  type TimeToHireAnalytics,
  type TrendData,
} from '@/lib/recruitment-api';
import { BrandedLoader } from '@/components/recruitment';

const ROLE_PURPLE = '#7c5cff';

function scoreColor(score: number): string {
  return score >= 75 ? 'var(--score-high)' : score >= 50 ? 'var(--score-mid)' : 'var(--score-low)';
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 rounded-full" style={{ background: 'var(--bg-soft)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-8 text-right text-[12px] font-semibold text-[var(--heading)]">{value}</span>
    </div>
  );
}

/** SVG line + area chart with a hover crosshair/tooltip, per dataviz's interaction guidance —
 * a chart is interactive by default, not just decorative. Straight segments (not curve-smoothed)
 * to keep the point-to-point relationship legible at a glance. */
function TrendChart({ data }: { data: { date: string; count: number }[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const W = 600;
  const H = 160;
  const PAD = 8;

  if (data.length === 0) {
    return <div className="py-10 text-center text-[13px] text-[var(--body)]">No trend data available</div>;
  }

  const max = Math.max(...data.map((d) => d.count), 1);
  const points = data.map((d, i) => ({
    x: data.length > 1 ? (i / (data.length - 1)) * (W - PAD * 2) + PAD : W / 2,
    y: H - PAD - (d.count / max) * (H - PAD * 2),
    ...d,
  }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${H} L ${points[0].x.toFixed(1)} ${H} Z`;
  const active = hoverIdx !== null ? points[hoverIdx] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--blue)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--blue)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#trendFill)" />
        <path d={linePath} fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {active && (
          <line x1={active.x} y1={0} x2={active.x} y2={H} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
        )}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoverIdx === i ? 4 : 2.5}
            fill={hoverIdx === i ? 'var(--blue)' : 'var(--bg)'}
            stroke="var(--blue)"
            strokeWidth="1.5"
          />
        ))}
        {/* Invisible hit-columns — bigger than the visual marks, per interaction guidance */}
        {points.map((p, i) => (
          <rect
            key={`hit-${i}`}
            x={i === 0 ? 0 : (points[i - 1].x + p.x) / 2}
            y={0}
            width={(i === points.length - 1 ? W : (points[Math.min(i + 1, points.length - 1)].x + p.x) / 2) - (i === 0 ? 0 : (points[i - 1].x + p.x) / 2)}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx((cur) => (cur === i ? null : cur))}
          />
        ))}
      </svg>
      {active && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-[11px] shadow-md dark:border-white/10 dark:bg-[#101827]"
          style={{ left: `${(active.x / W) * 100}%`, top: 0 }}
        >
          <div className="font-bold text-[var(--heading)]">{active.count} application{active.count !== 1 ? 's' : ''}</div>
          <div className="text-[10px] text-[var(--body)]">{new Date(active.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        </div>
      )}
    </div>
  );
}

type DonutSegment = { label: string; value: number; color: string; risk?: 'green' | 'amber' };

/** Permutes a short list to find an arrangement where the two flagged "risk" entries
 * (green/amber — the CVD-adjacent pair) aren't circular neighbors. Needed because
 * filtering out zero-value segments can collapse a safe static order (e.g. green, red,
 * amber, purple) down to just the risky pair sitting next to each other — the exact
 * case DESIGN.md's Non-Adjacent Pair Rule exists to prevent. A 2-segment ring can't
 * avoid adjacency at all (both slices always touch); the mandatory legend covers that case. */
function arrangeAvoidingRiskAdjacency(items: DonutSegment[]): DonutSegment[] {
  if (items.length <= 2) return items;
  const isBad = (arr: DonutSegment[]) =>
    arr.some((s, i) => {
      const next = arr[(i + 1) % arr.length];
      return (s.risk === 'green' && next.risk === 'amber') || (s.risk === 'amber' && next.risk === 'green');
    });
  if (!isBad(items)) return items;
  const permute = (arr: DonutSegment[]): DonutSegment[][] =>
    arr.length <= 1 ? [arr] : arr.flatMap((v, i) => permute([...arr.slice(0, i), ...arr.slice(i + 1)]).map((p) => [v, ...p]));
  return permute(items).find((p) => !isBad(p)) ?? items;
}

/** Donut with a mandatory legend (never color-only) — see DESIGN.md's Non-Adjacent Pair Rule for
 * why segment order matters here, not just which colors are used. */
function StatusDonut({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const arcSegments = arrangeAvoidingRiskAdjacency(segments.filter((s) => s.value > 0));
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-[104px] w-[104px] flex-shrink-0">
        <svg width="104" height="104" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="52" cy="52" r={r} fill="none" stroke="var(--bg-soft)" strokeWidth="12" />
          {arcSegments.map((s) => {
            const len = total > 0 ? (s.value / total) * circumference : 0;
            const seg = (
              <circle
                key={s.label}
                cx="52" cy="52" r={r} fill="none"
                stroke={s.color}
                strokeWidth="12"
                strokeDasharray={`${Math.max(0, len - 2)} ${circumference - len + 2}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            );
            offset += len;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[19px] font-extrabold text-[var(--heading)]" style={{ letterSpacing: '-0.02em' }}>{total}</span>
          <span className="text-[9px] font-medium text-[var(--body)]">Total</span>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[10.5px] text-[var(--body)]">
              <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="text-[11px] font-bold text-[var(--heading)]">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [interviews, setInterviews] = useState<InterviewAnalytics | null>(null);
  const [pipeline, setPipeline] = useState<PipelineAnalytics | null>(null);
  const [timeToHire, setTimeToHire] = useState<TimeToHireAnalytics | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAnalyticsOverview().catch(() => null),
      fetchInterviewAnalytics().catch(() => null),
      fetchPipelineAnalytics().catch(() => null),
      fetchTimeToHire().catch(() => null),
      fetchTrends().catch(() => null),
    ]).then(([o, i, p, t, tr]) => {
      setOverview(o);
      setInterviews(i);
      setPipeline(p);
      setTimeToHire(t);
      setTrends(tr);
      setLoading(false);
    });
  }, []);

  const pipelineTotals = useMemo(() => {
    if (!pipeline?.pipeline.length) return null;
    return pipeline.pipeline.reduce(
      (acc, p) => ({
        applied: acc.applied + p.total_applications,
        screened: acc.screened + p.screened,
        shortlisted: acc.shortlisted + p.shortlisted,
        interviewed: acc.interviewed + p.interviewed,
      }),
      { applied: 0, screened: 0, shortlisted: 0, interviewed: 0 },
    );
  }, [pipeline]);

  const timeToHireByJob = useMemo(() => {
    if (!timeToHire?.records.length) return [];
    const byJob = new Map<string, number[]>();
    for (const r of timeToHire.records) {
      const list = byJob.get(r.job_title) || [];
      list.push(r.days_to_review);
      byJob.set(r.job_title, list);
    }
    return Array.from(byJob.entries())
      .map(([job_title, days]) => ({ job_title, avg: days.reduce((a, b) => a + b, 0) / days.length }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 6);
  }, [timeToHire]);

  const handleExport = () => {
    if (!overview) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Applications', String(overview.total_applications)],
      ['Shortlisted', String(overview.shortlisted)],
      ['Rejected', String(overview.rejected)],
      ['Pending Review', String(overview.pending_review)],
      ['Interviews Completed', String(overview.assessment_completed)],
      ['Avg Days to Review', String(timeToHire?.average_days_to_review ?? '')],
      ['Avg Interview Score', String(interviews?.average_score ?? '')],
      ['Interview Completion Rate', `${interviews?.completion_rate ?? ''}%`],
      [],
      ['Job', 'Applications', 'Status'],
      ...overview.per_job.map((j) => [j.title, String(j.applications), j.status]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recruitment-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <BrandedLoader text="Loading analytics..." />;

  const statCards = [
    { label: 'Total Applications', value: overview?.total_applications ?? 0, color: 'var(--blue)', bg: 'rgba(69,132,237,0.1)', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
    { label: 'Shortlisted', value: overview?.shortlisted ?? 0, color: 'var(--status-approved)', bg: 'rgba(34,197,94,0.1)', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg> },
    { label: 'Pending Review', value: overview?.pending_review ?? 0, color: 'var(--status-new)', bg: 'rgba(245,158,11,0.1)', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'Rejected', value: overview?.rejected ?? 0, color: 'var(--status-rejected)', bg: 'rgba(239,68,68,0.1)', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> },
    { label: 'Interviews Completed', value: overview?.assessment_completed ?? 0, color: ROLE_PURPLE, bg: 'rgba(124,92,255,0.1)', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg> },
  ];

  // Base order keeps green and amber non-adjacent — see DESIGN.md's Non-Adjacent Pair Rule.
  // `risk` tags feed StatusDonut's dynamic reordering, which re-checks this after zero-value
  // segments are dropped (a static order alone isn't enough — see arrangeAvoidingRiskAdjacency).
  const statusSegments: DonutSegment[] = overview ? [
    { label: 'Shortlisted', value: overview.shortlisted, color: 'var(--status-approved)', risk: 'green' },
    { label: 'Rejected', value: overview.rejected, color: 'var(--status-rejected)' },
    { label: 'Pending Review', value: overview.pending_review, color: 'var(--status-new)', risk: 'amber' },
    { label: 'Interviews Completed', value: overview.assessment_completed, color: ROLE_PURPLE },
  ] : [];

  const pipelineStages = pipelineTotals ? [
    { label: 'Applied', value: pipelineTotals.applied, color: 'var(--blue)' },
    { label: 'Screened', value: pipelineTotals.screened, color: ROLE_PURPLE },
    { label: 'Shortlisted', value: pipelineTotals.shortlisted, color: 'var(--status-new)' },
    { label: 'Interviewed', value: pipelineTotals.interviewed, color: 'var(--status-approved)' },
  ] : [];

  return (
    <div>
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-[var(--heading)]" style={{ fontFamily: "'Roboto Slab', sans-serif" }}>Recruitment Analytics</h1>
          <p className="mt-1 text-[13px] text-[var(--body)]">Track key metrics and performance across your recruitment pipeline.</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-[12.5px] font-semibold text-[var(--heading)] transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)] dark:border-white/10"
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
          Export Report
        </button>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#101827]"
            style={{ animation: `cardSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s both`, boxShadow: `0 2px 12px ${card.color}14` }}
          >
            <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div className="text-[24px] font-extrabold text-[var(--heading)]" style={{ letterSpacing: '-0.02em' }}>{card.value}</div>
            <div className="mt-0.5 text-[12px] font-medium text-[var(--body)]">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Trends + Status donut */}
      <div className="mb-6 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-[var(--heading)]">Application Trends</h2>
            <span className="text-[10.5px] font-medium text-[var(--body)]">Last 30 days</span>
          </div>
          <TrendChart data={trends?.daily_applications ?? []} />
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]">
          <h2 className="mb-5 text-[14px] font-bold text-[var(--heading)]">Applications by Status</h2>
          {overview ? <StatusDonut segments={statusSegments} /> : <p className="text-[13px] text-[var(--body)]">No data available.</p>}
        </div>
      </div>

      {/* Per-job list + Pipeline overview */}
      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]">
          <h2 className="mb-5 text-[14px] font-bold text-[var(--heading)]">Applications per Job</h2>
          {overview?.per_job && overview.per_job.length > 0 ? (
            <div className="space-y-3.5">
              {overview.per_job.map((job) => (
                <div key={job.job_id}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-[12.5px] font-medium text-[var(--heading)]">{job.title}</span>
                    <span
                      className="flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold"
                      style={{
                        background: job.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                        color: job.status === 'active' ? 'var(--status-approved)' : 'var(--status-new)',
                      }}
                    >
                      {job.status}
                    </span>
                  </div>
                  <MiniBar value={job.applications} max={Math.max(...overview.per_job.map((j) => j.applications), 1)} color="var(--blue)" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[var(--body)]">No job postings yet.</p>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]">
          <h2 className="mb-5 text-[14px] font-bold text-[var(--heading)]">Recruitment Pipeline Overview</h2>
          {pipelineTotals && pipelineTotals.applied > 0 ? (
            <>
              <div className="mb-4 flex items-end justify-between gap-2">
                {pipelineStages.map((stage) => (
                  <div key={stage.label} className="flex-1 text-center">
                    <div className="text-[19px] font-extrabold text-[var(--heading)]" style={{ letterSpacing: '-0.02em' }}>{stage.value}</div>
                    <div className="mt-0.5 text-[10.5px] font-medium text-[var(--body)]">{stage.label}</div>
                  </div>
                ))}
              </div>
              <div className="relative h-2 overflow-hidden rounded-full" style={{ background: 'var(--bg-soft)' }}>
                {pipelineStages.map((stage) => (
                  <div key={stage.label} className="absolute inset-y-0 left-0 transition-all duration-500" style={{ width: `${(stage.value / pipelineTotals.applied) * 100}%`, background: stage.color }} />
                ))}
              </div>
              <div className="mt-2 flex justify-between">
                {pipelineStages.map((stage) => (
                  <span key={stage.label} className="flex-1 text-center text-[10px] font-semibold text-[var(--body)] first:text-left last:text-right">
                    {Math.round((stage.value / pipelineTotals.applied) * 100)}%
                  </span>
                ))}
              </div>
              <div className="mt-4 rounded-xl px-3.5 py-3 text-center" style={{ background: 'var(--bg-soft)' }}>
                <span className="text-[11px] text-[var(--body)]">Overall Conversion Rate </span>
                <span className="text-[13px] font-extrabold text-[var(--blue)]">
                  {pipelineTotals.applied > 0 ? Math.round((pipelineTotals.interviewed / pipelineTotals.applied) * 100) : 0}%
                </span>
              </div>
            </>
          ) : (
            <p className="text-[13px] text-[var(--body)]">No pipeline data available.</p>
          )}
        </div>
      </div>

      {/* Top performers + Time to hire */}
      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]">
          <h2 className="mb-5 text-[14px] font-bold text-[var(--heading)]">Top Performing Applicants</h2>
          {interviews?.top_performers && interviews.top_performers.length > 0 ? (
            <div className="space-y-3.5">
              {interviews.top_performers.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: `${ROLE_PURPLE}18`, color: ROLE_PURPLE }}>
                      {p.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[12.5px] font-semibold text-[var(--heading)]">{p.name}</div>
                      <div className="truncate text-[10.5px] text-[var(--body)]">{p.job_title}</div>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <div className="h-1.5 w-14 rounded-full" style={{ background: 'var(--bg-soft)' }}>
                      <div className="h-full rounded-full" style={{ width: `${p.score}%`, background: scoreColor(p.score) }} />
                    </div>
                    <span className="w-6 text-right text-[13px] font-extrabold" style={{ color: scoreColor(p.score) }}>{Math.round(p.score)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[var(--body)]">No completed interviews yet.</p>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-[var(--heading)]">Time to Hire Overview</h2>
            {timeToHire && (
              <span className="text-[11px] text-[var(--body)]">
                <span className="text-[13px] font-extrabold text-[var(--heading)]">{timeToHire.average_days_to_review.toFixed(1)}</span> days avg
              </span>
            )}
          </div>
          {timeToHireByJob.length > 0 ? (
            <div className="space-y-3.5">
              {timeToHireByJob.map((j) => (
                <div key={j.job_title}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="min-w-0 truncate text-[12.5px] font-medium text-[var(--heading)]">{j.job_title}</span>
                    <span className="flex-shrink-0 text-[11px] font-semibold text-[var(--body)]">{j.avg.toFixed(1)}d</span>
                  </div>
                  <MiniBar value={Math.round(j.avg * 10)} max={Math.max(...timeToHireByJob.map((x) => x.avg * 10), 1)} color={ROLE_PURPLE} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[var(--body)]">No time-to-hire data available.</p>
          )}
        </div>
      </div>

      {/* AI Interview Summary */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]">
        <h2 className="mb-5 text-[14px] font-bold text-[var(--heading)]">AI Interview Summary</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Invitations Sent', value: interviews?.total_sent ?? 0, color: 'var(--blue)', bg: 'rgba(69,132,237,0.1)' },
            { label: 'Completed', value: interviews?.completed ?? 0, color: 'var(--status-approved)', bg: 'rgba(34,197,94,0.1)' },
            { label: 'Completion Rate', value: `${interviews?.completion_rate ?? 0}%`, color: ROLE_PURPLE, bg: 'rgba(124,92,255,0.1)' },
            { label: 'Average Score', value: interviews?.average_score ?? 0, color: 'var(--status-new)', bg: 'rgba(245,158,11,0.1)' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl p-4 text-center" style={{ background: stat.bg }}>
              <div className="text-[22px] font-extrabold" style={{ color: stat.color, letterSpacing: '-0.02em' }}>{stat.value}</div>
              <div className="mt-1 text-[11px] font-medium text-[var(--body)]">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
