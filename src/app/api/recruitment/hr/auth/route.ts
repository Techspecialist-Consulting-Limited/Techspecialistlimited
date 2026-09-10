import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '../../proxy';

// No defaults. This is the break-glass login used only while the backend is unreachable,
// and it previously fell back to hr@company.com / admin123, which meant any deployment
// that had not set these could be signed into with credentials published in this file.
// Unset now means the fallback is simply disabled rather than open.
const HR_EMAIL = process.env.HR_EMAIL;
const HR_PASSWORD = process.env.HR_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;
const FALLBACK_LOGIN_ENABLED = Boolean(HR_EMAIL && HR_PASSWORD && JWT_SECRET);

function base64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function createToken(email: string): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(JSON.stringify({ sub: email, exp: now + 8 * 3600, iat: now }));
  const signature = base64url(String(JWT_SECRET) + header + payload);
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

  // Fallback: handle login directly while the backend is down
  if (!FALLBACK_LOGIN_ENABLED) {
    return NextResponse.json(
      { detail: 'Sign-in is temporarily unavailable. Please try again shortly.' },
      { status: 503 }
    );
  }

  try {
    const { email, password } = body;

    if (email && password && email === HR_EMAIL && password === HR_PASSWORD) {
      const token = createToken(email);
      return NextResponse.json({ token });
    }

    return NextResponse.json({ detail: 'Invalid credentials' }, { status: 401 });
  } catch {
    return NextResponse.json({ detail: 'Invalid request' }, { status: 400 });
  }
}
