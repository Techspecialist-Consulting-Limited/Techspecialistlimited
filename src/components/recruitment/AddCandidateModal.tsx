'use client';

import { useState } from 'react';
import { manualInterviewInvite } from '@/lib/recruitment-api';

interface AddCandidateModalProps {
  open: boolean;
  jobId: string;
  onClose: () => void;
  onAdded: () => void;
}

const emptyForm = {
  candidate_name: '',
  candidate_email: '',
  expiration_days: 7,
};

export default function AddCandidateModal({ open, jobId, onClose, onAdded }: AddCandidateModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [cv, setCv] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.candidate_name.trim() || !form.candidate_email.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await manualInterviewInvite({
        jobId,
        candidateName: form.candidate_name.trim(),
        candidateEmail: form.candidate_email.trim(),
        expirationDays: form.expiration_days,
        cv,
        coverLetter,
      });
      setForm(emptyForm);
      setCv(null);
      setCoverLetter(null);
      onAdded();
    } catch {
      setError('Failed to add candidate. Please try again.');
    }
    setSubmitting(false);
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  const inputClass = 'mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-[11px] text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5';
  const labelClass = 'text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={handleClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl bg-[var(--bg)] p-7 shadow-2xl"
        style={{ width: '480px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <h3 className="mb-1 text-[16px] font-bold text-[var(--heading)]">Add Candidate for AI Interview</h3>
        <p className="mb-5 text-[12px] text-[var(--body)]">For candidates who applied outside the platform (e.g. directly by email). This skips CV screening and sends the AI interview invite immediately.</p>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Candidate Name</label>
            <input
              type="text"
              value={form.candidate_name}
              onChange={(e) => setForm({ ...form, candidate_name: e.target.value })}
              placeholder="e.g. Jane Doe"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Candidate Email</label>
            <input
              type="email"
              value={form.candidate_email}
              onChange={(e) => setForm({ ...form, candidate_email: e.target.value })}
              placeholder="jane@example.com"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>CV (optional)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => setCv(e.target.files?.[0] || null)}
                className="mt-1 w-full text-[12px] text-[var(--body)] file:mr-3 file:rounded-lg file:border-0 file:bg-[rgba(69,132,237,0.1)] file:px-3 file:py-2 file:text-[11px] file:font-semibold file:text-[var(--blue)]"
              />
            </div>
            <div>
              <label className={labelClass}>Cover Letter (optional)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => setCoverLetter(e.target.files?.[0] || null)}
                className="mt-1 w-full text-[12px] text-[var(--body)] file:mr-3 file:rounded-lg file:border-0 file:bg-[rgba(69,132,237,0.1)] file:px-3 file:py-2 file:text-[11px] file:font-semibold file:text-[var(--blue)]"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Interview Link Expires In (days)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={form.expiration_days}
              onChange={(e) => setForm({ ...form, expiration_days: parseInt(e.target.value) || 7 })}
              className={inputClass}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700 dark:border-red-800/30 dark:bg-red-900/10 dark:text-red-400">{error}</div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-[13px] font-medium text-[var(--body)] transition-all hover:border-[var(--blue)] hover:text-[var(--blue)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.candidate_name.trim() || !form.candidate_email.trim()}
            className="rounded-xl px-5 py-2.5 text-[13px] font-bold text-white transition-all disabled:opacity-40"
            style={{
              background: 'var(--blue)',
              opacity: submitting || !form.candidate_name.trim() || !form.candidate_email.trim() ? 0.5 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Sending Invite...' : 'Send AI Interview Invite'}
          </button>
        </div>
      </div>
    </div>
  );
}
