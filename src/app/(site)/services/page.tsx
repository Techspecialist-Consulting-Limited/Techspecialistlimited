'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { sendDiscoveryCallEmail } from '../../lib/emailjs';

const serviceData: Record<string, {
  num: string;
  title: string;
  intro: string;
  img: string;
  included: string[];
  deliver: string;
  deliverStat: string;
  industries: string[];
}> = {
  advisory: {
    num: '01',
    title: 'Digital Transformation Advisory',
    intro: 'Before you transform, you need a plan that fits. Most digital initiatives fail not because of bad technology, but because they start in the wrong place. Digital Transformation Advisory is where every TechSpecialist engagement begins: a structured, honest assessment of where you are, what\'s holding you back, and what the smartest path forward looks like before a single tool is deployed.',
    img: 'https://res.cloudinary.com/daqmbfctv/image/upload/v1770221473/WhatsApp_Image_2026-02-04_at_17.00.42_2_n8mwjp.jpg',
    included: [
      'AI Readiness Assessment',
      'IT Strategy Development',
      'Internal Process Optimization',
      'Digital Maturity Benchmarking',
      'Change Management Planning'
    ],
    deliver: 'Roadmap aligned to your sector, budget, and growth stage, built on Microsoft tools you already own. Evaluate your data maturity, workflow gaps, and team capability before any AI deployment begins. Identification and prioritization of your top operational bottlenecks with clear, measurable improvement targets. Stakeholder mapping, adoption frameworks, and communication plans so the transformation sticks.',
    deliverStat: '📋 Strategic roadmap',
    industries: ['Government MDAs', 'International NGOs', 'Private Sector Organizations', 'Financial Services', 'Healthcare']
  },
  automation: {
    num: '02',
    title: 'Business Process Automation',
    intro: 'We design, deploy, and maintain automation systems that replace manual, repetitive, error-prone work with intelligent processes that run 24/7. From a single workflow to an organization-wide unified layer, every build is connected, measurable, and live within weeks of sign-off.',
    img: 'https://res.cloudinary.com/daqmbfctv/image/upload/c_crop,g_north_west,h_735,w_905,x_175,y_75/bacgroundimg_j9yowq.jpg',
    included: [
      'Agentic AI Deployment',
      'Executive Intelligence Dashboard Build',
      'Workflow Automation',
      'Data Integration & Unification',
      'Automated Reporting & Predictive Analytics'
    ],
    deliver: 'Connect siloed systems into a single, clean data layer, so every report draws from one source of truth. Copilot Studio agents that handle approvals, responses, and workflows autonomously 24/7, inside your Microsoft tenant. Dashboards that surface live KPIs, budget tracking, and operational health for decision-makers to get answers in seconds, not weeks. Workflows that eliminate manual handoffs, approvals, notifications, data capture, and reporting in one connected system. Scheduled reports, donor summaries, audit trails, and board packs are generated automatically with zero manual effort.',
    deliverStat: '⚡ Live within weeks',
    industries: ['Government Agencies', 'Healthcare Organizations', 'Financial Institutions', 'Educational Institutions', 'NGOs with sensitive data']
  },
  security: {
    num: '03',
    title: 'Information Security',
    intro: 'Your people, data, and systems are valuable. Protect it like it is. We don\'t just audit and advise; we architect, implement, and maintain your security posture as a living system. Zero Trust principles, data loss prevention, identity management, and staff awareness programs work together to ensure your organization is protected at every layer: people, process, and technology.',
    img: 'https://res.cloudinary.com/daqmbfctv/image/upload/v1772630271/bgolahan_wwa3ph.jpg',
    included: [
      'Security Audit & Risk Assessment',
      'Zero Trust Architecture',
      'Data Loss Prevention (DLP)',
      'Compliance & Policy Management',
      'Security Awareness Training'
    ],
    deliver: 'A full review of your current vulnerabilities, access controls, and data handling with a prioritized remediation plan. Implement identity-first security with conditional access, MFA, and least-privilege controls across your Microsoft 365 environment. Policies that prevent sensitive data from leaving your tenant across email, SharePoint, Teams, and OneDrive. NDPR, ISO 27001, and donor compliance frameworks embedded into your day-to-day operations, not bolted at audit time. Staff phishing simulations, policy briefings, and incident response drills, so your people are your first line of defense.',
    deliverStat: '🔒 Protected at every layer',
    industries: ['Government Ministries', 'International Development Organizations', 'Corporate Enterprises', 'Donor-funded Organizations', 'Regulatory Bodies']
  },
  itsm: {
    num: '04',
    title: 'IT Service Management',
    intro: 'IT that works so your team can too. The infrastructure layer on which everything runs. Reliable, maintained, and supported so your team can focus on work, not IT problems. Reliable devices, a responsive helpdesk, and clean Managed Services.',
    img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80',
    included: [
      'IT Asset Setup & Onboarding',
      'Helpdesk & Service Desk Support',
      'Asset Lifecycle Management',
      'Cloud Infrastructure Management',
      'IT Policy & Documentation'
    ],
    deliver: 'Device procurement, configuration, Microsoft 365 licensing, and user onboarding done right the first time. Responsive L1–L3 support for your team from ticket management, remote resolution, and escalation on a managed retainer. Track, maintain, and retire hardware and software across your organization with full visibility in a live asset register. Azure and Microsoft 365 tenant administration, user provisioning, storage, licensing, and performance monitoring. Acceptable use of policies, IT handbooks, and SLA frameworks that bring structure and accountability to your IT operations.',
    deliverStat: '🖥️ IT that works',
    industries: ['Public Sector Organizations', 'NGO Staff', 'Corporate Teams', 'Educational Institutions', 'Parastatals']
  }
};

