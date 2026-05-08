'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function ApplyForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get('id');

  const [job, setJob] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(!!jobId);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
        if (!supabase) {
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobId)
          .single()
        if (!error && data) setJob(data);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('job_id', jobId);
      fd.append('applicant_name', formData.applicant_name);
      fd.append('applicant_email', formData.applicant_email);
      fd.append('phone', formData.phone);
      fd.append('cover_letter_text', formData.cover_letter_text);
      if (resume) fd.append('resume', resume);
      if (coverLetter) fd.append('cover_letter', coverLetter);

      const res = await fetch('/api/apply', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Failed');
      setSubmitted(true);
    } catch (err) {
      alert('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-[#4584ed] border-t-transparent" />
          <p className="text-gray-600 dark:text-gray-400">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!jobId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">🔍</div>
          <h2 className="mb-4 text-2xl font-bold text-[#2f2f2f] dark:text-white">No Job Selected</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">Please browse our open positions and apply from there.</p>
          <Link href="/careers" className="text-[#4584ed] hover:underline">← Browse Careers</Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">✅</div>
          <h2 className="mb-4 text-2xl font-bold text-[#2f2f2f] dark:text-white">Application Submitted!</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">We&apos;ll review your application and get back to you.</p>
          <Link href="/careers" className="text-[#4584ed] hover:underline">← Browse More Careers</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '68px' }}>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href={`/careers/${jobId}`} className="mb-6 inline-flex items-center gap-2 text-sm text-[#5f6368] hover:text-[#4584ed]">
          ← Back to Job
        </Link>
        <h1 className="mb-2 font-serif text-3xl font-normal leading-tight tracking-[-0.03em] text-[#2f2f2f] dark:text-white sm:text-4xl">
          Apply for <span className="text-[#4584ed]">{job?.title || 'this position'}</span>
        </h1>
        {job?.description && (
          <p className="mb-8 text-[#5f6368] dark:text-gray-300">{job.description}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#5f6368] dark:text-white/55">
              Full Name *
              <input required value={formData.applicant_name} onChange={(e) => setFormData(p => ({ ...p, applicant_name: e.target.value }))} className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#2f2f2f] outline-none focus:border-[#4584ed] dark:border-white/10 dark:bg-white/5 dark:text-white" />
            </label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#5f6368] dark:text-white/55">
              Email *
              <input required type="email" value={formData.applicant_email} onChange={(e) => setFormData(p => ({ ...p, applicant_email: e.target.value }))} className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#2f2f2f] outline-none focus:border-[#4584ed] dark:border-white/10 dark:bg-white/5 dark:text-white" />
            </label>
          </div>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#5f6368] dark:text-white/55">
            Phone
            <input value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#2f2f2f] outline-none focus:border-[#4584ed] dark:border-white/10 dark:bg-white/5 dark:text-white" />
          </label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#5f6368] dark:text-white/55">
            Cover Letter / Message
            <textarea rows={5} value={formData.cover_letter_text} onChange={(e) => setFormData(p => ({ ...p, cover_letter_text: e.target.value }))} className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#2f2f2f] outline-none focus:border-[#4584ed] dark:border-white/10 dark:bg-white/5 dark:text-white" />
          </label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#5f6368] dark:text-white/55">
            Resume / CV *
            <input required type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResume(e.target.files?.[0] || null)} className="text-sm text-[#5f6368] file:mr-4 file:rounded-lg file:border-0 file:bg-[#4584ed] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#2d65c4] dark:text-gray-300" />
          </label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#5f6368] dark:text-white/55">
            Cover Letter (file)
            <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCoverLetter(e.target.files?.[0] || null)} className="text-sm text-[#5f6368] file:mr-4 file:rounded-lg file:border-0 file:bg-[#4584ed] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#2d65c4] dark:text-gray-300" />
          </label>
          <button type="submit" disabled={submitting} className="w-full rounded-lg bg-[#4584ed] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(69,132,237,0.3)] transition hover:bg-[#2d65c4] disabled:cursor-not-allowed disabled:bg-gray-400">
            {submitting ? 'Submitting...' : 'Submit Application →'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-[#4584ed] border-t-transparent" />
      </div>
    }>
      <ApplyForm />
    </Suspense>
  );
}
