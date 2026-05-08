'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCaseStudy, getRelatedCaseStudies } from '@/data/case-studies';

export default function CaseStudyDetail() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const cs = getCaseStudy(id);

  if (!cs) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">📄</div>
          <h2 className="mb-4 text-2xl font-bold text-[#2f2f2f] dark:text-white">Case Study Not Found</h2>
          <Link href="/case-studies" className="text-[#4584ed] hover:underline">← Back to Case Studies</Link>
        </div>
      </div>
    );
  }

  const related = getRelatedCaseStudies(cs.id, 2);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src={cs.heroImage} alt={cs.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b1020]/95 via-[#0b1020]/80 to-[#0b1020]/60" />
        </div>
        <div className="relative px-4 pb-20 pt-28 sm:px-6 lg:px-8 lg:pb-28 lg:pt-36">
          <div className="mx-auto max-w-6xl">
            <div className="mb-4 flex items-center gap-3">
              <Link href="/case-studies" className="inline-flex items-center gap-1.5 text-xs text-white/50 transition hover:text-white">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#4584ed] backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4584ed]" />
                {cs.category}
              </span>
            </div>
            <h1 className="max-w-4xl font-serif text-4xl font-normal leading-tight tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
              {cs.subtitle}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-white/80">{cs.client}</span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span className="text-sm text-white/60">{cs.industry}</span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span className="text-sm text-white/60">{cs.duration}</span>
            </div>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">{cs.summary}</p>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative -mt-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-[#101827] sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
            {cs.stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-[#4584ed] sm:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-[#5f6368] dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <main className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-16 lg:grid-cols-[1fr_300px]">
            {/* Main content */}
            <div className="space-y-16">
              {/* Challenge */}
              <section>
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-lg dark:bg-red-900/20">⚠️</span>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#4584ed]">The Challenge</div>
                    <h2 className="text-2xl font-bold text-[#2f2f2f] dark:text-white">What we set out to solve</h2>
                  </div>
                </div>
                <ul className="space-y-4">
                  {cs.challenge.map((item, i) => (
                    <li key={i} className="flex items-start gap-4 rounded-xl border border-gray-100 bg-[#f7f9fc] px-5 py-4 dark:border-white/5 dark:bg-white/[0.02]">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">{i + 1}</span>
                      <span className="text-[#5f6368] dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Solution */}
              <section>
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg dark:bg-blue-900/20">💡</span>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#4584ed]">The Solution</div>
                    <h2 className="text-2xl font-bold text-[#2f2f2f] dark:text-white">How we delivered</h2>
                  </div>
                </div>
                <ul className="space-y-4">
                  {cs.solution.map((item, i) => (
                    <li key={i} className="flex items-start gap-4 rounded-xl border border-gray-100 bg-[#f7f9fc] px-5 py-4 dark:border-white/5 dark:bg-white/[0.02]">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">{i + 1}</span>
                      <span className="text-[#5f6368] dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Results */}
              <section>
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-lg dark:bg-green-900/20">✅</span>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#4584ed]">The Results</div>
                    <h2 className="text-2xl font-bold text-[#2f2f2f] dark:text-white">What changed</h2>
                  </div>
                </div>
                <div className="space-y-4">
                  {cs.results.map((item, i) => (
                    <div key={i} className="flex items-start gap-4 rounded-xl border border-green-100 bg-green-50/50 px-5 py-4 dark:border-green-900/20 dark:bg-green-900/5">
                      <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span className="text-[#5f6368] dark:text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="lg:sticky lg:top-[100px] lg:self-start">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#101827]">
                <h3 className="mb-4 text-lg font-bold text-[#2f2f2f] dark:text-white">Project Details</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f6368] dark:text-gray-400">Client</div>
                    <div className="mt-1 text-sm font-semibold text-[#2f2f2f] dark:text-white">{cs.client}</div>
                  </div>
                  <div className="h-px bg-gray-100 dark:bg-white/10" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f6368] dark:text-gray-400">Industry</div>
                    <div className="mt-1 text-sm text-[#2f2f2f] dark:text-white">{cs.industry}</div>
                  </div>
                  <div className="h-px bg-gray-100 dark:bg-white/10" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f6368] dark:text-gray-400">Duration</div>
                    <div className="mt-1 text-sm text-[#2f2f2f] dark:text-white">{cs.duration}</div>
                  </div>
                  <div className="h-px bg-gray-100 dark:bg-white/10" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f6368] dark:text-gray-400">Service</div>
                    <div className="mt-1 text-sm text-[#2f2f2f] dark:text-white">{cs.service}</div>
                  </div>
                  <div className="h-px bg-gray-100 dark:bg-white/10" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#5f6368] dark:text-gray-400">Category</div>
                    <span className="mt-1.5 inline-block rounded-full bg-[#f7f9fc] px-3 py-1 text-xs font-semibold text-[#5f6368] dark:bg-gray-700 dark:text-gray-300">
                      {cs.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Testimonial */}
              {cs.testimonial && (
                <div className="mt-6 rounded-2xl border border-gray-200 bg-[#f7f9fc] p-6 shadow-sm dark:border-white/10 dark:bg-[#101827]">
                  <svg className="mb-3 h-8 w-8 text-[#4584ed]/30" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11H10v10H0z"/></svg>
                  <p className="text-sm leading-7 text-[#5f6368] italic dark:text-gray-300">&ldquo;{cs.testimonial.quote}&rdquo;</p>
                  <div className="mt-4 border-t border-gray-200 pt-4 dark:border-white/10">
                    <div className="text-sm font-bold text-[#2f2f2f] dark:text-white">{cs.testimonial.name}</div>
                    <div className="text-xs text-[#5f6368] dark:text-gray-400">{cs.testimonial.role}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Related Case Studies */}
      {related.length > 0 && (
        <section className="border-t border-gray-200 bg-[#f7f9fc] px-4 py-16 dark:border-white/10 dark:bg-white/[0.03] sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10">
              <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#4584ed]">More Case Studies</div>
              <h2 className="mt-2 font-serif text-3xl font-normal leading-tight tracking-[-0.03em] text-[#2f2f2f] dark:text-white sm:text-4xl">
                Related <em className="text-[#4584ed] not-italic">work</em>
              </h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/case-studies/${item.id}`}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg hover:-translate-y-1 dark:border-white/10 dark:bg-[#101827]"
                >
                  <div className="aspect-[16/9] overflow-hidden">
                    <Image src={item.heroImage} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-6">
                    <div className="mb-1 text-xs font-bold uppercase tracking-[0.1em] text-[#4584ed]">{item.client}</div>
                    <h3 className="text-lg font-bold text-[#2f2f2f] transition group-hover:text-[#4584ed] dark:text-white">{item.subtitle}</h3>
                    <p className="mt-2 text-sm leading-7 text-[#5f6368] dark:text-gray-300 line-clamp-2">{item.summary}</p>
                    <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-[#4584ed] transition group-hover:gap-2.5">
                      Read Case Study
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-normal leading-tight tracking-[-0.03em] text-[#2f2f2f] dark:text-white sm:text-4xl">
            Want results like these for <em className="text-[#4584ed] not-italic">your organisation?</em>
          </h2>
          <p className="mt-4 text-lg leading-8 text-[#5f6368] dark:text-white/60">
            Let&apos;s map your top 3 operational bottlenecks and show you exactly what&apos;s possible — on your existing Microsoft environment.
          </p>
          <Link
            href="/#discovery"
            className="mt-8 inline-flex items-center gap-2.5 rounded-xl bg-[linear-gradient(135deg,#4584ed_0%,#2d65c4_100%)] px-8 py-4 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(59,111,209,0.3)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(59,111,209,0.4)]"
          >
            Book a Discovery Call →
          </Link>
        </div>
      </section>
    </div>
  );
}
