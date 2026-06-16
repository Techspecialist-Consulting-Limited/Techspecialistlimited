import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

function verifyAdminToken(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  const adminToken = process.env.ADMIN_SECRET_TOKEN;

  if (!adminToken) {
    console.warn('ADMIN_SECRET_TOKEN not set');
    return false;
  }

  return token === adminToken;
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('assessment_results')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

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
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, followed_up } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing assessment id' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('assessment_results')
      .update({ followed_up })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Update assessment error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update assessment' },
      { status: 500 }
    );
  }
}
