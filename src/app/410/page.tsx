import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Link from "next/link";
import Image from "next/image";
import { headers } from 'next/headers';

// This function sets the HTTP status to 410
// Metadata is now handled in layout.tsx

export default async function Gone410Page({ searchParams }) {
  // Get search params for offer details
  const params = await searchParams;
  const offerType = params?.type || 'content';
  const slug = params?.slug;
  const countrySlug = params?.country;
  const isExpired = params?.expired === 'true';
  const isHidden = params?.hidden === 'true';

  // Set HTTP status to 410 via headers (this is handled by middleware)
  const headersList = headers();
  
  // Determine the appropriate message based on the content state
  const getMessage = () => {
    if (isHidden) {
      return {
        title: "Content No Longer Available",
        description: `This ${offerType} has been intentionally removed or hidden and is no longer accessible.`,
        buttonText: "Go Home",
        buttonLink: "/"
      };
    } else if (!slug) {
      return {
        title: "Content Does Not Exist",
        description: `The ${offerType} you're looking for doesn't exist or may have been removed. Please check the URL or browse our available content.`,
        buttonText: "Browse Available Content",
        buttonLink: `/${countrySlug || 'ng'}`
      };
    } else {
      return {
        title: "Content Has Expired",
        description: `This ${offerType} is no longer available. The promotion has ended and cannot be claimed.`,
        buttonText: "View Active Content",
        buttonLink: `/${countrySlug || 'ng'}`
      };
    }
  };

  const message = getMessage();

  return (
    <div className={`min-h-screen bg-[#fafbfc] flex flex-col`}>
      <Navbar />
      <main className="max-w-7xl mx-auto w-full px-4 flex-1">
        <div className="mt-6 mb-4 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          <Link href="/" className="hover:underline flex items-center gap-1 flex-shrink-0">
            <Image src="/assets/back-arrow.png" alt="Back" width={24} height={24} />
            Home
          </Link>
        </div>

        <div className="py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg 
                  width="48" 
                  height="48" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  viewBox="0 0 24 24"
                  className="text-red-600"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
            </div>

            <h1 className="text-6xl font-bold text-red-600 mb-4">410</h1>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {message.title}
            </h2>

            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {message.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href={message.buttonLink} 
                className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-6 py-3 transition flex items-center justify-center gap-2"
              >
                <Image src="/assets/back-arrow.png" alt="Back" width={20} height={20} />
                {message.buttonText}
              </Link>
            </div>

            <div className="mt-8 text-sm text-gray-500">
              <p>Looking for similar content? Check out our latest offerings!</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


