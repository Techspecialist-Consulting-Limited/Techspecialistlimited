import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.RECRUITMENT_API_URL || 'http://localhost:8000';

export async function proxyToBackend(
  req: NextRequest,
  backendPath: string,
  options?: { method?: string; forwardBody?: boolean; forwardFormData?: boolean },
) {
  const method = options?.method || req.method;
  const headers: Record<string, string> = {};

  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  const apiKey = req.headers.get('x-api-key');
  if (apiKey) headers['x-api-key'] = apiKey;

  let body: BodyInit | undefined;

  if (options?.forwardFormData && (method === 'POST' || method === 'PUT')) {
    body = await req.arrayBuffer().then((buf) => Buffer.from(buf));
    const ct = req.headers.get('content-type');
    if (ct) headers['Content-Type'] = ct;
  } else if (options?.forwardBody && (method === 'POST' || method === 'PUT')) {
    body = await req.text();
    headers['Content-Type'] = 'application/json';
  }

  // Forward query parameters from the original request
  const qs = req.nextUrl.searchParams.toString();
  const url = `${BACKEND_URL}${backendPath}${qs ? `?${qs}` : ''}`;

  try {
    const res = await fetch(url, { method, headers, body });
    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const blob = await res.blob();
    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
    };
    for (const key of ['x-conversation-id', 'x-topic-label', 'x-ai-text', 'x-interview-done']) {
      const val = res.headers.get(key);
      if (val) responseHeaders[key] = val;
    }
    return new NextResponse(blob, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
  }
}
