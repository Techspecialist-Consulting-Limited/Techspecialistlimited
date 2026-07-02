import { NextRequest } from 'next/server';
import { proxyToBackend } from '../../../proxy';

export async function GET(req: NextRequest, { params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  return proxyToBackend(req, `/api/hr/audit-logs/${applicationId}`);
}
