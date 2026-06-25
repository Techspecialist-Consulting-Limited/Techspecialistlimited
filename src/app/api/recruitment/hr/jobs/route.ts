import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { proxyToBackend } from '../../proxy';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  const backendResult = await proxyToBackend(req, '/api/jobs');
  if (backendResult.status !== 502) return backendResult;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json([]);

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const backendResult = await proxyToBackend(req, '/api/jobs', { forwardBody: true });
  if (backendResult.status !== 502) return backendResult;

  // Fallback: create job in Supabase directly
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'No backend or database available' }, { status: 503 });

  try {
    const body = await req.json();
    const { data, error } = await supabase
      .from('jobs')
      .insert([{
        title: body.title,
        description: body.description,
        requirements: body.requirements,
        department: body.department || null,
        location: body.location || null,
        type: body.type || 'Full-time',
        status: 'active',
        screening_instructions: body.screening_instructions || null,
        stage2_instructions: body.stage2_instructions || null,
        stage2_questions: body.stage2_questions || null,
        stage2_topic_labels: body.stage2_topic_labels || null,
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
