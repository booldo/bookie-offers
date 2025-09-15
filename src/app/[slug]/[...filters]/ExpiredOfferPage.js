"use client";
import React from "react";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import Link from "next/link";
import Image from "next/image";

function ExpiredOfferPage({ offer, embedded = false, countrySlug = "", isCountryEmpty = false, countryName = "", isHidden = false, contentType = "offer" }) {
  // Handle back button click without router dependency
  const handleBackClick = () => {
    if (countrySlug) {
      window.location.href = `/${countrySlug}`;
    } else {
      window.location.href = '/';
    }
  };
  
  // Determine the appropriate message based on the content state
  const getMessage = () => {
    if (isHidden) {
      return {
        title: "Content No Longer Available",
        description: `This ${contentType} has been intentionally removed or hidden and is no longer accessible.`,
        buttonText: "Go Home",
        buttonLink: "/"
      };
    } else if (isCountryEmpty) {
      return {
        title: `No Offers Available ${countryName ? `in ${countryName}` : ''}`,
        description: `We currently don't have any active offers${countryName ? ` in ${countryName}` : ''}. Please check back later or explore other countries.`,
        buttonText: "Go Home",
        buttonLink: "/"
      };
    } else if (!offer) {
      return {
        title: "Content Does Not Exist",
        description: `The ${contentType} you're looking for doesn't exist or may have been removed. Please check the URL or browse our available content.`,
        buttonText: "Browse Available Content",
        buttonLink: `/${countrySlug || 'ng'}`
      };
    } else {
      return {
        title: "Content Has Expired",
        description: `This ${contentType} is no longer available. The promotion has ended and cannot be claimed.`,
        buttonText: "View Active Content",
        buttonLink: `/${countrySlug || 'ng'}`
      };
    }
  };

  const message = getMessage();
  
  return (
    <div className={`min-h-screen bg-[#fafbfc] flex flex-col ${embedded ? '' : ''}`}>
      {!embedded && <Navbar />}
      <main className="max-w-7xl mx-auto w-full px-4 flex-1">
        {/* Back Button - positioned like breadcrumb */}
        <div className="mt-6 mb-4 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          <button onClick={handleBackClick} className="hover:underline flex items-center gap-1 flex-shrink-0">
            <Image src="/assets/back-arrow.png" alt="Back" width={24} height={24} />
            Home
          </button>
        </div>
        
        {/* 410 Error Content */}
        <div className="py-12 flex items-center justify-center">
        <div className="text-center">
          {/* 410 Status Icon */}
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

          {/* Error Code */}
          <h1 className="text-6xl font-bold text-red-600 mb-4">410</h1>
          
          {/* Main Message */}
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {message.title}
          </h2>
          
          {/* Content Details - only show for expired offers, not hidden content */}
          {!isHidden && !isCountryEmpty && offer && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 max-w-md mx-auto">
              <h3 className="font-semibold text-gray-900 mb-2">
                {offer.title}
              </h3>
              <p className="text-gray-600 text-sm mb-2">
                Bookmaker: {offer.bookmaker}
              </p>
              <p className="text-red-600 text-sm font-medium">
                Expired: {offer.expires}
              </p>
            </div>
          )}
          
          {/* Non-existent content message */}
          {!isHidden && !isCountryEmpty && !offer && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 max-w-md mx-auto">
              <h3 className="font-semibold text-gray-900 mb-2">
                The requested content could not be found
              </h3>
              <p className="text-gray-600 text-sm mb-2">
                This content may have been removed or the URL may be incorrect
              </p>
            </div>
          )}
          
          {/* Description */}
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {message.description}
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href={message.buttonLink} 
              className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-6 py-3 transition flex items-center justify-center gap-2"
            >
              <Image src="/assets/back-arrow.png" alt="Back" width={20} height={20} />
              {message.buttonText}
            </Link>
          </div>
          
          {/* Additional Info */}
          <div className="mt-8 text-sm text-gray-500">
            <p>Looking for similar content? Check out our latest offerings!</p>
          </div>
        </div>
        </div>
      </main>
      {!embedded && <Footer />}
    </div>
  );
}

export default ExpiredOfferPage; 