'use client';

import { Suspense } from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ApplyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get('id');

  const [job, setJob] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(jobId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<Record<string, any>>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    coverLetter: '',
    resumeUrl: ''
  });

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [clFile, setClFile] = useState<File | null>(null);
  const [cvUploaded, setCvUploaded] = useState(false);
  const [clUploaded, setClUploaded] = useState(false);

  const cvInputRef = useRef<HTMLInputElement | null>(null);
  const clInputRef = useRef<HTMLInputElement | null>(null);

  const loadJob = useCallback(async (id: string) => {
    if (!id) return;
    setIsLoading(true);
    try {
      const { initializeApp, getApps } = await import('firebase/app');
      const { getFirestore, doc, getDoc } = await import('firebase/firestore');

      if (!getApps().length) {
        initializeApp({
          apiKey: "AIzaSyD1151-t0RDGn1bz0GwMr4Uv0uA4E6bnoo",
          authDomain: "techspecialist-careers.firebaseapp.com",
          projectId: "techspecialist-careers",
          storageBucket: "techspecialist-careers.firebasestorage.app",
          messagingSenderId: "68286942864",
          appId: "1:68286942864:web:06748d637d7422f0ccd215"
        });
      }

      const db = getFirestore();
      const docRef = doc(db, 'jobs', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setJob({ id: docSnap.id, ...docSnap.data() });
      } else {
        setJob({
          id,
          title: 'Software Developer',
          department: 'Engineering',
          location: 'Abuja',
          type: 'Full-time',
          description: 'Join our engineering team to build innovative solutions.'
        });
      }
    } catch (error) {
      console.error('Error loading job:', error);
      setJob({
        id,
        title: 'Software Developer',
        department: 'Engineering',
        location: 'Abuja',
        type: 'Full-time',
        description: 'Join our engineering team.'
      });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (jobId) {
      queueMicrotask(() => loadJob(jobId));
    }
  }, [jobId, loadJob]);

  const handleFileSelect = async (type: 'cv' | 'cl', file: File) => {
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setModalConfig({
        title: 'Invalid File Type',
        subtitle: 'Please upload a PDF or Word document',
        body: '<p>The file must be in PDF or DOCX format.</p>',
        iconType: 'warning',
        buttons: [{ text: 'OK', className: 'bg-[#4584ed] text-white px-6 py-2 rounded-lg', onClick: () => setShowModal(false) }]
      });
      setShowModal(true);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setModalConfig({
        title: 'File Too Large',
        subtitle: 'Maximum file size is 5MB',
        body: '<p>Please compress your document or upload a smaller file.</p>',
        iconType: 'warning',
        buttons: [{ text: 'OK', className: 'bg-[#4584ed] text-white px-6 py-2 rounded-lg', onClick: () => setShowModal(false) }]
      });
      setShowModal(true);
      return;
    }

    if (type === 'cv') {
      setCvFile(file);
      setCvUploaded(true);
    } else {
      setClFile(file);
      setClUploaded(true);
    }
  };

  const removeFile = (type: 'cv' | 'cl') => {
    if (type === 'cv') {
      setCvFile(null);
      setCvUploaded(false);
      if (cvInputRef.current) cvInputRef.current.value = '';
    } else {
      setClFile(null);
      setClUploaded(false);
      if (clInputRef.current) clInputRef.current.value = '';
    }
  };

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'careers');
    formData.append('folder', 'careers-applications');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/daqmbfctv/auto/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone) {
      setModalConfig({
        title: 'Missing Information',
        subtitle: 'Please fill in all required fields',
        body: '<p>Name, email, and phone number are required.</p>',
        iconType: 'warning',
        buttons: [{ text: 'OK', className: 'bg-[#4584ed] text-white px-6 py-2 rounded-lg', onClick: () => setShowModal(false) }]
      });
      setShowModal(true);
      return;
    }

    if (!cvFile && !formData.resumeUrl) {
      setModalConfig({
        title: 'CV Required',
        subtitle: 'Please upload your CV or provide a resume link',
        body: '<p>Your CV/Resume is required to apply for this position.</p>',
        iconType: 'warning',
        buttons: [{ text: 'OK', className: 'bg-[#4584ed] text-white px-6 py-2 rounded-lg', onClick: () => setShowModal(false) }]
      });
      setShowModal(true);
      return;
    }

    if (!jobId || job?.status === 'closed') {
      setModalConfig({
        title: job?.status === 'closed' ? 'Application Closed' : 'No Job Selected',
        subtitle: job?.status === 'closed' ? 'This position is no longer accepting applications' : 'Please choose a position first',
        body: job?.status === 'closed'
          ? `<p>We're sorry, but the <strong>${job?.title || 'selected'}</strong> position is no longer accepting applications.</p>`
          : '<p>Please return to careers and choose the position you want to apply for.</p>',
        iconType: 'warning',
        buttons: [{ text: 'View Open Positions', className: 'bg-[#4584ed] text-white px-6 py-2 rounded-lg', onClick: () => router.push('/careers') }]
      });
      setShowModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      let cvUrl = formData.resumeUrl;
      let clUrl = null;

      if (cvFile) {
        const result = await uploadToCloudinary(cvFile);
        cvUrl = result.secure_url;
      }

      if (clFile) {
        const result = await uploadToCloudinary(clFile);
        clUrl = result.secure_url;
      }

      const { initializeApp, getApps } = await import('firebase/app');
      const { getFirestore, collection, addDoc, serverTimestamp } = await import('firebase/firestore');

      if (!getApps().length) {
        initializeApp({
          apiKey: "AIzaSyD1151-t0RDGn1bz0GwMr4Uv0uA4E6bnoo",
          authDomain: "techspecialist-careers.firebaseapp.com",
          projectId: "techspecialist-careers",
          storageBucket: "techspecialist-careers.firebasestorage.app",
          messagingSenderId: "68286942864",
          appId: "1:68286942864:web:06748d637d7422f0ccd215"
        });
      }

      const db = getFirestore();
      await addDoc(collection(db, 'applications'), {
        jobId,
        jobTitle: job?.title || 'Unknown Position',
        applicantName: formData.name,
        applicantEmail: formData.email,
        phone: formData.phone,
        resumeUrl: cvUrl,
        resumeFileName: cvFile ? cvFile.name : null,
        coverLetterUrl: clUrl,
        coverLetterFileName: clFile ? clFile.name : null,
        coverLetterText: formData.coverLetter,
        status: 'new',
        appliedAt: serverTimestamp()
      });

      setModalConfig({
        title: 'Application Submitted!',
        subtitle: 'Thank you for applying',
        body: `<p>Your application for <strong>${job?.title || 'the position'}</strong> has been submitted successfully.</p><p>We will review your application and get back to you soon.</p>`,
        iconType: 'success',
        buttons: [
          { text: 'View Open Positions', className: 'bg-[#4584ed] text-white px-6 py-2 rounded-lg', onClick: () => router.push('/careers') },
          { text: 'Close', className: 'bg-gray-200 text-gray-700 px-6 py-2 rounded-lg', onClick: () => setShowModal(false) }
        ]
      });
      setShowModal(true);

      setFormData({ name: '', email: '', phone: '', coverLetter: '', resumeUrl: '' });
      setCvFile(null);
      setClFile(null);
      setCvUploaded(false);
      setClUploaded(false);

    } catch (error) {
      console.error('Error submitting application:', error);
      setModalConfig({
        title: 'Submission Error',
        subtitle: 'Something went wrong',
        body: '<p>There was an error submitting your application. Please try again later.</p>',
        iconType: 'error',
        buttons: [{ text: 'OK', className: 'bg-[#4584ed] text-white px-6 py-2 rounded-lg', onClick: () => setShowModal(false) }]
      });
      setShowModal(true);
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#4584ed] border-t-transparent mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
    );
  }

  return (
    <div>
      {/* PAGE HEADER */}
      <header className="border-b border-gray-200 bg-white px-4 py-12 dark:border-white/10 dark:bg-[#0b1020] sm:px-6 lg:px-8 lg:py-16" style={{ marginTop: '64px' }}>
        <div className="mx-auto max-w-6xl">
          <Link href="/careers" className="mb-4 inline-flex items-center gap-2 text-sm text-[#5f6368] hover:text-[#4584ed] dark:text-white/60">
            ← Back to Careers
          </Link>
          {job && (
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-[#4584ed]">{job.department}</div>
              <h1 className="font-serif text-4xl font-normal leading-tight tracking-[-0.03em] text-[#2f2f2f] dark:text-white sm:text-5xl">
                {job.title}
              </h1>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="rounded-full bg-[#f7f9fc] px-3 py-1 text-xs font-semibold text-[#5f6368] dark:bg-gray-700 dark:text-gray-300">{job.location}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  job.type?.toLowerCase() === 'full-time'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                }`}>{job.type || 'Full-time'}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* APPLY FORM */}
      <main className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_420px]">
          {/* Main Form */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#2f2f2f] dark:text-white">Apply Now</h2>
              <p className="mt-2 text-sm text-[#5f6368] dark:text-white/60">Submit your application for this position.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Documents */}
              <section className="rounded-2xl border border-gray-200 bg-[#f7f9fc] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[#5f6368] dark:text-white/55">Documents</div>
                <div className="grid gap-3">
                  <label className={`relative block cursor-pointer rounded-xl border-2 border-dashed border-gray-200 bg-white p-4 text-center transition hover:border-[#4584ed] dark:border-white/10 dark:bg-[#0b1020] ${cvUploaded ? 'has-file' : ''}`}>
                    <input
                      ref={cvInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc"
                      onChange={(e) => { const f = e.target.files; if (f && f[0]) handleFileSelect('cv', f[0]); }}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <span className={`upload-empty ${cvUploaded ? 'hidden' : 'block'}`}>
                      <span className="mb-2 block text-sm font-semibold">Drop your CV here</span>
                      <span className="mt-1 block text-xs text-[#5f6368] dark:text-white/55">PDF, DOC, or DOCX. Max 5MB.</span>
                    </span>
                    <span className={`upload-filled ${cvUploaded ? 'block' : 'hidden'} flex items-center justify-center gap-2 text-[#5f6368] dark:text-white/80`}>
                      <span className="text-[#4584ed] font-bold">✓</span> {cvFile?.name}
                      <button type="button" onClick={(e) => { e.preventDefault(); removeFile('cv'); }} className="ml-2 rounded bg-red-100 px-2 py-1 text-xs text-red-700">Remove</button>
                    </span>
                  </label>

                  <label className={`relative block cursor-pointer rounded-xl border-2 border-dashed border-gray-200 bg-white p-4 text-center transition hover:border-[#4584ed] dark:border-white/10 dark:bg-[#0b1020] ${clUploaded ? 'has-file' : ''}`}>
                    <input
                      ref={clInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc"
                      onChange={(e) => { const f = e.target.files; if (f && f[0]) handleFileSelect('cl', f[0]); }}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <span className={`upload-empty ${clUploaded ? 'hidden' : 'block'}`}>
                      <span className="mb-2 block text-sm font-semibold">Add a cover letter</span>
                      <span className="mt-1 block text-xs text-[#5f6368] dark:text-white/55">Optional PDF, DOC, or DOCX.</span>
                    </span>
                    <span className={`upload-filled ${clUploaded ? 'block' : 'hidden'} flex items-center justify-center gap-2 text-[#5f6368] dark:text-white/80`}>
                      <span className="text-[#4584ed] font-bold">✓</span> {clFile?.name}
                      <button type="button" onClick={(e) => { e.preventDefault(); removeFile('cl'); }} className="ml-2 rounded bg-red-100 px-2 py-1 text-xs text-red-700">Remove</button>
                    </span>
                  </label>
                </div>
                <label className="mt-4 grid gap-2 text-sm font-semibold text-[#2f2f2f] dark:text-white">
                  Or paste a resume link
                  <input
                    type="url"
                    value={formData.resumeUrl}
                    onChange={(e) => setFormData({...formData, resumeUrl: e.target.value})}
                    placeholder="https://linkedin.com/in/yourprofile or Google Drive"
                    className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-normal text-[#2f2f2f] outline-none focus:border-[#4584ed] dark:border-white/10 dark:bg-[#0b1020] dark:text-white"
                  />
                </label>
              </section>

              {/* Personal Info */}
              <label className="grid gap-2 text-sm font-semibold text-[#2f2f2f] dark:text-white">
                Full Name *
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="John Doe"
                  className="rounded-lg border border-gray-200 bg-[#f7f9fc] px-4 py-3 text-sm font-normal text-[#2f2f2f] outline-none focus:border-[#4584ed] dark:border-white/10 dark:bg-[#0b1020] dark:text-white"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-[#2f2f2f] dark:text-white">
                  Email *
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="john@example.com"
                    className="rounded-lg border border-gray-200 bg-[#f7f9fc] px-4 py-3 text-sm font-normal text-[#2f2f2f] outline-none focus:border-[#4584ed] dark:border-white/10 dark:bg-[#0b1020] dark:text-white"
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold text-[#2f2f2f] dark:text-white">
                  Phone *
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+234 800 000 0000"
                    className="rounded-lg border border-gray-200 bg-[#f7f9fc] px-4 py-3 text-sm font-normal text-[#2f2f2f] outline-none focus:border-[#4584ed] dark:border-white/10 dark:bg-[#0b1020] dark:text-white"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-semibold text-[#2f2f2f] dark:text-white">
                Cover Letter (Optional)
                <textarea
                  rows={5}
                  value={formData.coverLetter}
                  onChange={(e) => setFormData({...formData, coverLetter: e.target.value})}
                  placeholder="Tell us why you're a great fit for this role..."
                  className="resize-y rounded-lg border border-gray-200 bg-[#f7f9fc] px-4 py-3 text-sm font-normal text-[#2f2f2f] outline-none focus:border-[#4584ed] dark:border-white/10 dark:bg-[#0b1020] dark:text-white"
                ></textarea>
              </label>

              <button
                type="submit"
                disabled={isSubmitting || job?.status === 'closed'}
                className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#4584ed_0%,#2d65c4_100%)] px-6 py-4 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(69,132,237,0.28)] disabled:cursor-not-allowed disabled:opacity-70`}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    Submitting...
                  </>
                ) : job?.status === 'closed' ? (
                  'Applications Closed'
                ) : (
                  'Submit Application →'
                )}
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_12px_38px_rgba(8,14,30,0.08)] dark:border-white/10 dark:bg-[#101827] lg:sticky lg:top-24">
            <h3 className="mb-4 text-xl font-bold text-[#2f2f2f] dark:text-white">Job Summary</h3>
            {job && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f6368] dark:text-white/55">Department</div>
                  <div className="mt-1 text-sm text-[#2f2f2f] dark:text-white">{job.department}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f6368] dark:text-white/55">Location</div>
                  <div className="mt-1 text-sm text-[#2f2f2f] dark:text-white">{job.location}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f6368] dark:text-white/55">Type</div>
                  <div className="mt-1 text-sm text-[#2f2f2f] dark:text-white">{job.type || 'Full-time'}</div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#101827]">
            <div className="mb-4 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                modalConfig.iconType === 'success' ? 'bg-green-100' :
                modalConfig.iconType === 'error' ? 'bg-red-100' :
                'bg-yellow-100'
              }`}>
                {modalConfig.iconType === 'success' && <span className="text-2xl">✓</span>}
                {modalConfig.iconType === 'error' && <span className="text-2xl">✕</span>}
                {modalConfig.iconType === 'warning' && <span className="text-2xl">⚠</span>}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#2f2f2f] dark:text-white">{modalConfig.title}</h3>
                <p className="text-sm text-[#5f6368] dark:text-white/60">{modalConfig.subtitle}</p>
              </div>
            </div>
            <div className="text-sm leading-7 text-[#5f6368] dark:text-white/65" dangerouslySetInnerHTML={{ __html: modalConfig.body || '' }} />
            <div className="mt-6 flex gap-3">
              {modalConfig.buttons?.map((btn: Record<string, any>, idx: number) => (
                <button key={idx} onClick={btn.onClick} className={`${btn.className}`}>
                  {btn.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-center"><div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#4584ed] border-t-transparent mb-4"></div><p className="text-gray-600 dark:text-gray-400">Loading...</p></div></div>}>
      <ApplyContent />
    </Suspense>
  );
}
