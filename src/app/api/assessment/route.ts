import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.RECRUITMENT_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, company_name, scores, total_score, max_score, level } = body

    if (!email || !scores || total_score === undefined || !level) {
      return NextResponse.json(
        { error: 'Missing required fields: email, scores, total_score, level' },
        { status: 400 }
      )
    }

    const res = await fetch(`${BACKEND_URL}/api/ai-readiness/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, company_name, scores, total_score, max_score, level }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || 'Failed to save assessment results');

    return NextResponse.json({ success: true, result: data })
  } catch (error: any) {
    console.error('Assessment save error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to save assessment results' },
      { status: 500 }
    )
  }
}
