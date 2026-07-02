import { NextRequest } from 'next/server';
import { proxyToBackend } from '../../../proxy';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ interviewId: string }> }) {
  const { interviewId } = await params;
  return proxyToBackend(req, `/api/hr/interviews/${interviewId}`, { forwardBody: true });
}
