'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { resetPassword } from '@/lib/recruitment-api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
    } catch {
      setError('This link is invalid or has expired. Please request a new one.');
    }
    setLoading(false);
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      style={{
        background: 'var(--navy)',
        backgroundImage: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(69, 132, 237, 0.12) 0%, transparent 65%)',
      }}
    >
      <div
        className="w-full max-w-[440px] rounded-2xl bg-white p-10"
        style={{ boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.5s ease' }}
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-extrabold text-white" style={{ background: 'var(--blue)' }}>
            TS
          </div>
          <h1 className="font-syne text-[24px] font-extrabold text-[var(--heading)]">
            {done ? 'Password Set' : 'Set Your Password'}
          </h1>
          <p className="mt-1 text-[14px] text-[var(--body)]">
            {done ? 'You can now sign in with your new password.' : 'Choose a password for your HR Portal account'}
          </p>
        </div>

        {done ? (
          <Link href="/hr/login" className="btn-primary block w-full text-center">
            Go to Sign In
          </Link>
        ) : !token ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
            No reset token was provided. Please use the link from your email.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">
              New Password
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[14px] normal-case tracking-normal text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)]"
                placeholder="At least 8 characters"
              />
            </label>
            <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">
              Confirm Password
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[14px] normal-case tracking-normal text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)]"
                placeholder="Re-enter your password"
              />
            </label>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center disabled:cursor-not-allowed disabled:opacity-50"
              style={{ display: 'block' }}
            >
              {loading ? 'Saving...' : 'Set Password'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/hr/login" className="text-[13px] text-[var(--body)] transition-colors hover:text-[var(--blue)]">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
