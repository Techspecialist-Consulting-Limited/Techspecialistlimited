'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAllInterviews, fetchUpcomingInterviews, fetchJobs, fetchApplicants, createInterview, updateInterview, Interview, CreateInterviewData, Job, Application } from '@/lib/recruitment-api';

export default function InterviewsPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [upcoming, setUpcoming] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
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

  const handleCreate = async () => {
    if (!form.application_id || !form.scheduled_date || !form.scheduled_time) return;
    setSubmitting(true);
    try {
      const { job_id, ...rest } = form;
      await createInterview(rest);
      setShowSchedule(false);
      const [all, up] = await Promise.all([fetchAllInterviews(), fetchUpcomingInterviews()]);
      setInterviews(all);
      setUpcoming(up);
      setForm({ application_id: '', job_id: '', interview_type: 'physical', scheduled_date: '', scheduled_time: '', duration_minutes: 60, location: '', meeting_link: '', interviewer_name: '', notes: '' });
      setApplicants([]);
    } catch (e) {
      alert('Failed to create interview');
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
    } catch {}
  };

  const today = new Date().toISOString().split('T')[0];
  const filtered = filterDate
    ? interviews.filter((iv) => iv.scheduled_date === filterDate)
    : interviews;

  if (loading) {
    return <div style={{ padding: '24px', color: 'var(--body)' }}>Loading interviews...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Interviews</h1>
          <p style={{ fontSize: '13px', color: 'var(--body)', marginTop: '4px' }}>Schedule, manage, and track interviews</p>
        </div>
        <button
          onClick={() => setShowSchedule(true)}
          style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none',
            background: 'var(--blue)', color: '#fff', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          + Schedule Interview
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={{
          padding: '20px', borderRadius: '12px', border: '1px solid var(--border)',
          background: 'var(--bg)',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--body)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Upcoming</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--heading)' }}>{upcoming.length}</div>
        </div>
        <div style={{
          padding: '20px', borderRadius: '12px', border: '1px solid var(--border)',
          background: 'var(--bg)',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--body)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Total Scheduled</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--heading)' }}>{interviews.length}</div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)',
            background: 'var(--bg)', color: 'var(--heading)', fontSize: '13px',
          }}
        />
        {filterDate && (
          <button
            onClick={() => setFilterDate('')}
            style={{
              marginLeft: '8px', padding: '10px 14px', borderRadius: '10px',
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--body)', fontSize: '12px', cursor: 'pointer',
            }}
          >
            Clear filter
          </button>
        )}
      </div>

      <div style={{
        borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden',
        background: 'var(--bg)',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px',
          gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--border)',
          fontSize: '11px', fontWeight: 600, color: 'var(--body)', textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>
          <span>Candidate</span>
          <span>Date</span>
          <span>Time</span>
          <span>Type</span>
          <span>Status</span>
          <span></span>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--body)', fontSize: '13px' }}>
            No interviews found{filterDate ? ' for this date' : ''}
          </div>
        )}
        {filtered.map((iv) => (
          <div
            key={iv.id}
            style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px',
              gap: '8px', padding: '14px 16px', borderBottom: '1px solid var(--border)',
              fontSize: '13px', alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: 'var(--heading)' }}>{iv.candidate_name}</div>
              <div style={{ fontSize: '11px', color: 'var(--body)', marginTop: '1px' }}>{iv.job_title}</div>
            </div>
            <span style={{ color: 'var(--heading)' }}>{iv.scheduled_date}</span>
            <span style={{ color: 'var(--body)' }}>{iv.scheduled_time}</span>
            <span style={{
              fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
              background: iv.interview_type === 'virtual' ? 'rgba(69,132,237,0.1)' : 'rgba(16,185,129,0.1)',
              color: iv.interview_type === 'virtual' ? 'var(--blue)' : '#10b981',
              textTransform: 'capitalize', width: 'fit-content',
            }}>
              {iv.interview_type}
            </span>
            <select
              value={iv.status}
              onChange={(e) => handleStatusChange(iv.id, e.target.value)}
              style={{
                padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--heading)', fontSize: '11px',
              }}
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
            <button
              onClick={() => router.push(`/hr/applicants/${iv.application_id}`)}
              style={{
                padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--body)', fontSize: '11px',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--blue)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--body)'; }}
            >
              View
            </button>
          </div>
        ))}
      </div>

      {showSchedule && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowSchedule(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '520px', maxHeight: '90vh', overflowY: 'auto',
              borderRadius: '16px', background: 'var(--bg)', padding: '28px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--heading)', margin: '0 0 20px 0' }}>Schedule Interview</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--body)', marginBottom: '4px', display: 'block' }}>Job Opening</label>
                <select
                  value={form.job_id}
                  onChange={(e) => {
                    setForm({ ...form, job_id: e.target.value, application_id: '' });
                    if (!e.target.value) setApplicants([]);
                  }}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    color: 'var(--heading)', fontSize: '13px',
                  }}
                >
                  <option value="">Select a job...</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--body)', marginBottom: '4px', display: 'block' }}>Candidate</label>
                <select
                  value={form.application_id}
                  onChange={(e) => setForm({ ...form, application_id: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    color: 'var(--heading)', fontSize: '13px',
                  }}
                >
                  <option value="">Select a candidate...</option>
                  {applicants.map((a) => (
                    <option key={a.id} value={a.id}>{a.candidate_name} ({a.candidate_email})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--body)', marginBottom: '4px', display: 'block' }}>Date</label>
                  <input
                    type="date"
                    value={form.scheduled_date}
                    min={today}
                    onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--border)', background: 'var(--bg)',
                      color: 'var(--heading)', fontSize: '13px', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--body)', marginBottom: '4px', display: 'block' }}>Time</label>
                  <input
                    type="time"
                    value={form.scheduled_time}
                    onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--border)', background: 'var(--bg)',
                      color: 'var(--heading)', fontSize: '13px', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--body)', marginBottom: '4px', display: 'block' }}>Duration (min)</label>
                  <input
                    type="number"
                    value={form.duration_minutes}
                    min={15}
                    step={15}
                    onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--border)', background: 'var(--bg)',
                      color: 'var(--heading)', fontSize: '13px', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--body)', marginBottom: '4px', display: 'block' }}>Interview Type</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['physical', 'virtual', 'phone'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setForm({ ...form, interview_type: type })}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '10px',
                        border: form.interview_type === type ? '1.5px solid var(--blue)' : '1px solid var(--border)',
                        background: form.interview_type === type ? 'rgba(69,132,237,0.06)' : 'transparent',
                        color: form.interview_type === type ? 'var(--blue)' : 'var(--body)',
                        fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {form.interview_type === 'virtual' && (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--body)', marginBottom: '4px', display: 'block' }}>Meeting Link</label>
                  <input
                    type="url"
                    value={form.meeting_link || ''}
                    onChange={(e) => setForm({ ...form, meeting_link: e.target.value })}
                    placeholder="https://meet.google.com/..."
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--border)', background: 'var(--bg)',
                      color: 'var(--heading)', fontSize: '13px', boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {form.interview_type === 'physical' && (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--body)', marginBottom: '4px', display: 'block' }}>Location</label>
                  <input
                    type="text"
                    value={form.location || ''}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Office address, room number..."
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      border: '1px solid var(--border)', background: 'var(--bg)',
                      color: 'var(--heading)', fontSize: '13px', boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--body)', marginBottom: '4px', display: 'block' }}>Interviewer Name</label>
                <input
                  type="text"
                  value={form.interviewer_name || ''}
                  onChange={(e) => setForm({ ...form, interviewer_name: e.target.value })}
                  placeholder="e.g. John Smith"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    color: 'var(--heading)', fontSize: '13px', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--body)', marginBottom: '4px', display: 'block' }}>Notes (sent to candidate)</label>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Preparation instructions, documents to bring, etc."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    color: 'var(--heading)', fontSize: '13px', boxSizing: 'border-box',
                    resize: 'vertical', fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '22px' }}>
              <button
                onClick={() => setShowSchedule(false)}
                style={{
                  padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--body)', fontSize: '13px',
                  fontWeight: 500, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting || !form.application_id || !form.scheduled_date || !form.scheduled_time}
                style={{
                  padding: '10px 20px', borderRadius: '10px', border: 'none',
                  background: 'var(--blue)', color: '#fff', fontSize: '13px',
                  fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting || !form.application_id || !form.scheduled_date || !form.scheduled_time ? 0.5 : 1,
                }}
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
