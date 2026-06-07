import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, scores, total_score, max_score, level } = body

    if (!email || !scores || total_score === undefined || !level) {
      return NextResponse.json(
        { error: 'Missing required fields: email, scores, total_score, level' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('assessment_results')
      .insert([
        {
          email,
          scores,
          total_score,
          max_score: max_score || 75,
          level,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, result: data })
  } catch (error: any) {
    console.error('Assessment save error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to save assessment results' },
      { status: 500 }
    )
  }
}
