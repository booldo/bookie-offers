"use client";
import React, { useLayoutEffect, useRef, useEffect, useState } from "react";
import Navbar from "../../../../components/Navbar";
import Footer from "../../../../components/Footer";
import Image from "next/image";
import Link from "next/link";
import { client } from "../../../../sanity/lib/client";
import { urlFor } from "../../../../sanity/lib/image";
import { PortableText } from '@portabletext/react';
import { useRouter } from "next/navigation";
import TrackedLink from "../../../../components/TrackedLink";

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
    setLoading(true);
    // Fetch the main offer and more offers from Sanity
    const fetchData = async () => {
      try {
        // Fetch the main offer by slug
        const mainOfferQuery = `*[_type == "offers" && country == "Nigeria" && slug.current == $slug][0]{
          _id,
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
          country,
          maxBonus,
          minDeposit,
          description,
          expires,
          published,
          terms,
          howItWorks,
          faq,
          banner,
          bannerAlt,
          affiliateLink
        }`;
        const mainOffer = await client.fetch(mainOfferQuery, { slug });
        
        // Get total count of offers (excluding current one)
        const totalCountQuery = `count(*[_type == "offers" && country == "Nigeria" && slug.current != $slug])`;
        const total = await client.fetch(totalCountQuery, { slug });
        setTotalOffers(total);
        
        // Fetch more offers, excluding the current one
        const moreOffersQuery = `*[_type == "offers" && country == "Nigeria" && slug.current != $slug] | order(_createdAt desc)[0...$count]{
          _id,
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
          country,
          maxBonus,
          minDeposit,
          description,
          expires,
          published,
          terms,
          howItWorks,
          banner,
          bannerAlt
        }`;
        const more = await client.fetch(moreOffersQuery, { slug, count: loadMoreCount });
        setOffer(mainOffer);
        setMoreOffers(more);
        setLoading(false);
      } catch (err) {
        setError("Failed to load offer details");
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, loadMoreCount]);

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const newCount = loadMoreCount + 4;
      const moreOffersQuery = `*[_type == "offers" && country == "Nigeria" && slug.current != $slug] | order(_createdAt desc)[$count...$newCount]{
        _id,
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
        country,
        maxBonus,
        minDeposit,
        description,
        expires,
        published,
        terms,
        howItWorks,
        banner,
        bannerAlt
      }`;
      const more = await client.fetch(moreOffersQuery, { slug, count: loadMoreCount, newCount });
      setMoreOffers(more);
      setLoadMoreCount(newCount);
    } catch (err) {
      console.error("Failed to load more offers:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleFAQToggle = (index) => {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <Navbar />
      <main className="max-w-7xl mx-auto w-full px-2 sm:px-4 flex-1">
        {/* Individual Offer Banner */}
        {!loading && !error && offer && offer.banner && (
          <div className="mt-6 mb-6">
            <Image 
              src={urlFor(offer.banner).width(1200).height(200).url()} 
              alt={offer.bannerAlt || offer.title}
              width={1200}
              height={200}
              className="w-full h-auto rounded-xl"
            />
          </div>
        )}
        
        <div className="mt-6 mb-4 flex items-center gap-2 text-sm text-gray-500 ml-2">
          <button type="button" onClick={() => router.back()} className="hover:underline flex items-center gap-1">
            <Image src="/assets/back-arrow.png" alt="Back" width={24} height={24} />
            Home
          </button>
          <span className="mx-1">|</span>
          <span className="text-gray-700 font-medium">{offer?.bonusType?.name || "Bonus"}</span>
        </div>
        {/* Offer Card */}
        {error && <div className="text-center text-red-500">{error}</div>}
        {!error && offer && (
          <>
            {/* Offer Card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 mb-6 flex flex-col">
              {/* Top row */}
              <div className="flex justify-between items-center mb-4 sm:order-1">
                <div className="flex items-center gap-3">
                  {offer.bookmaker?.logo ? (
                    <Image src={urlFor(offer.bookmaker.logo).width(40).height(40).url()} alt={offer.bookmaker.logoAlt || offer.bookmaker.name} width={40} height={40} className="rounded-md" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-md" />
                  )}
                  <span className="font-semibold text-gray-900 text-lg">{offer.bookmaker?.name}</span>
                </div>
                <span className="text-gray-500 text-sm">Published: {offer.published}</span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2 sm:order-2">{offer.bonusType?.name}</h1>
              <div className="text-gray-700 mb-4 sm:order-3">
                {offer.description && <PortableText value={offer.description} components={portableTextComponents} />}
              </div>
              
              <div className="flex items-center gap-2 mb-6 sm:order-4">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                <span className="text-green-700 text-sm font-medium">Expires: {offer.expires}</span>
              </div>

              {offer.affiliateLink && (
                <TrackedLink
                  href={`/go/${offer.slug?.current}`}
                  linkId={offer._id}
                  linkType="offer"
                  linkTitle={offer.title}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-fit sm:px-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mb-6 sm:order-5"
                >
                  Get Bonus
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </TrackedLink>
              )}

              {/* How it works */}
              {offer.howItWorks && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 mb-6 sm:order-6">
                  <div className="text-gray-700 text-sm">
                    {offer.howItWorks && <PortableText value={offer.howItWorks} components={portableTextComponents} />}
                  </div>
                </div>
              )}
              {/* Payment Method */}
              {offer.bookmaker?.paymentMethods && offer.bookmaker.paymentMethods.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 mb-6 sm:order-7">
                  <div className="font-semibold text-gray-900 mb-1">Payment Method</div>
                  <div className="flex flex-wrap gap-2 text-gray-700 text-sm">
                    {offer.bookmaker.paymentMethods.map((pm, i) => (
                      <span key={i} className="border border-gray-200 rounded px-2 py-1 bg-gray-50">{pm}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Terms & Condition */}
              {offer.terms && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 mb-6 sm:order-8">
                  <div className="text-gray-700 text-sm">
                    {offer.terms && <PortableText value={offer.terms} components={portableTextComponents} />}
                  </div>
                </div>
              )}
              {/* License */}
              {offer.bookmaker?.license && offer.bookmaker.license.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 mb-6 sm:order-9">
                  <div className="font-semibold text-gray-900 mb-1">License</div>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 pl-4">
                    {offer.bookmaker.license.map((license, i) => (
                      <li key={i}>{license}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* FAQ */}
              {offer.faq && offer.faq.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 mb-6 mt-6 order-10">
                  <div className="font-semibold text-gray-900 mb-4">Frequently Asked Questions</div>
                  <div className="space-y-3">
                    {offer.faq.map((item, index) => (
                      <FAQItem 
                        key={index} 
                        question={item.question} 
                        answer={item.answer}
                        isOpen={openFAQIndex === index}
                        onToggle={() => handleFAQToggle(index)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        {/* More Offers */}
        {!loading && !error && moreOffers.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 mb-10">
            <div className="font-semibold text-lg text-gray-900 mb-3">More Offers</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {moreOffers.map((o) => (
                <Link
                  key={o._id || o.id}
                  href={`/ng/offers/${o.slug?.current}`}
                  scroll={false}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between transition cursor-pointer hover:bg-gray-50 hover:shadow-lg hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {o.bookmaker?.logo ? (
                      <Image src={urlFor(o.bookmaker.logo).width(28).height(28).url()} alt={o.bookmaker.logoAlt || o.bookmaker.name} width={28} height={28} className="rounded-md" />
                    ) : (
                      <div className="w-7 h-7 bg-gray-100 rounded-md" />
                    )}
                    <span className="font-semibold text-gray-900 text-base">{o.bookmaker?.name}</span>
                    <span className="ml-auto text-xs text-gray-500">Published: {o.published}</span>
                  </div>
                  <div className="font-semibold text-gray-900 text-sm mb-1">{o.title}</div>
                  <div className="text-xs text-gray-500 mb-2">
                    {o.description && <PortableText value={o.description} />}
                  </div>
                  <span className="flex items-center gap-1 text-green-700 text-xs font-medium">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    Expires: {o.expires}
                  </span>
                </Link>
              ))}
            </div>
            <div className="flex justify-center mt-6">
              {loadMoreCount < totalOffers && (
                <button 
                  onClick={handleLoadMore}
                  className="px-6 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition" 
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? "Loading..." : "Load More"}
                </button>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default OfferDetailsInner; 