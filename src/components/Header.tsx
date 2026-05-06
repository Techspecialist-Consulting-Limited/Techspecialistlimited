'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const menu = document.getElementById('mobileMenu');
      const hamburger = document.getElementById('navHamburger');
      if (menu && menu.contains(target)) return;
      if (hamburger && hamburger.contains(target)) return;
      setIsMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isMenuOpen]);

  const smoothScroll = (id: string) => {
    const el = document.querySelector(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 68;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const navLinks = [
    { label: 'The Pain Points', href: '#problem' },
    { label: 'Services', href: '/services' },
    { label: 'Careers', href: '/careers' },
    { label: 'How We Work', href: '#how' },
    { label: 'Use Cases', href: '#cases' },
    { label: 'Our Team', href: '#our-team' },
  ];

  const isExternal = (href: string) => href.startsWith('/');

  const textColor = theme === 'dark' ? 'rgba(255,255,255,0.65)' : '#5f6368';
  const borderColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
  const bgColor = theme === 'dark' ? '#0b1020' : '#fff';
  const spanBg = theme === 'dark' ? '#fff' : '#2f2f2f';
  const hamburgerTransform = isMenuOpen
    ? [{ transform: 'translateY(7px) rotate(45deg)' }, { opacity: 0 }, { transform: 'translateY(-7px) rotate(-45deg)' }]
    : [{ transform: 'none' }, { opacity: 1 }, { transform: 'none' }];

  return (
    <>
      <nav
        id="mainNav"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: bgColor, borderBottom: `1px solid ${borderColor}`, transition: 'box-shadow 0.3s', boxShadow: isScrolled ? '0 1px 4px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)' : 'none' }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
          <Link href="/" aria-label="Home">
            <img src="https://res.cloudinary.com/daqmbfctv/image/upload/v1772108889/WhatsApp_Image_2026-02-26_at_12.00.40-removebg-preview_qp8kjd.png" alt="TechSpecialist" style={{ display: 'block', height: '40px', width: 'auto' }} />
          </Link>

          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {navLinks.map((link) =>
              isExternal(link.href) ? (
                <Link key={link.label} href={link.href} style={{ color: textColor, fontSize: '13.5px', fontWeight: 500, textDecoration: 'none', letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>{link.label}</Link>
              ) : (
                <a key={link.label} href={link.href} onClick={(e) => { e.preventDefault(); smoothScroll(link.href); }} style={{ color: textColor, fontSize: '13.5px', fontWeight: 500, textDecoration: 'none', letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>{link.label}</a>
              )
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
              <button onClick={toggleTheme} style={iconStyle(textColor, borderColor)} aria-label="Toggle theme">{theme === 'light' ? '☀️' : '🌙'}</button>
              <a href="https://www.linkedin.com/company/techspecialist-limited/posts/?feedView=all" target="_blank" rel="noopener" style={iconStyle(textColor, borderColor)}>in</a>
              <a href="https://x.com/Tclafrica" target="_blank" rel="noopener" style={iconStyle(textColor, borderColor)}>𝕏</a>
              <a href="mailto:info@techspecialistlimited.com" style={iconStyle(textColor, borderColor)}>✉</a>
            </div>
          </div>

          <button
            id="navHamburger"
            className="hamburger-btn"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Menu"
            aria-expanded={isMenuOpen}
            style={{ flexDirection: 'column', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', position: 'relative', zIndex: 102 }}
          >
            <span style={{ display: 'block', width: '24px', height: '2px', background: spanBg, borderRadius: '2px', transition: 'all 0.2s ease', ...hamburgerTransform[0] }}></span>
            <span style={{ display: 'block', width: '24px', height: '2px', background: spanBg, borderRadius: '2px', transition: 'all 0.2s ease', ...hamburgerTransform[1] }}></span>
            <span style={{ display: 'block', width: '24px', height: '2px', background: spanBg, borderRadius: '2px', transition: 'all 0.2s ease', ...hamburgerTransform[2] }}></span>
          </button>
        </div>
      </nav>

      <div
        id="mobileMenu"
        style={{ position: 'fixed', top: '68px', left: 0, right: 0, zIndex: 101, display: isMenuOpen ? 'flex' : 'none', flexDirection: 'column', background: bgColor, borderBottom: `1px solid ${borderColor}`, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', overflowY: 'auto', maxHeight: 'calc(100vh - 68px)', paddingTop: '12px', paddingBottom: '16px' }}
      >
        {navLinks.map((link) =>
          isExternal(link.href) ? (
            <Link key={link.label} href={link.href} onClick={() => setIsMenuOpen(false)} style={{ padding: '11px 24px', fontSize: '14px', fontWeight: 500, color: textColor, textDecoration: 'none', display: 'block' }}>{link.label}</Link>
          ) : (
            <a key={link.label} href={link.href} onClick={(e) => { e.preventDefault(); smoothScroll(link.href); }} style={{ padding: '11px 24px', fontSize: '14px', fontWeight: 500, color: textColor, textDecoration: 'none', display: 'block' }}>{link.label}</a>
          )
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', padding: '0 24px' }}>
          <button onClick={toggleTheme} style={iconStyle(textColor, borderColor)}>{theme === 'light' ? '☀️' : '🌙'}</button>
          <a href="https://www.linkedin.com/company/techspecialist-limited/posts/?feedView=all" target="_blank" rel="noopener" style={iconStyle(textColor, borderColor)}>in</a>
          <a href="https://x.com/Tclafrica" target="_blank" rel="noopener" style={iconStyle(textColor, borderColor)}>𝕏</a>
          <a href="mailto:info@techspecialistlimited.com" style={iconStyle(textColor, borderColor)}>✉</a>
        </div>
      </div>
    </>
  );
}

function iconStyle(color: string, border: string) {
  return { width: '34px', height: '34px', borderRadius: '8px', border: `1.5px solid ${border}`, background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color, display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const, textDecoration: 'none' as const };
}
