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
  assessment_sent_at?: string | null;
  assessment_expires_at?: string | null;
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
  cv_url: string | null;
  cover_letter_url: string | null;
  cv_text: string | null;
  cover_letter_text: string | null;
  status: string;
  stage: number;
  assessment_token: string | null;
  assessment_sent_at: string | null;
  assessment_expires_at: string | null;
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
  created_at?: string;
}

export interface StageResult {
  id: string;
  stage_number: number;
  score: number;
  created_at?: string;
  ai_feedback: {
    feedback?: string;
    strengths?: string[];
    weaknesses?: string[];
    recommendation?: string;
    overall_recommendation?: string;
    communication_skills?: number;
    technical_competency?: number;
    confidence_professionalism?: number;
    problem_solving?: number;
    relevance_of_responses?: number;
    key_strengths?: string[];
    areas_for_improvement?: string[];
    interview_summary?: string;
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

export interface ReviewResponse {
  status: string;
  stage: number;
  assessment_token?: string;
  assessment_sent_at?: string | null;
  assessment_expires_at?: string | null;
}

export interface ResendResponse {
  assessment_token: string;
  assessment_sent_at: string | null;
  assessment_expires_at: string | null;
  message: string;
}

export function reviewApplication(
  applicationId: string,
  action: 'approve' | 'reject',
  expirationDays?: number,
): Promise<ReviewResponse> {
  return request(`/hr/review/${applicationId}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ action, expiration_days: expirationDays }),
  });
}

export function approveApplication(
  applicationId: string,
  expirationDays?: number,
): Promise<ReviewResponse> {
  return request(`/hr/approve/${applicationId}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ expiration_days: expirationDays }),
  });
}

export function resendAssessment(
  applicationId: string,
  expirationDays?: number,
): Promise<ResendResponse> {
  return request(`/hr/resend/${applicationId}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ expiration_days: expirationDays }),
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

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return request('/hr/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, new_password: string): Promise<{ message: string }> {
  return request('/hr/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password }),
  });
}

export async function changePassword(current_password: string, new_password: string): Promise<{ message: string }> {
  return request('/hr/auth/change-password', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ current_password, new_password }),
  });
}

// ── HR settings & team ──

export interface AppSettings {
  company_name: string;
  brand_color: string;
  logo_url: string;
  sender_display_name: string;
  notification_emails: string[];
}

export function fetchSettings(): Promise<AppSettings> {
  return request('/hr/settings', { headers: authHeaders() });
}

export function updateSettings(data: AppSettings): Promise<AppSettings> {
  return request('/hr/settings', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export interface HrTeamMember {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
}

export function fetchHrUsers(): Promise<HrTeamMember[]> {
  return request('/hr/users', { headers: authHeaders() });
}

export function inviteHrUser(name: string, email: string): Promise<HrTeamMember> {
  return request('/hr/users', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name, email }),
  });
}

export function setHrUserActive(userId: string, is_active: boolean): Promise<HrTeamMember> {
  return request(`/hr/users/${userId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ is_active }),
  });
}

export function deleteHrUser(userId: string): Promise<{ message: string }> {
  return request(`/hr/users/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(),
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

export interface AssessmentError {
  error: string;
  expired?: boolean;
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

// ── Analytics ──

export interface AnalyticsOverview {
  total_applications: number;
  pending_review: number;
  shortlisted: number;
  rejected: number;
  assessment_completed: number;
  per_job: { job_id: string; title: string; status: string; applications: number }[];
}

export interface InterviewAnalytics {
  total_sent: number;
  completed: number;
  completion_rate: number;
  average_score: number;
  top_performers: { name: string; email: string; score: number; job_title: string }[];
}

export interface PipelineData {
  job_id: string;
  title: string;
  total_applications: number;
  screened: number;
  shortlisted: number;
  interviewed: number;
  rejected: number;
}

export interface PipelineAnalytics {
  pipeline: PipelineData[];
}

export interface TimeToHireRecord {
  application_id: string;
  candidate_name: string;
  job_title: string;
  application_date: string;
  assessment_sent_date: string;
  days_to_review: number;
}

export interface TimeToHireAnalytics {
  average_days_to_review: number;
  records: TimeToHireRecord[];
}

export interface TrendData {
  daily_applications: { date: string; count: number }[];
}

export function fetchAnalyticsOverview(): Promise<AnalyticsOverview> {
  return request('/hr/analytics/overview', { headers: authHeaders() });
}

export function fetchInterviewAnalytics(): Promise<InterviewAnalytics> {
  return request('/hr/analytics/interviews', { headers: authHeaders() });
}

export function fetchPipelineAnalytics(): Promise<PipelineAnalytics> {
  return request('/hr/analytics/pipeline', { headers: authHeaders() });
}

export function fetchTimeToHire(): Promise<TimeToHireAnalytics> {
  return request('/hr/analytics/time-to-hire', { headers: authHeaders() });
}

export function fetchTrends(): Promise<TrendData> {
  return request('/hr/analytics/trends', { headers: authHeaders() });
}

// ── Interviews ──

export interface Interview {
  id: string;
  application_id: string;
  candidate_name: string;
  job_title: string;
  interview_type: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  location: string | null;
  meeting_link: string | null;
  interviewer_name: string | null;
  notes: string | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateInterviewData {
  application_id: string;
  interview_type: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  location?: string;
  meeting_link?: string;
  interviewer_name?: string;
  notes?: string;
}

export function createInterview(data: CreateInterviewData): Promise<Interview> {
  return request('/hr/interviews', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function fetchInterviewsByApplication(applicationId: string): Promise<Interview[]> {
  return request(`/hr/interviews/by-application/${applicationId}`, { headers: authHeaders() });
}

export function fetchUpcomingInterviews(): Promise<Interview[]> {
  return request('/hr/interviews/upcoming', { headers: authHeaders() });
}

export function fetchAllInterviews(): Promise<Interview[]> {
  return request('/hr/interviews/all', { headers: authHeaders() });
}

export function updateInterview(interviewId: string, data: Partial<CreateInterviewData & { status: string }>): Promise<Interview> {
  return request(`/hr/interviews/${interviewId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

// ── Audit Logs ──

export interface AuditLogEntry {
  id: string;
  application_id: string;
  action: string;
  detail: string | null;
  performed_by: string | null;
  created_at: string | null;
}

export function fetchAuditLogs(applicationId: string): Promise<AuditLogEntry[]> {
  return request(`/hr/audit-logs/${applicationId}`, { headers: authHeaders() });
}

// ── Documents ──

export async function fetchDocumentUrl(applicationId: string): Promise<string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('hr_token') : null;
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`/api/recruitment/hr/applicants/${applicationId}/document`, { headers });
  if (!res.ok) throw new Error(`Document fetch failed ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}


