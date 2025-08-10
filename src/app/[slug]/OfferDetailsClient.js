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
            block: { normal: ({children}) => <span>{children}</span> }
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
              block: { normal: ({children}) => <p>{children}</p> }
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

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoadMoreCount(prev => prev + 4);
    setIsLoadingMore(false);
  };

  if (!offer) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Offer Not Found</h1>
        <p className="text-gray-600 mb-4">The requested offer could not be found.</p>
        <Link href={`/${countryName.toLowerCase().replace(/\s+/g, '-')}`} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          Back to Offers
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href={`/${countryName.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-gray-700">
          {countryName} Offers
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{offer.title}</span>
      </nav>

      {/* Main Offer Content */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
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

        {/* Description */}
        {offer.description && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-700 leading-relaxed">{offer.description}</p>
          </div>
        )}

        {/* CTA Button */}
        <div className="text-center pt-6 border-t border-gray-200">
          <TrackedLink
            href={offer.affiliateLink || '#'}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors inline-block"
          >
            Claim Bonus Now
          </TrackedLink>
        </div>
      </div>

      {/* FAQ Section */}
      {offer.faq && offer.faq.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
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
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              More Offers from {offer.bookmaker?.name}
            </h2>
            <span className="text-sm text-gray-500">
              {totalOffers} total offers
            </span>
          </div>
          
          <div className="space-y-4">
            {moreOffers.slice(0, loadMoreCount).map((moreOffer) => (
              <div key={moreOffer._id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {moreOffer.bookmaker?.logo && (
                      <Image
                        src={urlFor(moreOffer.bookmaker.logo).width(40).height(40).url()}
                        alt={moreOffer.bookmaker.logoAlt || moreOffer.bookmaker.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-md object-contain"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{moreOffer.title}</h3>
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
                    </div>
                  </div>
                  
                  <Link
                    href={`/${countryName.toLowerCase().replace(/\s+/g, '-')}/offers/${moreOffer.slug.current}`}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {isLoadingMore ? 'Loading...' : 'Load More Offers'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
