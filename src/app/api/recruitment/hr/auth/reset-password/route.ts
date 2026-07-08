import { NextRequest } from 'next/server';
import { proxyToBackend } from '../../../proxy';

export async function POST(req: NextRequest) {
  return proxyToBackend(req, '/api/auth/reset-password', { method: 'POST', forwardBody: true });
}
