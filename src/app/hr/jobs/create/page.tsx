'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createJob } from '@/lib/recruitment-api';

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    department: '',
    location: '',
    type: 'Full-time',
    screening_instructions: '',
    stage2_instructions: '',
    stage2_questions: '',
    stage2_topic_labels: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createJob({
        ...form,
        stage2_questions: form.stage2_questions.split('\n').filter(Boolean),
        stage2_topic_labels: form.stage2_topic_labels.split('\n').filter(Boolean),
      });
      router.push('/hr/jobs');
    } catch {
      setError('Failed to create job. Please try again.');
    }
    setLoading(false);
  };

  const inputClass = 'w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[14px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5 dark:text-white';
  const labelClass = 'grid gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]';

  return (
    <div className="mx-auto max-w-[800px]">
      <Link href="/hr/jobs" className="mb-6 inline-flex items-center gap-2 text-[13px] font-medium text-[var(--body)] transition-colors hover:text-[var(--blue)]">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
        Back to Jobs
      </Link>

      <h1 className="mb-2 font-syne text-[28px] font-extrabold text-[var(--heading)]">Create Job Posting</h1>
      <p className="mb-8 text-[14px] text-[var(--body)]">Fill in the details to create a new job posting with AI screening configuration.</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Job Details */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6">
          <h2 className="mb-5 font-syne text-[16px] font-bold text-[var(--heading)]">Job Details</h2>
          <div className="space-y-5">
            <label className={labelClass}>
              Job Title <span className="text-[var(--status-rejected)]">*</span>
              <input required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className={inputClass} placeholder="e.g. Senior Software Engineer" />
            </label>
            <div className="grid gap-5 sm:grid-cols-3">
              <label className={labelClass}>
                Department
                <input value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} className={inputClass} placeholder="e.g. Engineering" />
              </label>
              <label className={labelClass}>
                Location
                <input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} className={inputClass} placeholder="e.g. Lagos, Nigeria" />
              </label>
              <label className={labelClass}>
                Type
                <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className={inputClass}>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Remote</option>
                </select>
              </label>
            </div>
            <label className={labelClass}>
              Description <span className="text-[var(--status-rejected)]">*</span>
              <textarea required rows={4} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={inputClass} placeholder="Job description..." style={{ resize: 'vertical' }} />
            </label>
            <label className={labelClass}>
              Requirements <span className="text-[var(--status-rejected)]">*</span>
              <textarea required rows={4} value={form.requirements} onChange={(e) => setForm((p) => ({ ...p, requirements: e.target.value }))} className={inputClass} placeholder="One requirement per line..." style={{ resize: 'vertical' }} />
            </label>
          </div>
        </div>

        {/* AI Configuration */}
        <div className="rounded-xl border border-[rgba(69,132,237,0.15)] p-6" style={{ background: 'rgba(69, 132, 237, 0.02)' }}>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'rgba(69, 132, 237, 0.1)' }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--blue)" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
            </div>
            <h2 className="font-syne text-[16px] font-bold text-[var(--heading)]">AI Configuration</h2>
          </div>
          <div className="space-y-5">
            <label className={labelClass}>
              CV Screening Instructions
              <textarea rows={3} value={form.screening_instructions} onChange={(e) => setForm((p) => ({ ...p, screening_instructions: e.target.value }))} className={inputClass} placeholder="e.g. Focus on Python experience, relevant projects, and leadership skills" style={{ resize: 'vertical' }} />
            </label>
            <label className={labelClass}>
              Assessment Instructions
              <textarea rows={3} value={form.stage2_instructions} onChange={(e) => setForm((p) => ({ ...p, stage2_instructions: e.target.value }))} className={inputClass} placeholder="Instructions for the voice interview AI evaluator" style={{ resize: 'vertical' }} />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className={labelClass}>
                Assessment Questions
                <textarea rows={4} value={form.stage2_questions} onChange={(e) => setForm((p) => ({ ...p, stage2_questions: e.target.value }))} className={inputClass} placeholder="One question per line" style={{ resize: 'vertical' }} />
                <span className="text-[10px] font-normal normal-case text-[var(--body)]">
                  {form.stage2_questions.split('\n').filter(Boolean).length} question(s)
                </span>
              </label>
              <label className={labelClass}>
                Topic Labels
                <textarea rows={4} value={form.stage2_topic_labels} onChange={(e) => setForm((p) => ({ ...p, stage2_topic_labels: e.target.value }))} className={inputClass} placeholder="One label per line (matches 1:1 with questions)" style={{ resize: 'vertical' }} />
                <span className="text-[10px] font-normal normal-case text-[var(--body)]">
                  {form.stage2_topic_labels.split('\n').filter(Boolean).length} label(s)
                </span>
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">{error}</div>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/hr/jobs" className="rounded-md border border-[var(--border)] px-6 py-3 text-[13px] font-semibold text-[var(--body)] transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)]">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Job'}
          </button>
        </div>
      </form>
    </div>
  );
}
