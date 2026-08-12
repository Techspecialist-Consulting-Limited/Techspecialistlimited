'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';

const sections = [
  { id: 'intro', label: 'Introduction' },
  { id: 'about-us', label: '1. About Us' },
  { id: 'scope', label: '2. Scope' },
  { id: 'definitions', label: '3. Definitions' },
  { id: 'categories', label: '4. Categories of Data' },
  { id: 'collection', label: '5. How We Collect Data' },
  { id: 'legal-basis', label: '6. Legal Basis' },
  { id: 'cookies', label: '7. Cookies' },
  { id: 'disclosure', label: '8. Disclosure & Sharing' },
  { id: 'intl-transfers', label: '9. Intl. Transfers' },
  { id: 'retention', label: '10. Data Retention' },
  { id: 'rights', label: '11. Data Subject Rights' },
  { id: 'ai-processing', label: '12. AI & Profiling' },
  { id: 'security', label: '13. Data Security' },
  { id: 'breach-notification', label: '13A. Breach Notification' },
  { id: 'ropa', label: '13B. RoPA' },
  { id: 'third-party', label: '14. Third-Party' },
  { id: 'children', label: "15. Children's Privacy" },
  { id: 'complaints', label: '16. Complaints' },
  { id: 'contact', label: '17. Contact' },
  { id: 'changes', label: '18. Changes' },
];

function SectionLink({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <a
      href={`#${id}`}
      onClick={(e) => {
        e.preventDefault();
        const url = `${window.location.origin}${window.location.pathname}#${id}`;
        navigator.clipboard.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="ml-2 inline-flex items-center opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-[#4584ed]"
      aria-label={`Copy link to this section`}
      title="Copy link to this section"
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
      )}
    </a>
  );
}

function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="text-xl font-semibold text-gray-900 dark:text-white mb-3 group scroll-mt-24">
      {children}
      <SectionLink id={id} />
    </h2>
  );
}

function CollapsibleDetail({ summary, children, id }: { summary: ReactNode; children: ReactNode; id: string }) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div data-collapsible={id}>
      <div className={open ? 'block' : 'block'}>
        {summary}
      </div>
      {open && <div ref={contentRef}>{children}</div>}
      <button
        onClick={() => setOpen(!open)}
        className="mt-3 text-sm text-[#4584ed] hover:underline flex items-center gap-1"
      >
        {open ? (
          <>Collapse section <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg></>
        ) : (
          <>Learn more <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg></>
        )}
      </button>
    </div>
  );
}

