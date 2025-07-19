"use client";
import HomeNavbar from "../../components/HomeNavbar";
import Footer from "../../components/Footer";
import { useState, useEffect } from "react";
import { client } from "../../sanity/lib/client";

export default function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    async function fetchFaqs() {
      try {
        const data = await client.fetch(`*[_type == "faq"] | order(_createdAt asc) { question, answer }`);
        setFaqs(data);
      } catch (err) {
        setFaqs([]);
      } finally {
        setLoading(false);
      }
    }
    fetchFaqs();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc]">
      <HomeNavbar />
      <main className="flex-1 max-w-4xl mx-auto py-12 px-4 w-full">
        <div className="flex items-center mb-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-gray-700 hover:text-black font-medium focus:outline-none group"
            aria-label="Go back"
          >
            <svg className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-base sm:text-lg font-semibold">FAQ</span>
          </button>
        </div>
        <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading FAQs...</div>
          ) : faqs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No FAQs found.</div>
          ) : faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm">
              <button
                className="w-full flex justify-between items-center px-4 py-4 text-left text-base font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black rounded-xl transition-colors duration-200 hover:bg-gray-50"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                aria-expanded={openIndex === idx}
              >
                <span className="font-sans text-lg sm:text-xl font-semibold text-gray-900">{faq.question}</span>
                <svg
                  className={`w-5 h-5 ml-2 transition-transform duration-300 ${openIndex === idx ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${openIndex === idx ? 'faq-dropdown-open' : 'faq-dropdown-closed'}`}
                style={{ maxHeight: openIndex === idx ? '500px' : '0px' }}
              >
                <div className="px-4 pb-4 text-gray-700 text-sm sm:text-base font-sans">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
} 