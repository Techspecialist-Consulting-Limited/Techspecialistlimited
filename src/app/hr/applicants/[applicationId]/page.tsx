'use client';

import { startTransition, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApplicantDetail, reviewApplication, resendAssessment, createInterview, fetchAuditLogs, fetchInterviewsByApplication, type ApplicantDetail, type ResendResponse, type AuditLogEntry, type Interview } from '@/lib/recruitment-api';
import { ScoreCircle, StatusBadge, ScoreBar, TranscriptViewer, BrandedLoader, ConfirmDialog } from '@/components/recruitment';

const EXPIRATION_OPTIONS = [
  { label: '3 days', value: 3 },
  { label: '5 days', value: 5 },
  { label: '1 week', value: 7 },
  { label: '2 weeks', value: 14 },
  { label: 'Custom (30 days)', value: 30 },
];

export default function ApplicantDetailPage() {
  const { applicationId } = useParams();
  const [applicant, setApplicant] = useState<ApplicantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'resend' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [expirationDays, setExpirationDays] = useState(7);
  const [resendResult, setResendResult] = useState<ResendResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    interview_type: 'physical',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    location: '',
    meeting_link: '',
    interviewer_name: '',
    notes: '',
  });
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);

  useEffect(() => {
    if (!applicationId || Array.isArray(applicationId)) return;
    startTransition(async () => {
      try {
        const data = await fetchApplicantDetail(applicationId);
        setApplicant(data);
        fetchAuditLogs(applicationId).then(setAuditLogs).catch(() => {});
        fetchInterviewsByApplication(applicationId).then(setInterviews).catch(() => {});
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
  const latestInterview = interviews[0];

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleScheduleInterview = async () => {
    if (!scheduleForm.scheduled_date || !scheduleForm.scheduled_time || !applicant) return;
    setScheduleSubmitting(true);
    try {
      await createInterview({
        application_id: applicant.id,
        ...scheduleForm,
      });
      const data = await fetchApplicantDetail(applicant.id);
      setApplicant(data);
      fetchInterviewsByApplication(applicant.id).then(setInterviews).catch(() => {});
      setShowScheduleModal(false);
      setScheduleForm({
        interview_type: 'physical',
        scheduled_date: '',
        scheduled_time: '',
        duration_minutes: 60,
        location: '',
        meeting_link: '',
        interviewer_name: '',
        notes: '',
      });
    } catch {
      alert('Failed to schedule interview');
    }
    setScheduleSubmitting(false);
  };

  const isAssessmentExpired = applicant.assessment_expires_at
    ? new Date(applicant.assessment_expires_at) < new Date()
    : false;

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

      {/* Combined Scorecard */}
      {(sr || stageTwoResult) && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] dark:border-white/10 dark:bg-[#101827]">
          <div className="border-b border-[var(--border)] px-6 py-4 dark:border-white/10">
            <h2 className="text-[15px] font-bold text-[var(--heading)]">Combined Assessment Score</h2>
          </div>
          <div className="p-6">
            <div className="grid gap-6 sm:grid-cols-3">
              {sr && (
                <div className="flex flex-col items-center rounded-xl border border-[var(--border)] p-5 dark:border-white/10">
                  <ScoreCircle score={sr.overall_score} size={80} strokeWidth={5} label="" />
                  <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Stage 1: CV Review</div>
                  <div className="mt-3 w-full space-y-1 text-[11px] text-[var(--body)]">
                    <div className="flex justify-between"><span>Strengths</span><span className="font-medium text-[var(--score-high)]">{sr.strengths?.split(',').length || 0} identified</span></div>
                  </div>
                </div>
              )}
              {stageTwoResult && (
                <div className="flex flex-col items-center rounded-xl border border-[var(--border)] p-5 dark:border-white/10">
                  <ScoreCircle score={stageTwoResult.score} size={80} strokeWidth={5} label="" />
                  <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Stage 2: AI Interview</div>
                  {stageTwoResult.ai_feedback?.overall_recommendation && (
                    <div className="mt-2 text-[11px] font-semibold capitalize" style={{
                      color: stageTwoResult.ai_feedback.overall_recommendation === 'highly_recommended' ? 'var(--score-high)' :
                             stageTwoResult.ai_feedback.overall_recommendation === 'recommended' ? 'var(--blue)' :
                             stageTwoResult.ai_feedback.overall_recommendation === 'consider' ? 'var(--score-mid)' : 'var(--score-low)',
                    }}>
                      {stageTwoResult.ai_feedback.overall_recommendation.replace(/_/g, ' ')}
                    </div>
                  )}
                </div>
              )}
              {sr && stageTwoResult && (
                <div className="flex flex-col items-center rounded-xl border border-[var(--border)] p-5 dark:border-white/10" style={{ background: 'rgba(69,132,237,0.03)' }}>
                  <ScoreCircle score={Math.round((sr.overall_score + stageTwoResult.score) / 2)} size={90} strokeWidth={5} label="" />
                  <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Combined Score</div>
                  <div className="mt-1 text-[10px] text-[var(--body)]">Average of both stages</div>
                </div>
              )}
            </div>
            {/* Granular scores for Stage 2 */}
            {stageTwoResult?.ai_feedback?.communication_skills !== undefined && (
              <div className="mt-6 grid gap-4 sm:grid-cols-5">
                {[
                  { label: 'Communication', value: stageTwoResult.ai_feedback.communication_skills ?? 0 },
                  { label: 'Technical', value: stageTwoResult.ai_feedback.technical_competency ?? 0 },
                  { label: 'Confidence', value: stageTwoResult.ai_feedback.confidence_professionalism ?? 0 },
                  { label: 'Problem Solving', value: stageTwoResult.ai_feedback.problem_solving ?? 0 },
                  { label: 'Relevance', value: stageTwoResult.ai_feedback.relevance_of_responses ?? 0 },
                ].map((dim) => (
                  <div key={dim.label} className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                        <div className="h-full rounded-full" style={{ width: `${dim.value}%`, background: dim.value >= 75 ? 'var(--score-high)' : dim.value >= 50 ? 'var(--score-mid)' : 'var(--score-low)' }} />
                      </div>
                      <span className="text-[11px] font-bold text-[var(--heading)] w-7">{Math.round(dim.value)}</span>
                    </div>
                    <div className="text-[9px] font-medium text-[var(--body)] mt-1">{dim.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recruitment Timeline */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] dark:border-white/10 dark:bg-[#101827]">
        <div className="border-b border-[var(--border)] px-6 py-4 dark:border-white/10">
          <h2 className="text-[15px] font-bold text-[var(--heading)]">Recruitment Timeline</h2>
        </div>
        <div className="p-6">
          <div className="relative flex items-start gap-4 overflow-x-auto pb-2">
            {[
              { label: 'Application Submitted', date: applicant.created_at, done: !!applicant.created_at, icon: '📄' },
              { label: 'CV Reviewed', date: sr?.created_at || applicant.created_at, done: !!sr, icon: '🔍' },
              { label: 'Assessment Sent', date: applicant.assessment_sent_at, done: !!applicant.assessment_sent_at, icon: '📧' },
              { label: 'Assessment Completed', date: stageTwoResult?.created_at, done: !!stageTwoResult, icon: '🎙️' },
              { label: 'Interview Scheduled', date: latestInterview?.created_at, done: !!latestInterview, icon: '📅' },
              { label: 'Final Decision', date: applicant.status === 'rejected' ? applicant.created_at : null, done: applicant.status === 'rejected', icon: '✅' },
            ].map((event, i) => (
              <div key={i} className="flex flex-col items-center flex-shrink-0" style={{ minWidth: '120px' }}>
                <div className="flex items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-[16px]" style={{
                    background: event.done ? 'rgba(34,197,94,0.1)' : 'var(--bg-soft)',
                    border: event.done ? '2px solid var(--score-high)' : '2px solid var(--border)',
                  }}>
                    {event.icon}
                  </div>
                  {i < 5 && <div className="h-[2px] w-8" style={{ background: event.done ? 'var(--score-high)' : 'var(--border)' }} />}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-[11px] font-medium text-[var(--heading)]">{event.label}</div>
                  {event.date ? (
                    <div className="text-[9px] text-[var(--body)] mt-0.5">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  ) : (
                    <div className="text-[9px] text-[var(--body)] mt-0.5">Pending</div>
                  )}
                </div>
              </div>
            ))}
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
                <div className="mt-1 text-[14px] font-medium text-[var(--heading)]">{formatDate(applicant.created_at)}</div>
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

                {/* Granular scorecard */}
                {stageTwoResult.ai_feedback?.communication_skills !== undefined && (
                  <div className="mb-6 grid gap-3 sm:grid-cols-5">
                    {[
                      { label: 'Communication', value: stageTwoResult.ai_feedback.communication_skills ?? 0 },
                      { label: 'Technical Competency', value: stageTwoResult.ai_feedback.technical_competency ?? 0 },
                      { label: 'Confidence & Professionalism', value: stageTwoResult.ai_feedback.confidence_professionalism ?? 0 },
                      { label: 'Problem Solving', value: stageTwoResult.ai_feedback.problem_solving ?? 0 },
                      { label: 'Relevance of Responses', value: stageTwoResult.ai_feedback.relevance_of_responses ?? 0 },
                    ].map((dim) => (
                      <div key={dim.label} className="rounded-xl border border-[var(--border)] p-4 text-center dark:border-white/10">
                        <div className="text-[18px] font-extrabold" style={{
                          color: dim.value >= 75 ? 'var(--score-high)' : dim.value >= 50 ? 'var(--score-mid)' : 'var(--score-low)',
                        }}>{Math.round(dim.value)}</div>
                        <div className="mt-1 text-[9px] font-medium text-[var(--body)] leading-tight">{dim.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Recommendation */}
                <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] p-5 dark:border-white/10">
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">AI Recommendation</div>
                  {stageTwoResult.ai_feedback?.overall_recommendation && (
                    <div className="text-[14px] font-semibold capitalize" style={{
                      color: stageTwoResult.ai_feedback.overall_recommendation === 'highly_recommended' ? 'var(--score-high)' :
                             stageTwoResult.ai_feedback.overall_recommendation === 'recommended' ? 'var(--blue)' :
                             stageTwoResult.ai_feedback.overall_recommendation === 'consider' ? 'var(--score-mid)' : 'var(--score-low)',
                    }}>
                      {stageTwoResult.ai_feedback.overall_recommendation.replace(/_/g, ' ')}
                    </div>
                  )}
                  {stageTwoResult.ai_feedback?.interview_summary && (
                    <div className="mt-2 text-[12px] leading-relaxed text-[var(--body)]">{stageTwoResult.ai_feedback.interview_summary}</div>
                  )}
                  {!stageTwoResult.ai_feedback?.interview_summary && stageTwoResult.ai_feedback?.feedback && (
                    <div className="mt-2 text-[12px] leading-relaxed text-[var(--body)]">{stageTwoResult.ai_feedback.feedback}</div>
                  )}
                  {stageTwoResult.ai_feedback?.key_strengths && stageTwoResult.ai_feedback.key_strengths.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 text-[11px] font-bold text-[var(--score-high)]">Key Strengths</div>
                      <ul className="space-y-1">
                        {stageTwoResult.ai_feedback.key_strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--body)]">
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--score-high)" strokeWidth={2.5} className="mt-0.5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {stageTwoResult.ai_feedback?.areas_for_improvement && stageTwoResult.ai_feedback.areas_for_improvement.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 text-[11px] font-bold text-[var(--score-low)]">Areas for Improvement</div>
                      <ul className="space-y-1">
                        {stageTwoResult.ai_feedback.areas_for_improvement.map((w, i) => (
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

          {/* Audit Timeline */}
          {auditLogs.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] dark:border-white/10 dark:bg-[#101827]">
              <div className="border-b border-[var(--border)] px-6 py-4 dark:border-white/10">
                <h2 className="text-[15px] font-bold text-[var(--heading)]">Audit Timeline</h2>
              </div>
              <div className="p-6">
                <div className="space-y-0">
                  {auditLogs.map((log, i) => (
                    <div key={log.id} className="relative flex gap-4 pb-6 last:pb-0">
                      {i < auditLogs.length - 1 && (
                        <div className="absolute left-[11px] top-[28px] h-full w-px bg-[var(--border)]" />
                      )}
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full" style={{
                        background: log.action.startsWith('interview') ? 'rgba(69,132,237,0.1)' :
                                     log.action.includes('approved') || log.action === 'assessment_approved' ? 'rgba(16,185,129,0.1)' :
                                     log.action === 'rejected' ? 'rgba(239,68,68,0.1)' :
                                     'rgba(245,158,11,0.1)',
                      }}>
                        <span style={{ fontSize: '10px' }}>
                          {log.action.startsWith('interview') ? '📅' :
                           log.action.includes('approved') || log.action === 'assessment_approved' ? '✅' :
                           log.action === 'rejected' ? '❌' :
                           log.action === 'assessment_resent' ? '📧' :
                           log.action === 'application_cleared' ? '🗑️' : '📝'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold text-[var(--heading)] capitalize">
                            {log.action.replace(/_/g, ' ')}
                          </span>
                          {log.created_at && (
                            <span className="text-[10px] text-[var(--body)]">
                              {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        {log.detail && (
                          <div className="mt-0.5 text-[11px] text-[var(--body)]">{log.detail}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
          {/* Actions card */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]" style={{ boxShadow: 'var(--shadow-md)' }}>
            <h3 className="mb-5 text-[15px] font-bold text-[var(--heading)]">Actions</h3>

            {/* Expiration period selector */}
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
              className="mb-3 w-full rounded-xl px-5 py-3 text-[13px] font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              style={{ background: 'var(--status-approved)' }}
            >
              Approve & Send Assessment
            </button>

            <button
              onClick={() => setConfirmAction('reject')}
              disabled={applicant.status === 'rejected'}
              className="w-full rounded-xl px-5 py-3 text-[13px] font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              style={{ background: 'var(--status-rejected)' }}
            >
              Reject Candidate
            </button>
          </div>

          {/* Schedule Interview card */}
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
                      <span className="text-[12px] font-semibold text-green-600 capitalize">{latestInterview.status} — {latestInterview.interview_type}</span>
                    </div>
                    <div className="space-y-0.5 text-[11px] text-[var(--body)]">
                      <div>{latestInterview.scheduled_date} at {latestInterview.scheduled_time} ({latestInterview.duration_minutes}min)</div>
                      {latestInterview.location && <div>Location: {latestInterview.location}</div>}
                      {latestInterview.meeting_link && (
                        <div>Link: <a href={latestInterview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-[var(--blue)] hover:underline break-all">{latestInterview.meeting_link}</a></div>
                      )}
                      {latestInterview.interviewer_name && <div>Interviewer: {latestInterview.interviewer_name}</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assessment status card */}
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
                        <span className="text-[13px] font-medium text-amber-500">Sent — Awaiting Response</span>
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

                {/* Resend button */}
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

          {/* Application meta */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]" style={{ boxShadow: 'var(--shadow-md)' }}>
            <div className="space-y-4">
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
                <div className="mt-1 text-[14px] font-medium text-[var(--heading)]">{formatDate(applicant.created_at)}</div>
              </div>
            </div>
          </div>

          {resendResult && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-800/30 dark:bg-green-900/10">
              <div className="flex items-start gap-3">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={2} className="mt-0.5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div>
                  <p className="text-[13px] font-bold text-green-800 dark:text-green-400">Invitation Sent</p>
                  <p className="mt-1 text-[12px] text-green-700 dark:text-green-500">{resendResult.message}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowScheduleModal(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl bg-[var(--bg)] p-7 shadow-2xl"
            style={{ width: '480px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <h3 className="mb-5 text-[16px] font-bold text-[var(--heading)]">Schedule Interview — {applicant.candidate_name}</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Date</label>
                  <input
                    type="date"
                    value={scheduleForm.scheduled_date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_date: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-[11px] text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Time</label>
                  <input
                    type="time"
                    value={scheduleForm.scheduled_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_time: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-[11px] text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Duration (min)</label>
                  <input
                    type="number"
                    value={scheduleForm.duration_minutes}
                    min={15}
                    step={15}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, duration_minutes: parseInt(e.target.value) || 60 })}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-[11px] text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Type</label>
                <div className="mt-1 flex gap-2">
                  {['physical', 'virtual', 'phone'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setScheduleForm({ ...scheduleForm, interview_type: type })}
                      className={`flex-1 rounded-xl px-4 py-[10px] text-[12px] font-medium capitalize transition-all ${
                        scheduleForm.interview_type === type
                          ? 'border-[1.5px] border-[var(--blue)] bg-[rgba(69,132,237,0.06)] text-[var(--blue)]'
                          : 'border border-[var(--border)] bg-transparent text-[var(--body)] hover:border-[var(--blue)]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {scheduleForm.interview_type === 'virtual' && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Meeting Link</label>
                  <input
                    type="url"
                    value={scheduleForm.meeting_link}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, meeting_link: e.target.value })}
                    placeholder="https://meet.google.com/..."
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-[11px] text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
                  />
                </div>
              )}

              {scheduleForm.interview_type === 'physical' && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Location</label>
                  <input
                    type="text"
                    value={scheduleForm.location}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
                    placeholder="Office address, room number..."
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-[11px] text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Interviewer</label>
                <input
                  type="text"
                  value={scheduleForm.interviewer_name}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, interviewer_name: e.target.value })}
                  placeholder="e.g. John Smith"
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-[11px] text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Notes (sent to candidate)</label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Preparation instructions, documents to bring, etc."
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-[11px] text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-[13px] font-medium text-[var(--body)] transition-all hover:border-[var(--blue)] hover:text-[var(--blue)]"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleInterview}
                disabled={scheduleSubmitting || !scheduleForm.scheduled_date || !scheduleForm.scheduled_time}
                className="rounded-xl px-5 py-2.5 text-[13px] font-bold text-white transition-all disabled:opacity-40"
                style={{
                  background: 'var(--blue)',
                  opacity: scheduleSubmitting || !scheduleForm.scheduled_date || !scheduleForm.scheduled_time ? 0.5 : 1,
                  cursor: scheduleSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {scheduleSubmitting ? 'Scheduling...' : 'Schedule Interview'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        title={
          confirmAction === 'approve' ? 'Approve & Send Assessment' :
          confirmAction === 'resend' ? 'Resend Assessment Invitation' :
          'Reject Candidate'
        }
        description={
          confirmAction === 'approve'
            ? `This will move the candidate to Stage 2 and send them an AI interview invitation with a ${expirationDays}-day expiry.`
            : confirmAction === 'resend'
            ? `This will generate a new assessment link and send a fresh invitation email with a ${expirationDays}-day expiry. The old link will be invalidated.`
            : 'This will reject the candidate and send them a notification email.'
        }
        confirmLabel={actionLoading ? 'Processing...' : confirmAction === 'approve' ? 'Approve & Send' : confirmAction === 'resend' ? 'Resend' : 'Reject'}
        variant={confirmAction === 'approve' ? 'success' : confirmAction === 'resend' ? 'success' : 'danger'}
        onConfirm={handleReview}
        onCancel={() => { setConfirmAction(null); setResendResult(null); }}
      />
    </div>
  );
}