export default function PrivacyPage() {
  const [active, setActive] = useState('intro');
  const [search, setSearch] = useState('');
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const sectionsRef = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px' }
    );

    for (const { id } of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!search) {
      for (const el of sectionsRef.current.values()) {
        el.style.display = '';
      }
      return;
    }
    const term = search.toLowerCase();
    for (const { id } of sections) {
      const el = document.getElementById(id);
      if (!el) continue;
      const text = el.textContent?.toLowerCase() ?? '';
      el.style.display = text.includes(term) ? '' : 'none';
    }
  }, [search]);

  return (
    <div className="bg-white dark:bg-[#080e1e] min-h-screen">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #privacy-content, #privacy-content * { visibility: visible; }
          #privacy-content { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          a[href] { text-decoration: underline; color: #000; }
          hr { break-inside: avoid; }
          section { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <div className="mb-12 no-print">
          <Link href="/" className="text-sm text-[#4584ed] hover:underline">&larr; Back to Home</Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10">
          <div>
            <div className="mb-4">
              <span className="text-xs font-medium text-white bg-[#4584ed] px-3 py-1 rounded-full">Classification: External</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Privacy Policy</h1>
            <div className="text-gray-500 dark:text-white/40 text-sm space-y-0.5">
              <p>Last updated: <strong>May 2026</strong></p>
              <p>Next review: <strong>May 2027</strong></p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 no-print">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.03] transition text-gray-600 dark:text-white/65"
              aria-label="Print this page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9V2h12v7" />
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                <path d="M6 14h12v8H6z" />
              </svg>
              Print
            </button>
            <button
              onClick={() => {
                const content = document.getElementById('privacy-content');
                if (!content) return;
                const text = content.innerText;
                const blob = new Blob([text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'Techspecialist-Consulting-Privacy-Policy.txt';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.03] transition text-gray-600 dark:text-white/65"
              aria-label="Download this page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </button>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-[#4584ed]/10 border border-blue-200 dark:border-[#4584ed]/20 rounded-lg p-4 mb-8 no-print">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#4584ed] mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div className="text-sm text-gray-700 dark:text-blue-200">
              <strong className="text-gray-900 dark:text-white">Updated May 2026.</strong>{' '}
              This privacy policy has been updated to reflect the Nigeria Data Protection Act 2023 (NDPA) and our registration as a Data Protection Compliance Organization (DPCO).{' '}
              <Link href="/privacy/changelog" className="text-[#4584ed] hover:underline">See what changed</Link>.
            </div>
          </div>
        </div>

        <div className="flex gap-12">
          <nav className="hidden lg:block w-64 shrink-0 no-print" aria-label="Table of contents">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40 mb-3">On this page</p>
              <ul className="space-y-1 border-l-2 border-gray-200 dark:border-white/10">
                {sections.map(({ id, label }) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`block pl-4 py-1.5 text-sm border-l-2 -ml-[2px] transition-colors ${
                        active === id
                          ? 'border-[#4584ed] text-[#4584ed] font-medium'
                          : 'border-transparent text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row gap-3 mb-8 no-print">
              <div className="relative flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search within this policy..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4584ed] focus:border-transparent"
                />
              </div>

              <div className="lg:hidden relative">
                <button
                  onClick={() => setMobileTocOpen(!mobileTocOpen)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.03] transition text-gray-600 dark:text-white/65"
                >
                  Jump to section
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${mobileTocOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {mobileTocOpen && (
                  <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white dark:bg-[#101827] border border-gray-200 dark:border-white/10 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {sections.map(({ id, label }) => (
                      <a
                        key={id}
                        href={`#${id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                          setMobileTocOpen(false);
                        }}
                        className={`block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.03] ${
                          active === id ? 'text-[#4584ed] font-medium' : 'text-gray-600 dark:text-white/65'
                        }`}
                      >
                        {label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div id="privacy-content" className="space-y-8 text-gray-700 dark:text-white/70 leading-relaxed">
              <section id="intro">
                <H2 id="intro">Introduction</H2>
                <p>
                  This Privacy Policy explains how Techspecialist Consulting Limited (&ldquo;TCL&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) collects, uses, stores, discloses, transfers, and protects personal data obtained through our website, products, services, training programmes, managed IT services, consulting engagements, recruitment processes, and all related business interactions.
                </p>
                <p className="mt-3">
                  This Privacy Policy is issued in compliance with the provisions of the Nigeria Data Protection Act 2023 (NDPA), applicable regulations issued by the Nigeria Data Protection Commission (NDPC), including the Nigeria Data Protection Regulation (NDPR), and other applicable international data protection laws where relevant, including the General Data Protection Regulation (GDPR).
                </p>
                <p className="mt-3">
                  By accessing our website or engaging with our services, you acknowledge that your personal data may be processed in accordance with this Policy.
                </p>
               
              </section>

              <hr className="border-gray-200 dark:border-white/10" />

              <section id="about-us">
                <H2 id="about-us">1. About Us</H2>
                <p>
                  Techspecialist Consulting Limited (TCL) is an information technology consulting and managed services company providing technology advisory, digital transformation, cybersecurity, cloud computing, and enterprise infrastructure, software solutions, IT support services, capacity building, and business technology consulting services to public, private, and development sector organizations across Nigeria.
                </p>
                <div className="mt-3 p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg border border-gray-200 dark:border-white/10">
                  <p><strong>Registered Office:</strong> Goldlink House, No. 2 Harare Street, Off Rabat Street, Zone 6, Wuse, Abuja, Nigeria.</p>
                  <p><strong>Website:</strong> <a href="https://techspecialistlimited.com" target="_blank" rel="noopener" className="text-[#4584ed] hover:underline">https://techspecialistlimited.com</a></p>
                  <p><strong>Email:</strong> <a href="mailto:info@techspecialistlimited.com" className="text-[#4584ed] hover:underline">info@techspecialistlimited.com</a></p>
                  <p><strong>Telephone:</strong> <a href="tel:+23492911443" className="text-[#4584ed] hover:underline">+234 9 291 1443</a></p>
                </div>
                <p className="mt-3">
                  TCL is a licensed Data Protection Compliance Organization (DPCO) registered with the Nigeria Data Protection Commission (NDPC). We operate both as a <strong>Data Controller</strong> — for data collected in the course of its own operations — and as a <strong>Data Processor</strong> when processing personal data on behalf of client organizations. Where TCL acts as a Data Processor, it does so solely in accordance with the written instructions of the relevant Data Controller under a binding Data Processing Agreement.
                </p>
               
              </section>

              <hr className="border-gray-200 dark:border-white/10" />

              <section id="scope">
                <H2 id="scope">2. Scope of This Privacy Policy</H2>
                <p>This Privacy Policy applies to:</p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>Visitors to our website</li>
                  <li>Clients and prospective clients</li>
                  <li>Employees and job applicants</li>
                  <li>Vendors, contractors, and consultants</li>
                  <li>Training participants and event attendees</li>
                  <li>Business partners</li>
                  <li>Individuals who communicate or interact with us in any capacity</li>
                </ul>
                <p className="mt-3">This Policy explains: the categories of personal data we collect; how we collect and process personal data; the lawful basis for processing; how we use and disclose personal data; data retention periods; international data transfers; security measures; your rights under applicable data protection laws; and how to contact our Data Protection Officer or the NDPC.</p>
               
              </section>

              <hr className="border-gray-200 dark:border-white/10" />

              <section id="definitions">
                <H2 id="definitions">3. Definitions of Personal Data</H2>
                <p>
                  Under the NDPA 2023, &ldquo;Personal Data&rdquo; means any information relating to an identified or identifiable natural person (a &ldquo;Data Subject&rdquo;). This includes: full name; email address; telephone number; residential or business address; government-issued identification details; IP address and online identifiers; employment records; financial information; device identifiers; location data; photographs or audiovisual recordings; and any information capable of identifying an individual directly or indirectly.
                </p>
                <p className="mt-3">
                  <strong>&ldquo;Sensitive Personal Data&rdquo;</strong> includes information relating to: health or medical conditions; biometric data; ethnicity or racial origin; religious or philosophical beliefs; political opinions; trade union membership; sexual orientation or gender identity; criminal convictions or offences; and such other categories as the NDPC may prescribe from time to time.
                </p>
                <p className="mt-3">
                  <strong>&ldquo;AI-Derived Data&rdquo;</strong> means personal data generated through automated analysis, inference, or profiling by artificial intelligence systems — including data produced through Microsoft Copilot, Agentic AI tools, Power BI analytics, or similar technologies in the course of delivering TCL&rsquo;s services.
                </p>
               
              </section>

              <hr className="border-gray-200 dark:border-white/10" />

              <section id="categories">
                <H2 id="categories">4. Categories of Personal Data We Collect</H2>
                <CollapsibleDetail
                  id="categories"
                  summary={<p>Depending on your interaction with us, we may collect and process various categories of personal data including identity data, contact data, professional and employment data, technical and device data, usage data, marketing data, and AI-derived data.</p>}
                >
                  <p>Depending on your interaction with us, we may collect and process the following categories of personal data:</p>

                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2">a. Identity Data</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Full name, username, or login credentials</li>
                    <li>Gender, date of birth</li>
                    <li>Job title, designation, or professional role</li>
                    <li>Signature or identification details</li>
                  </ul>

                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2">b. Contact Data</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Email address, telephone number</li>
                    <li>Residential or business address</li>
                    <li>Contact and communication preferences</li>
                  </ul>

                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2">c. Professional and Employment Data</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Curriculum vitae (CVs) and resumes</li>
                    <li>Employment history, educational qualifications, certifications</li>
                    <li>Professional memberships and references</li>
                    <li>Recruitment and application records</li>
                  </ul>

                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2">d. Technical and Device Data</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>IP address, browser type, and version</li>
                    <li>Device identifiers and operating system</li>
                    <li>Access logs, cookies, and website usage information</li>
                    <li>Microsoft 365, Azure, and Power Platform telemetry and usage data generated through TCL&rsquo;s managed services</li>
                  </ul>

                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2">e. Usage and Interaction Data</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Website pages visited and service usage patterns</li>
                    <li>Training participation and certification records</li>
                    <li>Communication history and support requests</li>
                  </ul>

                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2">f. Marketing and Communication Data</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Marketing and newsletter preferences</li>
                    <li>Event registrations, survey responses, and consent records</li>
                  </ul>

                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2">g. AI-Derived and Inferred Data</h3>
                  <p>Where TCL deploys AI-powered tools in the course of delivering services, data derived from automated analysis or inference may be generated. Such data is processed only on a lawful basis.</p>
                </CollapsibleDetail>
               
              </section>

              <hr className="border-gray-200 dark:border-white/10" />

              <section id="collection">
                <H2 id="collection">5. How We Collect Personal Data</H2>
                <p>We collect personal data through various channels, including:</p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>Website contact forms, online registrations, and subscriptions</li>
                  <li>Service agreements and contracts</li>
                  <li>Recruitment and onboarding processes</li>
                  <li>Training and event registrations</li>
                  <li>Telephone calls, meetings, and email correspondence</li>
                  <li>Vendor registration processes</li>
                  <li>Cookies and website analytics technologies</li>
                  <li>Social media interactions</li>
                  <li>Third-party referrals or business introductions</li>
                  <li>Publicly available sources where legally permitted</li>
                  <li>Integrated Microsoft platform services like Microsoft 365, Azure, Power Platform, and Microsoft Copilot, through which interaction, usage, and telemetry data may be collected as part of service delivery</li>
                </ul>
                <p className="mt-3">We may also automatically collect certain technical data when you access or use our website.</p>
               
              </section>

              <hr className="border-gray-200 dark:border-white/10" />

              <section id="legal-basis">
                <H2 id="legal-basis">6. Purpose and Legal Basis for Processing</H2>
                <CollapsibleDetail
                  id="legal-basis"
                  summary={
                    <>
                      <p>We process personal data only where we have a lawful basis. The six lawful bases we rely on are: contractual necessity, legal and regulatory obligations, legitimate interests, consent, vital interests, and public interest. Where we process sensitive personal data, enhanced safeguards apply.</p>
                      <p className="mt-2">Where we rely on legitimate interests, we have conducted a Legitimate Interests Assessment (LIA) documenting that such interests do not override the fundamental rights and freedoms of data subjects. The LIA is available upon written request to our Data Protection Officer.</p>
                    </>
                  }
                >
                  <p>We process personal data only where we have a lawful basis. The six lawful bases we rely on, and their specific applications, are set out below.</p>

                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2">a. Contractual Necessity</h3>
                  <p>We process personal data where necessary to provide our services, deliver managed IT and consulting solutions, manage client relationships, process payments and transactions, deliver training and certification programmes, and administer contracts and service requests.</p>

                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2">b. Legal and Regulatory Obligations</h3>
                  <p>We may process personal data to comply with applicable laws and regulations, including tax and accounting obligations, employment and labour laws, cybersecurity obligations, law enforcement or regulatory requests, and court orders or legal proceedings.</p>

                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2">c. Legitimate Interests</h3>
                  <p>We may process personal data where reasonably necessary for our legitimate business interests, including improving our services and website, fraud prevention and security monitoring, business administration and reporting, customer support and relationship management, and information security and risk management.</p>
                  <p className="mt-2">Where we rely on legitimate interests, we have conducted a Legitimate Interests Assessment (LIA) documenting that such interests do not override the fundamental rights and freedoms of data subjects. The LIA is available upon written request to our Data Protection Officer.</p>

                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2">d. Consent</h3>
                  <p>Where required by law, we obtain your consent before sending marketing communications, processing sensitive personal data, using non-essential cookies or tracking technologies, and sharing information for optional programmes or activities.</p>
                  <p className="mt-2">Consent is collected through clear, specific, and unambiguous mechanisms, including written, electronic, or digital forms, and is documented with a timestamp and a record of the scope of consent given. Where consent relates to sensitive personal data, it is explicitly sought and separately recorded. You may withdraw consent at any time by contacting us or by using the opt-out mechanism in our communications. Withdrawal of consent does not affect the lawfulness of processing carried out before withdrawal.</p>

                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2">e. Vital Interests</h3>
                  <p>We may process personal data where necessary to protect the vital interests of a data subject or another person, for example, in an emergency health or safety situation.</p>

                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2">f. Public Interest</h3>
                  <p>Where TCL delivers services to federal or state government agencies, data processing may be carried out in the public interest or in the exercise of official authority, in accordance with applicable law and under documented public-interest safeguards set out.</p>

                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2">Special Category Data</h3>
                  <p>Where we process sensitive personal data, we rely on explicit consent or another ground permitted under Section 30 of the NDPA. We implement enhanced safeguards for sensitive personal data, including restricted access, enhanced encryption, and additional staff training obligations.</p>
                </CollapsibleDetail>
               
              </section>

              <hr className="border-gray-200 dark:border-white/10" />

              <section id="cookies">
                <H2 id="cookies">7. Cookies and Tracking Technologies</H2>
                <p>Our website uses cookies and similar tracking technologies. We obtain your opt-in consent before activating any non-essential cookies.</p>

                <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2">Cookie categories</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Strictly Necessary Cookies</strong> — essential to website operation and security. These do not require consent and cannot be disabled.</li>
                  <li><strong>Analytics Cookies</strong> — used to measure website traffic and user behaviour and activated only with your prior consent.</li>
                  <li><strong>Marketing and Advertising Cookies</strong> — used to deliver relevant content and track engagement, and are activated only with your prior consent.</li>
                  <li><strong>Preference Cookies</strong> — used to remember your settings and personalize your experience. Activated only with your prior consent.</li>
                </ul>
                <p className="mt-3">
                  A cookie consent banner is displayed on your first visit to our website. Non-essential cookies are only activated following your explicit opt-in. You may withdraw or update your cookie preferences at any time by clicking (Manage Cookie Preferences) on our website or by emailing <a href="mailto:info@techspecialistlimited.com" className="text-[#4584ed] hover:underline">info@techspecialistlimited.com</a>.
                </p>
                <p className="mt-2">
                  Withdrawing consent will not affect services that rely solely on strictly necessary cookies. You may also control or disable cookies through your browser settings; however, disabling necessary cookies may impair certain website functions.
                </p>
               
              </section>

              <hr className="border-gray-200 dark:border-white/10" />

              <section id="disclosure">
                <H2 id="disclosure">8. Disclosure and Sharing of Personal Data</H2>
                <p>We may disclose personal data to trusted third parties where necessary for legitimate business purposes, including:</p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>Cloud hosting and infrastructure providers</li>
                  <li>IT support and cybersecurity partners</li>
                  <li>Payment processors</li>
                  <li>Legal, financial, and professional advisers</li>
                  <li>Recruitment and HR service providers</li>
                  <li>Training and certification partners</li>
                  <li>Regulators and government authorities</li>
                  <li>Law enforcement agencies where legally required</li>
                </ul>
                <p className="mt-3">
                  We execute Data Processing Agreements (DPAs) with all third-party processors. All processors are contractually required to implement appropriate technical and organizational safeguards, process personal data only in accordance with our documented instructions, notify us promptly of any personal data breach affecting data we have shared with them. A list of our key processors is available upon written request.
                </p>
                <p className="mt-2">
                  We will provide at least 30 days&rsquo; prior notice where we intend to engage a new sub-processor whose activities may materially affect the processing of your personal data.
                </p>
                <p className="mt-2"><strong>We do not sell personal data to third parties.</strong></p>
               
              </section>

              <hr className="border-gray-200 dark:border-white/10" />

              <section id="intl-transfers">
                <H2 id="intl-transfers">9. International Data Transfers</H2>
                <p>
                  Where personal data is transferred outside Nigeria, we ensure that appropriate safeguards are implemented. Such transfers are governed by Standard Contractual Clauses approved by the NDPC, binding corporate rules, adequacy decisions, or explicit consent of the data subject, as applicable to the specific transfer.
                </p>
                <p className="mt-2">
                  Additional safeguards we implement for international transfers include Data Processing Agreements, confidentiality obligations, and NDPC-approved transfer mechanisms. Where required by the NDPA, we notify the NDPC of international transfers.
                </p>
               
              </section>

              <hr className="border-gray-200 dark:border-white/10" />

              <section id="retention">
                <H2 id="retention">10. Data Retention</H2>
                <p>We retain personal data only for as long as necessary to fulfil the purposes for which it was collected, including legal and regulatory compliance, contractual obligations, audit and accounting purposes, dispute resolution, and business continuity requirements. The following indicative retention periods apply:</p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-white/[0.05]">
                        <th className="text-left p-3 border border-gray-200 dark:border-white/10 font-medium">Category of Personal Data</th>
                        <th className="text-left p-3 border border-gray-200 dark:border-white/10 font-medium">Retention Period</th>
                        <th className="text-left p-3 border border-gray-200 dark:border-white/10 font-medium">Basis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Client contract & engagement data', '7 years', 'Contractual & legal obligation'],
                        ['Employee & HR records', '7 years post-termination', 'Employment law (Labour Act)'],
                        ['Recruitment & application records', '1 year post-rejection', 'Legitimate interests'],
                        ['Training & certification records', '5 years', 'Contractual/regulatory'],
                        ['Website analytics & cookies', '24 months', 'Legitimate interests'],
                        ['Marketing consent records', 'Duration of consent + 3 years', 'Legal obligation'],
                        ['Vendor & contractor data', '7 years', 'Tax & contractual obligation'],
                        ['Data breach & incident logs', '5 years', 'Legal/regulatory obligation'],
                        ['DPIA documentation', 'Life of processing + 3 years', 'Regulatory (GAID 2025)'],
                        ['CCTV / access logs (if any)', '30 days', 'Security / legitimate interests'],
                      ].map(([category, period, basis], i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-gray-50 dark:bg-white/[0.02]'}>
                          <td className="p-3 border border-gray-200 dark:border-white/10">{category}</td>
                          <td className="p-3 border border-gray-200 dark:border-white/10">{period}</td>
                          <td className="p-3 border border-gray-200 dark:border-white/10">{basis}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
               
              </section>

              <hr className="border-gray-200 dark:border-white/10" />

              <section id="rights">
                <H2 id="rights">11. Data Subject Rights</H2>
                <CollapsibleDetail
                  id="rights"
                  summary={
                    <>
                      <p>Under the NDPA 2023 and applicable data protection laws, you have the following rights: access, rectification, erasure, withdrawal of consent, objection or restriction of processing, data portability, objection to direct marketing, information on automated decision-making, non-discrimination, and the right to lodge a complaint with the NDPC.</p>
                      <p className="mt-2">We will respond to all data subject requests within 30 days of receipt. We will not charge a fee for reasonable requests.</p>
                    </>
                  }
                >
                  <p>Under the NDPA 2023 and applicable data protection laws, you have the following rights:</p>
                  <ul className="list-disc pl-6 mt-3 space-y-2">
                    <li><strong>Right of access</strong> — to request a copy of the personal data we hold about you</li>
                    <li><strong>Right to rectification</strong> — to request correction of inaccurate or incomplete data</li>
                    <li><strong>Right to erasure</strong> — to request deletion of your personal data where there is no overriding lawful basis for continued processing</li>
                    <li><strong>Right to withdraw consent</strong> — at any time, without affecting the lawfulness of prior processing</li>
                    <li><strong>Right to object or restrict processing</strong> — to object to or limit certain processing activities</li>
                    <li><strong>Right to data portability</strong> — to receive your personal data in a structured, commonly used, machine-readable format</li>
                    <li><strong>Right to object to direct marketing</strong> — to opt out of marketing communications at any time</li>
                    <li><strong>Right to information on automated decision-making</strong> — to request information about any automated processing that produces significant effects on you</li>
                    <li><strong>Right to non-discrimination</strong> — exercising any of these rights will not result in denial of services or other adverse treatment</li>
                    <li><strong>Right to lodge a complaint</strong> — with the Nigeria Data Protection Commission</li>
                  </ul>
                  <p className="mt-3">
                    We will respond to all data subject requests within 30 days of receipt. Where a request is complex or involves numerous data points, we may extend this period by a further 30 days, with written notice to you explaining the reason for the extension. We will not charge a fee for reasonable requests; however, we reserve the right to charge a reasonable administrative fee for manifestly unfounded or excessive requests.
                  </p>
                  <p className="mt-2">
                    To protect your data, we may request appropriate proof of identity before processing a data subject request. Identity verification information will be used solely for this purpose and will not be retained beyond the resolution of the request.
                  </p>
                </CollapsibleDetail>
               
              </section>

              <hr className="border-gray-200 dark:border-white/10" />

              <section id="ai-processing">
                <H2 id="ai-processing">12. Automated Decision-Making, AI Processing, and Profiling</H2>
                <p>
                  TCL does not make decisions based solely on automated processing, including profiling, that produce legal or similarly significant effects on individuals in the course of its internal business operations.
                </p>
                <p className="mt-2">
                  However, TCL provides and deploys artificial intelligence systems, Agentic AI solutions, Microsoft Copilot, and Power BI decision intelligence tools on behalf of client organizations. Where such deployments involve automated or AI-assisted decision-making that may have significant effects on individuals, TCL acts as a Data Processor under the instructions of the relevant client as Data Controller. Data subjects affected by such systems should direct enquiries and rights requests to the relevant client organization.
                </p>
                <p className="mt-2">
                  We conduct a Data Protection Impact Assessment (DPIA) before deploying any AI or automated system likely to pose a high risk to the rights and freedoms of individuals. DPIAs are submitted to the NDPC where required and are reviewed periodically. Our DPIA framework is overseen by our Data Protection Officer.
                </p>
                <p className="mt-2">
                  Where any future automated processing with significant individual effects is carried out by TCL in its own capacity as Data Controller, TCL will implement appropriate safeguards, disclose the logic involved, and provide mechanisms for human review and objection as required.
                </p>
               
              </section>

              <hr className="border-gray-200 dark:border-white/10" />

              <section id="security">
                <H2 id="security">13. Data Security</H2>
                <p>
                  We implement appropriate technical and organizational measures (TOMs) designed to protect personal data against accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or access. These measures include:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>Secure hosting infrastructure and Microsoft Azure Security Centre integration</li>
                  <li>Zero Trust network architecture and access controls</li>
                  <li>Multi-factor authentication and role-based access management</li>
                  <li>Encryption of personal data in transit and at rest</li>
                  <li>Microsoft Defender endpoint protection and firewall systems</li>
                  <li>Monitoring, logging, and anomaly detection systems</li>
                  <li>Employee confidentiality obligations and regular data protection training</li>
                  <li>Periodic security assessments, vulnerability reviews, and compliance audits</li>
                </ul>
                <p className="mt-3">
                  Despite these measures, no transmission or storage system can be guaranteed to be completely secure. In the event of a security incident, we will act promptly to contain, assess, and remediate.
                </p>
               
              </section>

              <hr className="border-gray-200 dark:border-white/10" />

              <section id="breach-notification">
                <H2 id="breach-notification">13A. Data Breach Notification</H2>
                <p>In the event of a personal data breach, TCL will take the following:</p>
                <p className="mt-2">
                  (a) Notify the NDPC within 72 hours of becoming aware of a breach that is likely to pose a high risk to the rights and freedoms of data subjects, providing details of the breach, the categories, and approximate volume of data and individuals affected, the likely consequences, and the remedial measures taken or proposed.
                </p>
                <p className="mt-2">
                  (b) Notify affected data subjects without undue delay where the breach is likely to result in a high risk to their rights and freedoms, including clear guidance on the steps they may take to protect themselves.
                </p>
                <p className="mt-2">
                  (c) Maintain an internal Breach Register documenting all breaches, including those not reported to the NDPC, recording the facts, effects, and remedial actions taken. The Breach Register is maintained by the Data Protection Officer and is available to the NDPC on request.
                </p>
                <p className="mt-3">
                  Notifications will be made to: Nigeria Data Protection Commission — <a href="https://ndpc.gov.ng" target="_blank" rel="noopener" className="text-[#4584ed] hover:underline">ndpc.gov.ng</a> / <a href="mailto:info@ndpc.gov.ng" className="text-[#4584ed] hover:underline">info@ndpc.gov.ng</a>.
                </p>
               
              </section>

              <hr className="border-gray-200 dark:border-white/10" />

              <section id="ropa">
                <H2 id="ropa">13B. Record of Processing Activities (RoPA)</H2>
                <p>
                  We maintain a Record of Processing Activities (RoPA) documenting: the categories of personal data processed; the purposes and lawful bases of processing; data retention periods; data sharing practices and third-party processors; and technical and organizational security measures. The RoPA is maintained by the Data Protection Officer, reviewed at least semi-annually, and made available to the NDPC upon request.
                </p>
               
              </section>

              <hr className="border-gray-200 dark:border-white/10" />

              <section id="third-party">
                <H2 id="third-party">14. Third-Party Websites and Services</H2>
                <p>
                  Our website may contain links to third-party websites or services. TCL is not responsible for the privacy practices, policies, or content of external websites. Users are encouraged to review the privacy policies of third-party platforms before providing personal data.
                </p>
               
              </section>

              <hr className="border-gray-200 dark:border-white/10" />

              <section id="children">
                <H2 id="children">15. Children&rsquo;s Privacy</H2>
                <p>
                  Our services are not directed at individuals under the age of 18. We do not knowingly collect or process personal data relating to children without an appropriate legal basis or verifiable parental or guardian consent where required under the NDPA, the Child Rights Act 2003, or other applicable law.
                </p>
                <p className="mt-2">
                  If we become aware that we have collected personal data from an individual under the age of 18 without appropriate consent, we will delete such data promptly and, where required by law, notify the relevant guardian or authority.
                </p>
               
              </section>

              <hr className="border-gray-200 dark:border-white/10" />

              <section id="complaints">
                <H2 id="complaints">16. Complaints and Regulatory Authority</H2>
                <p>
                  If you are dissatisfied with how we handle your personal data, we encourage you to first contact our Data Protection Officer directly. We will acknowledge your complaint within 5 business days and aim to resolve it within 30 days.
                </p>
                <p className="mt-2">
                  If you remain unsatisfied following our internal resolution process, you have the right to lodge a complaint with:
                </p>
                <div className="mt-3 p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg border border-gray-200 dark:border-white/10">
                  <p><strong>Nigeria Data Protection Commission (NDPC)</strong></p>
                  <p>Website: <a href="https://ndpc.gov.ng" target="_blank" rel="noopener" className="text-[#4584ed] hover:underline">https://ndpc.gov.ng</a></p>
                  <p>Email: <a href="mailto:info@ndpc.gov.ng" className="text-[#4584ed] hover:underline">info@ndpc.gov.ng</a></p>
                </div>
               
              </section>

              <hr className="border-gray-200 dark:border-white/10" />

              <section id="contact">
                <H2 id="contact">17. Contact Information</H2>
                <p>For enquiries, requests, or complaints relating to this Privacy Policy or our data processing activities, please contact:</p>
                <div className="mt-3 p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg border border-gray-200 dark:border-white/10">
                  <p><strong>Techspecialist Consulting Limited</strong></p>
                  <p><strong>General Email:</strong> <a href="mailto:info@techspecialistlimited.com" className="text-[#4584ed] hover:underline">info@techspecialistlimited.com</a></p>
                  <p><strong>Address:</strong> Goldlink House, No. 2 Harare Street, Off Rabat Street, Zone 6, Wuse, Abuja, Nigeria.</p>
                  <p><strong>Telephone:</strong> <a href="tel:+23492911443" className="text-[#4584ed] hover:underline">+234 9 291 1443</a></p>
                </div>
               
              </section>

              <hr className="border-gray-200 dark:border-white/10" />

              <section id="changes">
                <H2 id="changes">18. Changes to This Privacy Policy</H2>
                <p>
                  We may update this Privacy Policy periodically to reflect changes in legal, regulatory, operational, or business requirements. Any updates will be published on our website together with the revised &ldquo;Last Updated&rdquo; date.
                </p>
                <p className="mt-2">
                  For material updates to this Policy, including changes to the legal bases for processing, categories of data collected, or the introduction of new third-party processors, we will provide at least 14 days&rsquo; prior notice via email (where we hold your email address) or through a prominent notice on our website before changes take effect. Your continued use of our services after that period constitutes acceptance of the revised Policy.
                </p>
                <p className="mt-2">
                  We encourage all users to review this Policy regularly to remain informed about how their personal data is processed and protected.
                </p>
               
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
