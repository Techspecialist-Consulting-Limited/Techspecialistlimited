import type { Application } from './recruitment-api';

const STALLED_THRESHOLD_DAYS = 7;
const TERMINAL_STATUSES = ['hired', 'rejected'];

export function isStalled(app: Application): boolean {
  if (TERMINAL_STATUSES.includes(app.status)) return false;
  const reference = app.updated_at || app.created_at;
  if (!reference) return false;
  const daysSince = (Date.now() - new Date(reference).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= STALLED_THRESHOLD_DAYS;
}

export function isDuplicate(app: Application): boolean {
  return (app.application_count_for_email || 1) > 1;
}
