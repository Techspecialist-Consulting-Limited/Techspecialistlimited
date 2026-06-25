import { NextRequest } from 'next/server';
import { proxyToBackend } from '../../proxy';

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return proxyToBackend(req, `/api/assessment/${token}`);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const action = req.nextUrl.searchParams.get('action') || 'start';
  return proxyToBackend(req, `/api/assessment/${token}/${action}`, { forwardBody: true });
}
