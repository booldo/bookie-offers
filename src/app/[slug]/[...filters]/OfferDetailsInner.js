"use client";
import React, { useLayoutEffect, useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { client } from "../../../sanity/lib/client";
import { urlFor } from "../../../sanity/lib/image";
import { PortableText } from '@portabletext/react';
import { formatDate } from '../../../utils/dateFormatter';
import { useRouter } from "next/navigation";
import TrackedLink from "../../../components/TrackedLink";
import { useCountryContext } from '../../../hooks/useCountryContext';
import ExpiredOfferPage from './ExpiredOfferPage';

// Custom components for PortableText
const portableTextComponents = {
  block: {
    h1: ({children}) => <h1 className="text-2xl font-bold text-gray-900 mb-4">{children}</h1>,
    h2: ({children}) => <h2 className="text-xl font-semibold text-gray-900 mb-3">{children}</h2>,
    h3: ({children}) => <h3 className="text-lg font-semibold text-gray-900 mb-2">{children}</h3>,
    h4: ({children}) => <h4 className="text-base font-semibold text-gray-900 mb-2">{children}</h4>,
    normal: ({children}) => <p className="text-gray-700 mb-3 leading-relaxed">{children}</p>,
  },
  list: {
    bullet: ({children}) => <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1">{children}</ul>,
    number: ({children}) => <ol className="list-decimal list-inside text-gray-700 mb-3 space-y-1">{children}</ol>,
  },
  listItem: {
    bullet: ({children}) => <li className="text-gray-700">{children}</li>,
    number: ({children}) => <li className="text-gray-700">{children}</li>,
  },
  marks: {
    strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
    em: ({children}) => <em className="italic text-gray-700">{children}</em>,
    code: ({children}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
  },
};

// FAQ Item Component
const FAQItem = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="font-medium text-gray-900 flex-1 text-left">
          <PortableText value={question} components={portableTextComponents} />
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
            <PortableText value={answer} components={portableTextComponents} />
          </div>
        </div>
      </div>
    </div>
  );
};

