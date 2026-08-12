import Link from 'next/link';

export const metadata = {
  title: 'ICE Account and Data Deletion — TechSpecialist',
  description: 'Request account and data deletion for ICE (In Case of Emergency) — an emergency incident reporting application developed by Tech Specialist Limited for NSIA.',
};

export default function IceAccountDeletionPage() {
  return (
    <div className="bg-white dark:bg-[#080e1e] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <div className="mb-12">
          <Link href="/" className="text-sm text-[#4584ed] hover:underline">&larr; Back to Home</Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">ICE Account and Data Deletion</h1>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-white/70 leading-relaxed">
          <section>
            <p>
              ICE (In Case of Emergency) is an emergency incident reporting and rapid response application developed by
              Tech Specialist Limited for the Nigeria Sovereign Investment Authority (NSIA).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Account Management</h2>
            <p>
              User accounts within ICE are provisioned and managed by authorized administrators. Users cannot create
              accounts directly within the application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Requesting Account Deletion</h2>
            <p>
              If you would like your account and associated personal information removed from the ICE platform, please
              contact the system administrator or submit a request by email.
            </p>
            <div className="mt-3 p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg border border-gray-200 dark:border-white/10">
              <p><strong>Email:</strong> <a href="mailto:mikek@techspecialistlimited.com" className="text-[#4584ed] hover:underline">mikek@techspecialistlimited.com</a></p>
              <p><strong>Subject:</strong> ICE Account Deletion Request</p>
            </div>
            <p className="mt-3 font-medium">Please include:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Full Name</li>
              <li>Registered Phone Number</li>
              <li>Registered Email Address (if applicable)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Data Deleted</h2>
            <p>Upon approval and verification of the request, the following information may be deleted:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>User account information</li>
              <li>Profile information</li>
              <li>Contact information</li>
              <li>Authentication records</li>
              <li>User preferences and settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Data Retention</h2>
            <p>Certain records may be retained where required for:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Emergency response operations</li>
              <li>Public safety requirements</li>
              <li>Security investigations</li>
              <li>Audit and compliance obligations</li>
              <li>Applicable legal and regulatory requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Processing Time</h2>
            <p>Deletion requests are generally processed within 30 days of verification.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h2>
            <p>For questions regarding account deletion or privacy matters:</p>
            <div className="mt-3 p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg border border-gray-200 dark:border-white/10">
              <p>Email: <a href="mailto:mikek@techspecialistlimited.com" className="text-[#4584ed] hover:underline">mikek@techspecialistlimited.com</a></p>
              <p className="mt-2 text-sm text-gray-500 dark:text-white/40">ICE (In Case of Emergency)</p>
              <p className="text-sm text-gray-500 dark:text-white/40">Developed by Tech Specialist Limited for the Nigeria Sovereign Investment Authority (NSIA).</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
