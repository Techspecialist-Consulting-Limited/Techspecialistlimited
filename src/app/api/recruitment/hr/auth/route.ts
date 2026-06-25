import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '../../proxy';

const HR_EMAIL = process.env.HR_EMAIL || 'hr@company.com';
const HR_PASSWORD = process.env.HR_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-456';

function base64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function createToken(email: string): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(JSON.stringify({ sub: email, exp: now + 8 * 3600, iat: now }));
  const signature = base64url(JWT_SECRET + header + payload);
  return `${header}.${payload}.${signature}`;
}

export async function POST(req: NextRequest) {
  // Read body once, use for both paths
  const bodyText = await req.text();
  let body: { email?: string; password?: string };
  try { body = JSON.parse(bodyText); } catch { return NextResponse.json({ detail: 'Invalid request' }, { status: 400 }); }

  // Try FastAPI backend first
  const proxyReq = new NextRequest(req.url, { method: 'POST', headers: req.headers, body: bodyText });
  const backendResult = await proxyToBackend(proxyReq, '/api/auth/login', { forwardBody: true });
  if (backendResult.status !== 502) return backendResult;

  // Fallback: handle login directly
  try {
    const { email, password } = body;

    if (email === HR_EMAIL && password === HR_PASSWORD) {
      const token = createToken(email);
      return NextResponse.json({ token });
    }

    return NextResponse.json({ detail: 'Invalid credentials' }, { status: 401 });
  } catch {
    return NextResponse.json({ detail: 'Invalid request' }, { status: 400 });
  }
}
