import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const job_id = formData.get('job_id') as string
    const applicant_name = formData.get('applicant_name') as string
    const applicant_email = formData.get('applicant_email') as string
    const phone = formData.get('phone') as string
    const cover_letter_text = formData.get('cover_letter_text') as string
    const resume = formData.get('resume') as File | null
    const cover_letter = formData.get('cover_letter') as File | null

    if (!job_id || !applicant_name || !applicant_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let resume_url: string | null = null
    let cover_letter_url: string | null = null

    if (resume && resume.size > 0) {
      const ext = resume.name.split('.').pop() || 'pdf'
      const fileName = `resumes/${crypto.randomUUID()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('applications')
        .upload(fileName, resume, {
          contentType: resume.type,
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('applications')
        .getPublicUrl(fileName)

      resume_url = urlData?.publicUrl || null
    }

    if (cover_letter && cover_letter.size > 0) {
      const ext = cover_letter.name.split('.').pop() || 'pdf'
      const fileName = `cover-letters/${crypto.randomUUID()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('applications')
        .upload(fileName, cover_letter, {
          contentType: cover_letter.type,
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('applications')
        .getPublicUrl(fileName)

      cover_letter_url = urlData?.publicUrl || null
    }

    const { data, error } = await supabase
      .from('applications')
      .insert([
        {
          job_id,
          applicant_name,
          applicant_email,
          phone: phone || null,
          cover_letter_text: cover_letter_text || null,
          resume_url,
          cover_letter_url,
          status: 'new',
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, application: data })
  } catch (error: any) {
    console.error('Application submission error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to submit application' },
      { status: 500 }
    )
  }
}
