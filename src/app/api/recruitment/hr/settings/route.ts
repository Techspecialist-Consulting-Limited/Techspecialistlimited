import { NextRequest } from 'next/server';
import { proxyToBackend } from '../../proxy';

export async function GET(req: NextRequest) {
  return proxyToBackend(req, '/api/hr/settings', { method: 'GET' });
}

export async function PUT(req: NextRequest) {
  return proxyToBackend(req, '/api/hr/settings', { method: 'PUT', forwardBody: true });
}
