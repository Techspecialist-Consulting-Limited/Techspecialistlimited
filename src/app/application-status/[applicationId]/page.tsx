'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { fetchApplicationStatus, type ApplicationStatus } from '@/lib/recruitment-api';

export default function ApplicationStatusPage() {
  const { applicationId } = useParams();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [status, setStatus] = useState<ApplicationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasChecked, setHasChecked] = useState(false);

  const checkStatus = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!applicationId || Array.isArray(applicationId) || !email.trim()) return;
    setLoading(true);
    setError('');
    setHasChecked(true);
    try {
      const data = await fetchApplicationStatus(applicationId, email.trim());
      setStatus(data);
    } catch {
      setStatus(null);
      setError('We could not find an application matching that email address for this link.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (searchParams.get('email')) {
      checkStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[480px] flex-col justify-center px-6 py-28">
      <h1 className="mb-2 font-syne text-[24px] font-extrabold text-[var(--heading)]">Check Application Status</h1>
      <p className="mb-8 text-[14px] text-[var(--body)]">Enter the email address you applied with to see your current application status.</p>

      <form onSubmit={checkStatus} className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[14px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[var(--blue)] px-6 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--blue)]/90 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check Status'}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700 dark:border-red-800/30 dark:bg-red-900/10 dark:text-red-400">
          {error}
        </div>
      )}

      {status && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]">
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">{status.job_title}</p>
          <p className="mt-1 text-[15px] font-semibold text-[var(--heading)]">Hi {status.candidate_name},</p>
          <div className="mt-4 rounded-xl bg-[rgba(69,132,237,0.06)] px-4 py-3">
            <p className="text-[14px] font-semibold text-[var(--blue)]">{status.status_label}</p>
          </div>
          {status.applied_at && (
            <p className="mt-4 text-[12px] text-[var(--body)]">
              Applied on {new Date(status.applied_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      {!status && !error && hasChecked && !loading && (
        <p className="text-[13px] text-[var(--body)]">No status to show yet.</p>
      )}
    </div>
  );
}
