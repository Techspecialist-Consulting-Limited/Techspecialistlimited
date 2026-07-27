'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAllInterviews, fetchUpcomingInterviews, fetchJobs, fetchApplicants, createInterview, updateInterview, Interview, CreateInterviewData, Job, Application } from '@/lib/recruitment-api';
import { BrandedLoader } from '@/components/recruitment';

const ROLE_PURPLE = '#7c5cff';

const TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  physical: { bg: 'rgba(34,197,94,0.1)', color: 'var(--status-approved)' },
  virtual: { bg: 'rgba(69,132,237,0.1)', color: 'var(--blue)' },
  phone: { bg: 'rgba(124,92,255,0.1)', color: ROLE_PURPLE },
};

export default function InterviewsPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [upcoming, setUpcoming] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [form, setForm] = useState<CreateInterviewData & { job_id: string }>({
    application_id: '',
    job_id: '',
    interview_type: 'physical',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    location: '',
    meeting_link: '',
    interviewer_name: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    Promise.all([
      fetchAllInterviews(),
      fetchUpcomingInterviews(),
      fetchJobs(),
    ])
      .then(([all, up, jbs]) => {
        setInterviews(all);
        setUpcoming(up);
        setJobs(jbs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!form.job_id) return;
    fetchApplicants(form.job_id)
      .then(setApplicants)
      .catch(() => setApplicants([]));
  }, [form.job_id]);

  const resetForm = () => {
    setForm({ application_id: '', job_id: '', interview_type: 'physical', scheduled_date: '', scheduled_time: '', duration_minutes: 60, location: '', meeting_link: '', interviewer_name: '', notes: '' });
    setApplicants([]);
  };

  const handleCreate = async () => {
    if (!form.application_id || !form.scheduled_date || !form.scheduled_time) return;
    setSubmitting(true);
    setFormError('');
    try {
      const { job_id, ...rest } = form;
      await createInterview(rest);
      setShowSchedule(false);
      const [all, up] = await Promise.all([fetchAllInterviews(), fetchUpcomingInterviews()]);
      setInterviews(all);
      setUpcoming(up);
      resetForm();
    } catch {
      setFormError('Failed to create interview. Please check the details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateInterview(id, { status });
      const [all, up] = await Promise.all([fetchAllInterviews(), fetchUpcomingInterviews()]);
      setInterviews(all);
      setUpcoming(up);
    } catch { /* empty */ }
  };

  const today = new Date().toISOString().split('T')[0];
  const filtered = filterDate
    ? interviews.filter((iv) => iv.scheduled_date === filterDate)
    : interviews;

  if (loading) return <BrandedLoader text="Loading interviews..." />;

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-[var(--heading)]" style={{ fontFamily: "'Roboto Slab', sans-serif" }}>Interviews</h1>
          <p className="mt-1 text-[13px] text-[var(--body)]">Schedule, manage, and track interviews.</p>
        </div>
        <button
          onClick={() => setShowSchedule(true)}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[12.5px] font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
          style={{ background: 'var(--blue)' }}
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Schedule Interview
        </button>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#101827]" style={{ boxShadow: '0 2px 12px rgba(69,132,237,0.08)' }}>
          <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'rgba(69,132,237,0.1)', color: 'var(--blue)' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="text-[24px] font-extrabold text-[var(--heading)]" style={{ letterSpacing: '-0.02em' }}>{upcoming.length}</div>
          <div className="mt-0.5 text-[12px] font-medium text-[var(--body)]">Upcoming</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#101827]" style={{ boxShadow: `0 2px 12px ${ROLE_PURPLE}14` }}>
          <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'rgba(124,92,255,0.1)', color: ROLE_PURPLE }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75" /></svg>
          </div>
          <div className="text-[24px] font-extrabold text-[var(--heading)]" style={{ letterSpacing: '-0.02em' }}>{interviews.length}</div>
          <div className="mt-0.5 text-[12px] font-medium text-[var(--body)]">Total Scheduled</div>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-3">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
        />
        {filterDate && (
          <button
            onClick={() => setFilterDate('')}
            className="rounded-full border border-[var(--border)] px-4 py-2.5 text-[12px] font-semibold text-[var(--body)] transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)] dark:border-white/10"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] dark:border-white/10 dark:bg-[#101827]">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-2 border-b border-[var(--border)] px-5 py-3 text-[10.5px] font-bold uppercase tracking-[0.06em] text-[var(--body)] dark:border-white/10">
          <span>Candidate</span>
          <span>Date</span>
          <span>Time</span>
          <span>Type</span>
          <span>Status</span>
          <span></span>
        </div>
        {filtered.length === 0 && (
          <div className="p-10 text-center text-[13px] text-[var(--body)]">
            No interviews found{filterDate ? ' for this date' : ''}.
          </div>
        )}
        {filtered.map((iv) => {
          const typeStyle = TYPE_STYLES[iv.interview_type] ?? TYPE_STYLES.physical;
          return (
            <div
              key={iv.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] items-center gap-2 border-b border-[var(--border)] px-5 py-3.5 text-[13px] transition-colors last:border-b-0 hover:bg-[var(--bg-soft)] dark:border-white/10 dark:hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--blue), ' + ROLE_PURPLE + ')' }}>
                  {iv.candidate_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-[var(--heading)]">{iv.candidate_name}</div>
                  <div className="truncate text-[11px] text-[var(--body)]">{iv.job_title}</div>
                </div>
              </div>
              <span className="text-[var(--heading)]">{iv.scheduled_date}</span>
              <span className="text-[var(--body)]">{iv.scheduled_time}</span>
              <span className="w-fit rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize" style={{ background: typeStyle.bg, color: typeStyle.color }}>
                {iv.interview_type}
              </span>
              <select
                value={iv.status}
                onChange={(e) => handleStatusChange(iv.id, e.target.value)}
                className="rounded-md border border-[var(--border)] bg-transparent px-2 py-1 text-[11px] text-[var(--heading)] outline-none focus:border-[var(--blue)] dark:border-white/10"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
              <button
                onClick={() => router.push(`/hr/applicants/${iv.application_id}`)}
                className="w-fit rounded-md border border-[var(--border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--body)] transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)] dark:border-white/10"
              >
                View
              </button>
            </div>
          );
        })}
      </div>

      {showSchedule && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onClick={() => setShowSchedule(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-3xl bg-[var(--bg)] p-7 dark:bg-[#101827]"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
          >
            <h2 className="mb-5 text-[18px] font-bold text-[var(--heading)]">Schedule Interview</h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Job Opening</label>
                <select
                  value={form.job_id}
                  onChange={(e) => {
                    setForm({ ...form, job_id: e.target.value, application_id: '' });
                    if (!e.target.value) setApplicants([]);
                  }}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
                >
                  <option value="">Select a job...</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Candidate</label>
                <select
                  value={form.application_id}
                  onChange={(e) => setForm({ ...form, application_id: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
                >
                  <option value="">Select a candidate...</option>
                  {applicants.map((a) => (
                    <option key={a.id} value={a.id}>{a.candidate_name} ({a.candidate_email})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Date</label>
                  <input
                    type="date"
                    value={form.scheduled_date}
                    min={today}
                    onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Time</label>
                  <input
                    type="time"
                    value={form.scheduled_time}
                    onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Duration (min)</label>
                  <input
                    type="number"
                    value={form.duration_minutes}
                    min={15}
                    step={15}
                    onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Interview Type</label>
                <div className="flex gap-2">
                  {(['physical', 'virtual', 'phone'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setForm({ ...form, interview_type: type })}
                      className="flex-1 rounded-xl px-3 py-2.5 text-[12px] font-semibold capitalize transition-all"
                      style={{
                        border: form.interview_type === type ? `1.5px solid ${TYPE_STYLES[type].color}` : '1px solid var(--border)',
                        background: form.interview_type === type ? `${TYPE_STYLES[type].color}14` : 'transparent',
                        color: form.interview_type === type ? TYPE_STYLES[type].color : 'var(--body)',
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {form.interview_type === 'virtual' && (
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Meeting Link</label>
                  <input
                    type="url"
                    value={form.meeting_link || ''}
                    onChange={(e) => setForm({ ...form, meeting_link: e.target.value })}
                    placeholder="https://meet.google.com/..."
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
                  />
                </div>
              )}

              {form.interview_type === 'physical' && (
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Location</label>
                  <input
                    type="text"
                    value={form.location || ''}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Office address, room number..."
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Interviewer Name</label>
                <input
                  type="text"
                  value={form.interviewer_name || ''}
                  onChange={(e) => setForm({ ...form, interviewer_name: e.target.value })}
                  placeholder="e.g. John Smith"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--body)]">Notes (sent to candidate)</label>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Preparation instructions, documents to bring, etc."
                  rows={3}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              {formError && <p className="text-[12px] font-medium text-red-600">{formError}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => { setShowSchedule(false); setFormError(''); }}
                className="rounded-full border border-[var(--border)] px-5 py-2.5 text-[13px] font-semibold text-[var(--body)] transition-colors hover:text-[var(--heading)] dark:border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting || !form.application_id || !form.scheduled_date || !form.scheduled_time}
                className="rounded-full px-5 py-2.5 text-[13px] font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: 'var(--blue)' }}
              >
                {submitting ? 'Scheduling...' : 'Schedule Interview'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
