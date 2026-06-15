import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — TechSpecialist',
  description: 'Terms of Service for TechSpecialist Limited. Governing the use of our website and services.',
};

export default function TermsPage() {
  return (
    <div className="bg-white dark:bg-[#080e1e] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <div className="mb-12">
          <Link href="/" className="text-sm text-[#4584ed] hover:underline">&larr; Back to Home</Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Terms of Service</h1>
        <p className="text-gray-500 dark:text-white/40 text-sm mb-10">Last updated: June 2026</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-white/70 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the TechSpecialist Limited (&ldquo;TechSpecialist,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) website 
              and services, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, 
              you must not use our website or services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Description of Services</h2>
            <p>
              TechSpecialist provides digital transformation advisory, AI consulting, executive intelligence solutions, 
              and managed services. Our services are delivered based on specific engagement agreements and statements of work 
              executed separately from these general terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. Intellectual Property</h2>
            <p>
              All content on this website, including text, graphics, logos, images, software, and digital materials, 
              is the property of TechSpecialist Limited or its licensors and is protected by applicable intellectual 
              property laws. You may not reproduce, distribute, modify, or create derivative works without our prior 
              written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. Use of Website</h2>
            <p>You agree to use our website only for lawful purposes and in a manner that does not:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Violate any applicable Nigerian or international law or regulation.</li>
              <li>Infringe upon the rights of any third party.</li>
              <li>Transmit harmful code, viruses, or malware.</li>
              <li>Interfere with the proper functioning of the website.</li>
              <li>Attempt to gain unauthorised access to our systems.</li>
              <li>Engage in data scraping or mining without permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. User Submissions</h2>
            <p>
              Any information, feedback, or materials you submit to us through our website (including via contact forms, 
              consultation requests, or assessment tools) are considered non-confidential and non-proprietary, unless 
              otherwise agreed in writing. We may use such submissions for service improvement and business development 
              purposes, subject to our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, TechSpecialist Limited shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use 
              of our website or services. Our total liability for any claim shall not exceed the amount paid by you 
              for the specific service giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">7. Disclaimer of Warranties</h2>
            <p>
              Our website and services are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without any 
              warranties of any kind, either express or implied. We do not guarantee that the website will be 
              uninterrupted, secure, or error-free. We make no representations about the suitability, reliability, 
              or accuracy of the information presented on this website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">8. Third-Party Services</h2>
            <p>
              Our website may integrate with or reference third-party services, including Microsoft Azure, 
              Google Analytics, and other platforms. We are not responsible for the content, availability, or 
              practices of these third-party services. Your use of such services is governed by their respective terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">9. Governing Law</h2>
            <p>
              These Terms of Service shall be governed by and construed in accordance with the laws of the Federal 
              Republic of Nigeria. Any disputes arising from these terms shall be subject to the exclusive jurisdiction 
              of the courts of Abuja, F.C.T., Nigeria.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately 
              upon posting to this page. Your continued use of the website after any modifications indicates your 
              acceptance of the updated terms. We encourage you to review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">11. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to our website and services at any time, 
              without prior notice, for conduct that we believe violates these Terms of Service or is otherwise 
              harmful to our interests or those of other users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">12. Contact Us</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="mt-3 p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg border border-gray-200 dark:border-white/10">
              <p><strong>TechSpecialist Limited</strong></p>
              <p>2 Harare Street, Wuse Zone 6</p>
              <p>Abuja, F.C.T., Nigeria</p>
              <p className="mt-2">Email: <a href="mailto:info@techspecialistlimited.com" className="text-[#4584ed] hover:underline">info@techspecialistlimited.com</a></p>
              <p>Phone: <a href="tel:+23409291144" className="text-[#4584ed] hover:underline">+234 0929 11443</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
