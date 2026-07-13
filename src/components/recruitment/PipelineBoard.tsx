'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { reviewApplication, type Application } from '@/lib/recruitment-api';
import { isStalled, isDuplicate } from '@/lib/applicant-flags';
import StatusBadge from './StatusBadge';
import ScoreCircle from './ScoreCircle';
import ConfirmDialog from './ConfirmDialog';
import ScheduleInterviewModal from './ScheduleInterviewModal';

interface Column {
  key: string;
  label: string;
  match: (status: string) => boolean;
}

const COLUMNS: Column[] = [
  { key: 'new', label: 'New', match: (s) => s === 'pending' },
  { key: 'assessment_sent', label: 'Assessment Sent', match: (s) => s === 'approved' },
  { key: 'assessment_completed', label: 'Assessment Completed', match: (s) => s === 'assessment_completed' || s === 'assessment_flagged' },
  { key: 'interview_scheduled', label: 'Interview Scheduled', match: (s) => s === 'interview_scheduled' },
  { key: 'hired', label: 'Hired', match: (s) => s === 'hired' },
  { key: 'rejected', label: 'Rejected', match: (s) => s === 'rejected' },
];

function columnKeyForStatus(status: string): string {
  return COLUMNS.find((c) => c.match(status))?.key || 'new';
}

interface PipelineBoardProps {
  applicants: Application[];
  onRefresh: () => void;
}

export default function PipelineBoard({ applicants, onRefresh }: PipelineBoardProps) {
  const router = useRouter();
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [banner, setBanner] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<{ action: 'approve' | 'reject' | 'hire'; app: Application } | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<Application | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showBanner = (message: string) => {
    setBanner(message);
    setTimeout(() => setBanner(''), 4000);
  };

  const handleDrop = (targetKey: string, app: Application) => {
    const sourceKey = columnKeyForStatus(app.status);
    setDragOverColumn(null);
    if (sourceKey === targetKey) return;

    if (sourceKey === 'hired' || sourceKey === 'rejected') {
      showBanner('Hired or rejected candidates can\'t be moved to another stage.');
      return;
    }

    switch (targetKey) {
      case 'assessment_sent':
        if (sourceKey !== 'new') {
          showBanner('Only new applicants can be moved to Assessment Sent.');
          return;
        }
        setConfirmTarget({ action: 'approve', app });
        break;
      case 'rejected':
        setConfirmTarget({ action: 'reject', app });
        break;
      case 'hired':
        setConfirmTarget({ action: 'hire', app });
        break;
      case 'interview_scheduled':
        setScheduleTarget(app);
        break;
      case 'assessment_completed':
        showBanner('This stage updates automatically once the candidate completes their AI interview.');
        break;
      case 'new':
        showBanner('Candidates can\'t be moved back to New.');
        break;
    }
  };

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    setActionLoading(true);
    try {
      await reviewApplication(confirmTarget.app.id, confirmTarget.action, 7);
      onRefresh();
    } catch {
      showBanner('Action failed. Please try again.');
    }
    setActionLoading(false);
    setConfirmTarget(null);
  };

  return (
    <div>
      {banner && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/10 dark:text-amber-400">
          {banner}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const cardsInColumn = applicants.filter((a) => col.match(a.status));
          return (
            <div
              key={col.key}
              onDragOver={(e) => { e.preventDefault(); setDragOverColumn(col.key); }}
              onDragLeave={() => setDragOverColumn((prev) => (prev === col.key ? null : prev))}
              onDrop={(e) => {
                e.preventDefault();
                const raw = e.dataTransfer.getData('text/plain');
                if (!raw) return;
                try {
                  const app: Application = JSON.parse(raw);
                  handleDrop(col.key, app);
                } catch { /* empty */ }
              }}
              className="flex w-[280px] flex-shrink-0 flex-col rounded-xl border transition-colors"
              style={{
                borderColor: dragOverColumn === col.key ? 'var(--blue)' : 'var(--border)',
                background: dragOverColumn === col.key ? 'rgba(69,132,237,0.04)' : 'var(--bg-soft)',
              }}
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 dark:border-white/10">
                <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--heading)]">{col.label}</span>
                <span className="rounded-full bg-[var(--bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--body)] dark:bg-white/5">{cardsInColumn.length}</span>
              </div>
              <div className="flex min-h-[120px] flex-col gap-2 p-2.5">
                {cardsInColumn.map((app) => {
                  const sr = app.screening_result;
                  const stalled = isStalled(app);
                  const duplicate = isDuplicate(app);
                  return (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={(e) => { e.dataTransfer.setData('text/plain', JSON.stringify(app)); }}
                      onClick={() => router.push(`/hr/applicants/${app.id}`)}
                      className="cursor-grab rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 transition-all hover:border-[rgba(69,132,237,0.22)] hover:shadow-md active:cursor-grabbing dark:border-white/10 dark:bg-[#101827]"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-[var(--heading)]">{app.candidate_name}</div>
                          <div className="truncate text-[10.5px] text-[var(--body)]">{app.candidate_email}</div>
                        </div>
                        {sr && <ScoreCircle score={sr.overall_score} size={30} strokeWidth={3} showLabel={false} />}
                      </div>
                      {(stalled || duplicate) && (
                        <div className="mb-2 flex flex-wrap gap-1">
                          {stalled && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">Stalled</span>
                          )}
                          {duplicate && (
                            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[9px] font-semibold text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">{app.application_count_for_email}x applied</span>
                          )}
                        </div>
                      )}
                      <StatusBadge status={app.status} />
                    </div>
                  );
                })}
                {cardsInColumn.length === 0 && (
                  <div className="flex flex-1 items-center justify-center py-6 text-[11px] text-[var(--body)] opacity-60">No candidates</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        title={
          confirmTarget?.action === 'approve' ? 'Approve & Send Assessment' :
          confirmTarget?.action === 'hire' ? 'Mark as Hired' :
          'Reject Candidate'
        }
        description={
          confirmTarget?.action === 'approve'
            ? `Move ${confirmTarget.app.candidate_name} to the assessment stage and send them an AI interview invitation (7-day expiry).`
            : confirmTarget?.action === 'hire'
            ? `Mark ${confirmTarget.app.candidate_name} as hired and send them a welcome email.`
            : `Reject ${confirmTarget?.app.candidate_name} and send them a notification email.`
        }
        confirmLabel={actionLoading ? 'Processing...' : confirmTarget?.action === 'approve' ? 'Approve & Send' : confirmTarget?.action === 'hire' ? 'Mark as Hired' : 'Reject'}
        variant={confirmTarget?.action === 'reject' ? 'danger' : 'success'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmTarget(null)}
      />

      {scheduleTarget && (
        <ScheduleInterviewModal
          open={!!scheduleTarget}
          applicationId={scheduleTarget.id}
          candidateName={scheduleTarget.candidate_name}
          onClose={() => setScheduleTarget(null)}
          onScheduled={() => { setScheduleTarget(null); onRefresh(); }}
        />
      )}
    </div>
  );
}
