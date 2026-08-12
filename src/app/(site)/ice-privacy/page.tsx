import Link from 'next/link';

export const metadata = {
  title: 'ICE Privacy Policy — TechSpecialist',
  description: 'Privacy Policy for ICE (In Case of Emergency) — an emergency incident reporting application developed by Tech Specialist Limited for NSIA.',
};

export default function IcePrivacyPage() {
  return (
    <div className="bg-white dark:bg-[#080e1e] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <div className="mb-12">
          <Link href="/" className="text-sm text-[#4584ed] hover:underline">&larr; Back to Home</Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy for ICE (In Case of Emergency)</h1>
        <p className="text-gray-500 dark:text-white/40 text-sm mb-10">Effective Date: 2026-06-10</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-white/70 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Introduction</h2>
            <p>
              ICE (In Case of Emergency) is an emergency incident reporting and rapid response application developed by
              Tech Specialist Limited for the Nigeria Sovereign Investment Authority (NSIA).
            </p>
            <p>
              This Privacy Policy explains how information is collected, used, disclosed, and protected when users access
              and use the ICE mobile application.
            </p>
            <p>
              By using ICE, users acknowledge and agree to the collection and use of information in accordance with this
              Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Information We Collect</h2>
            <p>ICE may collect the following categories of information:</p>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">Personal Information</h3>
            <p>Depending on the user&rsquo;s role and account configuration, ICE may collect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Full Name</li>
              <li>Phone Number</li>
              <li>Email Address</li>
              <li>User Identification Information</li>
              <li>Agency or Organization Information</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">Location Information</h3>
            <p>
              ICE collects precise device location information when permission is granted by the user. Location
              information is essential to the operation of the application and is used to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Identify the user&rsquo;s location during emergencies</li>
              <li>Facilitate rapid emergency response services</li>
              <li>Support emergency dispatch operations</li>
              <li>Enable responders to provide accurate and timely assistance</li>
              <li>Improve coordination between emergency response agencies</li>
              <li>Support incident reporting and management</li>
            </ul>
            <p>
              Location information may be collected when users submit emergency incidents or utilize location-based
              emergency services within the application. Failure to provide location access may limit the
              application&rsquo;s ability to provide emergency assistance effectively.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">Incident Information</h3>
            <p>Users may submit information relating to emergency incidents, including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Incident type</li>
              <li>Incident description</li>
              <li>Incident location</li>
              <li>Supporting information provided by the user</li>
              <li>Incident status updates</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">Device and Technical Information</h3>
            <p>ICE may automatically collect certain technical information including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Device type</li>
              <li>Operating system version</li>
              <li>Application version</li>
              <li>Device identifiers</li>
              <li>Diagnostic information</li>
              <li>Error logs and crash reports</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">How We Use Information</h2>
            <p>Information collected through ICE may be used to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Authenticate and authorize users</li>
              <li>Manage user accounts and access permissions</li>
              <li>Process emergency incident reports</li>
              <li>Facilitate emergency response coordination</li>
              <li>Provide location-based emergency assistance</li>
              <li>Improve application performance and reliability</li>
              <li>Detect, prevent, and investigate security incidents</li>
              <li>Maintain operational records and audit trails</li>
              <li>Comply with legal and regulatory obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Information Sharing</h2>
            <p>Information collected through ICE may be shared with:</p>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">Authorized Emergency Response Agencies</h3>
            <p>
              Information may be shared with emergency response agencies, first responders, and authorized personnel
              responsible for managing and responding to incidents.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">Government Authorities</h3>
            <p>
              Information may be shared with relevant government agencies where required for emergency response
              operations, public safety activities, or compliance with applicable laws.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">Service Providers</h3>
            <p>
              ICE may utilize trusted third-party service providers to support hosting, infrastructure, authentication,
              notifications, analytics, and other operational functions.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">Legal Requirements</h3>
            <p>
              Information may be disclosed where required by law, court order, legal process, regulatory authority, or
              government directive.
            </p>
            <p className="font-medium">ICE does not sell personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Data Security</h2>
            <p>
              ICE implements reasonable administrative, technical, and organizational safeguards designed to protect
              information against unauthorized access, disclosure, alteration, or destruction.
            </p>
            <p>
              While every effort is made to secure information, no electronic transmission or storage system can be
              guaranteed to be completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Data Retention</h2>
            <p>Information is retained only for as long as necessary to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide emergency response services</li>
              <li>Maintain operational functionality</li>
              <li>Support public safety activities</li>
              <li>Comply with legal and regulatory obligations</li>
              <li>Maintain audit and security records</li>
            </ul>
            <p>
              Certain records may be retained for extended periods where required by law, security requirements,
              emergency response obligations, or public safety considerations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">User Rights</h2>
            <p>Users may request:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access to personal information</li>
              <li>Correction of inaccurate information</li>
              <li>Deletion of eligible personal information</li>
              <li>Information regarding how their personal data is processed</li>
            </ul>
            <p>
              Requests may be submitted using the contact information provided below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Account Deletion</h2>
            <p>
              ICE user accounts are provisioned and managed by authorized administrators. Users who wish to request
              account deletion may submit a request by contacting:
            </p>
            <div className="mt-3 p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg border border-gray-200 dark:border-white/10">
              <p><strong>Email:</strong> <a href="mailto:mikek@techspecialistlimited.com" className="text-[#4584ed] hover:underline">mikek@techspecialistlimited.com</a></p>
              <p><strong>Subject:</strong> ICE Account Deletion Request</p>
            </div>
            <p>
              Requests will be reviewed and processed in accordance with applicable operational, legal, and security
              requirements. Some information may be retained where required for emergency response coordination, legal
              compliance, security investigations, audit requirements, or public safety obligations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Children&rsquo;s Privacy</h2>
            <p>
              ICE is not intended for use by children without appropriate authorization and supervision. The application
              is designed primarily for authorized users and individuals participating in emergency response and incident
              reporting activities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Third-Party Services</h2>
            <p>
              ICE may integrate with trusted third-party services to support application functionality, including:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Authentication services</li>
              <li>Cloud infrastructure providers</li>
              <li>Notification services</li>
              <li>Analytics and monitoring tools</li>
              <li>Emergency response support systems</li>
            </ul>
            <p>
              These providers are expected to implement appropriate privacy and security safeguards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Changes to This Privacy Policy</h2>
            <p>
              This Privacy Policy may be updated periodically to reflect changes in operational requirements, legal
              obligations, or application functionality. Updated versions will become effective upon publication. Users
              are encouraged to review this Privacy Policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h2>
            <p>
              For questions regarding this Privacy Policy, personal data, account deletion, or privacy-related matters,
              please contact:
            </p>
            <div className="mt-3 p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg border border-gray-200 dark:border-white/10">
              <p><strong>Tech Specialist Limited</strong></p>
              <p>Email: <a href="mailto:mikek@techspecialistlimited.com" className="text-[#4584ed] hover:underline">mikek@techspecialistlimited.com</a></p>
              <p className="mt-2 text-sm text-gray-500 dark:text-white/40">Application: ICE (In Case of Emergency)</p>
              <p className="text-sm text-gray-500 dark:text-white/40">Developed by Tech Specialist Limited for the Nigeria Sovereign Investment Authority (NSIA).</p>
            </div>
            <p className="text-sm text-gray-500 dark:text-white/40">Last Updated: 2026-06-13</p>
          </section>

        </div>
      </div>
    </div>
  );
}
