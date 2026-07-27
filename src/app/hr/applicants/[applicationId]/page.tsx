'use client';

import { startTransition, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  fetchApplicantDetail, reviewApplication, resendAssessment, deleteApplication, fetchAuditLogs,
  fetchInterviewsByApplication, fetchScorecardsByApplication, fetchDocumentUrl,
  type ApplicantDetail, type ResendResponse, type AuditLogEntry, type Interview, type Scorecard,
} from '@/lib/recruitment-api';
import { ScoreCircle, ScoreBar, TranscriptViewer, BrandedLoader, ConfirmDialog, ScheduleInterviewModal, ScorecardPanel } from '@/components/recruitment';

const ROLE_PURPLE = '#7c5cff';

const EXPIRATION_OPTIONS = [
  { label: '3 days', value: 3 },
  { label: '5 days', value: 5 },
  { label: '1 week', value: 7 },
  { label: '2 weeks', value: 14 },
  { label: 'Custom (30 days)', value: 30 },
];

function scoreColor(score: number): string {
  return score >= 75 ? 'var(--score-high)' : score >= 50 ? 'var(--score-mid)' : 'var(--score-low)';
}

function CheckIcon({ color = 'currentColor', size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function WarningIcon({ color = 'currentColor', size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  );
}

/** A compact score gauge for the sidebar's Assessments Overview — falls back to a dashed
 * "not yet" ring rather than a fabricated 0, since no-data and a-real-zero mean different things. */
function MiniRing({ value, label, sublabel, highlight }: { value: number | null; label: string; sublabel?: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-xl p-3 text-center" style={{ background: highlight ? 'rgba(124,92,255,0.06)' : 'var(--bg-soft)' }}>
      {value === null ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed" style={{ borderColor: 'var(--border)' }}>
          <span className="text-[13px] font-bold text-[var(--body)]">—</span>
        </div>
      ) : (
        <ScoreCircle score={value} size={56} strokeWidth={5} showLabel={false} />
      )}
      <div className="mt-2 text-[10.5px] font-semibold text-[var(--heading)]">{label}</div>
      <div className="text-[9px] text-[var(--body)]">{sublabel || 'Not yet available'}</div>
    </div>
  );
}

function auditVisual(action: string): { bg: string; color: string; icon: React.ReactNode } {
  if (action.startsWith('interview')) {
    return { bg: 'rgba(69,132,237,0.1)', color: 'var(--blue)', icon: <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75" /></svg> };
  }
  if (action.includes('approved') || action === 'assessment_approved') {
    return { bg: 'rgba(34,197,94,0.1)', color: 'var(--status-approved)', icon: <CheckIcon color="var(--status-approved)" size={12} /> };
  }
  if (action === 'rejected') {
    return { bg: 'rgba(239,68,68,0.1)', color: 'var(--status-rejected)', icon: <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> };
  }
  if (action === 'assessment_resent' || action === 'manually_added_for_interview') {
    return { bg: 'rgba(245,158,11,0.1)', color: 'var(--status-new)', icon: <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg> };
  }
  if (action === 'application_cleared') {
    return { bg: 'rgba(239,68,68,0.1)', color: 'var(--status-rejected)', icon: <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg> };
  }
  return { bg: 'rgba(124,92,255,0.1)', color: ROLE_PURPLE, icon: <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg> };
}

export default function ApplicantDetailPage() {
  const { applicationId } = useParams();
  const router = useRouter();
  const [applicant, setApplicant] = useState<ApplicantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'hire' | 'resend' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [expirationDays, setExpirationDays] = useState(7);
  const [resendResult, setResendResult] = useState<ResendResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [cvLoading, setCvLoading] = useState(false);

  useEffect(() => {
    if (!applicationId || Array.isArray(applicationId)) return;
    startTransition(async () => {
      try {
        const data = await fetchApplicantDetail(applicationId);
        setApplicant(data);
        fetchAuditLogs(applicationId).then(setAuditLogs).catch(() => {});
        fetchInterviewsByApplication(applicationId).then(setInterviews).catch(() => {});
        fetchScorecardsByApplication(applicationId).then(setScorecards).catch(() => {});
      } catch { /* empty */ }
      setLoading(false);
    });
  }, [applicationId]);

  const handleReview = async () => {
    if (!confirmAction || !applicant) return;
    setActionLoading(true);
    try {
      if (confirmAction === 'resend') {
        const result = await resendAssessment(applicant.id, expirationDays);
        setResendResult(result);
        const data = await fetchApplicantDetail(applicant.id);
        setApplicant(data);
      } else {
        await reviewApplication(applicant.id, confirmAction, expirationDays);
        const data = await fetchApplicantDetail(applicant.id);
        setApplicant(data);
      }
    } catch { /* empty */ }
    setActionLoading(false);
    setConfirmAction(null);
  };

  const handleDelete = async () => {
    if (!applicant) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteApplication(applicant.id);
      router.push(`/hr/jobs/${applicant.job_id}/applicants`);
    } catch {
      setDeleteError('Failed to delete application. Please try again.');
      setDeleteLoading(false);
    }
  };

  const handleViewCv = async () => {
    if (!applicant) return;
    setCvLoading(true);
    try {
      const url = await fetchDocumentUrl(applicant.id);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    } catch { /* empty */ }
    setCvLoading(false);
  };

  const handleInterviewScheduled = async () => {
    if (!applicant) return;
    const data = await fetchApplicantDetail(applicant.id);
    setApplicant(data);
    fetchInterviewsByApplication(applicant.id).then(setInterviews).catch(() => {});
    setShowScheduleModal(false);
  };

  if (loading) return <BrandedLoader text="Loading applicant details..." />;

  if (!applicant) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--bg-soft)' }}>
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="var(--body)" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
          </div>
          <h2 className="mb-2 text-lg font-bold text-[var(--heading)]">Applicant Not Found</h2>
          <p className="mb-6 text-sm text-[var(--body)]">This applicant could not be found or may have been removed.</p>
          <Link href="/hr/applicants" className="text-sm font-semibold text-[var(--blue)] hover:underline">Back to Applicants</Link>
        </div>
      </div>
    );
  }

  const sr = applicant.screening_result;
  // A candidate can retry stage 2 (e.g. after a terminated session gets a fresh invite),
  // producing multiple stage_results rows — the most recently created one is the real outcome.
  const stageTwoResults = applicant.stage_results?.filter((s) => s.stage_number === 2) ?? [];
  const stageTwoResult = stageTwoResults.length > 0
    ? [...stageTwoResults].sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())[0]
    : undefined;
  // The transcript can live on the live ConversationSession (in-progress/most recent interview)
  // or, for a terminated/retried session, only as a JSON snapshot on the StageResult itself.
  type TranscriptMessage = { role: 'ai' | 'candidate'; content: string; topic_label?: string };
  let transcriptMessages: TranscriptMessage[] = [];
  if (applicant.conversation_session && applicant.conversation_session.conversation_history.length > 0) {
    transcriptMessages = applicant.conversation_session.conversation_history.map((m) => ({
      role: m.role === 'ai' ? 'ai' : 'candidate',
      content: m.content,
      topic_label: m.topic_label,
    }));
  } else if (stageTwoResult?.transcript) {
    try {
      const parsed = JSON.parse(stageTwoResult.transcript) as { role: string; content: string; topic_label?: string }[];
      transcriptMessages = parsed.map((m) => ({ role: m.role === 'ai' ? 'ai' : 'candidate', content: m.content, topic_label: m.topic_label }));
    } catch { /* malformed/legacy transcript snapshot — fall back to no transcript */ }
  }
  const hasAssessment = transcriptMessages.length > 0;
  const latestInterview = interviews[0];
  const addedByHr = !sr && applicant.stage >= 2;

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isAssessmentExpired = applicant.assessment_expires_at
    ? new Date(applicant.assessment_expires_at) < new Date()
    : false;

  const combinedScore = sr && stageTwoResult ? Math.round((sr.overall_score + stageTwoResult.score) / 2) : null;
  const teamAvg = scorecards.length > 0
    ? Math.round((scorecards.reduce((sum, s) => sum + (s.communication_score + s.technical_score + s.culture_fit_score + s.problem_solving_score) / 4, 0) / scorecards.length) * 20)
    : null;
  const heroScore = combinedScore ?? stageTwoResult?.score ?? sr?.overall_score ?? null;
  const heroScoreLabel = combinedScore !== null ? 'Combined Score' : stageTwoResult ? 'Interview Score' : sr ? 'Screening Score' : '';

  const decisionDone = applicant.status === 'hired' || applicant.status === 'rejected';
  const decisionLabel = applicant.status === 'rejected' ? 'Rejected' : applicant.status === 'hired' ? 'Hired' : 'Decision';
  const decisionColor = applicant.status === 'rejected' ? 'var(--status-rejected)' : 'var(--status-approved)';
  const pipelineSteps = [
    { key: 'submitted', label: 'Submitted', done: true, rejected: false, color: 'var(--status-approved)' },
    { key: 'reviewed', label: 'Reviewed', done: !!sr, rejected: false, color: 'var(--status-approved)' },
    { key: 'interview', label: 'Interview', done: applicant.stage >= 2, rejected: false, color: 'var(--status-approved)' },
    { key: 'decision', label: decisionLabel, done: decisionDone, rejected: applicant.status === 'rejected', color: decisionColor },
  ];
  const doneCount = pipelineSteps.filter((s) => s.done).length;
  const progressPct = ((doneCount - 1) / (pipelineSteps.length - 1)) * 100;

  const initials = applicant.candidate_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const timelineEvents = [
    { label: 'Application Submitted', date: applicant.created_at, done: !!applicant.created_at, icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
    { label: 'CV Reviewed', date: sr?.created_at || applicant.created_at, done: !!sr, icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg> },
    { label: 'Assessment Sent', date: applicant.assessment_sent_at, done: !!applicant.assessment_sent_at, icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg> },
    { label: 'Assessment Completed', date: stageTwoResult?.created_at, done: !!stageTwoResult, icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg> },
    { label: 'Interview Scheduled', date: latestInterview?.created_at, done: !!latestInterview, icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75" /></svg> },
    { label: 'Final Decision', date: decisionDone ? applicant.updated_at || applicant.created_at : null, done: decisionDone, icon: <CheckIcon size={16} /> },
  ];

  return (
    <div>
      {/* Back button */}
      <Link
        href="/hr/applicants"
        className="mb-5 inline-flex items-center gap-2 text-[13px] font-medium text-[var(--body)] transition-colors hover:text-[var(--blue)]"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Applicants
      </Link>

      {/* Hero header */}
      <div className="relative mb-8 overflow-hidden rounded-3xl p-7 lg:p-9" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #3c2a8f 45%, #6d3fd6 75%, #7c5cff 100%)' }}>
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.16), transparent 70%)' }} />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(69,132,237,0.28), transparent 70%)' }} />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div
              className="flex h-[68px] w-[68px] flex-shrink-0 items-center justify-center rounded-full text-[22px] font-bold text-white"
              style={{ background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(6px)', boxShadow: '0 0 0 4px rgba(255,255,255,0.18)' }}
            >
              {initials}
            </div>
            <div>
              <h1 className="text-[24px] font-extrabold text-white" style={{ fontFamily: "'Roboto Slab', sans-serif" }}>{applicant.candidate_name}</h1>
              <p className="mt-1 text-[13.5px] text-white/70">{applicant.candidate_email}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">{applicant.job_title}</span>
                {addedByHr && <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">Added by HR</span>}
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">Stage {applicant.stage}</span>
              </div>
            </div>
          </div>
          {heroScore !== null ? (
            <div className="flex-shrink-0 self-start sm:self-center">
              <ScoreCircle score={heroScore} size={76} strokeWidth={5} trackColor="rgba(255,255,255,0.22)" labelColor="rgba(255,255,255,0.75)" label={heroScoreLabel} />
            </div>
          ) : (
            <div className="flex-shrink-0 self-start rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-center backdrop-blur-md sm:self-center">
              <div className="text-[12px] font-semibold text-white">Awaiting Screening</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-8 lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] dark:border-white/10 dark:bg-[#101827]">
            <div className="border-b border-[var(--border)] px-6 py-4 dark:border-white/10">
              <h2 className="text-[15px] font-bold text-[var(--heading)]">Key Information</h2>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Name</div>
                    <div className="mt-1 text-[14px] font-medium text-[var(--heading)]">{applicant.candidate_name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Email</div>
                    <div className="mt-1 break-all text-[14px] font-medium text-[var(--heading)]">{applicant.candidate_email}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Position</div>
                    <div className="mt-1 text-[14px] font-medium text-[var(--heading)]">{applicant.job_title}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Applied</div>
                    <div className="mt-1 text-[14px] font-medium text-[var(--heading)]">{formatDate(applicant.created_at)}</div>
                  </div>
                </div>
                {applicant.cv_url && (
                  <div className="border-t border-[var(--border)] px-6 py-4 dark:border-white/10">
                    <button
                      onClick={handleViewCv}
                      disabled={cvLoading}
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-[12.5px] font-semibold text-[var(--heading)] transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)] disabled:opacity-50 dark:border-white/10"
                    >
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                      {cvLoading ? 'Loading…' : 'View CV'}
                    </button>
                  </div>
                )}
              </div>

              {!sr && !stageTwoResult && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-8 text-center dark:border-white/10 dark:bg-[#101827]">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'rgba(245,158,11,0.1)' }}>
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="var(--status-new)" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h3 className="mb-2 text-[15px] font-bold text-[var(--heading)]">Pending Review</h3>
                  <p className="text-[13px] text-[var(--body)]">This application is awaiting AI screening. Results will appear here once processed.</p>
                </div>
              )}

              {sr && (
                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] dark:border-white/10 dark:bg-[#101827]">
                  <div className="border-b border-[var(--border)] px-6 py-4 dark:border-white/10">
                    <h2 className="text-[15px] font-bold text-[var(--heading)]">AI Screening Results</h2>
                  </div>
                  <div className="p-6">
                    <div className="mb-6 flex items-center gap-5">
                      <ScoreCircle score={sr.overall_score} size={80} strokeWidth={6} />
                      <div>
                        <div className="text-[13px] font-semibold text-[var(--heading)]">Overall Score</div>
                        <div className="text-[11px] text-[var(--body)]">Based on AI analysis of CV and cover letter</div>
                      </div>
                    </div>
                    <div className="grid items-start gap-4 sm:grid-cols-3">
                      {sr.strengths && (
                        <div className="rounded-xl border border-[rgba(34,197,94,0.15)] bg-[rgba(34,197,94,0.03)] p-5">
                          <div className="mb-1 text-[13px] font-bold text-[var(--score-high)]">Strengths</div>
                          <div className="mt-2 whitespace-pre-line text-[12px] leading-relaxed text-[var(--body)]">{sr.strengths}</div>
                        </div>
                      )}
                      {sr.concerns && (
                        <div className="rounded-xl border border-[rgba(239,68,68,0.15)] bg-[rgba(239,68,68,0.03)] p-5">
                          <div className="mb-1 text-[13px] font-bold text-[var(--score-low)]">Concerns</div>
                          <div className="mt-2 whitespace-pre-line text-[12px] leading-relaxed text-[var(--body)]">{sr.concerns}</div>
                        </div>
                      )}
                      {sr.evidence && (
                        <div className="rounded-xl border border-[rgba(69,132,237,0.15)] bg-[rgba(69,132,237,0.03)] p-5">
                          <div className="mb-1 text-[13px] font-bold text-[var(--blue)]">Evidence</div>
                          <div className="mt-2 whitespace-pre-line text-[12px] leading-relaxed text-[var(--body)]">{sr.evidence}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {stageTwoResult && (
                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] dark:border-white/10 dark:bg-[#101827]">
                  <div className="border-b border-[var(--border)] px-6 py-4 dark:border-white/10">
                    <h2 className="text-[15px] font-bold text-[var(--heading)]">Detailed Competency Scores</h2>
                  </div>
                  <div className="p-6">
                    {stageTwoResult.ai_feedback?.communication_skills !== undefined && (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {[
                          { label: 'Communication', value: stageTwoResult.ai_feedback.communication_skills ?? 0 },
                          { label: 'Technical Competency', value: stageTwoResult.ai_feedback.technical_competency ?? 0 },
                          { label: 'Confidence & Professionalism', value: stageTwoResult.ai_feedback.confidence_professionalism ?? 0 },
                          { label: 'Problem Solving', value: stageTwoResult.ai_feedback.problem_solving ?? 0 },
                          { label: 'Relevance of Responses', value: stageTwoResult.ai_feedback.relevance_of_responses ?? 0 },
                        ].map((dim) => (
                          <div key={dim.label} className="rounded-xl border border-[var(--border)] p-4 dark:border-white/10">
                            <div className="mb-2 flex items-center justify-between">
                              <span style={{ color: scoreColor(dim.value) }}>{dim.value >= 50 ? <CheckIcon color={scoreColor(dim.value)} /> : <WarningIcon color={scoreColor(dim.value)} />}</span>
                              <span className="text-[17px] font-extrabold" style={{ color: scoreColor(dim.value) }}>{Math.round(dim.value)}<span className="text-[11px] font-medium text-[var(--body)]">/100</span></span>
                            </div>
                            <div className="mb-1.5 h-1.5 rounded-full" style={{ background: 'var(--bg-soft)' }}>
                              <div className="h-full rounded-full" style={{ width: `${dim.value}%`, background: scoreColor(dim.value) }} />
                            </div>
                            <div className="text-[10.5px] font-medium leading-tight text-[var(--body)]">{dim.label}</div>
                          </div>
                        ))}
                        <div className="flex flex-col items-center justify-center rounded-xl p-4 text-center" style={{ background: 'rgba(124,92,255,0.06)' }}>
                          <ScoreCircle score={stageTwoResult.score} size={56} strokeWidth={5} showLabel={false} />
                          <div className="mt-2 text-[10.5px] font-bold text-[var(--heading)]">Interview Score</div>
                          <div className="text-[9px] text-[var(--body)]">Combined competencies</div>
                        </div>
                      </div>
                    )}

                    {stageTwoResult.ai_feedback?.per_topic_scores && stageTwoResult.ai_feedback.per_topic_scores.length > 0 && (
                      <div className="mt-6">
                        <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Topic Scores</h3>
                        <div className="space-y-4">
                          {stageTwoResult.ai_feedback.per_topic_scores.map((ts) => (
                            <div key={ts.topic}>
                              <ScoreBar label={ts.topic} score={ts.score} />
                              {ts.summary && <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--body)]">{ts.summary}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] p-5 dark:border-white/10">
                      <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">AI Recommendation</div>
                      {stageTwoResult.ai_feedback?.overall_recommendation && (
                        <div
                          className="text-[14px] font-semibold capitalize"
                          style={{
                            color: stageTwoResult.ai_feedback.overall_recommendation === 'highly_recommended' ? 'var(--score-high)' :
                                   stageTwoResult.ai_feedback.overall_recommendation === 'recommended' ? 'var(--blue)' :
                                   stageTwoResult.ai_feedback.overall_recommendation === 'consider' ? 'var(--score-mid)' : 'var(--score-low)',
                          }}
                        >
                          {stageTwoResult.ai_feedback.overall_recommendation.replace(/_/g, ' ')}
                        </div>
                      )}
                      {(stageTwoResult.ai_feedback?.interview_summary || stageTwoResult.ai_feedback?.feedback) && (
                        <div className="mt-2 text-[12px] leading-relaxed text-[var(--body)]">
                          {stageTwoResult.ai_feedback.interview_summary || stageTwoResult.ai_feedback.feedback}
                        </div>
                      )}
                      {stageTwoResult.ai_feedback?.key_strengths && stageTwoResult.ai_feedback.key_strengths.length > 0 && (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div>
                            <div className="mb-2 text-[11px] font-bold text-[var(--score-high)]">Key Strengths</div>
                            <ul className="space-y-1.5">
                              {stageTwoResult.ai_feedback.key_strengths.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--body)]">
                                  <span className="mt-0.5 flex-shrink-0"><CheckIcon color="var(--score-high)" /></span>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          {stageTwoResult.ai_feedback.areas_for_improvement && stageTwoResult.ai_feedback.areas_for_improvement.length > 0 && (
                            <div>
                              <div className="mb-2 text-[11px] font-bold text-[var(--score-low)]">Areas for Improvement</div>
                              <ul className="space-y-1.5">
                                {stageTwoResult.ai_feedback.areas_for_improvement.map((w, i) => (
                                  <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--body)]">
                                    <span className="mt-0.5 flex-shrink-0"><WarningIcon color="var(--score-low)" /></span>
                                    {w}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {hasAssessment && (
                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] dark:border-white/10 dark:bg-[#101827]">
                  <div className="border-b border-[var(--border)] px-6 py-4 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <h2 className="text-[15px] font-bold text-[var(--heading)]">Interview Transcript</h2>
                      <span className="rounded-md bg-[rgba(69,132,237,0.08)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--blue)]">
                        {transcriptMessages.length} messages
                      </span>
                    </div>
                  </div>
                  <TranscriptViewer messages={transcriptMessages} maxHeight={440} />
                </div>
              )}

              {applicant.stage >= 2 && <ScorecardPanel applicationId={applicant.id} />}

              <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] dark:border-white/10 dark:bg-[#101827]">
                <div className="border-b border-[var(--border)] px-6 py-4 dark:border-white/10">
                  <h2 className="text-[15px] font-bold text-[var(--heading)]">Recruitment Timeline</h2>
                </div>
                <div className="p-6">
                  <div className="relative flex items-start gap-4 overflow-x-auto pb-2">
                    {timelineEvents.map((event, i) => (
                      <div key={i} className="flex flex-shrink-0 flex-col items-center" style={{ minWidth: '120px' }}>
                        <div className="flex items-center">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full"
                            style={{
                              background: event.done ? 'rgba(34,197,94,0.1)' : 'var(--bg-soft)',
                              color: event.done ? 'var(--score-high)' : 'var(--body)',
                              border: event.done ? '2px solid var(--score-high)' : '2px solid var(--border)',
                            }}
                          >
                            {event.icon}
                          </div>
                          {i < timelineEvents.length - 1 && <div className="h-[2px] w-8" style={{ background: event.done ? 'var(--score-high)' : 'var(--border)' }} />}
                        </div>
                        <div className="mt-2 text-center">
                          <div className="text-[11px] font-medium text-[var(--heading)]">{event.label}</div>
                          <div className="mt-0.5 text-[9px] text-[var(--body)]">
                            {event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Pending'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {auditLogs.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] dark:border-white/10 dark:bg-[#101827]">
                  <div className="border-b border-[var(--border)] px-6 py-4 dark:border-white/10">
                    <h2 className="text-[15px] font-bold text-[var(--heading)]">Audit Timeline</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-0">
                      {auditLogs.map((log, i) => {
                        const v = auditVisual(log.action);
                        return (
                          <div key={log.id} className="relative flex gap-4 pb-6 last:pb-0">
                            {i < auditLogs.length - 1 && <div className="absolute left-[11px] top-[28px] h-full w-px" style={{ background: 'var(--border)' }} />}
                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full" style={{ background: v.bg, color: v.color }}>
                              {v.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[12px] font-semibold capitalize text-[var(--heading)]">{log.action.replace(/_/g, ' ')}</span>
                                {log.created_at && (
                                  <span className="text-[10px] text-[var(--body)]">
                                    {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                              {log.detail && <div className="mt-0.5 text-[11px] text-[var(--body)]">{log.detail}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
        </div>

        {/* Persistent sidebar */}
        <div className="space-y-5 lg:col-span-1">
          {/* Recruitment Pipeline */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]">
            <h3 className="mb-5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Recruitment Pipeline</h3>
            <div className="relative flex items-start justify-between">
              <div className="absolute left-4 right-4 top-4 h-[2px]" style={{ background: 'var(--border)' }} />
              <div className="absolute left-4 top-4 h-[2px] transition-all duration-500" style={{ width: `calc(${progressPct}% * (100% - 32px) / 100%)`, background: 'var(--status-approved)' }} />
              {pipelineSteps.map((step) => (
                <div key={step.key} className="relative z-10 flex flex-col items-center gap-2" style={{ width: `${100 / pipelineSteps.length}%` }}>
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{
                      background: step.done ? step.color : 'var(--bg)',
                      border: `2px solid ${step.done ? step.color : 'var(--border)'}`,
                    }}
                  >
                    {step.done ? (
                      step.rejected ? (
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      ) : (
                        <CheckIcon color="white" />
                      )
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--border)' }} />
                    )}
                  </div>
                  <span className="text-center text-[10px] font-semibold leading-tight" style={{ color: step.done ? 'var(--heading)' : 'var(--body)' }}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assessments Overview */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]">
            <h3 className="mb-5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Assessments Overview</h3>
            <div className="grid grid-cols-2 gap-3">
              <MiniRing value={sr?.overall_score ?? null} label="Stage 1" sublabel="CV Screening" />
              <MiniRing value={stageTwoResult?.score ?? null} label="Stage 2" sublabel="AI Interview" />
              <MiniRing value={teamAvg} label="Team Review" sublabel={scorecards.length ? `${scorecards.length} scorecard${scorecards.length > 1 ? 's' : ''}` : 'No reviews yet'} />
              <MiniRing value={combinedScore} label="Combined" sublabel="All stages" highlight />
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]" style={{ boxShadow: 'var(--shadow-md)' }}>
            <h3 className="mb-5 text-[15px] font-bold text-[var(--heading)]">Actions</h3>
            <div className="mb-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Assessment Link Expiry</label>
              <select
                value={expirationDays}
                onChange={(e) => setExpirationDays(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-[11px] text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
              >
                {EXPIRATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setConfirmAction('approve')}
              disabled={applicant.status === 'approved' || (!sr && applicant.status === 'pending')}
              className="mb-3 w-full rounded-xl px-5 py-3 text-[13px] font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              style={{ background: 'var(--status-approved)' }}
            >
              Approve &amp; Send Assessment
            </button>

            <button
              onClick={() => setConfirmAction('reject')}
              disabled={applicant.status === 'rejected'}
              className="w-full rounded-xl px-5 py-3 text-[13px] font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              style={{ background: '#1e1b4b' }}
            >
              Reject Candidate
            </button>
          </div>

          {/* Interview scheduling */}
          {(applicant.status === 'approved' || applicant.status === 'interview_scheduled' || applicant.stage >= 2) && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]" style={{ boxShadow: 'var(--shadow-md)' }}>
              <h3 className="mb-5 text-[15px] font-bold text-[var(--heading)]">Interview</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Schedule</div>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="mt-2 w-full rounded-xl border border-[var(--blue)] px-5 py-2.5 text-[13px] font-bold text-[var(--blue)] transition-all hover:bg-[var(--blue)] hover:text-white"
                  >
                    Schedule Interview
                  </button>
                </div>
                {latestInterview && (
                  <div className="rounded-xl bg-[rgba(16,185,129,0.06)] px-4 py-3">
                    <div className="mb-2 flex items-center gap-2">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                      <span className="text-[12px] font-semibold capitalize text-green-600">{latestInterview.status} · {latestInterview.interview_type}</span>
                    </div>
                    <div className="space-y-0.5 text-[11px] text-[var(--body)]">
                      <div>{latestInterview.scheduled_date} at {latestInterview.scheduled_time} ({latestInterview.duration_minutes}min)</div>
                      {latestInterview.location && <div>Location: {latestInterview.location}</div>}
                      {latestInterview.meeting_link && (
                        <div>Link: <a href={latestInterview.meeting_link} target="_blank" rel="noopener noreferrer" className="break-all text-[var(--blue)] hover:underline">{latestInterview.meeting_link}</a></div>
                      )}
                      {latestInterview.interviewer_name && <div>Interviewer: {latestInterview.interviewer_name}</div>}
                    </div>
                  </div>
                )}
                {applicant.status !== 'hired' && applicant.status !== 'rejected' && (
                  <button
                    onClick={() => setConfirmAction('hire')}
                    className="w-full rounded-xl px-5 py-3 text-[13px] font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
                    style={{ background: 'var(--status-approved)' }}
                  >
                    Mark as Hired
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Assessment status */}
          {applicant.assessment_token && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]" style={{ boxShadow: 'var(--shadow-md)' }}>
              <h3 className="mb-5 text-[15px] font-bold text-[var(--heading)]">Assessment Status</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Status</div>
                  <div className="mt-1 flex items-center gap-2">
                    {isAssessmentExpired ? (
                      <>
                        <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-[13px] font-medium text-red-500">Expired</span>
                      </>
                    ) : applicant.status === 'assessment_completed' ? (
                      <>
                        <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-[13px] font-medium text-green-500">Completed</span>
                      </>
                    ) : (
                      <>
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-[13px] font-medium text-amber-500">Sent · Awaiting Response</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Sent</div>
                  <div className="mt-1 text-[13px] font-medium text-[var(--heading)]">{formatDate(applicant.assessment_sent_at)}</div>
                </div>
                {applicant.assessment_expires_at && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Deadline</div>
                    <div className={`mt-1 text-[13px] font-medium ${isAssessmentExpired ? 'text-red-500' : 'text-[var(--heading)]'}`}>
                      {formatDate(applicant.assessment_expires_at)}
                      {isAssessmentExpired && <span className="ml-1">(Expired)</span>}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Assessment Link</div>
                  <div className="mt-1">
                    <a
                      href={`/assessment/${applicant.assessment_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-[12px] font-medium text-[var(--blue)] hover:underline"
                    >
                      View Assessment
                    </a>
                  </div>
                </div>

                {!isAssessmentExpired && applicant.status !== 'assessment_completed' && (
                  <button
                    onClick={() => setConfirmAction('resend')}
                    disabled={actionLoading}
                    className="w-full rounded-xl border border-[var(--blue)] px-5 py-2.5 text-[13px] font-bold text-[var(--blue)] transition-all hover:bg-[var(--blue)] hover:text-white"
                  >
                    Resend Invitation
                  </button>
                )}
                {(isAssessmentExpired || applicant.status === 'assessment_completed') && (
                  <button
                    onClick={() => { setExpirationDays(7); setConfirmAction('resend'); }}
                    disabled={actionLoading}
                    className="w-full rounded-xl border border-[var(--blue)] px-5 py-2.5 text-[13px] font-bold text-[var(--blue)] transition-all hover:bg-[var(--blue)] hover:text-white"
                  >
                    Send New Invitation
                  </button>
                )}
              </div>
            </div>
          )}

          {resendResult && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-800/30 dark:bg-green-900/10">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0"><CheckIcon color="#22c55e" size={18} /></span>
                <div>
                  <p className="text-[13px] font-bold text-green-800 dark:text-green-400">Invitation Sent</p>
                  <p className="mt-1 text-[12px] text-green-700 dark:text-green-500">{resendResult.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Danger zone */}
          <div className="rounded-2xl border border-red-200 bg-[var(--bg)] p-6 dark:border-red-800/30 dark:bg-[#101827]">
            <h3 className="mb-2 text-[13px] font-bold text-red-600">Danger Zone</h3>
            <p className="mb-4 text-[11px] text-[var(--body)]">Permanently delete this application and all associated data (CV, screening results, interview transcript). This cannot be undone — use this for candidate data-deletion requests.</p>
            {deleteError && <p className="mb-3 text-[11px] font-medium text-red-600">{deleteError}</p>}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full rounded-xl border border-red-200 px-5 py-2.5 text-[13px] font-bold text-red-600 transition-all hover:bg-red-50"
            >
              Delete Application
            </button>
          </div>
        </div>
      </div>

      <ScheduleInterviewModal
        open={showScheduleModal}
        applicationId={applicant.id}
        candidateName={applicant.candidate_name}
        onClose={() => setShowScheduleModal(false)}
        onScheduled={handleInterviewScheduled}
      />

      <ConfirmDialog
        open={!!confirmAction}
        title={
          confirmAction === 'approve' ? 'Approve & Send Assessment' :
          confirmAction === 'resend' ? 'Resend Assessment Invitation' :
          confirmAction === 'hire' ? 'Mark as Hired' :
          'Reject Candidate'
        }
        description={
          confirmAction === 'approve'
            ? `This will move the candidate to Stage 2 and send them an AI interview invitation with a ${expirationDays}-day expiry.`
            : confirmAction === 'resend'
            ? `This will generate a new assessment link and send a fresh invitation email with a ${expirationDays}-day expiry. The old link will be invalidated.`
            : confirmAction === 'hire'
            ? 'This will mark the candidate as hired and send them a welcome email.'
            : 'This will reject the candidate and send them a notification email.'
        }
        confirmLabel={actionLoading ? 'Processing...' : confirmAction === 'approve' ? 'Approve & Send' : confirmAction === 'resend' ? 'Resend' : confirmAction === 'hire' ? 'Mark as Hired' : 'Reject'}
        variant={confirmAction === 'approve' || confirmAction === 'resend' || confirmAction === 'hire' ? 'success' : 'danger'}
        onConfirm={handleReview}
        onCancel={() => { setConfirmAction(null); setResendResult(null); }}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Application"
        description={`This will permanently delete ${applicant.candidate_name}'s application, CV, screening results, interview transcript, and scheduled interviews. This cannot be undone.`}
        confirmLabel={deleteLoading ? 'Deleting...' : 'Delete Permanently'}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
