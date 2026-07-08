'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginHR, forgotPassword } from '@/lib/recruitment-api';
import { setHRAuth } from '@/lib/auth';

export default function HRLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [forgotMessage, setForgotMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await loginHR(email, password);
      setHRAuth(token, email);
      router.replace('/hr');
    } catch {
      setError('Invalid credentials. Please try again.');
    }
    setLoading(false);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { message } = await forgotPassword(email);
      setForgotMessage(message);
    } catch {
      setForgotMessage('If that email exists, a reset link has been sent.');
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
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-extrabold text-white" style={{ background: 'var(--blue)' }}>
            TS
          </div>
          <h1 className="font-syne text-[24px] font-extrabold text-[var(--heading)]">HR Portal</h1>
          <p className="mt-1 text-[14px] text-[var(--body)]">
            {mode === 'login' ? 'Sign in to manage recruitment' : 'Reset your password'}
          </p>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[14px] normal-case tracking-normal text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)]"
                placeholder="hr@techspecialist.com"
              />
            </label>
            <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">
              Password
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[14px] normal-case tracking-normal text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)]"
                placeholder="Enter your password"
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => { setMode('forgot'); setError(''); setForgotMessage(''); }}
              className="w-full text-center text-[13px] font-medium text-[var(--body)] transition-colors hover:text-[var(--blue)]"
            >
              Forgot password?
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-5">
            <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[14px] normal-case tracking-normal text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)]"
                placeholder="hr@techspecialist.com"
              />
            </label>

            {forgotMessage ? (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[13px] font-medium text-green-700">
                {forgotMessage}
              </div>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-center disabled:cursor-not-allowed disabled:opacity-50"
                style={{ display: 'block' }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            )}

            <button
              type="button"
              onClick={() => { setMode('login'); setForgotMessage(''); }}
              className="w-full text-center text-[13px] font-medium text-[var(--body)] transition-colors hover:text-[var(--blue)]"
            >
              Back to sign in
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-[13px] text-[var(--body)] transition-colors hover:text-[var(--blue)]">
            Back to Website
          </Link>
        </div>
      </div>
    </div>
  );
}
