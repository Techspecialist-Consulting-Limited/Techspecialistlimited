'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ExecutivePanel from '../components/ExecutivePanel';
import { sendDiscoveryCallEmail } from '../lib/emailjs';

export default function Home() {
  useEffect(() => {
    // Cookie consent
    const cookieBanner = document.getElementById('cookieBanner');
    const cookieAccept = document.getElementById('cookieAccept');
    const cookieDecline = document.getElementById('cookieDecline');
    const COOKIE_NAME = 'ts_cookie_consent';
    const COOKIE_EXPIRY_DAYS = 365;

    function getCookie(name: string): string | null {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    }

    function setCookie(name: string, value: string, days: number) {
      const expires = new Date();
      expires.setDate(expires.getDate() + days);
      document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    }

    function dismissBanner() {
      cookieBanner?.classList.remove('show');
      setTimeout(() => {
        if (cookieBanner) cookieBanner.style.display = 'none';
      }, 600);
    }

    const consent = getCookie(COOKIE_NAME);
    if (cookieBanner && !consent) {
      setTimeout(() => cookieBanner?.classList.add('show'), 2000);
    }

    cookieAccept?.addEventListener('click', () => {
      setCookie(COOKIE_NAME, 'accepted', COOKIE_EXPIRY_DAYS);
      dismissBanner();
    });

    cookieDecline?.addEventListener('click', () => {
      setCookie(COOKIE_NAME, 'essential', COOKIE_EXPIRY_DAYS);
      dismissBanner();
    });

    // Scroll progress bar
    const progressBar = document.getElementById('scrollProgressBar');
    if (progressBar) {
      window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollTop / docHeight) * 100;
        progressBar.style.width = `${Math.min(progress, 100)}%`;
      });
    }

    // Count-up animation
    const outcomesGrid = document.querySelector('.outcomes-grid');
    if (outcomesGrid) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.querySelectorAll('.outcome-num').forEach((n) => {
              const el = n as HTMLElement;
              const text = n.textContent?.trim() || '';
              if (text === '₦0' || text === '24/7') return;
              if (text.endsWith('wk')) animateCount(el, parseInt(text), '', 'wk');
              else if (text.includes('%')) animateCount(el, parseInt(text), '', '%');
              else if (text.includes('×')) animateCount(el, parseInt(text), '', '×');
            });
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.3 }
      );
      observer.observe(outcomesGrid);
    }

    function animateCount(el: HTMLElement, target: number, prefix: string, suffix: string, duration = 1200) {
      let start = 0;
      const step = target / (duration / 16);
      const timer = setInterval(() => {
        start = Math.min(start + step, target);
        el.innerHTML = prefix + Math.floor(start) + suffix;
        if (start >= target) clearInterval(timer);
      }, 16);
    }

    // Sticky section nav
    const stickyNav = document.getElementById('stickySectionNav');
    const homeSections = ['problem', 'how', 'cases', 'outcomes', 'client-voices', 'our-team'];

    if (stickyNav) {
      window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        stickyNav.classList.toggle('is-visible', scrollY > 500);

        homeSections.forEach((id) => {
          const section = document.getElementById(id);
          const link = stickyNav.querySelector(`a[href="#${id}"]`);
          if (section && link) {
            const rect = section.getBoundingClientRect();
            link.classList.toggle('is-active', rect.top <= 100 && rect.bottom > 100);
          }
        });
      });
    }

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const id = anchor.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });

    // Testimonials carousel
    const track = document.querySelector('.testimonials-track') as HTMLElement | null;
    const prevBtn = document.getElementById('testimonialPrev');
    const nextBtn = document.getElementById('testimonialNext');
    const dotsContainer = document.getElementById('carouselDots');

    if (track && prevBtn && nextBtn) {
      let currentIndex = 0;
      const cards = track.querySelectorAll('.testimonial') as NodeListOf<HTMLElement>;
      
      function buildDots() {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        const visibleCount = window.innerWidth <= 768 ? 1 : 2;
        const maxIndex = Math.max(0, cards.length - visibleCount);
        for (let i = 0; i <= maxIndex; i++) {
          const dot = document.createElement('div');
          dot.className = `carousel-dot${i === 0 ? ' active' : ''}`;
          dot.addEventListener('click', () => goTo(i));
          dotsContainer.appendChild(dot);
        }
      }

      function updateDots() {
        dotsContainer?.querySelectorAll('.carousel-dot').forEach((dot, i) => {
          dot.classList.toggle('active', i === currentIndex);
        });
      }

      function goTo(index: number) {
        const visibleCount = window.innerWidth <= 768 ? 1 : 2;
        const maxIndex = Math.max(0, cards.length - visibleCount);
        currentIndex = Math.max(0, Math.min(index, maxIndex));
        const gap = 20;
        const cardWidth = (cards[0]?.offsetWidth || 0) + gap;
        track!.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
        updateDots();
      }

      prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
      nextBtn.addEventListener('click', () => goTo(currentIndex + 1));
      buildDots();
      goTo(0);

      // Auto-slide
      let autoSlideInterval: ReturnType<typeof setInterval>;
      const startAutoSlide = () => {
        autoSlideInterval = setInterval(() => {
          const maxIndex = Math.max(0, cards.length - (window.innerWidth <= 768 ? 1 : 2));
          if (currentIndex < maxIndex) {
            goTo(currentIndex + 1);
          } else {
            goTo(0);
          }
        }, 4000);
      };
      const stopAutoSlide = () => clearInterval(autoSlideInterval);
      startAutoSlide();
      track.addEventListener('mouseenter', stopAutoSlide);
      track.addEventListener('mouseleave', startAutoSlide);

      window.addEventListener('resize', () => {
        currentIndex = 0;
        buildDots();
        goTo(0);
      });
    }

    // Partners slider duplication
    const partnersTrack = document.querySelector('.partners-track') as HTMLElement | null;
    if (partnersTrack && !partnersTrack.dataset.duplicated) {
      partnersTrack.innerHTML += partnersTrack.innerHTML;
      partnersTrack.dataset.duplicated = 'true';
    }

    // Team expand/collapse
    (window as any).toggleTeam = function () {
      const btn = document.getElementById('teamExpandBtn');
      const row = document.getElementById('teamSecondaryRow');
      const label = document.getElementById('expandLabel');
      const count = document.getElementById('expandCount');
      const cards = document.querySelectorAll('[data-team-card="true"]') as NodeListOf<HTMLElement>;
      const open = btn?.classList.contains('expanded');

      if (!open) {
        cards.forEach((c, i) => {
          c.classList.remove('hidden');
          c.style.animation = `fadeUp 0.4s ease ${i * 0.08}s both`;
        });
        row?.classList.remove('masked');
        row?.classList.add('expanded');
        btn?.classList.add('expanded');
        if (label) label.textContent = 'Showing the Full Crew';
        if (count) count.textContent = 'Collapse ↑';
      } else {
        cards.forEach((c) => c.classList.add('hidden'));
        row?.classList.remove('expanded');
        row?.classList.add('masked');
        btn?.classList.remove('expanded');
        if (label) label.textContent = 'Meet the Full Crew';
        if (count) count.textContent = `+${cards.length} more`;
      }
    };

    // Founder bio reveal
    (window as any).revealFounderBio = function () {
      const photo = document.getElementById('founderPhoto');
      const bio = document.getElementById('founderBio');
      const short = document.querySelector('.fc-short');
      const hint = document.getElementById('founderHint');

      if (bio?.classList.contains('revealed')) {
        bio.classList.remove('revealed');
        photo?.classList.remove('revealed');
        short?.classList.remove('hidden');
        hint?.classList.remove('show');
      } else {
        bio?.classList.add('revealed');
        photo?.classList.add('revealed');
        short?.classList.add('hidden');
        hint?.classList.add('show');
      }
    };

    // Set initial team count
    const cards = document.querySelectorAll('[data-team-card="true"]');
    const countEl = document.getElementById('expandCount');
    if (countEl) countEl.textContent = `+${cards.length} more`;
    if (cards.length === 0) {
      const wrap = document.getElementById('teamExpandWrap');
      if (wrap) wrap.style.display = 'none';
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

      function showMsg(text: string, type: 'success' | 'error') {
        if (!msgBox) return;
        msgBox.textContent = text;
        msgBox.className = `cta-form-msg ${type}`;
        msgBox.style.display = 'block';
      }

      function setLoading(loading: boolean) {
        if (!btn) return;
        btn.disabled = loading;
        if (btnText) btnText.style.display = loading ? 'none' : 'inline';
        if (btnSpinner) btnSpinner.style.display = loading ? 'inline' : 'none';
      }

      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = input?.value.trim() || '';
        input?.classList.remove('input-error');
        if (msgBox) msgBox.style.display = 'none';

        if (!isValidEmail(email)) {
          input?.classList.add('input-error');
          showMsg('Please enter a valid email address.', 'error');
          input?.focus();
          return;
        }

        setLoading(true);
        try {
          await sendDiscoveryCallEmail(email);
          showMsg('Thank you! Our team will be in touch within 24 hours to schedule your discovery call.', 'success');
          if (input) input.value = '';
        } catch (err) {
          showMsg('Something went wrong. Please email us at info@techspecialistlimited.com', 'error');
        }
        setLoading(false);
      });

      input?.addEventListener('input', function () {
        input.classList.remove('input-error');
        if (msgBox) msgBox.style.display = 'none';
      });
    }

    // Scroll reveal
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length > 0) {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
      );
      reveals.forEach((el) => revealObserver.observe(el));

      // Fallback: reveal all after 1.5s in case observer misses
      setTimeout(() => {
        reveals.forEach((el) => el.classList.add('visible'));
      }, 1500);
    }
  }, []);

  return (
    <div>
      {/* Scroll Progress Bar */}
      <div className="fixed left-0 top-0 z-[9999] h-[4px] w-full bg-gray-100">
        <div className="h-full w-0 bg-[linear-gradient(90deg,#4584ed,#ef6526)] transition-[width] duration-150" id="scrollProgressBar"></div>
      </div>

      {/* Sticky Section Nav */}
      <nav
        id="stickySectionNav"
        className="sticky-service-nav"
        aria-label="Page sections"
      >
        <a href="#problem">Pain Points</a>
        <a href="#how">How We Work</a>
        <a href="#cases">Use Cases</a>
        <a href="#outcomes">Outcomes</a>
        <a href="#client-voices">Voices</a>
        <a href="#our-team">Team</a>
      </nav>

      {/* HERO SECTION */}
      <section className="hero relative min-h-screen flex items-center overflow-hidden bg-[#080e1e]">
        <div className="hero-bg-grid absolute inset-0 z-0"></div>
        <div className="hero-layout relative z-10 mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-12 px-4 pb-12 pt-24 sm:px-6 sm:pb-14 sm:pt-28 lg:grid-cols-[1.15fr_0.85fr] lg:gap-[60px] lg:px-20 lg:pb-20 lg:pt-[140px]">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center lg:mx-0 lg:items-start lg:text-left" style={{ animation: 'fadeUp 1s ease both' }}>
            <div className="hero-badge relative mb-7 inline-flex items-center gap-2.5 overflow-hidden rounded-full border border-[#3b6fd14d] bg-[linear-gradient(135deg,rgba(59,111,209,0.2),rgba(59,111,209,0.08))] px-[18px] py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
              <span className="h-2 w-2 rounded-full bg-[#4584ed]" style={{ animation: 'pulseDot 2s ease-in-out infinite' }}></span>
              We Empower Your Workforce
            </div>

            <h1 className="font-syne text-white text-[clamp(36px,4.5vw,60px)] font-extrabold leading-tight tracking-tight mb-6">
              Your leadership<br /><em className="not-italic text-sky-400">should never</em> fly<br /><span className="strike">blind</span> again.
            </h1>

            <p className="hero-sub mb-8 text-[20px] text-white/80 leading-[1.75] max-w-2xl">
              We transform your <strong>fragmented organisational data</strong> into a live executive intelligence system — using <strong>Microsoft tools you already own</strong>. Every critical decision, answered in minutes.
            </p>

            <div className="hero-actions flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <a href="./ai-readiness-assessment" className="btn-primary inline-flex items-center gap-2.5 rounded-[10px] bg-[linear-gradient(135deg,#4584ed_0%,#2d65c4_100%)] px-8 py-4 text-sm font-semibold tracking-[0.01em] text-white shadow-[0_4px_20px_rgba(59,111,209,0.3)] transition duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(59,111,209,0.4)]">Take your AI readiness assessment</a>
              <a href="#how" className="btn-secondary inline-flex items-center gap-2 text-sm font-medium text-white/90 transition hover:text-white"><span className="play-icon">▶</span>See How We Work</a>
            </div>

            <div className="hero-stats flex flex-wrap justify-center items-start gap-4 sm:gap-6 mt-8 sm:mt-10 lg:justify-start">
              <div className="hero-stat text-center sm:text-left">
                <div className="hero-stat-num text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">10<span className="text-sky-400 text-lg sm:text-xl">wk</span></div>
                <div className="hero-stat-label text-[10px] sm:text-xs text-white/60 mt-0.5">To your first live dashboard</div>
              </div>
              <div className="hero-stat-divider hidden sm:block w-px h-10 sm:h-12 bg-white/20"></div>
              <div className="hero-stat text-center sm:text-left">
                <div className="hero-stat-num text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">3<span className="text-sky-400 text-lg sm:text-xl">×</span></div>
                <div className="hero-stat-label text-[10px] sm:text-xs text-white/60 mt-0.5">Faster decision cycles</div>
              </div>
              <div className="hero-stat-divider hidden sm:block w-px h-10 sm:h-12 bg-white/20"></div>
              <div className="hero-stat text-center sm:text-left">
                <div className="hero-stat-num text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">₦0</div>
                <div className="hero-stat-label text-[10px] sm:text-xs text-white/60 mt-0.5">New software to buy</div>
              </div>
            </div>
          </div>

          <ExecutivePanel />
        </div>
      </section>

      {/* PARTNERS LOGOS */}
      <section className="py-8 sm:py-10 border-y border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
        <div className="max-w-6xl mx-auto flex items-center gap-8 sm:gap-10 px-4 sm:px-8 md:px-16">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/55 whitespace-nowrap min-w-28">Trusted across Africa</div>
          <div className="flex-1 overflow-hidden" style={{ maskImage: 'linear-gradient(to right,transparent 0%,#000 8%,#000 92%,transparent 100%)', WebkitMaskImage: 'linear-gradient(to right,transparent 0%,#000 8%,#000 92%,transparent 100%)' }}>
            <div className="partners-track flex items-center gap-14 w-max animate-scroll">
              <div className="flex items-center justify-center py-1"><Image width={160} height={48} className="h-12 w-auto max-w-40 object-contain opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all" src="https://res.cloudinary.com/daqmbfctv/image/upload/v1772714011/vitesse-africa_hw9uhc.svg" alt="Vitesse Africa" /></div>
              <div className="flex items-center justify-center py-1"><Image width={160} height={48} className="h-12 w-auto max-w-40 object-contain opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all" src="https://res.cloudinary.com/daqmbfctv/image/upload/t_faqimage/Nigeria_Sovereign_Investment_Authority_logo.svg_ot8hus" alt="NSIA" /></div>
              <div className="flex items-center justify-center py-1"><Image width={160} height={48} className="h-12 w-auto max-w-40 object-contain opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all" src="https://res.cloudinary.com/daqmbfctv/image/upload/v1772714010/logo.jpg_i1jmtu.jpg" alt="Partner" /></div>
              <div className="flex items-center justify-center py-1"><Image width={160} height={48} className="h-12 w-auto max-w-40 object-contain opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all" src="https://res.cloudinary.com/daqmbfctv/image/upload/v1772714011/International_IDEA_logo_2023.svg_v8p6ve.png" alt="International IDEA" /></div>
              <div className="flex items-center justify-center py-1"><Image width={160} height={48} className="h-12 w-auto max-w-40 object-contain opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all" src="https://res.cloudinary.com/daqmbfctv/image/upload/v1769426792/ITF_rqhfac.jpg" alt="ITF" /></div>
              <div className="flex items-center justify-center py-1"><Image width={160} height={48} className="h-12 w-auto max-w-40 object-contain opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all" src="https://res.cloudinary.com/daqmbfctv/image/upload/t_new/macarthur_foundation_logo_bgu5s4" alt="MacArthur Foundation" /></div>
              <div className="flex items-center justify-center py-1"><Image width={160} height={48} className="h-12 w-auto max-w-40 object-contain opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all" src="https://res.cloudinary.com/daqmbfctv/image/upload/v1772714007/british-copy_pgm3yr.png" alt="British Council" /></div>
              <div className="flex items-center justify-center py-1"><Image width={160} height={48} className="h-12 w-auto max-w-40 object-contain opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all" src="https://res.cloudinary.com/daqmbfctv/image/upload/t_new/images_4_luyjae" alt="FCCPC" /></div>
              <div className="flex items-center justify-center py-1"><Image width={160} height={48} className="h-12 w-auto max-w-40 object-contain opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all" src="https://res.cloudinary.com/daqmbfctv/image/upload/t_new/images_3_n78nql" alt="NMRC" /></div>
              <div className="flex items-center justify-center py-1"><Image width={160} height={48} className="h-12 w-auto max-w-40 object-contain opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all" src="https://res.cloudinary.com/daqmbfctv/image/upload/v1769426792/neca_doibsu.jpg" alt="NECA" /></div>
              <div className="flex items-center justify-center py-1"><Image width={160} height={48} className="h-12 w-auto max-w-40 object-contain opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all" src="https://res.cloudinary.com/daqmbfctv/image/upload/t_new/imfhf10w_400x400_hl9mwd" alt="GF" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* THE PAIN POINTS */}
      <section className="problem-section-v2" id="problem">
        <div className="problem-inner-v2">
          <div className="problem-header-v2">
            <div>
              <div className="problem-tag-v2">The Pain Points</div>
              <h2 className="problem-h2-v2">
                Your data exists.<br /><em>Your leaders can&apos;t see it.</em>
              </h2>
            </div>
            <p className="problem-sub-v2">
              Most organisations run on 6–12 different systems. Finance in one place. HR in another. Operations in spreadsheets. Field reports on WhatsApp. By the time someone compiles it all — the decision has already been made badly, or not at all.
            </p>
          </div>

          <div className="problem-body-v2">
            <div className="pain-list">
              {[
                { num: '01', title: 'Data Lives in Silos', desc: "Every department runs its own system, its own format, its own version of the truth. Finance, HR, operations, and field teams can't see each other — and neither can leadership.", active: true },
                { num: '02', title: 'Reports Take Weeks to Compile', desc: "Board meetings arrive and someone is still pulling Excel files together, chasing department heads on WhatsApp. By the time the report reaches the DG's desk, the data is already stale." },
                { num: '03', title: 'Microsoft Licences Sitting Idle', desc: "Your organisation already pays for Microsoft 365, Power Platform, and Azure every month — and uses less than 20% of its capability. Power BI. Copilot. Power Automate. All paid for. All untouched." },
                { num: '04', title: "Leadership Can't Trust the Numbers", desc: "Ask three departments for the same figure and get three different answers. When data is inconsistent and unverified, confident strategic decisions become impossible." }
              ].map((item, i) => (
                <div key={i} className={`pain-item ${item.active ? 'active' : ''}`}>
                  <div className="pain-num">{item.num}</div>
                  <div className="pain-content">
                    <div className="pain-title">{item.title}</div>
                    <div className="pain-desc">{item.desc}</div>
                  </div>
                  <div className="pain-arrow">↗</div>
                </div>
              ))}

              <div className="problem-stats-strip">
                <div className="pstat">
                  <div className="pstat-num">80%</div>
                  <div className="pstat-label">Manual data entry eliminated</div>
                </div>
                <div className="pstat">
                  <div className="pstat-num">10×</div>
                  <div className="pstat-label">Faster board reporting</div>
                </div>
                <div className="pstat">
                  <div className="pstat-num">₦0</div>
                  <div className="pstat-label">New software to buy</div>
                </div>
              </div>
            </div>

            <div className="problem-video-v2">
              <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 dark:border-white/10">
                <div className="video-player-wrap" id="videoWrap">
                  <video
                    id="founderVideo"
                    src="https://res.cloudinary.com/daqmbfctv/video/upload/v1772185357/1772185333283.publer.com_slnguv.mp4"
                    poster="https://res.cloudinary.com/daqmbfctv/image/upload/v1772185357/1772185333283.publer.com_slnguv.jpg"
                    preload="metadata"
                    controls
                    className="w-full rounded-lg"
                  ></video>
                </div>
                <div className="mt-4 pl-3 border-l-4 border-[#4584ed]">
                  <p className="text-base sm:text-lg text-gray-700 dark:text-gray-200 leading-relaxed italic">
                    &#34;We built TechSpecialist because African organisations deserve the same intelligence infrastructure as the world&apos;s best-run companies — using tools they already own.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW WE WORK */}
      <section className="section how-section" id="how">
        <div className="how-inner">
          <div className="how-left">
            <div className="section-tag">How We Work</div>
            <h2 className="section-title reveal">
              Three layers.<br /><em>One transformation.</em>
            </h2>
            <p className="section-body reveal reveal-delay-1">
              We don&apos;t ask you to buy new software or rip out existing systems. We
              build on what you already own — and turn it into the intelligence
              infrastructure your leadership deserves.
            </p>
            <div className="layers">
              <div className="layer reveal">
                <div className="layer-num">01</div>
                <div className="layer-content">
                  <div className="layer-title">Agentic Operations Layer</div>
                  <div className="layer-desc">
                    We deploy intelligent agents that automate your most critical
                    repetitive workflows — procurement approvals, field reporting,
                    HR compliance, project monitoring. The agents run 24/7,
                    capture data consistently, and eliminate manual processes from
                    day one.
                  </div>
                  <div className="layer-tech">
                    <span className="tech-tag">Power Automate</span>
                    <span className="tech-tag">Copilot Studio</span>
                    <span className="tech-tag">Azure AI</span>
                  </div>
                </div>
              </div>
              <div className="layer reveal reveal-delay-1">
                <div className="layer-num">02</div>
                <div className="layer-content">
                  <div className="layer-title">Executive Intelligence Layer</div>
                  <div className="layer-desc">
                    All that clean, automated data flows directly into a live
                    executive dashboard. One screen. Full picture. Ask Copilot a
                    question in plain English and get an instant answer. Board
                    reports generate themselves.
                  </div>
                  <div className="layer-tech">
                    <span className="tech-tag">Power BI</span>
                    <span className="tech-tag">Microsoft Fabric</span>
                    <span className="tech-tag">M365 Copilot</span>
                  </div>
                </div>
              </div>
              <div className="layer reveal reveal-delay-2">
                <div className="layer-num">03</div>
                <div className="layer-content">
                  <div className="layer-title">Ongoing Managed Service</div>
                  <div className="layer-desc">
                    We stay with you. Monthly retainer — new agents, new
                    dashboards, new departments. As your organisation evolves,
                    your intelligence system evolves with it.
                  </div>
                  <div className="layer-tech">
                    <span className="tech-tag">Monthly Retainer</span>
                    <span className="tech-tag">Continuous Improvement</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="how-right reveal">
            <div className="section-tag">Delivery Timeline</div>
            <h3 className="timeline-heading">
              From sign-off to live<br />in <em>10 weeks.</em>
            </h3>
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-dot">W1</div>
                <div className="timeline-body">
                  <div className="timeline-week">Weeks 1 – 2</div>
                  <div className="timeline-title">Discovery &amp; Process Mapping</div>
                  <div className="timeline-desc">
                    We map your 3–5 most critical operational bottlenecks. No
                    obligation. You see exactly what&apos;s possible before anything is
                    built.
                  </div>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot">W3</div>
                <div className="timeline-body">
                  <div className="timeline-week">Weeks 3 – 6</div>
                  <div className="timeline-title">Agent Sprint</div>
                  <div className="timeline-desc">
                    2–3 intelligent agents deployed on your existing Microsoft
                    environment. Workflows automated. Data starts flowing cleanly
                    from day one.
                  </div>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot">W7</div>
                <div className="timeline-body">
                  <div className="timeline-week">Weeks 7 – 10</div>
                  <div className="timeline-title">Intelligence Dashboard Live</div>
                  <div className="timeline-desc">
                    Executive dashboard connected. Copilot activated. Board report
                    templates automated. Leadership sees their first live
                    organisational picture.
                  </div>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot">∞</div>
                <div className="timeline-body">
                  <div className="timeline-week">Month 3 onwards</div>
                  <div className="timeline-title">Managed Service &amp; Growth</div>
                  <div className="timeline-desc">
                    Monthly retainer. New agents, new insights, new departments.
                    Your intelligence system grows with your organisation.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="section dark:bg-[#0b1020]" id="cases" style={{ background: '#fff' }}>
        <div className="cases-section-wrap">
          <div className="cases-section-header">
            <div>
              <div className="section-tag">Use Cases</div>
              <h2 className="section-title reveal dark:text-white">
                We know your sector.<br /><em>We&apos;ve mapped your pain.</em>
              </h2>
            </div>
            <p className="section-body reveal reveal-delay-1 dark:text-white/60" style={{ maxWidth: 440, fontSize: 15 }}>
              Government MDAs, international NGOs, and private sector
              organisations each carry a distinct version of the same problem. We
              build tailored to your workflows — not a generic template.
            </p>
          </div>
          <div className="cases-grid reveal">
            <div className="case-card dark:bg-[#101827] dark:border-white/10">
              <div className="case-sector-tag">Government MDAs</div>
              <div className="case-num">01</div>
              <div className="case-title dark:text-white">From manual processes to digital governance</div>
              <div className="case-divider"></div>
              <ul className="case-list">
                <li>Budget performance reporting automated from IFMIS</li>
                <li>Procurement approvals routed digitally in hours, not weeks</li>
                <li>Project monitoring from field to DG&apos;s dashboard</li>
                <li>Audit documentation assembled continuously</li>
                <li>Staff attendance and HR compliance automated</li>
              </ul>
            </div>
            <div className="case-card dark:bg-[#101827] dark:border-white/10">
              <div className="case-sector-tag">International NGOs</div>
              <div className="case-num">02</div>
              <div className="case-title dark:text-white">From donor pressure to reporting confidence</div>
              <div className="case-divider"></div>
              <ul className="case-list">
                <li>Beneficiary data collection via mobile — no paper forms</li>
                <li>Donor reports compiled automatically from live data</li>
                <li>Grant milestone tracking with automated alerts</li>
                <li>Program performance dashboard for Country Directors</li>
                <li>Multi-donor compliance reporting in one click</li>
              </ul>
            </div>
            <div className="case-card dark:bg-[#101827] dark:border-white/10">
              <div className="case-sector-tag">Private Sector</div>
              <div className="case-num">03</div>
              <div className="case-title dark:text-white">From gut decisions to data-driven leadership</div>
              <div className="case-divider"></div>
              <ul className="case-list">
                <li>Sales field reporting — structured, real-time, no WhatsApp chaos</li>
                <li>Month-end close automated from days to hours</li>
                <li>Customer complaint routing with resolution tracking</li>
                <li>Live P&amp;L and operational dashboard for the C-Suite</li>
                <li>Cross-branch performance comparison in real time</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PROVEN OUTCOMES */}
      <section className="py-12 sm:py-[60px] px-4 sm:px-8 md:px-16 bg-gray-50 dark:bg-[#0b1020]" id="outcomes">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-end mb-10 lg:mb-12">
            <div>
              <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-brand mb-[14px]">Proven Outcomes</div>
              <h2 className="font-syne text-[clamp(30px,3.5vw,46px)] font-extrabold leading-[1.1] tracking-tight text-heading dark:text-white">
                The numbers<br /><em className="text-brand not-italic">speak for themselves.</em>
              </h2>
            </div>
            <p className="text-[15px] text-gray-500 dark:text-white/60 leading-7">
              Every metric below is grounded in real deployments — real organisations across Africa that made the shift from data chaos to executive clarity.
            </p>
          </div>
          <div className="outcomes-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { num: '10×', label: 'Faster Board Reporting', desc: 'From 3-week manual compilations to automated reports.' },
              { num: '80%', label: 'Reduction in Manual Data Entry', desc: 'Agents handle repetitive capture.' },
              { num: '₦0', label: 'New Software Required', desc: 'Runs on Microsoft tools you already pay for.' },
              { num: '6wk', label: 'First Workflow Automated', desc: 'From discovery to first live agent.' },
              { num: '100%', label: 'Audit-Ready at All Times', desc: 'Every action logged, every data point traceable.' },
              { num: '24/7', label: 'Agent Availability', desc: 'Your workflows never sleep.' }
            ].map((outcome, i) => (
              <div key={i} className="outcome bg-white dark:bg-[#101827] rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-white/10 text-center">
                <span className="outcome-num block text-3xl sm:text-4xl font-extrabold text-[#4584ed] mb-1 sm:mb-2">{outcome.num}</span>
                <div className="outcome-label text-sm sm:text-base font-bold text-heading dark:text-white mb-1 sm:mb-2">{outcome.label}</div>
                <div className="outcome-desc text-xs sm:text-sm text-gray-500 dark:text-white/60">{outcome.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLIENT VOICES */}
      <section className="py-12 sm:py-[60px] px-4 sm:px-8 md:px-16 bg-white dark:bg-[#0b1020]" id="client-voices">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-end mb-10 lg:mb-12">
            <div>
              <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-brand mb-[14px]">Client Voices</div>
              <h2 className="font-syne text-[clamp(30px,3.5vw,46px)] font-extrabold leading-[1.1] tracking-tight text-heading dark:text-white">
                What leaders say<br /><em className="text-brand not-italic">after seeing it live.</em>
              </h2>
            </div>
            <p className="text-[15px] text-gray-500 dark:text-white/60 leading-7">
              Direct words from Directors, CEOs, and Country Directors across Government, NGOs, and Private Sector organisations.
            </p>
          </div>
          <div className="testimonials-carousel-wrap relative">
            <button className="carousel-arrow carousel-prev hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white dark:bg-[#101827] rounded-full shadow-lg items-center justify-center dark:border dark:border-white/10" id="testimonialPrev">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button className="carousel-arrow carousel-next hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white dark:bg-[#101827] rounded-full shadow-lg items-center justify-center dark:border dark:border-white/10" id="testimonialNext">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            <div className="testimonials-viewport overflow-hidden px-8 sm:mx-12">
              <div className="testimonials-track flex gap-4 sm:gap-6 transition-transform duration-300" id="testimonialsTrack">
                {[
                  { badge: 'Government MDA', text: '"For the first time in seven years, I could see the real status of every department on one screen."', author: 'Director General', title: 'Federal Ministry', initials: 'AO' },
                  { badge: 'Private Sector', text: '"My CFO asked why we hadn\'t done this five years ago. The ROI was clear within 60 days."', author: 'CEO', title: 'Financial Services Group', initials: 'BK' }
                ].map((test, i) => (
                  <div key={i} className="testimonial min-w-[260px] sm:min-w-[300px] md:min-w-[400px] bg-white dark:bg-[#101827] rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-white/10">
                    <div className="testimonial-badge text-[10px] font-bold uppercase tracking-[0.12em] text-[#4584ed] mb-4">{test.badge}</div>
                    <div className="testimonial-text text-base text-gray-600 dark:text-white/60 leading-7 mb-4">&quot;{test.text}&quot;</div>
                    <div className="testimonial-author flex items-center gap-3">
                      <div className="author-avatar w-10 h-10 rounded-full bg-[#4584ed] text-white flex items-center justify-center font-bold text-sm">{test.initials}</div>
                      <div>
                        <div className="author-name text-sm font-bold text-heading dark:text-white">{test.author}</div>
                        <div className="author-title text-xs text-gray-500 dark:text-white/60">{test.title}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="carousel-dots flex justify-center gap-2 mt-6" id="carouselDots"></div>
        </div>
      </section>

      {/* MICROSOFT ECOSYSTEM */}
      <section className="py-12 sm:py-[60px] px-4 sm:px-8 md:px-16 bg-gray-50 dark:bg-[#0b1020] border-y border-gray-200 dark:border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end mb-12">
            <div>
              <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-brand flex items-center gap-[10px] mb-[14px]">
                <span className="w-[22px] h-[2px] bg-brand rounded-[2px]"></span> Microsoft Ecosystem
              </div>
              <h2 className="font-syne text-[clamp(30px,3.5vw,46px)] font-extrabold leading-[1.1] tracking-tight text-heading dark:text-white">
                Everything runs on tools<br /><em className="text-brand not-italic">you already own</em>
              </h2>
            </div>
            <p className="text-[15px] text-gray-500 dark:text-white/60 leading-7">
              We don&apos;t ask you to buy new software or migrate your data. Every capability lives inside your existing Microsoft environment.
            </p>
          </div>
          <div className="msft-tiles grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'Microsoft 365', img: 'https://res.cloudinary.com/daqmbfctv/image/upload/v1774269850/microsoft_365_icon_p8pvxv.png' },
              { name: 'Power Automate', img: 'https://res.cloudinary.com/daqmbfctv/image/upload/v1774269850/Power_Automate_icon_kjnhlq.png' },
              { name: 'Copilot Studio', img: 'https://res.cloudinary.com/daqmbfctv/image/upload/v1778155427/Copilot_Studio_icon-removebg-preview_wfilbp.png' },
              { name: 'Power BI', img: 'https://res.cloudinary.com/daqmbfctv/image/upload/v1774269850/power-bi-icon_wczztj.webp' },
              { name: 'Azure Data', img: 'https://res.cloudinary.com/daqmbfctv/image/upload/v1774269852/Microsoft_Azure.svg_dv1bj1.png' },
              { name: 'Microsoft Fabric', img: 'https://res.cloudinary.com/daqmbfctv/image/upload/v1778155426/_2d3d887d-4265-4bb7-9c61-e5d4f25ec182-removebg-preview_rx9j6a.png' }
            ].map((tool, i) => (
              <div key={i} className="msft-tile bg-white dark:bg-[#101827] rounded-xl p-4 text-center border border-gray-200 dark:border-white/10 hover:border-[#4584ed] hover:shadow-md transition">
                <div className="msft-tile-icon flex items-center justify-center mb-2">
                  <Image src={tool.img} alt={tool.name} width={40} height={40} className="h-10 w-auto" />
                </div>
                <div className="msft-tile-name text-xs text-gray-600 dark:text-white/60">{tool.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUR TEAM */}
      <section className="team-section-v2 dark:bg-[#0b1020]" id="our-team">
        <div className="team-inner-v2">
          <div className="team-header-v2">
            <div>
              <div className="team-tag-v2">Our Team</div>
              <h2 className="team-h2-v2 dark:text-white">
                Built on conviction.<br /><em>Driven by purpose.</em>
              </h2>
            </div>
            <p className="team-sub-v2 dark:text-white/60">
              A focused team of specialists who believe African organisations deserve intelligence infrastructure powered by tools they already own.
            </p>
          </div>

          {/* Featured 3 */}
          <div className="team-featured-row">
            <div className="team-card-founder" onClick={() => (window as any).revealFounderBio?.()}>
              <div className="founder-photo" id="founderPhoto">
                <Image fill src="https://res.cloudinary.com/daqmbfctv/image/upload/c_crop,g_north_west,h_3112,w_4016/NEW_CHAIR_PHOTO_gpgfga.jpg" alt="founder" />
              </div>
              <div className="founder-body">
                {/* <div className="fc-role-tag">Founder & CEO</div> */}
                <div className="fc-name">Kadir Salami</div>
                <div className="fc-title">CEO &amp; Founder</div>
                <div className="fc-divider"></div>
                <p className="fc-short">A decade of Microsoft solutions experience across government, NGOs, and private sector.</p>
                <div className="fc-bio" id="founderBio">
                  Kadir built TechSpecialist on the conviction that African organisations deserve world-class intelligence infrastructure — powered by tools they already own. A decade of Microsoft solutions experience across government, NGOs, and private sector.
                </div>
                <div className="fc-click-hint" id="founderHint">
                  <span>👆</span> Tap image to read more
                </div>
              </div>
            </div>
            <div className="team-card-large">
              <div className="large-photo">
                <Image width={300} height={400} src="https://res.cloudinary.com/daqmbfctv/image/upload/c_crop,g_north_west,h_930,w_1024/ChatGPT_Image_Mar_23_2026_12_32_54_PM_gdcoow.png" alt="Oluwagbolahan Aina" />
              </div>
              <div className="large-body">
                <div className="sc-role">Client Technology Specialist</div>
                <div className="sc-name">Oluwagbolahan Aina</div>
                <div className="lc-divider"></div>
              </div>
            </div>
            <div className="team-card-large">
              <div className="large-photo">
                <Image width={300} height={400} src="https://res.cloudinary.com/daqmbfctv/image/upload/c_crop,g_north_west,h_2930,w_3106/TBS_7248.jpg_ipltwe.jpg" alt="Joy Adah" />
              </div>
              <div className="large-body">
                <div className="sc-role">People &amp; Culture Manager</div>
                <div className="sc-name">Joy Adah</div>
                <div className="lc-divider"></div>
              </div>
            </div>
          </div>

          {/* Secondary row - initially hidden */}
          <div className="team-secondary-row masked" id="teamSecondaryRow">
            <div className="team-card-small hidden" data-team-card="true">
              <div className="small-photo">
                <Image width={300} height={400} src="https://res.cloudinary.com/daqmbfctv/image/upload/c_crop,g_north_west,h_2502,w_2696/tbs_7279jpg_iwkhrb_68362b.jpg" alt="Suleman Olalomi" />
              </div>
              <div className="small-body">
                <div className="lc-role">Project Management</div>
                <div className="lc-name">Suleman Olalomi</div>
                <div className="sc-divider"></div>
              </div>
            </div>
            <div className="team-card-small hidden" data-team-card="true">
              <div className="small-photo">
                <Image width={300} height={400} src="https://res.cloudinary.com/daqmbfctv/image/upload/c_crop,g_north_west,h_459,w_407/team8_yingf2.png" alt="Zainab Sanni" />
              </div>
              <div className="small-body">
                <div className="lc-role">Head of Technical Services &amp; Information Security</div>
                <div className="lc-name">Zainab Sanni</div>
                <div className="sc-divider"></div>
              </div>
            </div>
            <div className="team-card-small hidden" data-team-card="true">
              <div className="small-photo">
                <Image width={300} height={400} src="https://res.cloudinary.com/daqmbfctv/image/upload/c_crop,g_north_west,h_995,w_1024/IMG_0582_bs7gmt.png" alt="Ejike Etolue" />
              </div>
              <div className="small-body">
                <div className="sc-role">Cybersecurity Analyst &amp; IT Infrastructure Specialist</div>
                <div className="sc-name">Ejike Etolue</div>
                <div className="sc-divider"></div>
              </div>
            </div>
            <div className="team-card-small hidden" data-team-card="true">
              <div className="small-photo">
                <Image width={300} height={400} src="https://res.cloudinary.com/daqmbfctv/image/upload/c_crop,g_north_west,h_2206,w_2696/tbs_7297jpg_myh9kb_68362b.jpg" alt="Charles Onyeso" />
              </div>
              <div className="small-body">
                <div className="sc-role">Microsoft 365 Solutions Engineer</div>
                <div className="sc-name">Charles Onyeso</div>
                <div className="sc-divider"></div>
              </div>
            </div>
            <div className="team-card-small hidden" data-team-card="true">
              <div className="small-photo">
                <Image width={300} height={400} src="https://res.cloudinary.com/daqmbfctv/image/upload/c_crop,g_north_west,h_1115,w_1024/ChatGPT_Image_Mar_23_2026_02_41_23_PM_cuwmuf.png" alt="Abbas Taofeeq" />
              </div>
              <div className="small-body">
                <div className="sc-role">Business Automation Associate</div>
                <div className="sc-name">Abbas Taofeeq</div>
                <div className="sc-divider"></div>
              </div>
            </div>
            <div className="team-card-small hidden" data-team-card="true">
              <div className="small-photo">
                <Image width={300} height={400} src="https://res.cloudinary.com/daqmbfctv/image/upload/c_crop,g_north_west,h_1034,w_1086,y_66/ChatGPT_Image_Jun_1_2026_04_37_34_PM_fyatcn.png" alt="Praise Jacob" />
              </div>
              <div className="small-body">
                <div className="sc-role">Full stack Software Engineer</div>
                <div className="sc-name">Mike Kanu</div>
                <div className="sc-divider"></div>
              </div>
            </div>
            <div className="team-card-small hidden" data-team-card="true">
              <div className="small-photo">
                <Image width={300} height={400} src="https://res.cloudinary.com/daqmbfctv/image/upload/c_crop,g_north_west,h_2206,w_2696/tbs_7274jpg_gmfio2_68362b.jpg" alt="Robinah Abdulaziz" />
              </div>
              <div className="small-body">
                <div className="sc-role">Marketing &amp; Communications Associate</div>
                <div className="sc-name">Robinah Abdulaziz</div>
                <div className="sc-divider"></div>
              </div>
            </div>
          </div>

          <div className="team-expand-wrap" id="teamExpandWrap">
            <button className="team-expand-btn" id="teamExpandBtn" onClick={() => (window as any).toggleTeam?.()}>
              <span className="expand-icon">▾</span>
              <span id="expandLabel">Meet the Full Crew</span>
              <span className="expand-count" id="expandCount">+7 more</span>
            </button>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <style>{`
        .cta-section .cta-tag::before {
          content: "";
          width: 22px;
          height: 2px;
          background: rgba(69,132,237,0.5);
          border-radius: 2px;
        }
        .cta-section .cta-input-field:focus {
          border-color: #4584ed;
          background: rgba(255,255,255,0.14);
        }
        .cta-section .cta-input-field::placeholder {
          color: rgba(255,255,255,0.4);
        }
        .cta-section .cta-input-field.input-error {
          border-color: #f87171;
        }
        .cta-section .cta-submit-btn:hover {
          background: #2d65c4;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(69,132,237,0.3);
        }
        .cta-section .cta-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }
        .cta-form-msg {
          max-width: 500px;
          margin: 0 auto 14px;
          padding: 11px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          text-align: center;
          line-height: 1.5;
        }
        .cta-form-msg.success {
          background: rgba(74,222,128,0.15);
          border: 1px solid rgba(74,222,128,0.4);
          color: #bbf7d0;
        }
        .cta-form-msg.error {
          background: rgba(248,113,113,0.15);
          border: 1px solid rgba(248,113,113,0.4);
          color: #fecaca;
        }
        @media (max-width: 960px) {
          .cta-section { padding: 72px 24px !important; }
        }
        @media (max-width: 600px) {
          .cta-section .cta-form-row { flex-direction: column; }
        }
      `}</style>
      <section id="discovery" className="cta-section" style={{ padding: '110px 64px', textAlign: 'center', position: 'relative', overflow: 'hidden', background: '#080e1e' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 70% at 50% 100%, rgba(69,132,237,0.15) 0%, transparent 65%), radial-gradient(ellipse 40% 40% at 20% 20%, rgba(239,101,38,0.08) 0%, transparent 60%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '620px', margin: '0 auto' }}>
          <div className="cta-tag" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(69,132,237,0.9)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>Start Here</div>
          <h2 className="reveal" style={{ fontSize: 'clamp(30px, 4vw, 50px)', fontWeight: 800, lineHeight: 1.1, color: '#fff', marginBottom: '18px', letterSpacing: '-0.025em' }}>
            See your organisation&apos;s<br />data <em style={{ fontStyle: 'normal', color: '#4584ed' }}>come alive.</em>
          </h2>
          <p className="reveal reveal-delay-1" style={{ fontSize: '16px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.72, marginBottom: '36px', fontWeight: 400 }}>
            Book a free 45-minute discovery call. We&apos;ll map your 3 biggest operational bottlenecks and show you exactly what&apos;s possible — on your existing Microsoft environment. No obligation. Just clarity.
          </p>
          <form className="cta-form-row reveal reveal-delay-2" id="ctaEmailForm" noValidate style={{ display: 'flex', gap: '10px', maxWidth: '500px', margin: '0 auto 14px', flexWrap: 'wrap' }}>
            <input
              type="email"
              className="cta-input-field"
              id="ctaEmailInput"
              name="user_email"
              placeholder="Enter your organisation email (e.g. you@company.org)"
              required
              autoComplete="email"
              style={{ flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '13px 18px', color: '#fff', fontSize: '13px', outline: 'none', transition: 'border-color 0.2s, background 0.2s' }}
            />
            <button
              type="submit"
              className="cta-submit-btn"
              id="ctaSubmitBtn"
              style={{ background: '#4584ed', color: '#fff', padding: '13px 26px', border: 'none', borderRadius: '6px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, letterSpacing: '0.01em', cursor: 'pointer', transition: 'background 0.2s, transform 0.15s, box-shadow 0.2s', whiteSpace: 'nowrap' }}
            >
              <span id="ctaBtnText">Book Your Free Call →</span>
              <span id="ctaBtnSpinner" style={{ display: 'none' }}>Sending…</span>
            </button>
          </form>
          <div id="ctaFormMsg" style={{ display: 'none', maxWidth: '500px', margin: '0 auto 14px', padding: '11px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, textAlign: 'center', lineHeight: 1.5 }}></div>
          <div className="reveal reveal-delay-3" style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.4)', marginBottom: '40px' }}>🔒 Your information is never shared. Unsubscribe any time.</div>
          <div className="reveal" style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              'Free 45-min discovery call',
              'No obligation beyond the call',
              'First workflow live in 6 weeks',
              'Zero new software to purchase'
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'rgba(255,255,255,0.6)' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(69,132,237,0.2)', border: '1px solid rgba(69,132,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#4584ed', fontWeight: 700, flexShrink: 0 }}>✓</div>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cookie Banner */}
      <div
        className="cookie-banner fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 bg-white dark:bg-[#101827] rounded-2xl shadow-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 max-w-2xl border border-gray-200 dark:border-white/10"
        id="cookieBanner"
        role="dialog"
        aria-label="Cookie consent"
      >
        <div className="cookie-banner-content flex-1">
          <div className="cookie-banner-icon text-2xl mb-2">🍪</div>
          <div className="cookie-banner-title font-bold text-sm mb-1 dark:text-white">We use cookies to improve your experience</div>
          <div className="cookie-banner-desc text-xs text-gray-500 dark:text-white/60">
            TechSpecialist uses cookies to analyse traffic, personalise content,
            and improve performance. By clicking <strong>&quot;Accept All&quot;</strong>,
            you agree as described in our <a href="#" className="text-[#4584ed]">Privacy Policy</a>.
          </div>
        </div>
        <div className="cookie-banner-actions flex gap-3">
          <button className="cookie-btn-decline px-4 py-2 text-sm border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.03] transition dark:text-white/65" id="cookieDecline">
            Essential Only
          </button>
          <button className="cookie-btn-accept px-4 py-2 text-sm bg-[#4584ed] text-white rounded-lg hover:bg-[#2d65c4] transition" id="cookieAccept">
            Accept All
          </button>
        </div>
      </div>

    </div>
  );
}
