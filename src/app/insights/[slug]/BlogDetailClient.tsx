'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getBlogPost, getRelatedPosts } from '@/data/blog'
import { RichParagraph, RichBullet } from '@/components/RichText'

export default function BlogDetailClient() {
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const post = getBlogPost(slug)
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    if (!post) return
    const ids = ['executive-summary', ...post.sections.map((_, i) => `section-${i}`), 'key-takeaways']
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { threshold: 0, rootMargin: '-80px 0px -80% 0px' }
    )
    for (const id of ids) {
      document.getElementById(id) && observer.observe(document.getElementById(id)!)
    }
    return () => observer.disconnect()
  }, [post])

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">📄</div>
          <h2 className="mb-4 text-2xl font-bold text-[#2f2f2f] dark:text-white">Post Not Found</h2>
          <Link href="/insights" className="text-[#4584ed] hover:underline">← Back to Insights</Link>
        </div>
      </div>
    )
  }

  const related = getRelatedPosts(post.slug, 3)

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image fill src={post.heroImage} alt={post.title} className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b1020]/95 via-[#0b1020]/80 to-[#0b1020]/60" />
        </div>
        <div className="relative px-4 pb-20 pt-28 sm:px-6 lg:px-8 lg:pb-28 lg:pt-36">
          <div className="mx-auto max-w-6xl">
            <div className="mb-4 flex items-center gap-3">
              <Link href="/insights" className="inline-flex items-center gap-1.5 text-xs text-white/50 transition hover:text-white">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12h5M12 19l-7-7 7-7"/></svg>
                Back to Insights
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#4584ed] backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4584ed]" />
                {post.category}
              </span>
            </div>
            <h1 className="max-w-4xl font-serif text-4xl font-normal leading-tight tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
              {post.title}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-white/70">
              {post.subtitle}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/60">
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {post.author}
              </span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {post.readTime}
              </span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {post.published}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <main className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[280px_1fr]">
            {/* TOC SIDEBAR */}
            <div className="lg:sticky lg:top-[100px] lg:self-start">
              <nav className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#101827]">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.1em] text-[#5f6368] dark:text-gray-400">
                  On this page
                </h3>
                <ul className="space-y-2.5">
                  <li>
                    <a href="#executive-summary" className={`text-sm transition ${activeSection === 'executive-summary' ? 'text-[#4584ed] font-semibold' : 'text-[#5f6368] hover:text-[#4584ed] dark:text-gray-400 dark:hover:text-[#4584ed]'}`}>
                      Executive Summary
                    </a>
                  </li>
                  {post.sections.map((section, i) => (
                    <li key={i}>
                      <a
                        href={`#section-${i}`}
                        className={`text-sm transition ${activeSection === `section-${i}` ? 'text-[#4584ed] font-semibold' : 'text-[#5f6368] hover:text-[#4584ed] dark:text-gray-400 dark:hover:text-[#4584ed]'}`}
                      >
                        {section.heading}
                      </a>
                    </li>
                  ))}
                  <li>
                    <a href="#key-takeaways" className={`text-sm transition ${activeSection === 'key-takeaways' ? 'text-[#4584ed] font-semibold' : 'text-[#5f6368] hover:text-[#4584ed] dark:text-gray-400 dark:hover:text-[#4584ed]'}`}>
                      Key Takeaways
                    </a>
                  </li>
                </ul>
              </nav>
            </div>

            {/* MAIN CONTENT */}
            <div className="min-w-0 max-w-3xl">
              {/* EXECUTIVE SUMMARY */}
              <section id="executive-summary" className="mb-12">
                <div className="rounded-2xl border-l-4 border-[#4584ed] bg-[#f0f6ff] px-6 py-5 dark:bg-[#4584ed]/10">
                  <div className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-[#4584ed]">
                    Executive Summary
                  </div>
                  <p className="text-[17px] leading-[1.8] text-[#2f2f2f] dark:text-gray-200">
                    {post.executiveSummary}
                  </p>
                </div>
              </section>

              {/* SECTIONS */}
              <div className="space-y-12">
                {post.sections.map((section, i) => (
                  <section key={i} id={`section-${i}`}>
                    <h2 className="font-serif text-2xl font-normal leading-tight tracking-[-0.02em] text-[#2f2f2f] dark:text-white sm:text-3xl">
                      {section.heading}
                    </h2>
                    <div className="mt-4 space-y-4">
                      {section.blocks.map((block, j) => {
                        if (block.type === 'bullets') {
                          return (
                            <ul key={j} className="space-y-3 pl-0">
                              {block.items.map((item, k) => (
                                <RichBullet key={k} text={item} />
                              ))}
                            </ul>
                          )
                        }
                        return <RichParagraph key={j} text={block.text} />
                      })}
                    </div>
                  </section>
                ))}
              </div>

              {/* KEY TAKEAWAYS */}
              <section id="key-takeaways" className="mt-16 rounded-2xl border border-green-200 bg-green-50/50 px-6 py-6 dark:border-green-900/20 dark:bg-green-900/5">
                <h3 className="mb-4 text-lg font-bold text-[#2f2f2f] dark:text-white">
                  Key Takeaways
                </h3>
                <ul className="space-y-3">
                  {post.keyTakeaways.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span className="text-[17px] leading-[1.8] text-[#5f6368] dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* CTA */}
              <section className="mt-16 rounded-2xl border border-gray-200 bg-[#f7f9fc] px-8 py-10 text-center dark:border-white/10 dark:bg-white/[0.03]">
                <h3 className="font-serif text-2xl font-normal leading-tight tracking-[-0.02em] text-[#2f2f2f] dark:text-white sm:text-3xl">
                  {post.cta.heading}
                </h3>
                <p className="mx-auto mt-4 max-w-2xl text-[17px] leading-[1.8] text-[#5f6368] dark:text-gray-300">
                  {post.cta.body}
                </p>
                <Link
                  href={post.cta.buttonUrl}
                  className="mt-6 inline-flex items-center gap-2.5 rounded-xl bg-[linear-gradient(135deg,#4584ed_0%,#2d65c4_100%)] px-8 py-4 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(59,111,209,0.3)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(59,111,209,0.4)]"
                >
                  {post.cta.buttonText}
                </Link>
              </section>

              {/* AUTHOR BIO */}
              <section className="mt-12 rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-[#101827]">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#4584ed]/10 text-lg font-bold text-[#4584ed]">
                    TS
                  </div>
                  <div>
                    <div className="font-semibold text-[#2f2f2f] dark:text-white">{post.author}</div>
                    <p className="mt-1 text-sm leading-7 text-[#5f6368] dark:text-gray-400">
                      {post.authorBio}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* RELATED POSTS */}
      {related.length > 0 && (
        <section className="border-t border-gray-200 bg-[#f7f9fc] px-4 py-16 dark:border-white/10 dark:bg-white/[0.03] sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10">
              <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#4584ed]">More From Our Blog</div>
              <h2 className="mt-2 font-serif text-3xl font-normal leading-tight tracking-[-0.03em] text-[#2f2f2f] dark:text-white sm:text-4xl">
                Related <em className="text-[#4584ed] not-italic">articles</em>
              </h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/insights/${item.slug}`}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg hover:-translate-y-1 dark:border-white/10 dark:bg-[#101827]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image fill src={item.heroImage} alt={item.title} className="object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-block rounded-full bg-white/90 px-3 py-0.5 text-[11px] font-semibold text-gray-700 backdrop-blur dark:bg-gray-800/90 dark:text-gray-200">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-base font-bold text-[#2f2f2f] transition group-hover:text-[#4584ed] dark:text-white line-clamp-2">
                      {item.title}
                    </h3>
                    <div className="mt-2 text-xs text-[#5f6368] dark:text-gray-400">{item.readTime}</div>
                    <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-[#4584ed] transition group-hover:gap-2.5">
                      Read Article
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BOTTOM CTA */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-normal leading-tight tracking-[-0.03em] text-[#2f2f2f] dark:text-white sm:text-4xl">
            Ready to turn insight into <em className="text-[#4584ed] not-italic">action?</em>
          </h2>
          <p className="mt-4 text-lg leading-8 text-[#5f6368] dark:text-white/60">
            Let&apos;s discuss how TechSpecialist can help your organisation implement the strategies discussed in this article.
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
