import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export const metadata = {
  title: 'Privacy Policy | Booldo',
  description: 'Learn about how Booldo collects, uses, and protects your personal information.',
  robots: 'index, follow'
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <Navbar />
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex-1 py-8">
        <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 font-['General_Sans']">Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none font-['General_Sans']">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              <p className="text-gray-700 mb-4">
                We collect information you provide directly to us, such as when you visit our website, 
                interact with our content, or contact us for support.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Usage data and analytics information</li>
                <li>Device and browser information</li>
                <li>IP address and location data</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. How We Use Cookies</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Improve your browsing experience</li>
                <li>Analyze website traffic and usage patterns</li>
                <li>Personalize content and advertisements</li>
                <li>Remember your preferences and settings</li>
              </ul>
              <p className="text-gray-700 mt-4">
                You can control cookie settings through your browser or by using our cookie banner 
                when you first visit our site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Provide and improve our services</li>
                <li>Analyze usage patterns and optimize user experience</li>
                <li>Send you relevant information about betting offers</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Information Sharing</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties 
                without your consent, except as described in this policy or as required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate security measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
              <p className="text-gray-700 mb-4">
                Depending on your location, you may have certain rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Right to access your personal data</li>
                <li>Right to correct inaccurate information</li>
                <li>Right to delete your personal data</li>
                <li>Right to restrict processing</li>
                <li>Right to withdraw consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Cookie Management</h2>
              <p className="text-gray-700 mb-4">
                You can manage your cookie preferences at any time by:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Using the cookie settings link in our website footer</li>
                <li>Adjusting your browser settings to block or delete cookies</li>
                <li>Opting out of analytics tracking</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or our data practices, 
                please contact us at:
              </p>
              <p className="text-gray-700">
                Email: privacy@booldo.com<br />
                Address: [Your Company Address]
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any 
                changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
