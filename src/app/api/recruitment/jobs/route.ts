import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { proxyToBackend } from '../proxy';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  const backendResult = await proxyToBackend(req, '/api/jobs');
  if (backendResult.status !== 502) return backendResult;

  // Fallback to Supabase
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json([]);

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data || []);
}
