'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchJob, submitApplication, type Job } from '@/lib/recruitment-api';
import { supabase } from '@/lib/supabase';
import { BrandedLoader, EmptyState, FileUploadZone } from '@/components/recruitment';

type Step = 1 | 2 | 3;

function ApplyForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get('id');

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(!!jobId);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<Step>(1);

  const [formData, setFormData] = useState({
    applicant_name: '',
    applicant_email: '',
    phone: '',
    cover_letter_text: '',
  });
  const [resume, setResume] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState<File | null>(null);

  useEffect(() => {
    if (!jobId) return;
    (async () => {
      try {
        const data = await fetchJob(jobId);
        setJob(data);
      } catch {
        // Fall back to Supabase
        try {
          if (supabase) {
            const { data, error } = await supabase.from('jobs').select('*').eq('id', jobId).single();
            if (!error && data) setJob(data as Job);
          }
        } catch { /* empty */ }
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  const handleSubmit = async () => {
    if (!jobId) return;
    setSubmitting(true);
    setError('');
    try {
      // Try FastAPI backend first
      const fd = new FormData();
      fd.append('candidate_name', formData.applicant_name);
      fd.append('candidate_email', formData.applicant_email);
      if (formData.phone) fd.append('phone', formData.phone);
      if (formData.cover_letter_text) fd.append('cover_letter_text', formData.cover_letter_text);
      if (resume) fd.append('cv', resume);
      if (coverLetter) fd.append('cover_letter', coverLetter);
      await submitApplication(jobId, fd);
      setSubmitted(true);
    } catch {
      // Fall back to existing Supabase-based /api/apply route
      try {
        const fd = new FormData();
        fd.append('job_id', jobId);
        fd.append('applicant_name', formData.applicant_name);
        fd.append('applicant_email', formData.applicant_email);
        if (formData.phone) fd.append('phone', formData.phone);
        if (formData.cover_letter_text) fd.append('cover_letter_text', formData.cover_letter_text);
        if (resume) fd.append('resume', resume);
        if (coverLetter) fd.append('cover_letter', coverLetter);
        const res = await fetch('/api/apply', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Failed');
        setSubmitted(true);
      } catch {
        setError('Something went wrong. Please try again.');
      }
    }
    setSubmitting(false);
  };

  const canProceedStep1 = formData.applicant_name.trim() && formData.applicant_email.trim();
  const canProceedStep2 = !!resume;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <BrandedLoader text="Loading job details..." />
      </div>
    );
  }

  if (!jobId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          }
          title="No Position Selected"
          description="Please browse our open positions and apply from there."
          action={{ label: 'Browse Careers', onClick: () => router.push('/careers') }}
        />
      </div>
    );
  }

  /* ── Success State ── */
  if (submitted) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-6"
        style={{ background: 'linear-gradient(135deg, var(--blue), var(--blue-dark))' }}
      >
        <div
          className="w-full max-w-[480px] rounded-2xl bg-white p-10 text-center"
          style={{ boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.5s ease' }}
        >
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: 'rgba(34, 197, 94, 0.1)' }}
          >
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="var(--score-high)" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="font-syne mb-2 text-2xl font-extrabold text-[var(--heading)]">
            Application Submitted!
          </h2>
          <p className="mb-6 text-[14px] leading-relaxed text-[var(--body)]">
            Thank you for applying{job ? ` for ${job.title}` : ''}. We&apos;ll review your application and get back to you soon.
          </p>
          {/* Divider */}
          <div className="mx-auto mb-6 h-[2px] w-12 rounded" style={{ background: 'linear-gradient(90deg, var(--blue), var(--orange))' }} />
          <div className="mb-6 space-y-3 text-left">
            {[
              { icon: '1', text: 'AI-assisted screening of your CV' },
              { icon: '2', text: 'Voice-based AI interview (if shortlisted)' },
              { icon: '3', text: 'Team review and final decision' },
            ].map((item) => (
              <div key={item.icon} className="flex items-center gap-3">
                <div
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: 'var(--blue)' }}
                >
                  {item.icon}
                </div>
                <span className="text-[13px] text-[var(--body)]">{item.text}</span>
              </div>
            ))}
          </div>
          <Link
            href="/careers"
            className="btn-primary inline-block text-center"
          >
            Browse More Careers
          </Link>
        </div>
      </div>
    );
  }

  /* ── Step Progress ── */
  const steps = [
    { num: 1, label: 'Your Details' },
    { num: 2, label: 'Documents' },
    { num: 3, label: 'Review' },
  ];

  const inputClass =
    'w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[14px] normal-case tracking-normal text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5 dark:text-white';
  const labelClass =
    'grid gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]';

  return (
    <div style={{ marginTop: '68px' }}>
      <div className="mx-auto max-w-[720px] px-6 py-12 lg:py-16">
        {/* Back link */}
        <Link
          href={`/careers/${jobId}`}
          className="mb-6 inline-flex items-center gap-2 text-[13px] font-medium text-[var(--body)] transition-colors hover:text-[var(--blue)]"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Job
        </Link>

        <h1 className="section-title mb-2" style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}>
          Apply for <em>{job?.title || 'this position'}</em>
        </h1>
        {job?.description && (
          <p className="mb-8 text-[14px] leading-relaxed text-[var(--body)]">{job.description}</p>
        )}

        {/* Step indicator */}
        <div className="mb-10 flex items-center gap-0">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center" style={{ flex: i < steps.length - 1 ? 1 : 'none' }}>
              <button
                onClick={() => {
                  if (s.num === 1) setStep(1);
                  if (s.num === 2 && canProceedStep1) setStep(2);
                  if (s.num === 3 && canProceedStep1 && canProceedStep2) setStep(3);
                }}
                className="flex items-center gap-2"
              >
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors"
                  style={{
                    background: step >= s.num ? 'var(--blue)' : 'var(--bg-soft)',
                    color: step >= s.num ? '#fff' : 'var(--body)',
                    border: step >= s.num ? 'none' : '1px solid var(--border)',
                  }}
                >
                  {step > s.num ? (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    s.num
                  )}
                </div>
                <span
                  className="hidden text-[12px] font-semibold sm:inline"
                  style={{ color: step >= s.num ? 'var(--heading)' : 'var(--body)' }}
                >
                  {s.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div
                  className="mx-3 h-px flex-1"
                  style={{ background: step > s.num ? 'var(--blue)' : 'var(--border)' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Personal Details */}
        {step === 1 && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <h2 className="mb-6 font-syne text-lg font-bold text-[var(--heading)]">Personal Details</h2>
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClass}>
                  Full Name <span className="text-[var(--status-rejected)]">*</span>
                  <input
                    required
                    value={formData.applicant_name}
                    onChange={(e) => setFormData((p) => ({ ...p, applicant_name: e.target.value }))}
                    className={inputClass}
                    placeholder="Your full name"
                  />
                </label>
                <label className={labelClass}>
                  Email <span className="text-[var(--status-rejected)]">*</span>
                  <input
                    required
                    type="email"
                    value={formData.applicant_email}
                    onChange={(e) => setFormData((p) => ({ ...p, applicant_email: e.target.value }))}
                    className={inputClass}
                    placeholder="you@example.com"
                  />
                </label>
              </div>
              <label className={labelClass}>
                Phone Number
                <input
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  className={inputClass}
                  placeholder="+234..."
                />
              </label>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Documents */}
        {step === 2 && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <h2 className="mb-6 font-syne text-lg font-bold text-[var(--heading)]">Documents</h2>
            <div className="space-y-6">
              <FileUploadZone
                label="CV / Resume"
                accept=".pdf,.doc,.docx,.txt"
                required
                maxSizeMB={10}
                file={resume}
                onFileSelect={setResume}
              />
              <FileUploadZone
                label="Cover Letter"
                accept=".pdf,.doc,.docx"
                maxSizeMB={5}
                compact
                file={coverLetter}
                onFileSelect={setCoverLetter}
              />
              <div>
                <button
                  onClick={() => {
                    const el = document.getElementById('cover-text-toggle');
                    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                  }}
                  className="text-[13px] font-semibold text-[var(--blue)] transition-colors hover:text-[var(--blue-dark)]"
                >
                  Or write a cover message instead
                </button>
                <div id="cover-text-toggle" style={{ display: formData.cover_letter_text ? 'block' : 'none' }} className="mt-3">
                  <label className={labelClass}>
                    Cover Message
                    <textarea
                      rows={4}
                      value={formData.cover_letter_text}
                      onChange={(e) => setFormData((p) => ({ ...p, cover_letter_text: e.target.value }))}
                      className={inputClass}
                      placeholder="Tell us why you're a great fit..."
                      style={{ resize: 'vertical' }}
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="rounded-md border border-[var(--border)] px-5 py-2.5 text-[13px] font-semibold text-[var(--body)] transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)]"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Review Application
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <h2 className="mb-6 font-syne text-lg font-bold text-[var(--heading)]">Review Your Application</h2>

            <div className="space-y-4">
              {/* Personal info card */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5 dark:border-white/10 dark:bg-[#101827]">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Personal Details</span>
                  <button onClick={() => setStep(1)} className="text-[12px] font-semibold text-[var(--blue)]">Edit</button>
                </div>
                <div className="grid gap-2 text-[13px] sm:grid-cols-2">
                  <div><span className="text-[var(--body)]">Name:</span> <span className="font-medium text-[var(--heading)]">{formData.applicant_name}</span></div>
                  <div><span className="text-[var(--body)]">Email:</span> <span className="font-medium text-[var(--heading)]">{formData.applicant_email}</span></div>
                  {formData.phone && <div><span className="text-[var(--body)]">Phone:</span> <span className="font-medium text-[var(--heading)]">{formData.phone}</span></div>}
                </div>
              </div>

              {/* Documents card */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5 dark:border-white/10 dark:bg-[#101827]">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Documents</span>
                  <button onClick={() => setStep(2)} className="text-[12px] font-semibold text-[var(--blue)]">Edit</button>
                </div>
                <div className="space-y-2 text-[13px]">
                  {resume && (
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--score-high)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      <span className="text-[var(--heading)]">CV: {resume.name}</span>
                    </div>
                  )}
                  {coverLetter && (
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--score-high)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      <span className="text-[var(--heading)]">Cover Letter: {coverLetter.name}</span>
                    </div>
                  )}
                  {formData.cover_letter_text && (
                    <div className="flex items-start gap-2">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--score-high)" strokeWidth={2} className="mt-0.5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      <span className="text-[var(--heading)]">Cover message included</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="rounded-md border border-[var(--border)] px-5 py-2.5 text-[13px] font-semibold text-[var(--body)] transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)]"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <BrandedLoader text="Loading..." />
        </div>
      }
    >
      <ApplyForm />
    </Suspense>
  );
}
