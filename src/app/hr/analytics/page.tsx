'use client';

import { useEffect, useState } from 'react';
import { BrandedLoader } from '@/components/recruitment';
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

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[12px] font-semibold text-[var(--heading)] w-8 text-right">{value}</span>
    </div>
  );
}

function FunnelStage({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-full rounded-lg text-center py-3 px-4 transition-all"
        style={{
          background: `linear-gradient(135deg, ${color}22, ${color}11)`,
          border: `1px solid ${color}33`,
          width: `${Math.max(pct * 0.8, 40)}%`,
        }}
      >
        <div className="text-[20px] font-extrabold" style={{ color }}>{value}</div>
      </div>
      <span className="text-[11px] font-medium text-[var(--body)]">{label}</span>
    </div>
  );
}

function TrendChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const height = 120;
  if (data.length === 0) return <div className="text-[13px] text-[var(--body)] text-center py-8">No trend data available</div>;
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.count / max) * height;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className="w-full rounded-t transition-all duration-300 group-hover:opacity-80"
              style={{ height: Math.max(h, 2), background: 'var(--blue)' }}
            />
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-[var(--body)] whitespace-nowrap">
              {d.count}
            </div>
            {data.length <= 14 && (
              <span className="text-[8px] text-[var(--body)] truncate max-w-[40px] text-center">
                {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        );
      })}
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

  if (loading) return <BrandedLoader text="Loading analytics..." />;

  const statCards = [
    { label: 'Total Applications', value: overview?.total_applications ?? 0, color: 'var(--blue)' },
    { label: 'Shortlisted', value: overview?.shortlisted ?? 0, color: 'var(--status-approved)' },
    { label: 'Rejected', value: overview?.rejected ?? 0, color: 'var(--status-rejected)' },
    { label: 'Pending Review', value: overview?.pending_review ?? 0, color: 'var(--status-new)' },
    { label: 'Interviews Completed', value: overview?.assessment_completed ?? 0, color: 'var(--status-completed)' },
    { label: 'Avg Days to Review', value: timeToHire?.average_days_to_review ?? 0, color: 'var(--orange)', suffix: ' days' },
    { label: 'Avg Interview Score', value: interviews?.average_score ?? 0, color: 'var(--score-high)' },
    { label: 'Completion Rate', value: interviews?.completion_rate ?? 0, color: 'var(--score-mid)', suffix: '%' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-syne text-[28px] font-extrabold text-[var(--heading)]">Recruitment Analytics</h1>
        <p className="mt-1 text-[14px] text-[var(--body)]">Key metrics and performance indicators</p>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 dark:border-white/10 dark:bg-[#101827]"
          >
            <div className="absolute left-0 top-0 h-full w-[3px] rounded-r" style={{ background: card.color, opacity: 0.3 }} />
            <div className="text-[24px] font-extrabold text-[var(--heading)]" style={{ letterSpacing: '-0.02em' }}>
              {typeof card.value === 'number' ? (card.value % 1 === 0 ? card.value : card.value.toFixed(1)) : card.value}
              {card.suffix || ''}
            </div>
            <div className="mt-1 text-[12px] font-medium text-[var(--body)]">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Applications per job */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]">
          <h2 className="mb-5 text-[15px] font-bold text-[var(--heading)]">Applications per Job</h2>
          {overview?.per_job && overview.per_job.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">
                <span>Position</span>
                <span>Applications</span>
              </div>
              {overview.per_job.map((job) => (
                <div key={job.job_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-[13px] font-medium text-[var(--heading)] truncate">{job.title}</span>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold"
                      style={{
                        background: job.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                        color: job.status === 'active' ? 'var(--status-approved)' : 'var(--status-new)',
                      }}
                    >
                      {job.status}
                    </span>
                  </div>
                  <MiniBar value={job.applications} max={Math.max(...overview.per_job.map(j => j.applications), 1)} color="var(--blue)" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[var(--body)]">No job postings yet.</p>
          )}
        </div>

        {/* Pipeline funnel */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]">
          <h2 className="mb-5 text-[15px] font-bold text-[var(--heading)]">Recruitment Pipeline</h2>
          {pipeline?.pipeline && pipeline.pipeline.length > 0 ? (
            <div className="space-y-6">
              {pipeline.pipeline.slice(0, 5).map((job) => (
                <div key={job.job_id}>
                  <div className="mb-3 text-[12px] font-semibold text-[var(--heading)]">{job.title}</div>
                  <div className="space-y-2">
                    <FunnelStage
                      label="Total"
                      value={job.total_applications}
                      max={job.total_applications}
                      color="var(--blue)"
                    />
                    <FunnelStage
                      label="Screened"
                      value={job.screened}
                      max={job.total_applications}
                      color="var(--status-completed)"
                    />
                    <FunnelStage
                      label="Shortlisted"
                      value={job.shortlisted}
                      max={job.total_applications}
                      color="var(--status-approved)"
                    />
                    <FunnelStage
                      label="Interviewed"
                      value={job.interviewed}
                      max={job.total_applications}
                      color="var(--score-high)"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[var(--body)]">No pipeline data available.</p>
          )}
        </div>
      </div>

      {/* Trend chart */}
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[var(--heading)]">Application Trends</h2>
          <span className="text-[10px] text-[var(--body)]">Last 30 days</span>
        </div>
        {trends?.daily_applications && trends.daily_applications.length > 0 ? (
          <TrendChart data={trends.daily_applications} />
        ) : (
          <p className="text-[13px] text-[var(--body)] text-center py-8">No trend data available</p>
        )}
      </div>

      {/* Top performers + Time to hire */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Top performers */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]">
          <h2 className="mb-5 text-[15px] font-bold text-[var(--heading)]">Top Performing Applicants</h2>
          {interviews?.top_performers && interviews.top_performers.length > 0 ? (
            <div className="space-y-3">
              {interviews.top_performers.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-bold text-[var(--body)] w-5">#{i + 1}</span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-[var(--heading)] truncate">{p.name}</div>
                      <div className="text-[10px] text-[var(--body)] truncate">{p.job_title}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="text-[14px] font-extrabold"
                      style={{
                        color: p.score >= 75 ? 'var(--score-high)' : p.score >= 50 ? 'var(--score-mid)' : 'var(--score-low)',
                      }}
                    >
                      {Math.round(p.score)}
                    </div>
                    <div className="w-16 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${p.score}%`,
                          background: p.score >= 75 ? 'var(--score-high)' : p.score >= 50 ? 'var(--score-mid)' : 'var(--score-low)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[var(--body)]">No completed interviews yet.</p>
          )}
        </div>

        {/* Time to hire */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]">
          <h2 className="mb-5 text-[15px] font-bold text-[var(--heading)]">Time-to-Hire Overview</h2>
          {timeToHire?.records && timeToHire.records.length > 0 ? (
            <div className="space-y-3">
              {timeToHire.records.slice(0, 10).map((r) => (
                <div key={r.application_id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-[var(--heading)] truncate">{r.candidate_name}</div>
                    <div className="text-[10px] text-[var(--body)] truncate">{r.job_title}</div>
                  </div>
                  <span className="text-[12px] font-semibold text-[var(--body)] whitespace-nowrap">
                    {r.days_to_review}d
                  </span>
                </div>
              ))}
              {timeToHire.records.length > 10 && (
                <p className="text-[11px] text-[var(--body)] text-center pt-2">
                  +{timeToHire.records.length - 10} more records
                </p>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-[var(--body)]">No time-to-hire data available.</p>
          )}
        </div>
      </div>

      {/* Interview analytics summary */}
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]">
        <h2 className="mb-5 text-[15px] font-bold text-[var(--heading)]">AI Interview Summary</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Invitations Sent', value: interviews?.total_sent ?? 0, color: 'var(--blue)' },
            { label: 'Completed', value: interviews?.completed ?? 0, color: 'var(--status-approved)' },
            { label: 'Completion Rate', value: `${interviews?.completion_rate ?? 0}%`, color: 'var(--score-high)' },
            { label: 'Average Score', value: interviews?.average_score ?? 0, color: 'var(--score-mid)' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-[var(--border)] p-4 text-center dark:border-white/10">
              <div className="text-[22px] font-extrabold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="mt-1 text-[11px] font-medium text-[var(--body)]">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
