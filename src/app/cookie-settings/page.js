import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import CookieSettings from "../../components/CookieSettings";

export const metadata = {
  title: 'Cookie Settings | Booldo',
  description: 'Manage your cookie preferences and privacy settings.',
  robots: 'noindex, follow'
};

export default function CookieSettingsPage() {
  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <Navbar />
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex-1 py-8">
        <CookieSettings />
      </main>
      <Footer />
    </div>
  );
}
