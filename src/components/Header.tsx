'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';

interface AnchorItem {
  label: string;
  id: string;
}

const dropdownLinks: AnchorItem[] = [
  { label: 'How We Work', id: 'how' },
  { label: 'Use Cases', id: 'cases' },
  { label: 'Our Team', id: 'our-team' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileDropOpen, setMobileDropOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const menu = document.getElementById('mobileMenu');
      const hamburger = document.getElementById('navHamburger');
      if (menu && menu.contains(target)) return;
      if (hamburger && hamburger.contains(target)) return;
      setIsMenuOpen(false);
    }
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isMenuOpen]);

  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 68;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setIsMenuOpen(false);
    setMobileDropOpen(false);
  };

  const preDropdownLinks = [
    ...(isHome ? [] : [{ label: 'Home', href: '/' }]),
    { label: 'Services', href: '/services' },
  ];

  const postDropdownLinks = [
    { label: 'Case Studies', href: '/case-studies' },
    { label: 'Insights', href: '/insights' },
    { label: 'AI Readiness', href: '/ai-readiness-assessment' },
    { label: 'Careers', href: '/careers' },
  ];

  const renderAnchorLink = (link: AnchorItem) => {
    if (isHome) {
      return (
        <a
          key={link.id}
          href={`#${link.id}`}
          onClick={(e) => { e.preventDefault(); scrollTo(`#${link.id}`); }}
          className="block px-6 py-[9px] text-sm font-medium text-[#5f6368] transition hover:text-[#4584ed] dark:text-white/65 dark:hover:text-[#4584ed] no-underline"
        >
          {link.label}
        </a>
      );
    }
    return (
      <Link
        key={link.id}
        href={`/#${link.id}`}
        onClick={() => { setIsMenuOpen(false); setMobileDropOpen(false); }}
        className="block px-6 py-[9px] text-sm font-medium text-[#5f6368] transition hover:text-[#4584ed] dark:text-white/65 dark:hover:text-[#4584ed] no-underline"
      >
        {link.label}
      </Link>
    );
  };

  return (
    <>
      <nav
        id="mainNav"
        className={`fixed left-0 right-0 top-0 z-[9999] border-b bg-white transition-shadow dark:bg-[#0b1020] dark:border-white/10 ${isScrolled ? 'shadow-[0_1px_4px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)]' : 'shadow-none'}`}
        style={{ transition: 'box-shadow 0.3s' }}
      >
        <div className="mx-auto flex h-[68px] max-w-[1400px] items-center justify-between px-5">
          <Link href="/" aria-label="Home">
            <Image src="https://res.cloudinary.com/daqmbfctv/image/upload/v1772108889/WhatsApp_Image_2026-02-26_at_12.00.40-removebg-preview_qp8kjd.png" alt="TechSpecialist" className="block h-10 w-auto" width={40} height={40} />
          </Link>

          <div className="desktop-nav hidden lg:flex items-center gap-6">
            {preDropdownLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[13.5px] font-medium tracking-[0.01em] text-[#5f6368] dark:text-white/65 no-underline whitespace-nowrap transition hover:text-[#4584ed] dark:hover:text-[#4584ed]"
              >
                {link.label}
              </Link>
            ))}

            {/* Desktop dropdown */}
            <div className="relative group">
              <span className="inline-flex items-center gap-1 text-[13.5px] font-medium tracking-[0.01em] text-[#5f6368] dark:text-white/65 whitespace-nowrap cursor-default">
                The Pain Points
                <svg className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </span>
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="w-44 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-white/10 dark:bg-[#101827]">
                  {isHome ? (
                    dropdownLinks.map((link) => (
                      <a
                        key={link.id}
                        href={`#${link.id}`}
                        onClick={(e) => { e.preventDefault(); scrollTo(`#${link.id}`); }}
                        className="block rounded-lg px-4 py-2.5 text-sm font-medium text-[#5f6368] transition hover:bg-gray-50 hover:text-[#4584ed] dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-[#4584ed] no-underline"
                      >
                        {link.label}
                      </a>
                    ))
                  ) : (
                    dropdownLinks.map((link) => (
                      <Link
                        key={link.id}
                        href={`/#${link.id}`}
                        className="block rounded-lg px-4 py-2.5 text-sm font-medium text-[#5f6368] transition hover:bg-gray-50 hover:text-[#4584ed] dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-[#4584ed] no-underline"
                      >
                        {link.label}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>

            {postDropdownLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[13.5px] font-medium tracking-[0.01em] text-[#5f6368] dark:text-white/65 no-underline whitespace-nowrap transition hover:text-[#4584ed] dark:hover:text-[#4584ed]"
              >
                {link.label}
              </Link>
            ))}

            <div className="ml-2 flex items-center gap-[6px]">
              <button type="button" onClick={(e) => { e.stopPropagation(); toggleTheme(); }} className="icon-btn" aria-label="Toggle theme">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="block dark:hidden">
                  <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hidden dark:block">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              </button>
              <a href="https://www.linkedin.com/company/techspecialist-limited/posts/?feedView=all" target="_blank" rel="noopener" className="icon-btn" aria-label="LinkedIn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="https://x.com/Tclafrica" target="_blank" rel="noopener" className="icon-btn" aria-label="X (Twitter)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="mailto:info@techspecialistlimited.com" className="icon-btn" aria-label="Email">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </a>
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            id="navHamburger"
            className="lg:hidden flex flex-col items-center justify-center gap-[5px] bg-transparent border-none cursor-pointer p-2 relative z-[1000] min-w-[44px] min-h-[44px]"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Menu"
            aria-expanded={isMenuOpen}
          >
            <span className={`ham-line ${isMenuOpen ? 'open-1' : ''}`}></span>
            <span className={`ham-line ${isMenuOpen ? 'open-2' : ''}`}></span>
            <span className={`ham-line ${isMenuOpen ? 'open-3' : ''}`}></span>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        id="mobileMenu"
        className={`fixed left-0 right-0 top-[68px] z-[9998] flex-col overflow-y-auto border-b bg-white pb-4 pt-3 shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:bg-[#0b1020] dark:border-white/10 ${
          isMenuOpen ? 'flex' : 'hidden'
        } max-h-[calc(100vh-68px)]`}
      >
        {preDropdownLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            onClick={() => setIsMenuOpen(false)}
            className="block px-6 py-[11px] text-sm font-medium text-[#5f6368] dark:text-white/65 no-underline"
          >
            {link.label}
          </Link>
        ))}

        {/* Mobile dropdown trigger */}
        <div>
          <button
            onClick={() => setMobileDropOpen((prev) => !prev)}
            className="flex w-full items-center justify-between px-6 py-[11px] text-sm font-medium text-[#5f6368] dark:text-white/65 no-underline"
          >
            The Pain Points
            <svg
              className={`h-3.5 w-3.5 transition-transform ${mobileDropOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {mobileDropOpen && (
            <div className="border-l-2 border-[#4584ed]/30 ml-8 mb-2">
              {dropdownLinks.map((link) => {
                if (isHome) {
                  return (
                    <a
                      key={link.id}
                      href={`#${link.id}`}
                      onClick={(e) => { e.preventDefault(); scrollTo(`#${link.id}`); }}
                      className="block px-6 py-[9px] text-sm font-medium text-[#5f6368] transition hover:text-[#4584ed] dark:text-white/65 dark:hover:text-[#4584ed] no-underline"
                    >
                      {link.label}
                    </a>
                  );
                }
                return (
                  <Link
                    key={link.id}
                    href={`/#${link.id}`}
                    onClick={() => { setIsMenuOpen(false); setMobileDropOpen(false); }}
                    className="block px-6 py-[9px] text-sm font-medium text-[#5f6368] transition hover:text-[#4584ed] dark:text-white/65 dark:hover:text-[#4584ed] no-underline"
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {postDropdownLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            onClick={() => setIsMenuOpen(false)}
            className="block px-6 py-[11px] text-sm font-medium text-[#5f6368] dark:text-white/65 no-underline"
          >
            {link.label}
          </Link>
        ))}

        <div className="mt-2 flex items-center gap-2 px-6">
          <button type="button" onClick={(e) => { e.stopPropagation(); toggleTheme(); }} className="icon-btn" aria-label="Toggle theme">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="block dark:hidden">
              <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hidden dark:block">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>
          <a href="https://www.linkedin.com/company/techspecialist-limited/posts/?feedView=all" target="_blank" rel="noopener" className="icon-btn" aria-label="LinkedIn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
          <a href="https://x.com/Tclafrica" target="_blank" rel="noopener" className="icon-btn" aria-label="X (Twitter)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="mailto:info@techspecialistlimited.com" className="icon-btn" aria-label="Email">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </a>
        </div>
      </div>
    </>
  );
}
