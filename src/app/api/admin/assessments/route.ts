import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.RECRUITMENT_API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ai-readiness/results`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || 'Failed to fetch assessments');

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followed_up }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || 'Failed to update assessment');

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
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || 'Failed to delete assessment');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete assessment error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete assessment' },
      { status: 500 }
    );
  }
}
