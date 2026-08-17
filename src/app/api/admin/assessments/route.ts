import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.RECRUITMENT_API_URL || 'http://localhost:8000';

/**
 * These routes expose captured lead data (email, company, score), so every one of them
 * requires the caller's HR session. The token is forwarded rather than trusted here: the
 * backend validates the signature, this layer only refuses obviously anonymous calls so
 * they never reach it.
 */
function authHeader(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ') || header.length <= 'Bearer '.length) {
    return null;
  }
  return header;
}

const UNAUTHORIZED = NextResponse.json(
  { error: 'Sign in to the HR portal to access this data' },
  { status: 401 }
);

export async function GET(request: NextRequest) {
  const auth = authHeader(request);
  if (!auth) return UNAUTHORIZED;

  try {
    const res = await fetch(`${BACKEND_URL}/api/ai-readiness/results`, {
      headers: { Authorization: auth },
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.detail || 'Failed to fetch assessments' },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Fetch assessments error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = authHeader(request);
  if (!auth) return UNAUTHORIZED;

  try {
    const body = await request.json();
    const { id, followed_up } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing assessment id' },
        { status: 400 }
      );
    }

    const res = await fetch(`${BACKEND_URL}/api/ai-readiness/results/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ followed_up }),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.detail || 'Failed to update assessment' },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Update assessment error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update assessment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = authHeader(request);
  if (!auth) return UNAUTHORIZED;

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing assessment id' },
        { status: 400 }
      );
    }

    const res = await fetch(`${BACKEND_URL}/api/ai-readiness/results/${id}`, {
      method: 'DELETE',
      headers: { Authorization: auth },
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.detail || 'Failed to delete assessment' },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete assessment error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete assessment' },
      { status: 500 }
    );
  }
}
