"use client";

import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { client } from "../../../sanity/lib/client";
import ExpiredOfferPage from "../[...filters]/ExpiredOfferPage";
import Image from "next/image";
import { useEffect, useState } from "react";

// Data fetching function for client component
async function getContactData(countrySlug) {
  try {
      // First get the country name from the slug
      const countryData = await client.fetch(`*[_type == "countryPage" && slug.current == $countrySlug][0]{ country }`, { countrySlug });
      
      if (!countryData) {
        return null;
      }
      
      const doc = await client.fetch(`*[_type == "contact" && country == $countryName][0]{
        title,
        subtitle,
        email,
        // SEO fields (optional)
        metaTitle,
        metaDescription,
        noindex,
        nofollow,
        canonicalUrl,
        sitemapInclude
      }`, { countryName: countryData.country });
    
    return doc;
  } catch (error) {
    console.error('Error fetching contact data:', error);
    return null;
  }
}

// Main Contact page component
export default function CountryContactPage({ params }) {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const awaitedParams = await params;
      const data = await getContactData(awaitedParams.slug);
      setContact(data);
      setLoading(false);
    }
    fetchData();
  }, [params]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Check if the Contact page is hidden
  if (contact && (contact.noindex === true || contact.sitemapInclude === false)) {
    return (
      <ExpiredOfferPage 
        isHidden={true}
        contentType="contact page"
        embedded={false}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc]">
      <Navbar />
      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-10">
        {/* Breadcrumb-like back to Home, styled like offer details */}
        <div className="max-w-xl mx-auto mb-4 sm:mb-6 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          <button onClick={() => window.history.back()} className="hover:underline flex items-center gap-1 flex-shrink-0 focus:outline-none" aria-label="Go back">
            <Image src="/assets/back-arrow.png" alt="Back" width={24} height={24} />
            Home
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-lg max-w-xl mx-auto w-full p-6 sm:p-8 flex flex-col items-center border border-gray-100">
          {/* Static contact icon */}
          <div className="mb-4">
            <svg width="56" height="56" fill="none" viewBox="0 0 56 56">
              <rect width="56" height="56" rx="16" fill="#e6f4ea" />
              <path d="M14 20l14 10 14-10" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="14" y="20" width="28" height="16" rx="2" stroke="#15803d" strokeWidth="2"/>
            </svg>
          </div>
          
          {/* Static content - prerendered */}
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center text-green-800 font-['General_Sans']">
            {contact?.title || 'Contact Us'}
          </h1>
          <p className="mb-6 text-gray-600 text-center text-base sm:text-lg font-['General_Sans']">
            {contact?.subtitle || `We'd love to hear from you! For questions, suggestions, or partnership inquiries, reach out anytime:`}
          </p>
          
          {/* Static email link */}
          <a
            href={`mailto:${contact?.email || 'info@booldo.com'}`}
            className="text-green-700 text-lg sm:text-xl font-semibold underline hover:text-green-900 transition font-['General_Sans']"
          >
            {contact?.email || 'info@booldo.com'}
          </a>
          
          {/* Static note */}
          <div className="mt-8 text-gray-400 text-sm text-center font-['General_Sans']">
            {contact?.note || (
              <>
                We aim to respond to all emails within 24 hours.<br />Thank you for connecting with Booldo!
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
