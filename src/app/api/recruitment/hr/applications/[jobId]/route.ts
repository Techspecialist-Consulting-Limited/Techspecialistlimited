import { NextRequest } from 'next/server';
import { proxyToBackend } from '../../../proxy';

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return proxyToBackend(req, `/api/hr/applications/${jobId}`);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId: applicationId } = await params;
  return proxyToBackend(req, `/api/hr/applications/${applicationId}`);
}
