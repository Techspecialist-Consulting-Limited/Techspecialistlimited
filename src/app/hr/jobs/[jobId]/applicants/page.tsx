'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApplicants, fetchJob, bulkAction, type Application, type Job } from '@/lib/recruitment-api';
import { isStalled, isDuplicate } from '@/lib/applicant-flags';
import { StatusBadge, ScoreCircle, BrandedLoader, EmptyState, PipelineBoard, ConfirmDialog, AddCandidateModal } from '@/components/recruitment';

export default function ApplicantPipelinePage() {
  const { jobId } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'cards'>('board');
  const [showArchived, setShowArchived] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<'archive' | 'unarchive' | 'reject' | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const loadData = useCallback(async () => {
    if (!jobId || Array.isArray(jobId)) return;
    try {
      const [jobData, apps] = await Promise.all([fetchJob(jobId), fetchApplicants(jobId, showArchived)]);
      setJob(jobData);
      setApplicants(apps);
    } catch { /* empty */ }
    setLoading(false);
  }, [jobId, showArchived]);

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

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const runBulkAction = async () => {
    if (!bulkConfirm) return;
    setBulkLoading(true);
    try {
      await bulkAction(Array.from(selected), bulkConfirm);
      setSelected(new Set());
      await loadData();
    } catch { /* empty */ }
    setBulkLoading(false);
    setBulkConfirm(null);
  };

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

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-[var(--heading)]" style={{ fontFamily: "'Roboto Slab', sans-serif" }}>{job?.title || 'Applicants'}</h1>
          <p className="mt-1 text-[13px] text-[var(--body)]">{applicants.length} applicant{applicants.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {hasScreeningInProgress && (
            <div className="flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold" style={{ background: 'rgba(59, 130, 246, 0.08)', color: 'var(--status-screening)' }}>
              <div className="h-2 w-2 rounded-full" style={{ background: 'var(--status-screening)', animation: 'breathe 2s ease-in-out infinite' }} />
              AI screening in progress
            </div>
          )}
          <label className="flex items-center gap-2 text-[12px] font-medium text-[var(--body)]">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Show archived
          </label>
          <button
            onClick={() => setShowAddCandidate(true)}
            className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-[12.5px] font-semibold text-[var(--heading)] transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)] dark:border-white/10"
          >
            + Add Candidate
          </button>
          <div className="flex items-center gap-1 rounded-full border border-[var(--border)] p-1 dark:border-white/10">
            <button
              onClick={() => setViewMode('board')}
              className="rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-200"
              style={{ background: viewMode === 'board' ? 'var(--blue)' : 'transparent', color: viewMode === 'board' ? '#fff' : 'var(--body)' }}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className="rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-200"
              style={{ background: viewMode === 'cards' ? 'var(--blue)' : 'transparent', color: viewMode === 'cards' ? '#fff' : 'var(--body)' }}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'cards' && selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--blue)] bg-[rgba(69,132,237,0.06)] px-4 py-3">
          <span className="text-[13px] font-semibold text-[var(--heading)]">{selected.size} selected</span>
          <button
            onClick={() => setBulkConfirm(showArchived ? 'unarchive' : 'archive')}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-[12px] font-semibold text-[var(--body)] transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)]"
          >
            {showArchived ? 'Unarchive' : 'Archive'}
          </button>
          <button
            onClick={() => setBulkConfirm('reject')}
            className="rounded-md border border-red-200 px-3 py-1.5 text-[12px] font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            Reject
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-[12px] font-medium text-[var(--body)] hover:text-[var(--blue)]"
          >
            Clear selection
          </button>
        </div>
      )}

      {applicants.length === 0 ? (
        <EmptyState
          icon={<svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
          title="No Applicants Yet"
          description="Applicants will appear here once candidates start applying."
        />
      ) : viewMode === 'board' ? (
        <PipelineBoard applicants={applicants} onRefresh={loadData} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {applicants.map((app, i) => {
            const sr = app.screening_result;
            const stalled = isStalled(app);
            const duplicate = isDuplicate(app);
            const manuallyAdded = !sr && app.stage >= 2;
            return (
              <div
                key={app.id}
                className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[rgba(124,92,255,0.25)] hover:shadow-lg dark:border-white/10 dark:bg-[#101827]"
                style={{ animation: `cardSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s both`, opacity: app.is_archived ? 0.6 : 1 }}
              >
                <div className="absolute left-0 right-0 top-0 h-[3px] opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'linear-gradient(90deg, var(--blue), #7c5cff)' }} />
                <div className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selected.has(app.id)}
                        onChange={() => toggleSelected(app.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, var(--blue), #7c5cff)' }}
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
                  {(stalled || duplicate || app.is_archived || manuallyAdded) && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {app.is_archived && (
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-white/10 dark:text-white/60">Archived</span>
                      )}
                      {manuallyAdded && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-[var(--blue)] dark:bg-blue-900/20" title="Added directly by HR; no CV screening was run">Added by HR</span>
                      )}
                      {stalled && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">Stalled</span>
                      )}
                      {duplicate && (
                        <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">Applied {app.application_count_for_email}x</span>
                      )}
                    </div>
                  )}
                  <Link href={`/hr/applicants/${app.id}`} className="flex items-center justify-between">
                    <StatusBadge status={app.status} />
                    <span className="flex items-center gap-1 text-[12px] font-semibold text-[var(--blue)] opacity-0 transition-opacity group-hover:opacity-100">
                      View Details
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                    </span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {jobId && !Array.isArray(jobId) && (
        <AddCandidateModal
          open={showAddCandidate}
          jobId={jobId}
          onClose={() => setShowAddCandidate(false)}
          onAdded={() => { setShowAddCandidate(false); loadData(); }}
        />
      )}

      <ConfirmDialog
        open={!!bulkConfirm}
        title={bulkConfirm === 'reject' ? 'Reject Selected Candidates' : bulkConfirm === 'unarchive' ? 'Unarchive Selected' : 'Archive Selected'}
        description={
          bulkConfirm === 'reject'
            ? `This will reject ${selected.size} candidate${selected.size !== 1 ? 's' : ''} and send each a notification email.`
            : bulkConfirm === 'unarchive'
            ? `This will restore ${selected.size} candidate${selected.size !== 1 ? 's' : ''} from the archive.`
            : `This will archive ${selected.size} candidate${selected.size !== 1 ? 's' : ''}. They can be restored later.`
        }
        confirmLabel={bulkLoading ? 'Processing...' : bulkConfirm === 'reject' ? 'Reject' : bulkConfirm === 'unarchive' ? 'Unarchive' : 'Archive'}
        variant={bulkConfirm === 'reject' ? 'danger' : 'default'}
        onConfirm={runBulkAction}
        onCancel={() => setBulkConfirm(null)}
      />
    </div>
  );
}