function OfferDetailsInner({ slug }) {
  const { countryData, loading: countryLoading, error: countryError, isCountryLoaded, getCountryName, getCountrySlug } = useCountryContext();
  const router = useRouter();
  const [offer, setOffer] = useState(null);
  const [moreOffers, setMoreOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadMoreCount, setLoadMoreCount] = useState(4);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [shouldRestoreScroll, setShouldRestoreScroll] = useState(false);
  const [totalOffers, setTotalOffers] = useState(0);
  const [openFAQIndex, setOpenFAQIndex] = useState(null);
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    if (!slug) return;
    if (!isCountryLoaded()) return;
    
    const countryName = getCountryName();
    if (!countryName) return;

    setLoading(true);
    // Fetch the main offer and more offers from Sanity - now dynamic by country
    const fetchData = async () => {
      try {
        
        const mainOfferQuery = `*[_type == "offers" && country->country == $countryName && slug.current == $slug][0]{
          _id,
          title,
          bonusType->{name},
          slug,
          bookmaker->{
            _id,
            name,
            logo,
            logoAlt,
            paymentMethods,
            license,
            country
          },
          maxBonus,
          minDeposit,
          description,
          expires,
          published,
          affiliateLink->{
            _id,
            name,
            affiliateUrl,
            isActive,
            prettyLink
          },
          banner,
          bannerAlt,
          howItWorks,
          faq,
          metaTitle,
          metaDescription,
          noindex,
          nofollow,
          canonicalUrl,
          sitemapInclude,
          offerSummary
        }`;
        const mainOffer = await client.fetch(mainOfferQuery, { slug, countryName });
        setOffer(mainOffer);

        // Fetch more offers (excluding the current one) - now dynamic
        const moreOffersQuery = `*[_type == "offers" && country->country == $countryName && slug.current != $slug] | order(_createdAt desc) [0...$count] {
          _id,
          bonusType->{name},
          slug,
          bookmaker->{
            _id,
            name,
            logo,
            logoAlt
          },
          title,
          description,
          expires,
          published
        }`;
        const moreOffersData = await client.fetch(moreOffersQuery, { slug, count: loadMoreCount, countryName });
        setMoreOffers(moreOffersData);

        // Get total count for pagination - now dynamic
        const totalQuery = `count(*[_type == "offers" && country->country == $countryName && slug.current != $slug])`;
        const total = await client.fetch(totalQuery, { slug, countryName });
        setTotalOffers(total);

      } catch (err) {
        console.error('Error fetching offer data:', err);
        setError('Failed to load offer details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, loadMoreCount, isCountryLoaded, getCountryName]);

  // Restore scroll position when component mounts
  useLayoutEffect(() => {
    if (shouldRestoreScroll && scrollPositionRef.current > 0) {
      window.scrollTo(0, scrollPositionRef.current);
      setShouldRestoreScroll(false);
    }
  }, [shouldRestoreScroll]);

  // Save scroll position before navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      scrollPositionRef.current = window.scrollY;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleLoadMore = async (e) => {
    // Prevent default button behavior to avoid scroll issues
    e.preventDefault();
    e.stopPropagation();
    
    const countryName = getCountryName();
    if (!countryName) return;

    setIsLoadingMore(true);
    try {
      const moreOffersQuery = `*[_type == "offers" && country == $countryName && slug.current != $slug] | order(_createdAt desc) [0...$count] {
        _id,
        bonusType->{name},
        slug,
        bookmaker->{
          _id,
          name,
          logo,
          logoAlt
        },
        title,
        description,
        expires,
        published
      }`;
      const moreOffersData = await client.fetch(moreOffersQuery, { slug, count: loadMoreCount + 4, countryName });
      setMoreOffers(moreOffersData);
      setLoadMoreCount(prev => prev + 4);
    } catch (err) {
      console.error('Error loading more offers:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleFAQToggle = (index) => {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  // Show loading state while country is loading
  if (countryLoading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col">
        <main className="max-w-7xl mx-auto w-full px-2 sm:px-4 flex-1">
          <div className="flex justify-center items-center py-20">
            <div className="w-full max-w-3xl">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-2/3 mb-6 animate-pulse"></div>
              <div className="h-24 bg-gray-200 rounded w-full mb-4 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // If offer is expired, show ExpiredOfferPage without extra layout
  const isExpired = offer?.expires ? new Date(offer.expires) < new Date() : false;
  if (!loading && offer && isExpired) {
    return (
      <ExpiredOfferPage 
        offer={{
          title: offer.title,
          bookmaker: offer.bookmaker?.name,
          expires: formatDate(offer.expires)
        }}
        embedded={true}
        countrySlug={getCountrySlug()}
      />
    );
  }

  // Show error state if country not found
  if (countryError || !countryData) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col">
        <main className="max-w-7xl mx-auto w-full px-2 sm:px-4 flex-1">
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Country Not Found</h1>
              <p className="text-gray-600 mb-4">{countryError || "The requested country page could not be found."}</p>
              <button
                onClick={() => router.push('/')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Go Home
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <main className="max-w-7xl mx-auto w-full px-2 sm:px-4 flex-1">
        {/* Updated Breadcrumb */}
        <div className="mt-6 mb-4 flex items-center gap-2 text-sm text-gray-500 ml-2">
          <button type="button" onClick={() => router.push(`/${getCountrySlug()}`)} className="hover:underline flex items-center gap-1">
            <img src="/assets/back-arrow.png" alt="Back" width="16" height="16" />
            Home
          </button>
          <span className="mx-1">/</span>
          <span className="text-gray-700 font-medium">{offer?.bonusType?.name || "Bonus"}</span>
        </div>
        
        {loading && (
          <div className="flex justify-center items-center py-6">
            <div className="w-full max-w-7xl px-2">
              {/* Banner skeleton - match final dimensions */}
              <div className="w-full h-24 sm:h-48 bg-gray-200 rounded-xl mb-6 animate-pulse"></div>
              {/* Content skeleton */}
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-2/3 mb-6 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        )}
        
        {/* Individual Offer Banner */}
        {!loading && !error && offer && offer.banner && (
          <div className="mb-6">
            <Image 
              src={urlFor(offer.banner).width(1200).height(200).url()} 
              alt={offer.bannerAlt || offer.title}
              width={1200}
              height={200}
              className="w-full h-24 sm:h-48 object-cover rounded-xl"
            />
          </div>
        )}
        
        {/* Offer Card */}
        {error && <div className="text-center text-red-500">{error}</div>}
        {!error && offer && (
          <>
            {/* Offer Card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 mb-6 flex flex-col">
              {/* Top row */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                {offer.bookmaker?.logo ? (
                  <Image src={urlFor(offer.bookmaker.logo).width(40).height(40).url()} alt={offer.bookmaker.logoAlt || offer.bookmaker.name} width={40} height={40} className="rounded-md" />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-md" />
                )}
                <span className="font-semibold text-gray-900 text-lg">{offer.bookmaker?.name}</span>
              </div>
              <span className="text-gray-500 text-sm">Published: {formatDate(offer.published)}</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">{offer.title}</h1>
            
            {/* Offer Summary */}
            {offer.offerSummary && (
              <div className="text-gray-700 mb-4">
                <PortableText value={offer.offerSummary} components={portableTextComponents} />
              </div>
            )}
            
            {/* Offer Description */}
            {offer.description && (
            <div className="text-gray-700 mb-4">
                <PortableText value={offer.description} components={portableTextComponents} />
              </div>
            )}
            

              
            <div className="flex items-center gap-2 mb-6">
              <img src="/assets/calendar.png" alt="Calendar" width="18" height="18" />
              <span className="text-black text-sm">Expires: {formatDate(offer.expires)}</span>
            </div>

            {/* Desktop Get Bonus Button */}
            {offer.affiliateLink?.affiliateUrl && offer.affiliateLink?.isActive && (
              <TrackedLink
                href={offer.affiliateLink.affiliateUrl}
                linkId={offer._id}
                linkType="offer"
                linkTitle={offer.title}
                target="_blank"
                rel="noopener noreferrer"
                isAffiliate={true}
                prettyLink={offer.affiliateLink.prettyLink}
                className="hidden sm:flex sm:w-fit sm:px-6 bg-[#018651] hover:bg-[#017a4a] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 items-center justify-center gap-2 mb-6"
              >
                Get Bonus
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </TrackedLink>
            )}

            {/* How it works */}
            {offer && offer.howItWorks && (
              <div className="mb-6">
                <div className="font-semibold text-gray-900 mb-3">How it works</div>
                <div className="text-gray-700 text-sm">
                  <PortableText value={offer.howItWorks} components={portableTextComponents} />
                </div>
              </div>
            )}

            {/* Payment Method */}
            {offer && offer.bookmaker?.paymentMethods && offer.bookmaker.paymentMethods.length > 0 && (
              <div className="mb-6">
                <div className="font-semibold text-gray-900 mb-3">Payment Methods</div>
                <div className="flex flex-wrap gap-2 text-gray-700 text-sm">
                  {offer.bookmaker.paymentMethods.map((pm, i) => (
                      <span key={i} className="border border-gray-200 rounded px-2 py-1 bg-gray-50">{typeof pm === 'string' ? pm : pm.name}</span>
                  ))}
                </div>
              </div>
            )}

            {/* License */}
            {offer && offer.bookmaker?.license && offer.bookmaker.license.length > 0 && (
              <div className="mb-6">
                <div className="font-semibold text-gray-900 mb-3">License</div>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 pl-4">
                  {offer.bookmaker.license.map((license, i) => (
                      <li key={i}>{typeof license === 'string' ? license : license.name}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mobile Get Bonus Button */}
            {offer.affiliateLink?.affiliateUrl && offer.affiliateLink?.isActive && (
              <TrackedLink
                href={offer.affiliateLink.affiliateUrl}
                linkId={offer._id}
                linkType="offer"
                linkTitle={offer.title}
                target="_blank"
                rel="noopener noreferrer"
                isAffiliate={true}
                prettyLink={offer.affiliateLink.prettyLink}
                className="sm:hidden w-full bg-[#018651] hover:bg-[#017a4a] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mb-6"
              >
                Get Bonus
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </TrackedLink>
            )}

            {/* FAQ Section */}
            {offer && offer.faq && offer.faq.length > 0 && (
              <div>
                <div className="font-semibold text-gray-900 mb-4">Frequently Asked Questions</div>
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
          </div>

          {/* More Offers Section */}
          {moreOffers.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 mb-6">
              <div className="font-semibold text-gray-900 mb-4">More Offers</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {moreOffers.map((moreOffer) => (
                  <div
                    key={moreOffer._id}
                      className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer h-full"
                    onClick={() => router.push(`/${getCountrySlug()}/${moreOffer.bonusType?.name?.toLowerCase().replace(/\s+/g, '-')}/${moreOffer.slug?.current}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {moreOffer.bookmaker?.logo ? (
                          <Image src={urlFor(moreOffer.bookmaker.logo).width(32).height(32).url()} alt={moreOffer.bookmaker.name} width={32} height={32} className="rounded-md" />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded-md" />
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{moreOffer.bookmaker?.name}</div>
                            <div className="text-sm text-gray-600 line-clamp-2">{moreOffer.title}</div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(moreOffer.published)}</span>
                    </div>
                    {moreOffer.offerSummary && (
                      <div className="mt-2 text-sm text-gray-600">
                        <PortableText value={moreOffer.offerSummary} components={portableTextComponents} />
                      </div>
                    )}
                    {moreOffer.expires && (
                      <div className="flex items-center gap-1 text-sm text-black mt-2">
                        <img src="/assets/calendar.png" alt="Calendar" width="16" height="16" className="flex-shrink-0" />
                        <span className="text-xs">Expires: {formatDate(moreOffer.expires)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {totalOffers > loadMoreCount && (
                <div className="mt-4 text-center">
                  <button 
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="border-2 border-gray-300 hover:border-gray-400 disabled:border-gray-200 disabled:text-gray-400 text-gray-700 hover:text-gray-800 px-8 py-3 rounded-lg font-semibold transition-all duration-200 text-lg bg-white hover:bg-gray-50"
                  >
                    {isLoadingMore ? 'Loading...' : `Load ${Math.min(4, totalOffers - loadMoreCount)} more offers`}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
        )}
      </main>
    </div>
  );
}

export default OfferDetailsInner; 