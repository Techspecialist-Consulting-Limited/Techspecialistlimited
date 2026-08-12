import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy Changelog — Techspecialist Consulting Limited',
  description: 'Revision history of the Techspecialist Consulting Limited privacy policy.',
};

export default function PrivacyChangelogPage() {
  return (
    <div className="bg-white dark:bg-[#080e1e] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <div className="mb-12">
          <Link href="/privacy" className="text-sm text-[#4584ed] hover:underline">&larr; Back to Privacy Policy</Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Privacy Policy Changelog</h1>
        <p className="text-gray-500 dark:text-white/40 text-sm mb-10">Revision history of the Techspecialist Consulting Limited privacy policy.</p>

        <div className="space-y-10 text-gray-700 dark:text-white/70 leading-relaxed">
          <div>
            <div className="flex items-baseline gap-3 mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">May 2026</h2>
              <span className="text-xs text-white bg-[#4584ed] px-2 py-0.5 rounded-full">Current</span>
            </div>
            <ul className="list-disc pl-6 space-y-1.5 text-sm">
              <li>Complete rewrite to align with the Nigeria Data Protection Act 2023 (NDPA)</li>
              <li>Registered as a Data Protection Compliance Organization (DPCO) with the NDPC</li>
              <li>Added AI-Derived Data definition and AI processing disclosures</li>
              <li>Added Data Breach Notification section (72-hour NDPC notification)</li>
              <li>Added Record of Processing Activities (RoPA) section</li>
              <li>Added comprehensive data retention schedule with legal bases</li>
              <li>Enhanced Data Subject Rights section with all NDPA-guaranteed rights</li>
              <li>Added International Data Transfer safeguards</li>
              <li>Updated registered office address to Goldlink House</li>
              <li>Enhanced cookie consent and tracking technologies disclosures</li>
              <li>Added Legitimate Interests Assessment (LIA) documentation</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Earlier versions</h2>
            <p className="text-sm text-gray-500 dark:text-white/50">Previous versions of this privacy policy are available upon request by contacting <a href="mailto:info@techspecialistlimited.com" className="text-[#4584ed] hover:underline">info@techspecialistlimited.com</a>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
