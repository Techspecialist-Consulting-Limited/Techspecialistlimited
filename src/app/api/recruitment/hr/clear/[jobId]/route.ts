import { NextRequest } from 'next/server';
import { proxyToBackend } from '../../../proxy';

export async function POST(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return proxyToBackend(req, `/api/hr/clear/${jobId}`);
}
