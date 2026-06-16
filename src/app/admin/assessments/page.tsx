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
      <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
        <h1 style={{ marginBottom: '20px' }}>Admin Access</h1>
        <form onSubmit={handleTokenSubmit}>
          <input
            type="password"
            placeholder="Enter admin token"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
            required
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '10px',
              background: '#4584ed',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Login
          </button>
        </form>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Assessment Dashboard</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          <option value="">All Levels</option>
          <option value="AI Explorer">AI Explorer</option>
          <option value="AI Builder">AI Builder</option>
          <option value="AI Accelerator">AI Accelerator</option>
          <option value="AI Leader">AI Leader</option>
        </select>

        <button
          onClick={exportToCSV}
          style={{
            padding: '8px 16px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Export to CSV
        </button>

        <span style={{ color: '#666', fontSize: '14px' }}>
          {filteredAssessments.length} assessments
        </span>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filteredAssessments.length === 0 ? (
        <p style={{ color: '#999' }}>No assessments found</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '12px' }}>Company</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Email</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>Score</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>Level</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>Date</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>Followed Up</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssessments.map((assessment) => (
                <tr key={assessment.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    <strong>{assessment.company_name}</strong>
                  </td>
                  <td style={{ padding: '12px' }}>{assessment.email}</td>
                  <td style={{ textAlign: 'center', padding: '12px' }}>
                    <span
                      style={{
                        background: `${levelColors[assessment.level]}20`,
                        color: levelColors[assessment.level],
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                      }}
                    >
                      {assessment.total_score}/{assessment.max_score} ({percentageScore(assessment)}%)
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px' }}>
                    <span
                      style={{
                        background: `${levelColors[assessment.level]}20`,
                        color: levelColors[assessment.level],
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '13px',
                      }}
                    >
                      {assessment.level}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px', fontSize: '13px', color: '#666' }}>
                    {new Date(assessment.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px' }}>
                    <button
                      onClick={() => toggleFollowUp(assessment.id, assessment.followed_up || false)}
                      style={{
                        padding: '6px 12px',
                        background: assessment.followed_up ? '#10b981' : '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      {assessment.followed_up ? '✓ Done' : 'Pending'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
