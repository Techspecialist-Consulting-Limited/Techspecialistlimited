import { NextRequest } from 'next/server';
import { proxyToBackend } from '../../proxy';

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return proxyToBackend(req, `/api/jobs/${jobId}`);
}
