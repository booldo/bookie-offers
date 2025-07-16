"use client";
import HomeNavbar from "../../components/HomeNavbar";
import Footer from "../../components/Footer";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc]">
      <HomeNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-2xl shadow-lg max-w-xl w-full p-8 flex flex-col items-center border border-gray-100">
          <div className="mb-4">
            <svg width="56" height="56" fill="none" viewBox="0 0 56 56">
              <rect width="56" height="56" rx="16" fill="#e6f4ea" />
              <path d="M14 20l14 10 14-10" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="14" y="20" width="28" height="16" rx="2" stroke="#15803d" strokeWidth="2"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-center text-green-800">Contact Us</h1>
          <p className="mb-6 text-gray-600 text-center text-lg">We'd love to hear from you! For questions, suggestions, or partnership inquiries, reach out anytime:</p>
          <a
            href="mailto:info@booldo.com"
            className="text-green-700 text-xl font-semibold underline hover:text-green-900 transition"
          >
            info@booldo.com
          </a>
          <div className="mt-8 text-gray-400 text-sm text-center">
            We aim to respond to all emails within 24 hours.<br />Thank you for connecting with Booldo!
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 