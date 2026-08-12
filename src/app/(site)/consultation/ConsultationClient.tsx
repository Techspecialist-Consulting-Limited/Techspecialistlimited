'use client'

import Link from 'next/link'

export default function ConsultationClient() {
  return (
    <div>
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0b1020_0%,#1a1f2e_50%,#0f1419_100%)] px-4 pb-20 pt-28 sm:px-6 lg:px-8 lg:pb-28 lg:pt-36">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative mx-auto max-w-6xl text-center">
          <h1 className="font-serif text-5xl font-normal leading-tight tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl">
            Book a Consultation
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/60">
            This page is coming soon. In the meantime, book a discovery call through the link below.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/#discovery"
              className="inline-flex items-center gap-2.5 rounded-xl bg-[linear-gradient(135deg,#4584ed_0%,#2d65c4_100%)] px-8 py-4 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(59,111,209,0.3)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(59,111,209,0.4)]"
            >
              Book a Discovery Call →
            </Link>
            <Link
              href="/insights"
              className="inline-flex items-center gap-2.5 rounded-xl border border-white/20 px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              ← Back to Insights
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: 'Data Unification Assessment',
                description: 'Quantify the cost of data fragmentation and identify quick wins for unified data operations.',
                link: '/insights/data-silos-competitive-advantage',
              },
              {
                title: 'AI Opportunity Assessment',
                description: 'Identify which processes would benefit most from AI automation and map your implementation path.',
                link: '/insights/ai-adoption-gap',
              },
              {
                title: 'Security Posture Review',
                description: 'Assess your security posture and identify vulnerabilities before they become breaches.',
                link: '/insights/security-digital-transformation',
              },
            ].map((item, i) => (
              <Link
                key={i}
                href={item.link}
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-lg hover:-translate-y-1 dark:border-white/10 dark:bg-[#101827]"
              >
                <h3 className="text-lg font-bold text-[#2f2f2f] transition group-hover:text-[#4584ed] dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[#5f6368] dark:text-gray-400">
                  {item.description}
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-[#4584ed]">
                  Learn More →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