const relatedServices: Record<string, { id: string; name: string; desc: string }[]> = {
  advisory: [
    { id: 'automation', name: 'Business Process Automation', desc: 'From plan to reality' },
    { id: 'security', name: 'Information Security', desc: 'Protect your investment' }
  ],
  automation: [
    { id: 'advisory', name: 'Digital Transformation Advisory', desc: 'Strategic planning' },
    { id: 'itsm', name: 'IT Service Management', desc: 'Keep it running' }
  ],
  security: [
    { id: 'automation', name: 'Business Process Automation', desc: 'Secure workflows' },
    { id: 'advisory', name: 'Digital Transformation Advisory', desc: 'Risk-aware planning' }
  ],
  itsm: [
    { id: 'automation', name: 'Business Process Automation', desc: 'Automated IT ops' },
    { id: 'security', name: 'Information Security', desc: 'Secure infrastructure' }
  ]
};

function PillarIcon({ id, size = 20 }: { id: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (id) {
    case 'advisory':
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      );
    case 'automation':
      return (
        <svg {...common}>
          <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
        </svg>
      );
    case 'security':
      return (
        <svg {...common}>
          <path d="M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6l-7-3Z" />
        </svg>
      );
    case 'itsm':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      );
    default:
      return null;
  }
}

function WhyIcon({ id, size = 28 }: { id: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (id) {
    case 'cost':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8.5 12.5 2.5 2.5 4.5-5" />
        </svg>
      );
    case 'speed':
      return <PillarIcon id="automation" size={size} />;
    case 'sector':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Services() {
  const [panelService, setPanelService] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'included' | 'deliver' | 'industries'>('included');
  const interactivitySetup = useRef(false);

  const openPanel = useCallback((serviceId: string) => {
    setPanelService(serviceId);
    setActiveTab('included');
    document.body.style.overflow = 'hidden';
  }, []);

  const closePanel = useCallback(() => {
    setPanelService(null);
    document.body.style.overflow = '';
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [closePanel]);

  useEffect(() => {
    if (interactivitySetup.current) return;
    interactivitySetup.current = true;

    // Scroll progress
    const progressBar = document.getElementById('scrollProgressBar');
    if (progressBar) {
      window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollTop / docHeight) * 100;
        progressBar.style.width = `${Math.min(progress, 100)}%`;
      });
    }

    // Service filters
    const filters = document.querySelectorAll('.service-filter-btn') as NodeListOf<HTMLElement>;
    const cards = document.querySelectorAll('.service-card') as NodeListOf<HTMLElement>;
    
    filters.forEach((filter) => {
      filter.addEventListener('click', () => {
        const service = filter.dataset.filter;
        
        filters.forEach(f => f.classList.remove('is-active'));
        filter.classList.add('is-active');
        
        cards.forEach((card) => {
          if (service === 'all' || card.dataset.service === service) {
            card.classList.remove('is-filtered');
            card.classList.add('is-active');
          } else {
            card.classList.add('is-filtered');
            card.classList.remove('is-active');
          }
        });
      });
    });

    // Hero tabs
    const heroTabs = document.querySelectorAll('.hero-tab') as NodeListOf<HTMLElement>;
    const previews = document.querySelectorAll('.pillar-preview') as NodeListOf<HTMLElement>;
    
    heroTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const service = tab.dataset.service;
        
        heroTabs.forEach(t => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        
        previews.forEach((preview) => {
          preview.classList.remove('is-active');
          if (preview.id === `pillar-preview-${service}`) {
            preview.classList.add('is-active');
          }
        });
      });
    });

    // Sticky nav
    const stickyNav = document.getElementById('stickyServiceNav');
    const sections = ['services', 'process', 'why', 'faq', 'discovery'];
    
    if (stickyNav) {
      window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        stickyNav.classList.toggle('is-visible', scrollY > 500);
        
        sections.forEach((id) => {
          const section = document.getElementById(id);
          const link = stickyNav.querySelector(`a[href="#${id}"]`);
          if (section && link) {
            const rect = section.getBoundingClientRect();
            link.classList.toggle('is-active', rect.top <= 100 && rect.bottom > 100);
          }
        });
      });
    }

    // Why cards expand
    const whyExpandBtns = document.querySelectorAll('.why-expand-btn');
    whyExpandBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        btn.closest('.why-card')?.classList.toggle('is-expanded');
      });
    });

    // FAQ items
    const faqItems = document.querySelectorAll('.faq-item:not(.no-results)') as NodeListOf<HTMLElement>;
    const faqCategories = document.querySelectorAll('.faq-category-btn') as NodeListOf<HTMLElement>;
    const faqSearchInput = document.getElementById('faqSearchInput') as HTMLInputElement | null;
    const noResults = document.getElementById('faqNoResults') as HTMLElement | null;
    let activeCategory = 'all';

    function filterFAQ() {
      const query = faqSearchInput?.value.toLowerCase().trim() || '';
      let visibleCount = 0;

      faqItems.forEach((item) => {
        const categoryMatch = activeCategory === 'all' || item.dataset.category === activeCategory;
        const keywords = (item.dataset.keywords || '').toLowerCase();
        const questionText = item.querySelector('h3')?.textContent?.toLowerCase() || '';
        const answerText = item.querySelector('.faq-answer-inner')?.textContent?.toLowerCase() || '';
        const searchMatch = !query || keywords.includes(query) || questionText.includes(query) || answerText.includes(query);

        const visible = categoryMatch && searchMatch;
        item.classList.toggle('is-filtered', !visible);
        if (visible) visibleCount++;
      });

      if (noResults) {
        noResults.style.display = visibleCount === 0 && query !== '' ? 'block' : 'none';
      }
    }

    faqCategories.forEach((cat) => {
      cat.addEventListener('click', () => {
        activeCategory = cat.dataset.category || 'all';
        faqCategories.forEach(c => c.classList.remove('is-active'));
        cat.classList.add('is-active');
        filterFAQ();
      });
    });

    faqItems.forEach((item) => {
      const question = item.querySelector('.faq-question');
      if (question) {
        question.addEventListener('click', () => {
          const wasActive = item.classList.contains('is-active');
          faqItems.forEach(i => i.classList.remove('is-active'));
          if (!wasActive) item.classList.add('is-active');
        });
      }
    });

    if (faqSearchInput) {
      faqSearchInput.addEventListener('input', () => {
        filterFAQ();
      });
    }

    // CTA form
    const form = document.getElementById('ctaEmailForm');
    const input = document.getElementById('ctaEmailInput') as HTMLInputElement | null;
    const btn = document.getElementById('ctaSubmitBtn') as HTMLButtonElement | null;
    const btnText = document.getElementById('ctaBtnText');
    const btnSpinner = document.getElementById('ctaBtnSpinner');
    const msgBox = document.getElementById('ctaFormMsg');

    if (form) {
      function isValidEmail(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
      }

      function showMsg(text: string, type: string) {
        if (!msgBox) return;
        msgBox.textContent = text;
        msgBox.className = `cta-form-msg ${type}`;
        msgBox.style.display = 'block';
      }

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = input?.value.trim() || '';
        
        if (!isValidEmail(email)) {
          input?.classList.add('input-error');
          showMsg('Please enter a valid email address.', 'error');
          input?.focus();
          return;
        }

        if (btn) btn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnSpinner) btnSpinner.style.display = 'inline';

        try {
          await sendDiscoveryCallEmail(email);
          showMsg('Thank you! Our team will be in touch within 24 hours.', 'success');
          if (input) input.value = '';
        } catch (err) {
          showMsg('Something went wrong. Please email us at info@techspecialistlimited.com', 'error');
        }

        if (btn) btn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnSpinner) btnSpinner.style.display = 'none';
      });

      input?.addEventListener('input', () => {
        input.classList.remove('input-error');
        if (msgBox) msgBox.style.display = 'none';
      });
    }
  }, []);

  const service = panelService ? serviceData[panelService] : null;
  const related = panelService ? relatedServices[panelService] || [] : [];

  return (
    <div>
      {/* Scroll Progress Bar */}
      <div className="fixed left-0 top-0 z-[70] h-1 w-full bg-transparent">
        <div className="h-full w-0 bg-[linear-gradient(90deg,#4584ed,#ef6526)] transition-[width] duration-150" id="scrollProgressBar"></div>
      </div>

      {/* Sticky Service Nav */}
      <nav
        id="stickyServiceNav"
        className="sticky-service-nav"
        aria-label="Services page sections"
      >
        <a href="#services">Services</a>
        <a href="#process">Process</a>
        <a href="#why">Why Us</a>
        <a href="#faq">FAQ</a>
        <a href="#discovery">Start</a>
      </nav>

      {/* HERO */}
      <section className="services-hero">
<div className="services-hero-bg">
            <Image src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80" alt="Digital infrastructure" fill className="object-cover" />
          </div>
        <div className="hero-content">
          <div className="hero-left">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Our Services
            </div>

            <h1>Transform Your<br />Organization With<br /><em>Four Pillars</em></h1>

            <p className="hero-sub">
              TechSpecialist helps organizations modernize operations, secure infrastructure, harness data, and build internal capability — using <strong>Microsoft technology you already own</strong>. Every engagement is outcome-driven, sector-tailored, and delivers visible results within weeks.
            </p>

            <div className="hero-actions">
              <a href="#discovery" className="btn-primary">Book a Discovery Call</a>
              <a href="#services" className="btn-secondary">Explore Services →</a>
            </div>

            <div className="hero-tabs">
              <button className="hero-tab is-active" data-service="advisory"><span className="hero-tab-icon"><PillarIcon id="advisory" size={14} /></span> Advisory</button>
              <button className="hero-tab" data-service="automation"><span className="hero-tab-icon"><PillarIcon id="automation" size={14} /></span> Automation</button>
              <button className="hero-tab" data-service="security"><span className="hero-tab-icon"><PillarIcon id="security" size={14} /></span> Security</button>
              <button className="hero-tab" data-service="itsm"><span className="hero-tab-icon"><PillarIcon id="itsm" size={14} /></span> IT Support</button>
            </div>

            <div className="pillar-preview is-active" id="pillar-preview-advisory">
              <div className="pillar-preview-title">Quick View</div>
              <div className="pillar-preview-features">
                <div className="pillar-preview-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  AI Readiness Assessment
                </div>
                <div className="pillar-preview-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  IT Strategy Development
                </div>
                <div className="pillar-preview-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  Process Optimization
                </div>
                <div className="pillar-preview-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  Change Management Planning
                </div>
              </div>
              <button className="pillar-preview-cta" onClick={() => openPanel('advisory')}>View full details →</button>
            </div>

            <div className="pillar-preview" id="pillar-preview-automation">
              <div className="pillar-preview-title">Quick View</div>
              <div className="pillar-preview-features">
                <div className="pillar-preview-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  Agentic AI Deployment
                </div>
                <div className="pillar-preview-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  Executive Dashboards
                </div>
                <div className="pillar-preview-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  Workflow Automation
                </div>
                <div className="pillar-preview-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  Data Integration
                </div>
              </div>
              <button className="pillar-preview-cta" onClick={() => openPanel('automation')}>View full details →</button>
            </div>

            <div className="pillar-preview" id="pillar-preview-security">
              <div className="pillar-preview-title">Quick View</div>
              <div className="pillar-preview-features">
                <div className="pillar-preview-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  Zero Trust Architecture
                </div>
                <div className="pillar-preview-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  Data Loss Prevention
                </div>
                <div className="pillar-preview-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  Compliance Management
                </div>
                <div className="pillar-preview-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  Security Awareness Training
                </div>
              </div>
              <button className="pillar-preview-cta" onClick={() => openPanel('security')}>View full details →</button>
            </div>

            <div className="pillar-preview" id="pillar-preview-itsm">
              <div className="pillar-preview-title">Quick View</div>
              <div className="pillar-preview-features">
                <div className="pillar-preview-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  IT Asset Setup
                </div>
                <div className="pillar-preview-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  Helpdesk Support
                </div>
                <div className="pillar-preview-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  Asset Lifecycle Management
                </div>
                <div className="pillar-preview-feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  Cloud Infrastructure
                </div>
              </div>
              <button className="pillar-preview-cta" onClick={() => openPanel('itsm')}>View full details →</button>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-num">4<span>Services</span></div>
                <div className="hero-stat-label">Complete digital support</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-num">10<span>wk</span></div>
                <div className="hero-stat-label">From sign-off to live</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-num">₦0</div>
                <div className="hero-stat-label">New software needed</div>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="pillars-container">
              <div className="pillar-item" data-service="advisory" onClick={() => openPanel('advisory')}>
                <div className="pillar-icon"><PillarIcon id="advisory" size={26} /></div>
                <div className="pillar-info">
                  <div className="pillar-num">01</div>
                  <div className="pillar-name">Digital Transformation Advisory</div>
                </div>
                <div className="pillar-arrow">→</div>
              </div>
              <div className="pillar-item" data-service="automation" onClick={() => openPanel('automation')}>
                <div className="pillar-icon"><PillarIcon id="automation" size={26} /></div>
                <div className="pillar-info">
                  <div className="pillar-num">02</div>
                  <div className="pillar-name">Business Process Automation</div>
                </div>
                <div className="pillar-arrow">→</div>
              </div>
              <div className="pillar-item" data-service="security" onClick={() => openPanel('security')}>
                <div className="pillar-icon"><PillarIcon id="security" size={26} /></div>
                <div className="pillar-info">
                  <div className="pillar-num">03</div>
                  <div className="pillar-name">Information Security</div>
                </div>
                <div className="pillar-arrow">→</div>
              </div>
              <div className="pillar-item" data-service="itsm" onClick={() => openPanel('itsm')}>
                <div className="pillar-icon"><PillarIcon id="itsm" size={26} /></div>
                <div className="pillar-info">
                  <div className="pillar-num">04</div>
                  <div className="pillar-name">IT Service Management</div>
                </div>
                <div className="pillar-arrow">→</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES GRID */}
      <section className="services-section" id="services">
        <div className="services-header">
          <div>
            <div className="section-tag">Our Services</div>
            <h2 className="section-title">
              Comprehensive support<br />
              <em>for your digital journey.</em>
            </h2>
          </div>
          <p className="section-sub">
            From strategic planning to day-to-day IT support, we provide end-to-end services that transform how your organization operates — using Microsoft tools you already own.
          </p>
        </div>

        <div className="services-grid">
          <div className="service-filters">
            <button className="service-filter-btn is-active" data-filter="all">All</button>
            <button className="service-filter-btn" data-filter="advisory"><PillarIcon id="advisory" size={14} /> Advisory</button>
            <button className="service-filter-btn" data-filter="automation"><PillarIcon id="automation" size={14} /> Automation</button>
            <button className="service-filter-btn" data-filter="security"><PillarIcon id="security" size={14} /> Security</button>
            <button className="service-filter-btn" data-filter="itsm"><PillarIcon id="itsm" size={14} /> IT Support</button>
          </div>

          <article className="service-card featured" data-service="advisory" onClick={() => openPanel('advisory')}>
            <div className="service-img-wrap">
              <Image src="https://res.cloudinary.com/daqmbfctv/image/upload/v1770221473/WhatsApp_Image_2026-02-04_at_17.00.42_2_n8mwjp.jpg" alt="Digital Transformation Advisory" fill className="object-cover" />
              <div className="service-overlay"></div>
              <div className="service-num-badge">01</div>
            </div>
            <div className="service-body">
              <h3 className="service-name">Digital Transformation Advisory</h3>
              <p className="service-intro">Before you transform, you need a plan that fits.</p>
              <div className="service-features">
                <span className="service-feature-tag">AI Readiness Assessment</span>
                <span className="service-feature-tag">IT Strategy</span>
                <span className="service-feature-tag">Change Management</span>
              </div>
              <span className="service-cta">
                See What&apos;s Included
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </span>
            </div>
          </article>

          {[
            { service: 'automation', num: '02', title: 'Business Process Automation', img: 'https://res.cloudinary.com/daqmbfctv/image/upload/c_crop,g_north_west,h_735,w_905,x_175,y_75/bacgroundimg_j9yowq.jpg', desc: 'Where strategy becomes reality.', tags: ['Agentic AI', 'Dashboards', 'Workflows'] },
            { service: 'security', num: '03', title: 'Information Security', img: 'https://res.cloudinary.com/daqmbfctv/image/upload/v1772630271/bgolahan_wwa3ph.jpg', desc: 'Your people, data, and systems are valuable. Protect it like it is.', tags: ['Zero Trust', 'DLP', 'Compliance'] },
            { service: 'itsm', num: '04', title: 'IT Service Management', img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80', desc: 'IT that works so your team can too.', tags: ['Helpdesk', 'Asset Management', 'Cloud Infrastructure'] }
          ].map((s, i) => (
            <article key={i} className="service-card" data-service={s.service} onClick={() => openPanel(s.service)}>
              <div className="service-img-wrap">
                <Image src={s.img} alt={s.title} fill className="object-cover" />
                <div className="service-overlay"></div>
                <div className="service-num-badge">{s.num}</div>
              </div>
              <div className="service-body">
                <h3 className="service-name">{s.title}</h3>
                <p className="service-intro">{s.desc}</p>
                <div className="service-features">
                  {s.tags.map((tag, j) => (
                    <span key={j} className="service-feature-tag">{tag}</span>
                  ))}
                </div>
                <span className="service-cta">
                  See What&apos;s Included
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* PROCESS SECTION */}
      <section className="process-section" id="process">
        <div className="process-inner">
          <div className="process-header">
            <div className="section-tag">How It Works</div>
            <h2 className="section-title">
              From zero to live<br />
              <em>in 10 weeks</em>
            </h2>
            <p className="section-sub">A proven process that delivers results, not just reports.</p>
          </div>

          <div className="process-grid">
            {[
              {
                num: '01',
                title: 'Discovery & Mapping',
                desc: 'We map your top 3-5 operational bottlenecks and show you exactly what\'s possible before anything is built.',
                time: 'Weeks 1–2',
                miniTest: 'They mapped our entire workflow in 2 weeks — we finally saw where all the time was going.'
              },
              {
                num: '02',
                title: 'Build & Deploy',
                desc: 'Intelligent agents go live on your existing Microsoft environment. Workflows automated. Data flowing cleanly.',
                time: 'Weeks 3–6',
                miniTest: 'Our first automation was live in week 4 — it replaced a process that took 3 days manually.'
              },
              {
                num: '03',
                title: 'Launch & Grow',
                desc: 'Executive dashboards connected. Copilot activated. Monthly retainer keeps your system evolving with your organisation.',
                time: 'Weeks 7–10',
                miniTest: 'Leadership can now ask Copilot anything about our data — no more waiting weeks for reports.'
              }
            ].map((step, i) => (
              <div key={i} className="process-step" style={{ position: 'relative' }}>
                <div className="process-num">{step.num}</div>
                {i < 2 && (
                  <div className="process-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                )}
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                <div className="process-time">{step.time}</div>
                <div className="process-mini-test">{step.miniTest}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="why-section" id="why">
        <div className="why-inner">
          <div className="why-header">
            <div className="section-tag">Why TechSpecialist</div>
            <h2 className="section-title">
              Built different.<br />
              <em>Delivers different.</em>
            </h2>
            <p className="section-sub">
              We&apos;re not just another IT consultancy. We build on what you own, deliver results in weeks, and stay with you as you grow.
            </p>
          </div>

          <div className="why-grid">
            {[
              {
                icon: 'cost',
                title: 'No New Software',
                desc: 'We build exclusively on Microsoft tools your organization already pays for. Zero additional license costs.',
                statNum: '₦0',
                statLabel: 'New software required',
                expandText: 'We leverage your existing M365 E3/E5, Power Platform, and Azure subscriptions. No new vendors, no new contracts, no new training overhead.'
              },
              {
                icon: 'speed',
                title: 'Results in Weeks',
                desc: 'From discovery to live — 10 weeks. Not 10 months. We move fast because your competitors are too.',
                statNum: '10wk',
                statLabel: 'To first live system',
                expandText: 'Our agile approach means you\'ll see tangible results within the first month. Week 1-2: discovery. Week 3-6: first automation live. Week 7-10: full deployment.'
              },
              {
                icon: 'sector',
                title: 'Sector-Tailored',
                desc: 'Government, NGOs, Private Sector — we understand your unique workflows, compliance needs, and challenges.',
                statNum: '3',
                statLabel: 'Sectors served across Africa',
                expandText: 'We\'ve worked with government MDAs, international NGOs, and private enterprises across Nigeria and beyond. Each sector has unique needs — we speak their language.'
              }
            ].map((card, i) => (
              <div key={i} className="why-card">
                <div className="why-icon"><WhyIcon id={card.icon} /></div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
                <div className="why-stat">
                  <div className="why-stat-num">{card.statNum}</div>
                  <div className="why-stat-label">{card.statLabel}</div>
                </div>
                <div className="why-card-expand">
                  <p style={{ fontSize: 13, color: 'var(--body)', lineHeight: 1.7 }}>{card.expandText}</p>
                  <button className="why-expand-btn">
                    <span>Learn more</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section" id="faq">
        <div className="faq-inner">
          <div className="faq-header">
            <div className="section-tag">FAQ</div>
            <h2 className="section-title" style={{ textAlign: 'center', marginTop: 16 }}>
              Questions before<br />
              <em>you start</em>
            </h2>
          </div>

          <div className="faq-list-container">
            <div className="faq-search">
              <svg className="faq-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" className="faq-search-input" id="faqSearchInput" placeholder="Search questions..." />
            </div>

            <div className="faq-categories">
              <button className="faq-category-btn is-active" data-category="all">All</button>
              <button className="faq-category-btn" data-category="pricing">Pricing &amp; Process</button>
              <button className="faq-category-btn" data-category="technical">Technical</button>
              <button className="faq-category-btn" data-category="sectors">Sectors</button>
            </div>

            <div className="faq-list" id="faqList">
              {[
                { q: 'Do we need to buy new software or licenses?', a: 'No. We build exclusively on Microsoft tools your organization already pays for — M365, Power Platform, Azure, and Copilot. There are no additional license costs, no new software to deploy, and no vendor lock-in.', cat: 'pricing', keywords: 'software licenses cost money buy purchase' },
                { q: 'How long does a typical engagement take?', a: 'From signed contract to your first live system takes just 10 weeks. Our phased approach means you\'ll see results early — typically within 6 weeks with the first workflow automated and running.', cat: 'pricing', keywords: 'duration timeline weeks months years how long' },
                { q: 'What happens after the initial deployment?', a: 'Every engagement includes a monthly managed service retainer. This covers new agents, new dashboards, new departments, and continuous improvement. As your organisation evolves, your intelligence system evolves with it.', cat: 'pricing', keywords: 'after deployment ongoing support retainer monthly' },
                { q: 'Is our data secure?', a: 'Absolutely. We\'re ISO 27001 aligned, implement Zero Trust architecture, and all work stays within your Microsoft environment. Your data never leaves your tenant, and we maintain the highest security standards throughout.', cat: 'technical', keywords: 'security safe data protection iso zero trust' },
                { q: 'Which sectors do you work with?', a: 'We specialize in three sectors: Government MDAs (digital governance, budget reporting, audit-readiness), International NGOs (donor reporting, grant tracking, beneficiary data), and Private Sector (C-suite dashboards, automation, field operations).', cat: 'sectors', keywords: 'government NGO private company sectors industries' }
              ].map((faq, i) => (
                <div key={i} className="faq-item" data-category={faq.cat} data-keywords={faq.keywords}>
                  <div className="faq-question">
                    <h3>{faq.q}</h3>
                    <div className="faq-toggle">+</div>
                  </div>
                  <div className="faq-answer">
                    <div className="faq-answer-inner">{faq.a}</div>
                  </div>
                </div>
              ))}

              <div className="faq-item no-results" id="faqNoResults">
                No questions match your search. Try different keywords.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="bottom-cta" id="discovery">
        <div className="cta-inner">
          <div className="cta-content">
            <div className="section-tag" style={{ textAlign: 'left', marginTop: 16 }}>Start Here</div>
            <h2 className="cta-title">
              Ready to transform<br />
              <em>your organization?</em>
            </h2>
            <p className="cta-sub">
              Book a free 45-minute discovery call. We&apos;ll map your top 3 operational bottlenecks and show you exactly what&apos;s possible — on your existing Microsoft environment.
            </p>
            <div className="cta-features">
              <div className="cta-feature">
                <div className="cta-feature-icon">✓</div>
                <span>Free 45-minute discovery call</span>
              </div>
              <div className="cta-feature">
                <div className="cta-feature-icon">✓</div>
                <span>No obligation beyond the call</span>
              </div>
              <div className="cta-feature">
                <div className="cta-feature-icon">✓</div>
                <span>First workflow live in 6 weeks</span>
              </div>
              <div className="cta-feature">
                <div className="cta-feature-icon">✓</div>
                <span>Zero new software to purchase</span>
              </div>
            </div>
          </div>

          <div className="cta-form-wrap">
            <div className="cta-form-title">Book Your Free Call</div>
            <div className="cta-form-sub">Enter your email and we&apos;ll reach out within 24 hours</div>
            <form className="cta-form" id="ctaEmailForm" noValidate>
              <input
                className="cta-input"
                type="email"
                id="ctaEmailInput"
                name="user_email"
                placeholder="Enter your work email"
                required
                autoComplete="email"
              />
              <button type="submit" className="btn-primary inline-flex items-center gap-2.5 rounded-[10px] bg-[linear-gradient(135deg,#4584ed_0%,#2d65c4_100%)] px-8 py-4 text-sm font-semibold tracking-[0.01em] text-white shadow-[0_4px_20px_rgba(59,111,209,0.3)] transition duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(59,111,209,0.4)] cta-submit" id="ctaSubmitBtn">
                <span id="ctaBtnText">Book Your Free Call →</span>
                <span id="ctaBtnSpinner" style={{ display: 'none' }}>Sending…</span>
              </button>
            </form>
            <div id="ctaFormMsg" className="cta-form-msg"></div>
            <div className="cta-guarantee">🔒 Your information is never shared. Unsubscribe anytime.</div>
          </div>
        </div>
      </section>

      {/* SERVICE PANEL OVERLAY */}
      <div className={`panel-overlay ${panelService ? 'active' : ''}`} onClick={closePanel}></div>

      {/* SERVICE PANEL */}
      <div className={`service-panel ${panelService ? 'open' : ''}`}>
        {service && (
          <>
            <div className="panel-header">
              <div className="panel-num">{service.num}</div>
              <button className="panel-close" onClick={closePanel} aria-label="Close panel">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="panel-img">
              <Image src={service.img} alt={service.title} fill className="object-cover" />
            </div>

            <div className="panel-content">
              <h2 className="panel-title">{service.title}</h2>
              <p className="panel-intro">{service.intro}</p>

              <div className="panel-tabs">
                <button className={`panel-tab ${activeTab === 'included' ? 'active' : ''}`} onClick={() => setActiveTab('included')}>
                  📋 What&apos;s Included
                </button>
                <button className={`panel-tab ${activeTab === 'deliver' ? 'active' : ''}`} onClick={() => setActiveTab('deliver')}>
                  🎯 What We Deliver
                </button>
                <button className={`panel-tab ${activeTab === 'industries' ? 'active' : ''}`} onClick={() => setActiveTab('industries')}>
                  🏢 Industries
                </button>
              </div>

              {activeTab === 'included' && (
                <div className="panel-tab-content active">
                  <ul className="panel-list">
                    {service.included.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === 'deliver' && (
                <div className="panel-tab-content active">
                  <div className="panel-deliverable">
                    <p>{service.deliver}</p>
                    <div className="panel-deliverable-stat">{service.deliverStat}</div>
                  </div>
                </div>
              )}

              {activeTab === 'industries' && (
                <div className="panel-tab-content active">
                  <ul className="panel-list">
                    {service.industries.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {related.length > 0 && (
                <div className="panel-related">
                  <div className="panel-related-title">Explore Related Services</div>
                  <div className="panel-related-list">
                    {related.map((r, i) => (
                      <div key={i} className="panel-related-item" onClick={() => openPanel(r.id)}>
                        <div className="panel-related-icon"><PillarIcon id={r.id} size={18} /></div>
                        <div className="panel-related-info">
                          <h4>{r.name}</h4>
                          <p>{r.desc}</p>
                        </div>
                        <div className="panel-related-arrow">→</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="panel-ctas">
                <a href="#discovery" className="btn-primary panel-cta-primary" onClick={closePanel}>
                  Book Discovery Call →
                </a>
                <button className="panel-cta-secondary" onClick={closePanel}>
                  <span>💬</span> Chat with Robina
                </button>
              </div>

              <button className="panel-back" onClick={closePanel}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back to Services
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}