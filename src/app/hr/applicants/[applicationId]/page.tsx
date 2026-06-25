'use client';

import { startTransition, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApplicantDetail, reviewApplication, type ApplicantDetail } from '@/lib/recruitment-api';
import { ScoreCircle, StatusBadge, ScoreBar, TranscriptViewer, BrandedLoader, ConfirmDialog } from '@/components/recruitment';

export default function ApplicantDetailPage() {
  const { applicationId } = useParams();
  const [applicant, setApplicant] = useState<ApplicantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!applicationId || Array.isArray(applicationId)) return;
    startTransition(async () => {
      try {
        const data = await fetchApplicantDetail(applicationId);
        setApplicant(data);
      } catch { /* empty */ }
      setLoading(false);
    });
  }, [applicationId]);

  const handleReview = async () => {
    if (!confirmAction || !applicant) return;
    setActionLoading(true);
    try {
      await reviewApplication(applicant.id, confirmAction);
      const data = await fetchApplicantDetail(applicant.id);
      setApplicant(data);
    } catch { /* empty */ }
    setActionLoading(false);
    setConfirmAction(null);
  };

  if (loading) return <BrandedLoader text="Loading applicant details..." />;

  if (!applicant) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-[40px]">🤷</div>
          <h2 className="mb-2 text-lg font-bold text-[var(--heading)]">Applicant Not Found</h2>
          <p className="mb-6 text-sm text-[var(--body)]">This applicant could not be found or may have been removed.</p>
          <Link href="/hr/applicants" className="text-sm font-semibold text-[var(--blue)] hover:underline">Back to Applicants</Link>
        </div>
      </div>
    );
  }

  const sr = applicant.screening_result;
  const hasAssessment = applicant.conversation_session ? applicant.conversation_session.conversation_history.length > 0 : false;
  const stageTwoResult = applicant.stage_results?.find(s => s.stage_number === 2);

  return (
    <div>
      {/* Back button */}
      <Link
        href="/hr/applicants"
        className="mb-6 inline-flex items-center gap-2 text-[13px] font-medium text-[var(--body)] transition-colors hover:text-[var(--blue)]"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Applicants
      </Link>

      {/* Hero header */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] dark:border-white/10 dark:bg-[#101827]">
        <div className="absolute left-0 right-0 top-0 h-[3px] bg-[linear-gradient(90deg,var(--blue),var(--orange))]" />
        <div className="p-6 lg:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div
                className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
                style={{ background: 'var(--blue)' }}
              >
                {applicant.candidate_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="font-syne text-[24px] font-extrabold text-[var(--heading)]">{applicant.candidate_name}</h1>
                <p className="mt-1 text-[14px] text-[var(--body)]">{applicant.candidate_email}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="rounded-full bg-[rgba(69,132,237,0.08)] px-3 py-0.5 text-[11px] font-semibold text-[var(--blue)]">
                    {applicant.job_title}
                  </span>
                  <StatusBadge status={applicant.status} />
                  <span className="text-[11px] text-[var(--body)]">Stage {applicant.stage}</span>
                </div>
              </div>
            </div>
            {sr && (
              <div className="flex flex-col items-center gap-1">
                <ScoreCircle score={sr.overall_score} size={72} strokeWidth={5} />
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Screening Score</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left column: applicant info + screening */}
        <div className="space-y-8 lg:col-span-2">
          {/* Key Information */}
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
                <div className="mt-1 text-[14px] font-medium text-[var(--heading)] break-all">{applicant.candidate_email}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Position</div>
                <div className="mt-1 text-[14px] font-medium text-[var(--heading)]">{applicant.job_title}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Applied</div>
                <div className="mt-1 text-[14px] font-medium text-[var(--heading)]">
                  {applicant.created_at
                    ? new Date(applicant.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* AI Screening Results */}
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
                <div className="grid gap-4 sm:grid-cols-3">
                  {sr.strengths && (
                    <div className="rounded-xl border border-[rgba(34,197,94,0.15)] bg-[rgba(34,197,94,0.03)] p-5">
                      <div className="mb-1 text-[13px] font-bold text-[var(--score-high)]">Strengths</div>
                      <div className="mt-2 text-[12px] leading-relaxed text-[var(--body)] whitespace-pre-line">{sr.strengths}</div>
                    </div>
                  )}
                  {sr.concerns && (
                    <div className="rounded-xl border border-[rgba(239,68,68,0.15)] bg-[rgba(239,68,68,0.03)] p-5">
                      <div className="mb-1 text-[13px] font-bold text-[var(--score-low)]">Concerns</div>
                      <div className="mt-2 text-[12px] leading-relaxed text-[var(--body)] whitespace-pre-line">{sr.concerns}</div>
                    </div>
                  )}
                  {sr.evidence && (
                    <div className="rounded-xl border border-[rgba(69,132,237,0.15)] bg-[rgba(69,132,237,0.03)] p-5">
                      <div className="mb-1 text-[13px] font-bold text-[var(--blue)]">Evidence</div>
                      <div className="mt-2 text-[12px] leading-relaxed text-[var(--body)] whitespace-pre-line">{sr.evidence}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stage 2 Assessment */}
          {stageTwoResult && (
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] dark:border-white/10 dark:bg-[#101827]">
              <div className="border-b border-[var(--border)] px-6 py-4 dark:border-white/10">
                <h2 className="text-[15px] font-bold text-[var(--heading)]">Stage 2: AI Interview Assessment</h2>
              </div>
              <div className="p-6">
                {/* Topic scores */}
                {stageTwoResult.ai_feedback?.per_topic_scores && (
                  <div className="mb-6">
                    <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Topic Scores</h3>
                    <div className="space-y-3">
                      {stageTwoResult.ai_feedback.per_topic_scores.map((ts) => (
                        <ScoreBar key={ts.topic} label={ts.topic} score={ts.score} />
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Recommendation */}
                <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] p-5 dark:border-white/10">
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">AI Recommendation</div>
                  {stageTwoResult.ai_feedback?.recommendation && (
                    <div className="text-[14px] font-semibold capitalize text-[var(--heading)]">{stageTwoResult.ai_feedback.recommendation}</div>
                  )}
                  {stageTwoResult.ai_feedback?.feedback && (
                    <div className="mt-2 text-[12px] leading-relaxed text-[var(--body)]">{stageTwoResult.ai_feedback.feedback}</div>
                  )}
                  {stageTwoResult.ai_feedback?.strengths && stageTwoResult.ai_feedback.strengths.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 text-[11px] font-bold text-[var(--score-high)]">Strengths</div>
                      <ul className="space-y-1">
                        {stageTwoResult.ai_feedback.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--body)]">
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--score-high)" strokeWidth={2.5} className="mt-0.5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {stageTwoResult.ai_feedback?.weaknesses && stageTwoResult.ai_feedback.weaknesses.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 text-[11px] font-bold text-[var(--score-low)]">Areas to Improve</div>
                      <ul className="space-y-1">
                        {stageTwoResult.ai_feedback.weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--body)]">
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--score-low)" strokeWidth={2.5} className="mt-0.5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Interview transcript */}
                {hasAssessment && applicant.conversation_session && (
                  <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] dark:border-white/10 dark:bg-[#101827]">
                    <div className="relative border-b border-[var(--border)] px-6 py-4 dark:border-white/10">
                      <div className="absolute left-0 top-0 h-full w-[3px] bg-[linear-gradient(180deg,var(--blue),var(--orange))]" />
                      <div className="flex items-center justify-between">
                        <h2 className="pl-2 text-[15px] font-bold text-[var(--heading)]">Interview Transcript</h2>
                        <span className="rounded-md bg-[rgba(69,132,237,0.08)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--blue)]">
                          {applicant.conversation_session.conversation_history.length} messages
                        </span>
                      </div>
                    </div>
                    <TranscriptViewer
                      messages={applicant.conversation_session.conversation_history.map(m => ({
                        role: m.role === 'assistant' ? 'ai' as const : 'candidate' as const,
                        content: m.content,
                        topic_label: m.topic_label,
                      }))}
                      maxHeight={440}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* If no screening or assessment yet */}
          {!sr && !stageTwoResult && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-8 text-center dark:border-white/10 dark:bg-[#101827]">
              <div className="mb-3 text-[32px]">⏳</div>
              <h3 className="mb-2 text-[15px] font-bold text-[var(--heading)]">Pending Review</h3>
              <p className="text-[13px] text-[var(--body)]">
                This application is awaiting AI screening. Results will appear here once processed.
              </p>
            </div>
          )}
        </div>

        {/* Right sidebar: actions */}
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]" style={{ boxShadow: 'var(--shadow-md)' }}>
            <h3 className="mb-5 text-[15px] font-bold text-[var(--heading)]">Actions</h3>

            <button
              onClick={() => setConfirmAction('approve')}
              disabled={applicant.status === 'approved' || (!sr && applicant.status === 'pending')}
              className="mb-3 w-full rounded-xl px-5 py-3 text-[13px] font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              style={{ background: 'var(--status-approved)' }}
            >
              Approve Candidate
            </button>

            <button
              onClick={() => setConfirmAction('reject')}
              disabled={applicant.status === 'rejected'}
              className="w-full rounded-xl px-5 py-3 text-[13px] font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              style={{ background: 'var(--status-rejected)' }}
            >
              Reject Candidate
            </button>

            {/* Application meta */}
            <div className="mt-6 space-y-4 border-t border-[var(--border)] pt-5 dark:border-white/10">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Status</div>
                <div className="mt-1"><StatusBadge status={applicant.status} /></div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Stage</div>
                <div className="mt-1 text-[14px] font-medium text-[var(--heading)]">Stage {applicant.stage}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Applied</div>
                <div className="mt-1 text-[14px] font-medium text-[var(--heading)]">
                  {applicant.created_at
                    ? new Date(applicant.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : '—'}
                </div>
              </div>
              {applicant.assessment_token && (
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction === 'approve' ? 'Approve Candidate' : 'Reject Candidate'}
        description={
          confirmAction === 'approve'
            ? 'This will move the candidate to the next stage and send them a notification email.'
            : 'This will reject the candidate and send them a notification email.'
        }
        confirmLabel={actionLoading ? 'Processing...' : confirmAction === 'approve' ? 'Approve' : 'Reject'}
        variant={confirmAction === 'approve' ? 'success' : 'danger'}
        onConfirm={handleReview}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}