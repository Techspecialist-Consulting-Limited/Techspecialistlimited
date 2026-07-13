'use client';

import { useEffect, useState } from 'react';
import { createScorecard, fetchScorecardsByApplication, type Scorecard } from '@/lib/recruitment-api';

interface ScorecardPanelProps {
  applicationId: string;
}

const CRITERIA: { key: 'communication_score' | 'technical_score' | 'culture_fit_score' | 'problem_solving_score'; label: string }[] = [
  { key: 'communication_score', label: 'Communication' },
  { key: 'technical_score', label: 'Technical / Role Fit' },
  { key: 'culture_fit_score', label: 'Culture Fit' },
  { key: 'problem_solving_score', label: 'Problem Solving' },
];

const RECOMMENDATION_OPTIONS: { value: Scorecard['recommendation']; label: string; color: string }[] = [
  { value: 'strong_yes', label: 'Strong Yes', color: 'var(--score-high)' },
  { value: 'yes', label: 'Yes', color: 'var(--blue)' },
  { value: 'no', label: 'No', color: 'var(--score-mid)' },
  { value: 'strong_no', label: 'Strong No', color: 'var(--status-rejected)' },
];

const emptyForm = {
  interviewer_name: '',
  communication_score: 3,
  technical_score: 3,
  culture_fit_score: 3,
  problem_solving_score: 3,
  recommendation: 'yes' as Scorecard['recommendation'],
  notes: '',
};

export default function ScorecardPanel({ applicationId }: ScorecardPanelProps) {
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchScorecardsByApplication(applicationId).then(setScorecards).catch(() => {});
  }, [applicationId]);

  const handleSubmit = async () => {
    if (!form.interviewer_name.trim()) {
      setError('Interviewer name is required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createScorecard({ application_id: applicationId, ...form, notes: form.notes || undefined });
      const data = await fetchScorecardsByApplication(applicationId);
      setScorecards(data);
      setForm(emptyForm);
      setShowForm(false);
    } catch {
      setError('Failed to submit scorecard. Please try again.');
    }
    setSubmitting(false);
  };

  const recLabel = (r: Scorecard['recommendation']) => RECOMMENDATION_OPTIONS.find((o) => o.value === r)?.label || r;
  const recColor = (r: Scorecard['recommendation']) => RECOMMENDATION_OPTIONS.find((o) => o.value === r)?.color || 'var(--body)';

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] dark:border-white/10 dark:bg-[#101827]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 dark:border-white/10">
        <h2 className="text-[15px] font-bold text-[var(--heading)]">Team Decision Scorecards</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md border border-[var(--blue)] px-3 py-1.5 text-[12px] font-bold text-[var(--blue)] transition-colors hover:bg-[var(--blue)] hover:text-white"
        >
          {showForm ? 'Cancel' : '+ Add Scorecard'}
        </button>
      </div>

      <div className="p-6">
        {showForm && (
          <div className="mb-6 space-y-4 rounded-xl border border-[var(--border)] p-5 dark:border-white/10">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Interviewer Name</label>
              <input
                type="text"
                value={form.interviewer_name}
                onChange={(e) => setForm({ ...form, interviewer_name: e.target.value })}
                placeholder="e.g. Jane Doe"
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-[10px] text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {CRITERIA.map((c) => (
                <div key={c.key}>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">{c.label}</label>
                    <span className="text-[12px] font-bold text-[var(--heading)]">{form[c.key]}/5</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={form[c.key]}
                    onChange={(e) => setForm({ ...form, [c.key]: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Recommendation</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {RECOMMENDATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setForm({ ...form, recommendation: opt.value })}
                    className="flex-1 rounded-xl px-4 py-[10px] text-[12px] font-semibold transition-all"
                    style={{
                      border: form.recommendation === opt.value ? `1.5px solid ${opt.color}` : '1px solid var(--border)',
                      background: form.recommendation === opt.value ? `${opt.color}14` : 'transparent',
                      color: form.recommendation === opt.value ? opt.color : 'var(--body)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Interview observations, strengths, concerns..."
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-[10px] text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            {error && <p className="text-[12px] font-medium text-red-600">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl px-5 py-2.5 text-[13px] font-bold text-white transition-all disabled:opacity-50"
              style={{ background: 'var(--blue)' }}
            >
              {submitting ? 'Submitting...' : 'Submit Scorecard'}
            </button>
          </div>
        )}

        {scorecards.length === 0 && !showForm ? (
          <p className="text-[13px] text-[var(--body)]">No scorecards submitted yet. Add one after the team interview.</p>
        ) : (
          <div className="space-y-4">
            {scorecards.map((s) => (
              <div key={s.id} className="rounded-xl border border-[var(--border)] p-5 dark:border-white/10">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[var(--heading)]">{s.interviewer_name}</span>
                  <span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: `${recColor(s.recommendation)}14`, color: recColor(s.recommendation) }}>
                    {recLabel(s.recommendation)}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {CRITERIA.map((c) => (
                    <div key={c.key} className="text-center">
                      <div className="text-[16px] font-extrabold text-[var(--heading)]">{s[c.key]}/5</div>
                      <div className="text-[9px] font-medium text-[var(--body)]">{c.label}</div>
                    </div>
                  ))}
                </div>
                {s.notes && <p className="mt-3 text-[12px] leading-relaxed text-[var(--body)] whitespace-pre-line">{s.notes}</p>}
                {s.created_at && (
                  <p className="mt-2 text-[10px] text-[var(--body)] opacity-70">
                    {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
