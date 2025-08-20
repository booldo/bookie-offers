"use client";
import React from "react";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

function ExpiredOfferPage({ offer, embedded = false, countrySlug = "", isCountryEmpty = false, countryName = "" }) {
  const router = useRouter();
  return (
    <div className={`min-h-screen bg-[#fafbfc] flex flex-col ${embedded ? '' : ''}`}>
      {!embedded && <Navbar />}
      <main className="max-w-7xl mx-auto w-full px-4 flex-1">
        {/* Back Button - positioned like breadcrumb */}
        <div className="mt-6 mb-4 flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => router.push(`/${countrySlug || ''}`)} className="hover:underline flex items-center gap-1">
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
          {isCountryEmpty ? (
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              No Offers Available {countryName ? `in ${countryName}` : ''}
            </h2>
          ) : !offer ? (
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Offer Does Not Exist
            </h2>
          ) : (
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Offer Has Expired
            </h2>
          )}
          
          {/* Offer Details */}
          {!isCountryEmpty && offer && (
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
          
          {/* Non-existent offer message */}
          {!isCountryEmpty && !offer && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 max-w-md mx-auto">
              <h3 className="font-semibold text-gray-900 mb-2">
                The requested offer could not be found
              </h3>
              <p className="text-gray-600 text-sm mb-2">
                This offer may have been removed or the URL may be incorrect
              </p>
            </div>
          )}
          
          {/* Description */}
          {isCountryEmpty ? (
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              We currently don't have any active offers{countryName ? ` in ${countryName}` : ''}. Please check back later or explore other countries.
            </p>
          ) : !offer ? (
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              The offer you're looking for doesn't exist or may have been removed. Please check the URL or browse our available offers.
            </p>
          ) : (
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              This offer is no longer available. The promotion has ended and cannot be claimed.
            </p>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isCountryEmpty ? (
              <>
                <Link 
                  href={`/`} 
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-6 py-3 transition flex items-center justify-center gap-2"
                >
                  <Image src="/assets/back-arrow.png" alt="Back" width={20} height={20} />
                  Go Home
                </Link>

              </>
            ) : !offer ? (
              <>
                <Link 
                  href={`/${countrySlug || 'ng'}`} 
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-6 py-3 transition flex items-center justify-center gap-2"
                >
                  <Image src="/assets/back-arrow.png" alt="Back" width={20} height={20} />
                  Browse Available Offers
                </Link>

              </>
            ) : (
              <>
                <Link 
                  href={`/${countrySlug || 'ng'}`} 
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-6 py-3 transition flex items-center justify-center gap-2"
                >
                  <Image src="/assets/back-arrow.png" alt="Back" width={20} height={20} />
                  View Active Offers
                </Link>

              </>
            )}
          </div>
          
          {/* Additional Info */}
          <div className="mt-8 text-sm text-gray-500">
            <p>Looking for similar offers? Check out our latest promotions!</p>
          </div>
        </div>
        </div>
      </main>
      {!embedded && <Footer />}
    </div>
  );
}

export default ExpiredOfferPage; 