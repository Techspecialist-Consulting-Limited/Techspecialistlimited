'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchJobs, fetchApplicants, fetchDocumentUrl, Application, Job } from '@/lib/recruitment-api';
import { StatusBadge, BrandedLoader } from '@/components/recruitment';

export default function DocumentsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [previewAppId, setPreviewAppId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs()
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedJobId) return;
    fetchApplicants(selectedJobId)
      .then(setApplicants)
      .catch(() => setApplicants([]));
  }, [selectedJobId]);

  const filtered = applicants.filter((a) => {
    const q = search.toLowerCase();
    if (q && !a.candidate_name.toLowerCase().includes(q) && !a.candidate_email.toLowerCase().includes(q)) return false;
    if (statusFilter && a.status !== statusFilter) return false;
    return true;
  });

  const handlePreview = async (appId: string) => {
    setPreviewAppId(appId);
    setPreviewUrl(null);
    try {
      const url = await fetchDocumentUrl(appId);
      setPreviewUrl(url);
    } catch {
      setPreviewUrl(null);
    }
  };

  const handleDownload = async (appId: string, name: string) => {
    try {
      const url = await fetchDocumentUrl(appId);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}_CV.pdf`;
      a.click();
    } catch { /* empty */ }
  };

  if (loading) return <BrandedLoader text="Loading jobs..." />;

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-[var(--heading)]" style={{ fontFamily: "'Roboto Slab', sans-serif" }}>Documents</h1>
        <p className="mt-1 text-[13px] text-[var(--body)]">Browse applicant CVs grouped by job opening.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={selectedJobId}
          onChange={(e) => { setSelectedJobId(e.target.value); if (!e.target.value) setApplicants([]); }}
          className="min-w-[220px] rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
        >
          <option value="">Select a job...</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>{j.title}</option>
          ))}
        </select>

        <div className="relative min-w-[200px] flex-1">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--body)" strokeWidth={2} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-[var(--border)] bg-[var(--bg)] py-2.5 pl-10 pr-4 text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-[13px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="interview_scheduled">Interview Scheduled</option>
        </select>
      </div>

      <div className={previewAppId ? 'grid gap-5 lg:grid-cols-2' : ''}>
        <div>
          {!selectedJobId && (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center text-[13px] text-[var(--body)] dark:border-white/10">
              Select a job opening above to view applicant documents.
            </div>
          )}

          {selectedJobId && filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center text-[13px] text-[var(--body)] dark:border-white/10">
              No applicants found{search ? ' matching your search' : ''}.
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {filtered.map((app, i) => (
              <div
                key={app.id}
                onClick={() => handlePreview(app.id)}
                className="group flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md dark:border-white/10"
                style={{
                  animation: `cardSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.04}s both`,
                  background: previewAppId === app.id ? 'rgba(69,132,237,0.05)' : 'var(--bg)',
                  borderColor: previewAppId === app.id ? 'var(--blue)' : undefined,
                }}
              >
                <div
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--blue), #7c5cff)' }}
                >
                  {app.candidate_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold text-[var(--heading)]">{app.candidate_name}</div>
                  <div className="truncate text-[11.5px] text-[var(--body)]">{app.candidate_email}</div>
                </div>
                <StatusBadge status={app.status} />
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownload(app.id, app.candidate_name); }}
                  className="flex-shrink-0 rounded-lg border border-[var(--border)] px-3 py-1.5 text-[11px] font-semibold text-[var(--body)] transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)] dark:border-white/10"
                >
                  Download
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/hr/applicants/${app.id}`); }}
                  className="flex-shrink-0 rounded-lg border border-[var(--border)] px-3 py-1.5 text-[11px] font-semibold text-[var(--body)] transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)] dark:border-white/10"
                >
                  Profile
                </button>
              </div>
            ))}
          </div>
        </div>

        {previewAppId && (
          <div className="sticky top-6 self-start">
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] dark:border-white/10 dark:bg-[#101827]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5 dark:border-white/10">
                <span className="text-[13px] font-bold text-[var(--heading)]">CV Preview</span>
                <button
                  onClick={() => { setPreviewAppId(null); setPreviewUrl(null); }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--body)] transition-colors hover:bg-[var(--bg-soft)] hover:text-[var(--heading)] dark:hover:bg-white/10"
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="h-[70vh] bg-[var(--bg-soft)] dark:bg-white/[0.02]">
                {previewUrl ? (
                  <iframe src={previewUrl} className="h-full w-full border-0" title="CV Preview" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[13px] text-[var(--body)]">Loading preview...</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
