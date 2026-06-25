const API_BASE = '/api/recruitment';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options?.headers) {
    const h = options.headers as Record<string, string>;
    Object.assign(headers, h);
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `API error ${res.status}`);
  }
  return res.json();
}

function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('hr_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Jobs ──

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  department?: string;
  location?: string;
  type?: string;
  status: string;
  is_deleted?: boolean;
  is_closed?: boolean;
  screening_instructions?: string;
  stage2_instructions?: string;
  stage2_questions?: string[];
  stage2_topic_labels?: string[];
  applicant_count?: number;
  created_at: string;
  updated_at?: string;
}

export function fetchJobs(): Promise<Job[]> {
  return request('/jobs');
}

export function fetchJob(jobId: string): Promise<Job> {
  return request(`/jobs/${jobId}`);
}

export function createJob(data: Partial<Job>): Promise<Job> {
  return request('/hr/jobs', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function updateJob(jobId: string, data: { is_closed?: boolean; status?: string }): Promise<Job> {
  return request(`/hr/jobs/${jobId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function softDeleteJob(jobId: string): Promise<Job> {
  return request(`/hr/jobs/${jobId}/soft-delete`, {
    method: 'PUT',
    headers: authHeaders(),
  });
}

export function restoreJob(jobId: string): Promise<Job> {
  return request(`/hr/jobs/${jobId}/restore`, {
    method: 'PUT',
    headers: authHeaders(),
  });
}

export function fetchDeletedJobs(): Promise<Job[]> {
  return request('/hr/jobs/history', { headers: authHeaders() });
}

// ── Applications ──

export interface Application {
  id: string;
  job_id: string;
  candidate_name: string;
  candidate_email: string;
  cv_url?: string;
  cover_letter_url?: string;
  cv_text?: string;
  cover_letter_text?: string;
  status: string;
  stage: number;
  assessment_token?: string;
  screening_result?: ScreeningResult;
  stage_results?: StageResult[];
  conversation_session?: ConversationSession;
  created_at: string;
}

export interface ApplicantDetail {
  id: string;
  job_id: string;
  candidate_name: string;
  candidate_email: string;
  cv_text: string | null;
  cover_letter_text: string | null;
  status: string;
  stage: number;
  assessment_token: string | null;
  job_title: string;
  screening_result: ScreeningResult | null;
  stage_results: StageResult[];
  conversation_session: ConversationSession | null;
  created_at: string | null;
}

export interface ScreeningResult {
  id: string;
  overall_score: number;
  strengths: string;
  concerns: string;
  evidence: string;
  raw_response?: string;
}

export interface StageResult {
  id: string;
  stage_number: number;
  score: number;
  ai_feedback: {
    feedback?: string;
    strengths?: string[];
    weaknesses?: string[];
    recommendation?: string;
    per_topic_scores?: { topic: string; score: number; summary: string }[];
  };
  transcript?: string;
}

export interface ConversationSession {
  id: string;
  status: string;
  conversation_history: { role: string; content: string; topic_label?: string }[];
  current_topic_index: number;
}

export async function submitApplication(
  jobId: string,
  data: FormData,
): Promise<{ id: string; message: string }> {
  const res = await fetch(`${API_BASE}/applications?job_id=${jobId}`, {
    method: 'POST',
    body: data,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `Submit failed ${res.status}`);
  }
  return res.json();
}

// ── HR ──

export function fetchApplicants(jobId: string): Promise<Application[]> {
  return request(`/hr/applications/${jobId}`, { headers: authHeaders() });
}

export function reviewApplication(
  applicationId: string,
  action: 'approve' | 'reject',
): Promise<{ message: string }> {
  return request(`/hr/review/${applicationId}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ action }),
  });
}

export function clearApplications(jobId: string): Promise<{ message: string }> {
  return request(`/hr/clear/${jobId}`, {
    method: 'POST',
    headers: authHeaders(),
  });
}

// ── Auth ──

export async function loginHR(email: string, password: string): Promise<{ token: string }> {
  return request('/hr/auth', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// ── Assessment ──

export interface AssessmentMeta {
  candidate_name: string;
  job_title: string;
  topic_labels: string[];
  topic_count: number;
  topic_time_limit: number;
  instructions: string;
  has_existing_session: boolean;
  existing_conversation_id: string | null;
}

export function fetchAssessmentMeta(token: string): Promise<AssessmentMeta> {
  return request(`/assessment/${token}`);
}

export async function startAssessment(
  token: string,
): Promise<{ audio: Blob; conversationId: string }> {
  const res = await fetch(`${API_BASE}/assessment/${token}/start`, { method: 'POST' });
  if (!res.ok) throw new Error(`Start failed ${res.status}`);
  const conversationId = res.headers.get('x-conversation-id') || '';
  const audio = await res.blob();
  return { audio, conversationId };
}

// ── Applicant Detail ──

export function fetchApplicantDetail(applicationId: string): Promise<ApplicantDetail> {
  return request(`/hr/applicants/${applicationId}`, { headers: authHeaders() });
}

// ── Dashboard Stats ──

export interface DashboardStats {
  active_jobs: number;
  total_applications: number;
  pending_review: number;
  completed: number;
  total_applicants: number;
}

export function fetchDashboardStats(): Promise<DashboardStats> {
  return request('/hr/stats', { headers: authHeaders() });
}
