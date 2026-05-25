import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-[#080e1e] text-white py-12 sm:py-16 px-4 sm:px-8">
      <div className="footer-top max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="footer-brand">
          <div className="footer-logo mb-4">
            <Image src="https://res.cloudinary.com/daqmbfctv/image/upload/v1772108889/WhatsApp_Image_2026-02-26_at_12.00.40-removebg-preview_qp8kjd.png" alt="TechSpecialist" className="h-10 w-auto" width={40} height={40} />
          </div>
          <div className="footer-tagline text-sm text-white/60 mb-4">Automate the Work, Empower your Workforce</div>
          <div className="footer-social flex gap-4">
            <a href="https://www.linkedin.com/company/techspecialist-limited/posts/?feedView=all" target="_blank" rel="noopener" className="text-white/60 hover:text-white transition">in</a>
            <a href="https://x.com/Tclafrica" target="_blank" rel="noopener" className="text-white/60 hover:text-white transition">𝕏</a>
            <a href="mailto:info@techspecialistlimited.com" className="text-white/60 hover:text-white transition">✉</a>
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
            <span className="footer-contact-icon">📍</span><span>2 Harare St, Wuse Zone 6, Abuja, F.C.T.</span>
          </a>
          <a href="mailto:info@techspecialistlimited.com" className="footer-contact-item flex items-center gap-2 text-sm text-white/60 hover:text-white mb-3">
            <span className="footer-contact-icon">✉️</span><span>info@techspecialistlimited.com</span>
          </a>
          <a href="tel:+23409291144" className="footer-contact-item flex items-center gap-2 text-sm text-white/60 hover:text-white mb-3">
            <span className="footer-contact-icon">📞</span><span>+234 0929 11443</span>
          </a>
          <a href="#discovery" className="footer-contact-item flex items-center gap-2 text-sm text-white/60 hover:text-white">
            <span className="footer-contact-icon">📅</span><span>Book a Discovery Call</span>
          </a>
        </div>
      </div>

      <div className="footer-badge-row max-w-6xl mx-auto px-16 flex flex-wrap gap-4 py-6 border-t border-white/10">
        {[
          { icon: '🔵', text: 'Microsoft Solutions Partner' },
          { icon: '⚡️', text: 'ISO 27001 Compliant' },
          { icon: '⚙', text: 'Azure Certified Team' },
          { icon: '🌍', text: 'Pan-African Operations' }
        ].map((badge, i) => (
          <div key={i} className="footer-badge flex items-center gap-2 text-xs text-white/60"><span>{badge.icon}</span> {badge.text}</div>
        ))}
      </div>

      <div className="footer-bottom max-w-6xl mx-auto px-16 flex flex-col sm:flex-row gap-4 justify-between text-xs text-white/40 pt-6 border-t border-white/10">
        <div>© 2026 TechSpecialist Ltd. All rights reserved. Abuja, Nigeria.</div>
        <div>A subsidiary of <a href="https://mswitchgroup.com/" target="_blank" rel="noopener" className="text-white/60 hover:text-white">Mswitch Group</a></div>
        <div><a href="#" className="hover:text-white">Privacy</a> · <a href="#" className="hover:text-white">Terms</a> · Built on Microsoft · Made in Nigeria 🇳🇬</div>
      </div>
    </footer>
  );
}
