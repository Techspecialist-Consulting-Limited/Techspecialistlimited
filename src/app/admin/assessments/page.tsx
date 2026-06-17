'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Assessment {
  id: string;
  email: string;
  company_name: string;
  total_score: number;
  max_score: number;
  level: string;
  scores: Record<string, { score: number; maxScore: number; percentage: number }>;
  created_at: string;
  followed_up?: boolean;
}

const levelColors: Record<string, string> = {
  'AI Explorer': '#94a3b8',
  'AI Builder': '#f59e0b',
  'AI Accelerator': '#4584ed',
  'AI Leader': '#10b981',
};

export default function AdminAssessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [showTokenForm, setShowTokenForm] = useState(true);

  const fetchAssessments = useCallback(async (token: string) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/admin/assessments', {
        headers: {
          'x-admin-token': token,
        },
      });

      if (!response.ok) {
        throw new Error('Unauthorized or failed to fetch');
      }

      const result = await response.json();
      setAssessments(result.data || []);
      setShowTokenForm(false);
      localStorage.setItem('admin_token', token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const savedToken = localStorage.getItem('admin_token');
      if (savedToken) {
        setAdminToken(savedToken);
        fetchAssessments(savedToken);
      } else {
        setLoading(false);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [fetchAssessments]);

  const handleTokenSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (adminToken) {
      fetchAssessments(adminToken);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setAdminToken('');
    setShowTokenForm(true);
    setAssessments([]);
  };

  const toggleFollowUp = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/assessments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({
          id,
          followed_up: !currentStatus,
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      setAssessments(assessments.map(a =>
        a.id === id ? { ...a, followed_up: !currentStatus } : a
      ));
    } catch (err) {
      alert('Failed to update assessment');
    }
  };

  const exportToCSV = () => {
    const headers = ['Company', 'Email', 'Score', 'Level', 'Date', 'Followed Up'];
    const rows = filteredAssessments.map(a => [
      a.company_name,
      a.email,
      `${a.total_score}/${a.max_score}`,
      a.level,
      new Date(a.created_at).toLocaleDateString(),
      a.followed_up ? 'Yes' : 'No',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredAssessments = filterLevel
    ? assessments.filter(a => a.level === filterLevel)
    : assessments;

  const percentageScore = (a: Assessment) =>
    Math.round((a.total_score / a.max_score) * 100);

  if (showTokenForm) {
    return (
      <div className="mx-auto max-w-[400px] p-5 sm:p-8">
        <h1 className="mb-5 text-xl font-bold sm:text-2xl">Admin Access</h1>
        <form onSubmit={handleTokenSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Enter admin token"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
          />
          <button
            type="submit"
            className="w-full rounded bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            Login
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Assessment Dashboard</h1>
        <button
          onClick={handleLogout}
          className="self-start rounded bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 sm:self-auto"
        >
          Logout
        </button>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm sm:w-auto"
        >
          <option value="">All Levels</option>
          <option value="AI Explorer">AI Explorer</option>
          <option value="AI Builder">AI Builder</option>
          <option value="AI Accelerator">AI Accelerator</option>
          <option value="AI Leader">AI Leader</option>
        </select>

        <button
          onClick={exportToCSV}
          className="w-full rounded bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 sm:w-auto"
        >
          Export to CSV
        </button>

        <span className="text-sm text-gray-500">
          {filteredAssessments.length} assessment{filteredAssessments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : filteredAssessments.length === 0 ? (
        <p className="text-gray-400">No assessments found</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-lg border border-gray-200 md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 text-center font-semibold">Score</th>
                  <th className="px-4 py-3 text-center font-semibold">Level</th>
                  <th className="px-4 py-3 text-center font-semibold">Date</th>
                  <th className="px-4 py-3 text-center font-semibold">Followed Up</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.map((assessment) => (
                  <tr key={assessment.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{assessment.company_name}</td>
                    <td className="px-4 py-3 text-gray-600">{assessment.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className="inline-block rounded px-2 py-1 text-sm font-bold"
                        style={{
                          background: `${levelColors[assessment.level]}20`,
                          color: levelColors[assessment.level],
                        }}
                      >
                        {assessment.total_score}/{assessment.max_score} ({percentageScore(assessment)}%)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className="inline-block rounded px-2 py-1 text-sm"
                        style={{
                          background: `${levelColors[assessment.level]}20`,
                          color: levelColors[assessment.level],
                        }}
                      >
                        {assessment.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500">
                      {new Date(assessment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleFollowUp(assessment.id, assessment.followed_up || false)}
                        className={`rounded px-3 py-1.5 text-xs font-medium text-white transition-colors ${
                          assessment.followed_up ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                        }`}
                      >
                        {assessment.followed_up ? '✓ Done' : 'Pending'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {filteredAssessments.map((assessment) => (
              <div
                key={assessment.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <strong className="text-sm">{assessment.company_name}</strong>
                    <p className="text-xs text-gray-500">{assessment.email}</p>
                  </div>
                  <button
                    onClick={() => toggleFollowUp(assessment.id, assessment.followed_up || false)}
                    className={`rounded px-2.5 py-1 text-xs font-medium text-white ${
                      assessment.followed_up ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  >
                    {assessment.followed_up ? '✓ Done' : 'Pending'}
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                  <span
                    className="inline-block rounded px-2 py-0.5 text-xs font-bold"
                    style={{
                      background: `${levelColors[assessment.level]}20`,
                      color: levelColors[assessment.level],
                    }}
                  >
                    {assessment.total_score}/{assessment.max_score} ({percentageScore(assessment)}%)
                  </span>
                  <span
                    className="inline-block rounded px-2 py-0.5 text-xs"
                    style={{
                      background: `${levelColors[assessment.level]}20`,
                      color: levelColors[assessment.level],
                    }}
                  >
                    {assessment.level}
                  </span>
                  <span>{new Date(assessment.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
