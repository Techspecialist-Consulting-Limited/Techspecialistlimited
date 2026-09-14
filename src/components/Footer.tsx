import Link from 'next/link';
import Image from 'next/image';
import {
  CalendarDaysIcon,
  CheckBadgeIcon,
  CogIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function Footer() {
  return (
    <footer className="bg-[#080e1e] text-white py-12 sm:py-16 px-4 sm:px-8">
      <div className="footer-top max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="footer-brand">
          <div className="footer-logo mb-4">
            <Image src="https://res.cloudinary.com/daqmbfctv/image/upload/v1772108889/WhatsApp_Image_2026-02-26_at_12.00.40-removebg-preview_qp8kjd.png" alt="TechSpecialist" className="h-10 w-auto" width={40} height={40} />
          </div>
          <div className="footer-tagline text-sm text-white/60 mb-4">Automate the Work, Empower your Workforce</div>
          <div className="footer-social flex items-center gap-4">
            <a href="https://www.linkedin.com/company/techspecialist-limited/posts/?feedView=all" target="_blank" rel="noopener" aria-label="LinkedIn" className="flex h-4 w-4 items-center justify-center text-white/60 hover:text-white transition">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.446-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            </a>
            <a href="https://x.com/Tclafrica" target="_blank" rel="noopener" aria-label="X (Twitter)" className="flex h-4 w-4 items-center justify-center text-white/60 hover:text-white transition">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
            <a href="mailto:info@techspecialistlimited.com" aria-label="Email" className="flex h-4 w-4 items-center justify-center text-white/60 hover:text-white transition"><EnvelopeIcon className="h-full w-full" aria-hidden="true" /></a>
          </div>
        </div>

        <div className="footer-col">
          <div className="footer-col-title text-sm font-bold uppercase tracking-[0.1em] text-white/80 mb-4">What We Do</div>
          <a href="#how" className="block text-sm text-white/60 hover:text-white mb-2">How We Work</a>
          <Link href="/insights" className="block text-sm text-white/60 hover:text-white mb-2">Insights</Link>
          <a href="#cases" className="block text-sm text-white/60 hover:text-white mb-2">Government MDAs</a>
          <a href="#cases" className="block text-sm text-white/60 hover:text-white mb-2">International NGOs</a>
          <a href="#cases" className="block text-sm text-white/60 hover:text-white mb-2">Private Sector</a>
          <a href="#discovery" className="block text-sm text-white/60 hover:text-white">Book Discovery Call</a>
        </div>

        <div className="footer-col">
          <div className="footer-col-title text-sm font-bold uppercase tracking-[0.1em] text-white/80 mb-4">Solutions</div>
          <a href="#how" className="block text-sm text-white/60 hover:text-white mb-2">Agentic Operations</a>
          <a href="#how" className="block text-sm text-white/60 hover:text-white mb-2">Executive Intelligence</a>
          <a href="#how" className="block text-sm text-white/60 hover:text-white mb-2">Managed Service</a>
          <a href="#problem" className="block text-sm text-white/60 hover:text-white mb-2">The Execution Gap</a>
          <a href="#client-voices" className="block text-sm text-white/60 hover:text-white">Client Results</a>
        </div>

        <div className="footer-col">
          <div className="footer-col-title text-sm font-bold uppercase tracking-[0.1em] text-white/80 mb-4">Get in Touch</div>
          <a href="https://maps.google.com/?q=2+Harare+Street+Wuse+Zone+6+Abuja" target="_blank" rel="noopener" className="footer-contact-item flex items-center gap-2 text-sm text-white/60 hover:text-white mb-3">
            <span className="footer-contact-icon"><MapPinIcon className="h-4 w-4" aria-hidden="true" /></span><span>2 Harare St, Wuse Zone 6, Abuja, F.C.T.</span>
          </a>
          <a href="mailto:info@techspecialistlimited.com" className="footer-contact-item flex items-center gap-2 text-sm text-white/60 hover:text-white mb-3">
            <span className="footer-contact-icon"><EnvelopeIcon className="h-4 w-4" aria-hidden="true" /></span><span>info@techspecialistlimited.com</span>
          </a>
          <a href="tel:+23409291144" className="footer-contact-item flex items-center gap-2 text-sm text-white/60 hover:text-white mb-3">
            <span className="footer-contact-icon"><PhoneIcon className="h-4 w-4" aria-hidden="true" /></span><span>+234 0929 11443</span>
          </a>
          <a href="#discovery" className="footer-contact-item flex items-center gap-2 text-sm text-white/60 hover:text-white">
            <span className="footer-contact-icon"><CalendarDaysIcon className="h-4 w-4" aria-hidden="true" /></span><span>Book a Discovery Call</span>
          </a>
        </div>
      </div>

      <div className="footer-badge-row max-w-6xl mx-auto px-16 flex flex-wrap gap-4 py-6 border-t border-white/10">
        {[
          { icon: CheckBadgeIcon, text: 'Microsoft Solutions Partner' },
          { icon: ShieldCheckIcon, text: 'ISO 27001 Compliant' },
          { icon: CogIcon, text: 'Azure Certified Team' },
          { icon: GlobeAltIcon, text: 'Pan-African Operations' }
        ].map((badge, i) => (
          <div key={i} className="footer-badge flex items-center gap-2 text-xs text-white/60"><badge.icon className="h-4 w-4" aria-hidden="true" /> {badge.text}</div>
        ))}
      </div>

      <div className="footer-bottom max-w-6xl mx-auto px-16 flex flex-col sm:flex-row gap-4 justify-between text-xs text-white/40 pt-6 border-t border-white/10">
        <div>© 2026 TechSpecialist Ltd. All rights reserved. Abuja, Nigeria.</div>
        <div>A subsidiary of <a href="https://mswitchgroup.com/" target="_blank" rel="noopener" className="text-white/60 hover:text-white">Mswitch Group</a></div>
        <div><Link href="/privacy" className="hover:text-white">Privacy</Link> · <Link href="/terms" className="hover:text-white">Terms</Link> · Built on Microsoft · Made in Nigeria</div>
      </div>
    </footer>
  );
}
