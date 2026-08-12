'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { blogPosts, categories } from '@/data/blog'
import type { BlogCategory } from '@/data/blog'

export default function InsightsPage() {
  const [activeCategory, setActiveCategory] = useState<BlogCategory | 'All'>('All')

  const filtered = activeCategory === 'All'
    ? blogPosts
    : blogPosts.filter((p) => p.category === activeCategory)

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
              Insights
            </div>
            <h1 className="font-serif text-5xl font-normal leading-tight tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl">
              Industry Insights for Digital Leaders
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/60">
              Thought leadership for C-suite executives navigating digital transformation, AI adoption, and security strategy. Practical insights from hundreds of implementation projects across Africa.
            </p>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="sticky top-[68px] z-30 border-b border-gray-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-[#0b1020]/95 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto">
          {(['All', ...categories] as const).map((cat) => (
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

      {/* BLOG POSTS */}
      <main className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-gray-500">No posts in this category yet.</div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {filtered.map((post) => (
                <Link
                  key={post.slug}
                  href={`/insights/${post.slug}`}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1 dark:border-white/10 dark:bg-[#101827]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={post.heroImage}
                      alt={post.title}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className="inline-block rounded-full bg-white/90 px-3.5 py-1 text-xs font-semibold text-gray-700 backdrop-blur dark:bg-gray-800/90 dark:text-gray-200">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center p-6 sm:p-8">
                    <h3 className="text-xl font-bold text-[#2f2f2f] transition group-hover:text-[#4584ed] dark:text-white">
                      {post.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[#5f6368] dark:text-gray-300 line-clamp-2">
                      {post.subtitle}
                    </p>

                    <div className="mt-4 flex items-center gap-4 text-xs text-[#5f6368] dark:text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {post.readTime}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        {post.author.replace('TechSpecialist ', '')}
                      </span>
                    </div>

                    <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-[#4584ed] transition group-hover:gap-2.5">
                      Read Article
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
            Ready to turn insight into <em className="text-[#4584ed] not-italic">action?</em>
          </h2>
          <p className="mt-4 text-lg leading-8 text-[#5f6368] dark:text-white/60">
            Every article points to a practical next step. Whether it&apos;s a data unification assessment, an AI opportunity analysis, or a security posture review—we can help you move forward.
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
  )
}
