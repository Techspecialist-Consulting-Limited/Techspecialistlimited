import { NextRequest } from 'next/server';
import { proxyToBackend } from '../../../../proxy';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return proxyToBackend(req, `/api/jobs/${jobId}/restore`, { method: 'PUT' });
}