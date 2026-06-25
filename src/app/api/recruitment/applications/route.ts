import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BACKEND_URL = process.env.RECRUITMENT_API_URL || 'http://localhost:8000';
const API_KEY = process.env.RECRUITMENT_API_KEY || process.env.API_KEY || 'dev-api-key-123';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('job_id') || '';
  const formData = await req.formData();

  const candidateName = formData.get('candidate_name') as string || '';
  const candidateEmail = formData.get('candidate_email') as string || '';
  const phone = formData.get('phone') as string || '';
  const coverLetterText = formData.get('cover_letter_text') as string || '';
  const cv = formData.get('cv') as File | null;
  const coverLetter = formData.get('cover_letter') as File | null;

  // Try FastAPI backend first
  try {
    const backendForm = new FormData();
    if (cv) backendForm.append('cv', cv);
    if (coverLetter) backendForm.append('cover_letter', coverLetter);

    const params = new URLSearchParams({
      job_id: jobId,
      candidate_name: candidateName,
      candidate_email: candidateEmail,
    });

    const res = await fetch(`${BACKEND_URL}/api/applications?${params}`, {
      method: 'POST',
      headers: { 'x-api-key': API_KEY },
      body: backendForm,
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { status: 201 });
    }

    if (res.status !== 502 && res.status !== 0) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json({ error: errText || `Backend error ${res.status}` }, { status: res.status });
    }
  } catch {
    // Backend unavailable, fall through to Supabase
  }

  // Fallback: submit to Supabase directly
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'No backend or database available' }, { status: 503 });
  }

  try {
    let resumeUrl: string | null = null;
    let coverLetterUrl: string | null = null;

    if (cv && cv.size > 0) {
      const ext = cv.name.split('.').pop() || 'pdf';
      const fileName = `resumes/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('applications')
        .upload(fileName, cv, { contentType: cv.type, upsert: false });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('applications').getPublicUrl(fileName);
        resumeUrl = urlData?.publicUrl || null;
      }
    }

    if (coverLetter && coverLetter.size > 0) {
      const ext = coverLetter.name.split('.').pop() || 'pdf';
      const fileName = `cover-letters/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('applications')
        .upload(fileName, coverLetter, { contentType: coverLetter.type, upsert: false });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('applications').getPublicUrl(fileName);
        coverLetterUrl = urlData?.publicUrl || null;
      }
    }

    const { data, error } = await supabase
      .from('applications')
      .insert([{
        job_id: jobId,
        applicant_name: candidateName,
        applicant_email: candidateEmail,
        phone: phone || null,
        cover_letter_text: coverLetterText || null,
        resume_url: resumeUrl,
        cover_letter_url: coverLetterUrl,
        status: 'new',
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id, message: 'Application submitted' }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to submit application' },
      { status: 500 },
    );
  }
}
