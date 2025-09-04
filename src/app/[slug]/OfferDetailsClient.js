"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "../../sanity/lib/image";
import { PortableText } from '@portabletext/react';
import { formatDate } from '../../utils/dateFormatter';
import TrackedLink from "../../components/TrackedLink";

// FAQ Item Component
const FAQItem = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="font-medium text-gray-900 flex-1 text-left">
          <PortableText value={question} components={{
            block: { normal: ({children}) => <span>{children}</span> },
            types: {
              code: ({value}) => {
                const {language, code} = value;
                return (
                  <div className="my-2">
                    <pre className="bg-gray-900 text-gray-100 p-2 rounded text-xs overflow-x-auto">
                      <code className={`language-${language}`}>
                        {code}
                      </code>
                    </pre>
                  </div>
                );
              },
            },
          }} />
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : ''} flex-shrink-0 ml-2`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-3 border-t border-gray-200">
          <div className="pt-3 text-gray-700 text-sm">
            <PortableText value={answer} components={{
              block: { normal: ({children}) => <p>{children}</p> },
              types: {
                code: ({value}) => {
                  const {language, code} = value;
                  return (
                    <div className="my-2">
                      <pre className="bg-gray-900 text-gray-100 p-2 rounded text-xs overflow-x-auto">
                        <code className={`language-${language}`}>
                          {code}
                        </code>
                      </pre>
                    </div>
                  );
                },
              },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function OfferDetailsClient({ offer, moreOffers, totalOffers, countryName }) {
  const [openFAQIndex, setOpenFAQIndex] = useState(null);
  const [loadMoreCount, setLoadMoreCount] = useState(4);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleFAQToggle = (index) => {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  const handleLoadMore = async (e) => {
    // Prevent default button behavior to avoid scroll issues
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoadingMore(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoadMoreCount(prev => prev + 4);
    setIsLoadingMore(false);
  };

  // Check if offer is expired
  const isExpired = offer?.expires ? new Date(offer.expires) < new Date() : false;
  if (offer && isExpired) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col">
        <main className="max-w-7xl mx-auto w-full px-4 flex-1">
          {/* Back Button */}
          <div className="mt-6 mb-4 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
            <Link href={`/${countryName.toLowerCase().replace(/\s+/g, '-')}`} className="hover:underline flex items-center gap-1">
              <img src="/assets/back-arrow.png" alt="Back" width={24} height={24} />
              Home
            </Link>
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
                Offer Has Expired
              </h2>
              
              {/* Offer Details */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 max-w-md mx-auto">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {offer.title}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  Bookmaker: {offer.bookmaker?.name}
                </p>
                <p className="text-red-600 text-sm font-medium">
                  Expired: {new Date(offer.expires).toLocaleDateString()}
                </p>
              </div>
              
              {/* Description */}
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                This offer is no longer available. The promotion has ended and cannot be claimed.
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href={`/${countryName.toLowerCase().replace(/\s+/g, '-')}`} 
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-6 py-3 transition flex items-center justify-center gap-2"
                >
                  <img src="/assets/back-arrow.png" alt="Back" width={20} height={20} />
                  View Active Offers
                </Link>
              </div>
              
              {/* Additional Info */}
              <div className="mt-8 text-sm text-gray-500">
                <p>Looking for similar offers? Check out our latest promotions!</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col">
        <main className="max-w-7xl mx-auto w-full px-4 flex-1">
          {/* Back Button */}
          <div className="mt-6 mb-4 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
            <Link href={`/${countryName.toLowerCase().replace(/\s+/g, '-')}`} className="hover:underline flex items-center gap-1">
              <img src="/assets/back-arrow.png" alt="Back" width={24} height={24} />
              Home
            </Link>
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
                Offer Not Available
              </h2>
              
              {/* Description */}
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                This offer is not available or may be in draft mode. Please check back later or browse our available offers.
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href={`/${countryName.toLowerCase().replace(/\s+/g, '-')}`} 
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-6 py-3 transition flex items-center justify-center gap-2"
                >
                  <img src="/assets/back-arrow.png" alt="Back" width={20} height={20} />
                  Browse Available Offers
        </Link>
              </div>
              
              {/* Additional Info */}
              <div className="mt-8 text-sm text-gray-500">
                <p>Looking for similar offers? Check out our latest promotions!</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-24 sm:pb-0 bg-[#FFFFFF]">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
        <Link href={`/${countryName.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-gray-700">
          {countryName} Offers
        </Link>
          <span className="mx-2">/</span>
          <Link 
            href={`/${countryName.toLowerCase().replace(/\s+/g, '-')}/${offer.bonusType?.name?.toLowerCase().replace(/\s+/g, '-')}`} 
            className="hover:text-gray-700 text-gray-700 font-medium"
          >
            {offer.bonusType?.name || "Bonus"}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{offer.title}</span>
        </div>
      </nav>

      {/* Main Offer Content */}
      <div className="bg-white p-6 mb-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {offer.bookmaker?.logo && (
              <Image
                src={urlFor(offer.bookmaker.logo).width(64).height(64).url()}
                alt={offer.bookmaker.logoAlt || offer.bookmaker.name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-lg object-contain"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{offer.title}</h1>
              <p className="text-gray-600">{offer.bookmaker?.name}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {offer.maxBonus && `Up to ${offer.maxBonus}`}
            </div>
            {offer.minDeposit && (
              <div className="text-sm text-gray-500">
                Min deposit: {offer.minDeposit}
              </div>
            )}
          </div>
        </div>

        {/* Banner */}
        {offer.banner && (
          <div className="mb-6">
            <Image
              src={urlFor(offer.banner).width(800).height(400).url()}
              alt={offer.bannerAlt || offer.title}
              width={800}
              height={400}
              className="w-full h-auto rounded-lg"
            />
          </div>
        )}



        {/* CTA Button (desktop only, mobile moved to sticky bar) */}
        <div className="hidden sm:block text-center pt-6 border-t border-gray-200">
          <TrackedLink
            href={offer.affiliateLink?.affiliateUrl || '#'}
            linkId={`bonus-${offer._id}`}
            linkType="offer"
            linkTitle={offer.title}
            isAffiliate={true}
            prettyLink={offer.affiliateLink?.prettyLink}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors inline-block"
          >
            Claim Bonus Now
          </TrackedLink>
        </div>
      </div>

      {/* FAQ Section */}
      {offer.faq && offer.faq.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 font-['General_Sans'] tracking-[1%]">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {offer.faq.map((faqItem, index) => (
              <FAQItem
                key={index}
                question={faqItem.question}
                answer={faqItem.answer}
                isOpen={openFAQIndex === index}
                onToggle={() => handleFAQToggle(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* More Offers Section */}
      {moreOffers && moreOffers.length > 0 && (
        <div className="bg-white p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              More Offers from {offer.bookmaker?.name}
            </h2>
            <span className="text-sm text-gray-500">
              {totalOffers} total offers
            </span>
          </div>
          
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {moreOffers.slice(0, loadMoreCount).map((moreOffer) => (
              <div key={moreOffer._id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex flex-col gap-3">
                  {/* Top row: Logo, Bookmaker Name, and Published Date */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      {moreOffer.bookmaker?.logo ? (
                      <Image
                          src={urlFor(moreOffer.bookmaker.logo).width(44).height(44).url()}
                        alt={moreOffer.bookmaker.logoAlt || moreOffer.bookmaker.name}
                          width={44}
                          height={44}
                          className="w-11 h-11 rounded-[6px] object-contain flex-shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 bg-gray-100 rounded-[6px] flex-shrink-0" />
                      )}
                      <div className="font-['General_Sans'] font-semibold text-[16px] leading-[100%] tracking-[1%] text-[#272932]">
                        {moreOffer.bookmaker?.name}
                      </div>
                    </div>
                    {/* Published Date - positioned on the far right */}
                    {moreOffer.published && (
                      <div className="text-sm text-gray-500">
                        <span className="font-['General_Sans'] font-medium text-[14px] leading-[100%] tracking-[1%] text-[#696969]">
                          Published: {formatDate(moreOffer.published)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Offer Title */}
                  <div className="font-['General_Sans'] font-medium text-[20px] leading-[100%] tracking-[1%] text-[#272932]">
                    {moreOffer.title}
                  </div>
                  
                  {/* Offer Summary */}
                  {moreOffer.offerSummary && (
                    <div className="font-['General_Sans'] font-normal text-[16px] leading-[20px] tracking-[1%] text-[#696969] line-clamp-2 mb-3">
                      <PortableText value={moreOffer.offerSummary} components={{
                        block: { normal: ({children}) => <span>{children}</span> },
                        types: {
                          code: ({value}) => {
                            const {language, code} = value;
                            return (
                              <div className="my-2">
                                <pre className="bg-gray-900 text-gray-100 p-2 rounded text-xs overflow-x-auto">
                                  <code className={`language-${language}`}>
                                    {code}
                                  </code>
                                </pre>
                              </div>
                            );
                          },
                        },
                      }} />
                    </div>
                  )}
                  
                  {/* Bonus Type and Max Bonus */}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {moreOffer.bonusType?.name && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            {moreOffer.bonusType.name}
                          </span>
                        )}
                        {moreOffer.maxBonus && (
                          <span className="text-green-600 font-medium">
                            Up to {moreOffer.maxBonus}
                          </span>
                        )}
                  </div>
                  
                  {/* View Details Button */}
                  <Link
                    href={`/${countryName.toLowerCase().replace(/\s+/g, '-')}/offers/${moreOffer.slug.current}`}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 self-start"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          {loadMoreCount < moreOffers.length && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-full font-medium transition-all duration-200 border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
      {/* Mobile sticky CTA bar */}
      {offer.affiliateLink?.affiliateUrl && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-3">
          <TrackedLink
            href={offer.affiliateLink.affiliateUrl}
            linkId={`bonus-${offer._id}`}
            linkType="offer"
            linkTitle={offer.title}
            isAffiliate={true}
            prettyLink={offer.affiliateLink?.prettyLink}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors inline-flex items-center justify-center gap-2"
          >
            Claim Bonus Now
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </TrackedLink>
        </div>
      )}
    </div>
  );
}
