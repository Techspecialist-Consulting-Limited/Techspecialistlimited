'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchJobs, fetchApplicants, fetchDocumentUrl, Application, Job } from '@/lib/recruitment-api';

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
    } catch {}
  };

  if (loading) {
    return <div style={{ padding: '24px', color: 'var(--body)' }}>Loading jobs...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Documents</h1>
        <p style={{ fontSize: '13px', color: 'var(--body)', marginTop: '4px' }}>Browse applicant CVs grouped by job opening</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select
          value={selectedJobId}
          onChange={(e) => {
            setSelectedJobId(e.target.value);
            if (!e.target.value) setApplicants([]);
          }}
          style={{
            padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)',
            background: 'var(--bg)', color: 'var(--heading)', fontSize: '13px', minWidth: '220px',
          }}
        >
          <option value="">Select a job...</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>{j.title}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)',
            background: 'var(--bg)', color: 'var(--heading)', fontSize: '13px', flex: 1, minWidth: '200px',
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)',
            background: 'var(--bg)', color: 'var(--heading)', fontSize: '13px',
          }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="interview_scheduled">Interview Scheduled</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: previewAppId ? '1fr 1fr' : '1fr', gap: '20px' }}>
        <div>
          {!selectedJobId && (
            <div style={{
              padding: '40px', textAlign: 'center', borderRadius: '12px',
              border: '1px dashed var(--border)', color: 'var(--body)', fontSize: '14px',
            }}>
              Select a job opening above to view applicant documents
            </div>
          )}

          {selectedJobId && filtered.length === 0 && (
            <div style={{
              padding: '40px', textAlign: 'center', borderRadius: '12px',
              border: '1px dashed var(--border)', color: 'var(--body)', fontSize: '14px',
            }}>
              No applicants found{search ? ' matching your search' : ''}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map((app) => (
              <div
                key={app.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 16px', borderRadius: '12px',
                  background: previewAppId === app.id ? 'rgba(69,132,237,0.06)' : 'var(--bg)',
                  border: previewAppId === app.id ? '1.5px solid var(--blue)' : '1px solid var(--border)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onClick={() => handlePreview(app.id)}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(69,132,237,0.1)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'var(--blue)', fontSize: '14px', fontWeight: 700, flexShrink: 0,
                }}>
                  {app.candidate_name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--heading)' }}>{app.candidate_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--body)', marginTop: '2px' }}>{app.candidate_email}</div>
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px',
                  background: app.status === 'pending' ? 'rgba(245,158,11,0.12)' : app.status === 'approved' ? 'rgba(16,185,129,0.12)' : app.status === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(69,132,237,0.12)',
                  color: app.status === 'pending' ? '#f59e0b' : app.status === 'approved' ? '#10b981' : app.status === 'rejected' ? '#ef4444' : 'var(--blue)',
                  textTransform: 'capitalize',
                }}>
                  {app.status.replace(/_/g, ' ')}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownload(app.id, app.candidate_name); }}
                  style={{
                    padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)',
                    background: 'transparent', color: 'var(--body)', fontSize: '11px',
                    fontWeight: 500, cursor: 'pointer', flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--blue)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--body)'; }}
                >
                  Download
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/hr/applicants/${app.id}`); }}
                  style={{
                    padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)',
                    background: 'transparent', color: 'var(--body)', fontSize: '11px',
                    fontWeight: 500, cursor: 'pointer', flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--blue)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--body)'; }}
                >
                  Profile
                </button>
              </div>
            ))}
          </div>
        </div>

        {previewAppId && (
          <div style={{ position: 'sticky', top: '24px', alignSelf: 'start' }}>
            <div style={{
              borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden',
              background: 'var(--bg)',
            }}>
              <div style={{
                padding: '12px 16px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading)' }}>
                  CV Preview
                </span>
                <button
                  onClick={() => { setPreviewAppId(null); setPreviewUrl(null); }}
                  style={{
                    padding: '4px 8px', borderRadius: '6px', border: 'none',
                    background: 'transparent', color: 'var(--body)', cursor: 'pointer',
                    fontSize: '16px', lineHeight: 1,
                  }}
                >
                  &times;
                </button>
              </div>
              <div style={{ height: '70vh', background: '#f5f5f5' }}>
                {previewUrl ? (
                  <iframe
                    src={previewUrl}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="CV Preview"
                  />
                ) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '100%', color: 'var(--body)', fontSize: '13px',
                  }}>
                    Loading preview...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
