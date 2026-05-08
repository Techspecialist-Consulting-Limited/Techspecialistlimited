'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { caseStudies } from '@/data/case-studies';

const categories = ['All', 'Government & Public Sector', 'Financial Services'];

export default function CaseStudiesPage() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? caseStudies
    : caseStudies.filter((cs) => cs.category === activeCategory);

  const totalStats = [
    { label: 'Combined Value', value: '₦2.5B+' },
    { label: 'Users Impacted', value: '2,500+' },
  ];

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0b1020_0%,#1a1f2e_50%,#0f1419_100%)] px-4 pb-20 pt-28 sm:px-6 lg:px-8 lg:pb-28 lg:pt-36">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0b1020]/60" />
        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#4584ed] backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4584ed]" />
              Our Work
            </div>
            <h1 className="font-serif text-5xl font-normal leading-tight tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl">
              Case Studies
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/60">
              Real problems, real solutions. See how we&apos;ve helped organisations across Africa transform their operations with technology built on Microsoft tools they already own.
            </p>
          </div>

          {/* STATS */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {totalStats.map((stat, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="mt-0.5 text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="sticky top-[68px] z-30 border-b border-gray-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-[#0b1020]/95 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition ${
                activeCategory === cat
                  ? 'bg-[#4584ed] text-white shadow-[0_2px_12px_rgba(69,132,237,0.3)]'
                  : 'bg-gray-100 text-[#5f6368] hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* CASE STUDIES */}
      <main className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-gray-500">No case studies in this category yet.</div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {filtered.map((cs) => (
                <Link
                  key={cs.id}
                  href={`/case-studies/${cs.id}`}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1 dark:border-white/10 dark:bg-[#101827]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={cs.heroImage}
                      alt={cs.title}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className="inline-block rounded-full bg-white/90 px-3.5 py-1 text-xs font-semibold text-gray-700 backdrop-blur dark:bg-gray-800/90 dark:text-gray-200">
                        {cs.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center p-6 sm:p-8">
                    <div className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-[#4584ed]">{cs.client}</div>
                    <h3 className="text-xl font-bold text-[#2f2f2f] transition group-hover:text-[#4584ed] dark:text-white">
                      {cs.subtitle}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[#5f6368] dark:text-gray-300 line-clamp-3">
                      {cs.summary}
                    </p>

                    <div className="mt-6 grid gap-3 grid-cols-4">
                      {cs.stats.slice(0, 4).map((stat, j) => (
                        <div key={j} className="rounded-lg bg-gray-50 px-3 py-2.5 text-center dark:bg-white/[0.03]">
                          <div className="text-sm font-bold text-[#4584ed]">{stat.value}</div>
                          <div className="text-[10px] leading-tight text-[#5f6368] dark:text-gray-400">{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center gap-4 text-xs text-[#5f6368] dark:text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {cs.duration}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        {cs.service}
                      </span>
                    </div>

                    <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-[#4584ed] transition group-hover:gap-2.5">
                      Read Case Study
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* CTA */}
      <section className="border-t border-gray-200 bg-[#f7f9fc] px-4 py-16 dark:border-white/10 dark:bg-white/[0.03] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-normal leading-tight tracking-[-0.03em] text-[#2f2f2f] dark:text-white sm:text-4xl">
            Ready to be our next <em className="text-[#4584ed] not-italic">success story?</em>
          </h2>
          <p className="mt-4 text-lg leading-8 text-[#5f6368] dark:text-white/60">
            Let&apos;s talk about how we can help your organisation transform operations with technology built on Microsoft tools you already own.
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
