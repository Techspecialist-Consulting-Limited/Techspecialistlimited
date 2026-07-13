'use client';

import { useState } from 'react';
import { createInterview } from '@/lib/recruitment-api';

interface ScheduleInterviewModalProps {
  open: boolean;
  applicationId: string;
  candidateName: string;
  onClose: () => void;
  onScheduled: () => void;
}

const emptyForm = {
  interview_type: 'physical',
  scheduled_date: '',
  scheduled_time: '',
  duration_minutes: 60,
  location: '',
  meeting_link: '',
  interviewer_name: '',
  notes: '',
};

export default function ScheduleInterviewModal({ open, applicationId, candidateName, onClose, onScheduled }: ScheduleInterviewModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.scheduled_date || !form.scheduled_time) return;
    setSubmitting(true);
    setError('');
    try {
      await createInterview({ application_id: applicationId, ...form });
      setForm(emptyForm);
      onScheduled();
    } catch {
      setError('Failed to schedule interview. Please try again.');
    }
    setSubmitting(false);
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

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
        <h3 className="mb-5 text-[16px] font-bold text-[var(--heading)]">Schedule Interview · {candidateName}</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Date</label>
              <input
                type="date"
                value={form.scheduled_date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-[11px] text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Time</label>
              <input
                type="time"
                value={form.scheduled_time}
                onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-[11px] text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Duration (min)</label>
              <input
                type="number"
                value={form.duration_minutes}
                min={15}
                step={15}
                onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })}
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
                  onClick={() => setForm({ ...form, interview_type: type })}
                  className={`flex-1 rounded-xl px-4 py-[10px] text-[12px] font-medium capitalize transition-all ${
                    form.interview_type === type
                      ? 'border-[1.5px] border-[var(--blue)] bg-[rgba(69,132,237,0.06)] text-[var(--blue)]'
                      : 'border border-[var(--border)] bg-transparent text-[var(--body)] hover:border-[var(--blue)]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {form.interview_type === 'virtual' && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Meeting Link</label>
              <input
                type="url"
                value={form.meeting_link}
                onChange={(e) => setForm({ ...form, meeting_link: e.target.value })}
                placeholder="https://meet.google.com/..."
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-[11px] text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
              />
            </div>
          )}

          {form.interview_type === 'physical' && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Office address, room number..."
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-[11px] text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
              />
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Interviewer</label>
            <input
              type="text"
              value={form.interviewer_name}
              onChange={(e) => setForm({ ...form, interviewer_name: e.target.value })}
              placeholder="e.g. John Smith"
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-[11px] text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Notes (sent to candidate)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Preparation instructions, documents to bring, etc."
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-[11px] text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
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
            disabled={submitting || !form.scheduled_date || !form.scheduled_time}
            className="rounded-xl px-5 py-2.5 text-[13px] font-bold text-white transition-all disabled:opacity-40"
            style={{
              background: 'var(--blue)',
              opacity: submitting || !form.scheduled_date || !form.scheduled_time ? 0.5 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Scheduling...' : 'Schedule Interview'}
          </button>
        </div>
      </div>
    </div>
  );
}
