"use client";
import React, { useLayoutEffect, useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { client } from "../../../sanity/lib/client";
import { urlFor } from "../../../sanity/lib/image";
import imageUrlBuilder from '@sanity/image-url';
import { PortableText } from '@portabletext/react';
import { formatDate } from '../../../utils/dateFormatter';
import { useRouter } from "next/navigation";
import TrackedLink from "../../../components/TrackedLink";
import { useCountryContext } from '../../../hooks/useCountryContext';
import ExpiredOfferPage from './ExpiredOfferPage';

// Helper function to validate Sanity asset references or URL strings
const isValidAssetRef = (asset) => {
  if (!asset) return false;

  // Check if it's a URL string
  if (typeof asset === 'string' && (asset.startsWith('http://') || asset.startsWith('https://'))) {
    return true;
  }

  // Check if it's a direct asset object with _ref
  if (asset._ref) {
    const ref = asset._ref;
    return ref.startsWith('image-') && ref.length > 10 && !ref.includes('undefined');
  }

  // Check if it's a direct asset object with asset property
  if (asset.asset && asset.asset._ref) {
    const ref = asset.asset._ref;
    return ref.startsWith('image-') && ref.length > 10 && !ref.includes('undefined');
  }

  return false;
};

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
    strong: ({children}) => <span className="font-normal text-gray-900">{children}</span>,
    em: ({children}) => <em className="italic text-gray-700">{children}</em>,
    code: ({children}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
  },
  types: {
    image: ({ value }) => {
      console.log('Image handler called with value:', value);
      // Handle both direct asset references and nested asset objects
      const imageSource = value?.asset || value;
      const src = imageSource ? imageUrlBuilder(client).image(imageSource).width(1200).url() : '';
      const alt = value?.alt || 'Offer image';
      console.log('Generated image src:', src);
      if (!src) return null;
      return (
        <figure className="my-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="w-full h-auto rounded-md"
            loading="lazy"
          />
          {value?.caption && (
            <figcaption className="text-sm text-gray-500 mt-2">{value.caption}</figcaption>
          )}
        </figure>
      );
    },
    code: ({value}) => {
      const {language, code, type} = value;

      // If type is 'execute' or language is 'html', render as HTML
      if (type === 'execute' || language === 'html' || (code && code.includes('<') && code.includes('>'))) {
        return (
          <div className="my-4">
            {value.filename && (
              <div className="bg-blue-50 px-3 py-2 text-sm text-blue-700 font-medium border border-blue-200 rounded-t">
                <span className="font-semibold">Embedded HTML:</span> {value.filename}
              </div>
            )}
            {value.description && (
              <div className="bg-gray-50 px-3 py-2 text-sm text-gray-600 border-b border-gray-200">
                {value.description}
              </div>
            )}
            <div
              className={`border border-gray-200 rounded-lg overflow-hidden ${value.filename || value.description ? 'rounded-t-none' : ''}`}
              dangerouslySetInnerHTML={{ __html: code }}
            />
          </div>
        );
      }

      // Otherwise, show syntax highlighted code
      return (
        <div className="my-4">
          {value.filename && (
            <div className="bg-gray-100 px-3 py-1 text-sm text-gray-600 font-mono border-b border-gray-200 rounded-t">
              {value.filename}
            </div>
          )}
          <pre className={`bg-[#0b1020] text-[#e2e8f0] p-4 rounded-lg overflow-x-auto text-sm ${value.filename ? 'rounded-t-none' : ''}`}>
            <code className={`language-${language || 'javascript'}`}>
              {code}
            </code>
          </pre>
        </div>
      );
    },
    codeBlock: ({value}) => {
      const {language, code, type, filename, description} = value;

      // If type is 'execute' or language is 'html', render as HTML
      const shouldRenderAsHTML = type === 'execute' || language === 'html' || (code && code.includes('<') && code.includes('>'));

      if (shouldRenderAsHTML) {
        return (
          <div className="my-4">
            {filename && (
              <div className="bg-blue-50 px-3 py-2 text-sm text-blue-700 font-medium border border-blue-200 rounded-t">
                <span className="font-semibold">Embedded HTML:</span> {filename}
              </div>
            )}
            {description && (
              <div className="bg-gray-50 px-3 py-2 text-sm text-gray-600 border-b border-gray-200">
                {description}
              </div>
            )}
            <div
              className={`border border-gray-200 rounded-lg overflow-hidden ${filename || description ? 'rounded-t-none' : ''}`}
              dangerouslySetInnerHTML={{ __html: code }}
            />
          </div>
        );
      }

      // Otherwise, show syntax highlighted code
      return (
        <div className="my-4">
          {filename && (
            <div className="bg-gray-100 px-3 py-1 text-sm text-gray-600 font-mono border-b border-gray-200 rounded-t">
              {filename}
            </div>
          )}
          <pre className={`bg-[#0b1020] text-[#e2e8f0] p-4 rounded-lg overflow-x-auto text-sm ${filename ? 'rounded-t-none' : ''}`}>
            <code className={`language-${language || 'javascript'}`}>
              {code}
            </code>
          </pre>
        </div>
      );
    },
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
          <PortableText
            value={question}
            components={{
              ...portableTextComponents,
              types: {
                ...portableTextComponents.types,
                code: ({value}) => {
                  const {language, code, type} = value;

                  // If type is 'execute' with HTML content, or language is 'html', or code contains HTML tags, render as HTML
                  const shouldRenderAsHTML = type === 'execute' || language === 'html' || (code && code.includes('<') && code.includes('>'));

                  if (shouldRenderAsHTML) {
                    return (
                      <div className="my-2">
                        <div
                          className="border border-gray-200 rounded p-2 bg-white"
                          dangerouslySetInnerHTML={{ __html: code }}
                        />
                      </div>
                    );
                  }

                  // Otherwise, show syntax highlighted code
                  return (
                    <div className="my-2">
                      <pre className="bg-gray-900 text-gray-100 p-2 rounded text-xs overflow-x-auto">
                        <code className={`language-${language || 'javascript'}`}>
                          {code}
                        </code>
                      </pre>
                    </div>
                  );
                },
              },
            }}
          />
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
            <PortableText
              value={answer}
              components={{
                ...portableTextComponents,
                types: {
                  ...portableTextComponents.types,
                  code: ({value}) => {
                    console.log('Code block value:', value); // Debug logging
                    const {language, code, type} = value;
              
                    // If type is 'execute' with HTML content, or language is 'html', or code contains HTML tags, render as HTML
                    const shouldRenderAsHTML = type === 'execute' || language === 'html' || (code && code.includes('<') && code.includes('>'));
                    console.log('Should render as HTML:', shouldRenderAsHTML, { type, language, hasHTMLTags: code && code.includes('<') && code.includes('>') });
              
                    if (shouldRenderAsHTML) {
                      return (
                        <div className="my-2">
                          <div
                            className="border border-gray-200 rounded p-2 bg-white"
                            dangerouslySetInnerHTML={{ __html: code }}
                          />
                        </div>
                      );
                    }

                    // Otherwise, show syntax highlighted code
                    return (
                      <div className="my-2">
                        <pre className="bg-gray-900 text-gray-100 p-2 rounded text-xs overflow-x-auto">
                          <code className={`language-${language || 'javascript'}`}>
                            {code}
                          </code>
                        </pre>
                      </div>
                    );
                  },
                },
              }}
            />
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
  const [loadMoreCount, setLoadMoreCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasClickedLoadMore, setHasClickedLoadMore] = useState(false);
  const [shouldRestoreScroll, setShouldRestoreScroll] = useState(false);
  const [totalOffers, setTotalOffers] = useState(0);
  const [openFAQIndex, setOpenFAQIndex] = useState(null);
  const [isContentHidden, setIsContentHidden] = useState(false);
  const scrollPositionRef = useRef(0);
  const sentinelRef = useRef(null);



  useEffect(() => {
    if (!slug) return;
    if (!isCountryLoaded()) return;
    
    const countryName = getCountryName();
    if (!countryName) return;

    setLoading(true);
    // Fetch the main offer and more offers from Sanity - now dynamic by country
    const fetchData = async () => {
      try {
        
        const mainOfferQuery = `*[_type == "offers" && country->country == $countryName && slug.current == $slug && (!defined(expires) || expires > now())][0]{
          _id,
          title,
          bonusType->{name},
          slug,
          bookmaker->{
            _id,
            name,
            logo,
            logoAlt,
            logoUrl,
            paymentMethods[]->{
              _id,
              name
            },
            license[]->{
              _id,
              name
            },
            country
          },
          maxBonus,
          minDeposit,
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
        
        // Check if offer is hidden and set state
        if (mainOffer && (mainOffer.noindex === true || mainOffer.sitemapInclude === false)) {
          console.log('Offer is hidden, setting hidden state');
          setIsContentHidden(true);
        }
        
        setOffer(mainOffer);

        // Fetch more offers (excluding the current one, hidden ones, and expired ones) - now dynamic
        const moreOffersQuery = `*[_type == "offers" && country->country == $countryName && slug.current != $slug && (noindex != true) && (sitemapInclude != false) && (!defined(expires) || expires > now())] | order(_createdAt desc) [0...$count] {
          _id,
          bonusType->{name},
          slug,
          bookmaker->{
            _id,
            name,
            logo,
            logoAlt,
            logoUrl
          },
          title,
          offerSummary,
          expires,
          published
        }`;
        const moreOffersData = await client.fetch(moreOffersQuery, { slug, count: loadMoreCount, countryName });
        setMoreOffers(moreOffersData);

        // Get total count for pagination - now dynamic (excluding hidden offers and expired offers)
        const totalQuery = `count(*[_type == "offers" && country->country == $countryName && slug.current != $slug && (noindex != true) && (sitemapInclude != false) && (!defined(expires) || expires > now())])`;
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

  const handleLoadMore = async () => {
    if (isLoadingMore || loadMoreCount >= totalOffers) return;

    const countryName = getCountryName();
    if (!countryName) return;

    setIsLoadingMore(true);
    setHasClickedLoadMore(true);
    try {
      const moreOffersQuery = `*[_type == "offers" && country->country == $countryName && slug.current != $slug && (noindex != true) && (sitemapInclude != false) && (!defined(expires) || expires > now())] | order(_createdAt desc) [0...$count] {
        _id,
        bonusType->{name},
        slug,
        bookmaker->{
          _id,
          name,
          logo,
          logoAlt,
          logoUrl
        },
        title,
        offerSummary,
        expires,
        published
      }`;
      const moreOffersData = await client.fetch(moreOffersQuery, { slug, count: loadMoreCount + 10, countryName });
      setMoreOffers(moreOffersData);
      setLoadMoreCount(prev => prev + 10);
    } catch (err) {
      console.error('Error loading more offers:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Infinite scroll effect
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && loadMoreCount < totalOffers && hasClickedLoadMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [isLoadingMore, loadMoreCount, totalOffers]);

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

  // If offer is hidden (noindex or sitemapInclude false), show ExpiredOfferPage
  if (!loading && isContentHidden) {
    return (
      <ExpiredOfferPage 
        offer={null}
        embedded={true}
        countrySlug={getCountrySlug()}
        isCountryEmpty={false}
        countryName={getCountryName()}
        isHidden={true}
        contentType="offer"
      />
    );
  }

  // If offer doesn't exist, show 410 error page
  if (!loading && !offer && !error) {
    return (
      <ExpiredOfferPage 
        offer={null}
        embedded={true}
        countrySlug={getCountrySlug()}
        isCountryEmpty={false}
        countryName={getCountryName()}
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
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col">
      <main className="max-w-7xl mx-auto w-full px-0 sm:px-4 flex-1 pb-24 sm:pb-0">
        {/* Updated Breadcrumb */}
        <div className="mt-6 mb-4 flex items-center gap-2 text-sm text-gray-500 ml-2 flex-wrap">
          <Link href={`/${getCountrySlug()}`} className="hover:underline flex items-center gap-1 flex-shrink-0 cursor-pointer text-blue-600">
            <img src="/assets/back-arrow.png" alt="Back" width="16" height="16" />
            Home
          </Link>
          <span className="mx-1 flex-shrink-0">/</span>
          <Link
            href={`/${getCountrySlug()}/${offer?.bonusType?.name?.toLowerCase().replace(/\s+/g, '-')}`}
            className="hover:underline text-blue-600 font-medium cursor-pointer"
          >
            {offer?.bonusType?.name || "Bonus"}
          </Link>
          <span className="mx-1 flex-shrink-0">/</span>
          <span className="text-gray-900 font-medium">
            {offer?.title || "Offer"}
          </span>
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
            <div className="bg-white p-1 sm:p-6 mb-6 flex flex-col">
              {/* Top row */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                {offer.bookmaker?.logo && isValidAssetRef(offer.bookmaker.logo) ? (
                  <img src={offer.bookmaker.logo} alt={offer.bookmaker.logoAlt || offer.bookmaker.name} width="40" height="40" className="rounded-md" />
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
            

            

              
            {/* Expiry Date - only show if offer has expiry */}
            {offer.expires && (
              <div className="flex items-center gap-2 mb-6">
                <img src="/assets/calendar.png" alt="Calendar" width="18" height="18" />
                <span className="text-black text-sm">Expires: {formatDate(offer.expires)}</span>
              </div>
            )}

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

            {/* Mobile Get Bonus Button (replaced by sticky bar) */}
            {offer.affiliateLink?.affiliateUrl && offer.affiliateLink?.isActive && (
              <div className="hidden"></div>
            )}

            {/* FAQ Section */}
            {offer && offer.faq && offer.faq.length > 0 && (
              <div>
                <div className="font-normal text-gray-900 mb-4">FAQ</div>
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
            <div className="bg-white p-1 sm:p-6 mb-4">
              <div className="font-semibold text-gray-900 mb-4">More Offers</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {moreOffers.map((moreOffer) => (
                  <div
                    key={moreOffer._id}
                    className="relative border  border-gray-200 rounded-lg p-1mb-2 sm:p-4 hover:border-gray-300 transition-colors cursor-pointer h-full min-w-0"
                  >
                    {moreOffer.slug?.current && (
                      <Link
                        href={`/${getCountrySlug()}/${moreOffer.bonusType?.name?.toLowerCase().replace(/\s+/g, '-')}/${moreOffer.slug?.current}`}
                        aria-label={moreOffer.title}
                        className="  absolute inset-0 z-10"
                      />
                    )}
                    <div className="flex flex-col gap-3 p-2 ">
                      {/* Top row: Logo, Bookmaker Name, and Published Date */}
                      <div className="flex items-center justify-between min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {moreOffer.bookmaker?.logo && isValidAssetRef(moreOffer.bookmaker.logo) ? (
                            <img
                              src={moreOffer.bookmaker.logo}
                              alt={moreOffer.bookmaker.name}
                              width="44"
                              height="44"
                              className="w-[44px] h-[44px] rounded-[6px] flex-shrink-0"
                            />
                          ) : (
                            <div className="w-[25px] h-[25px] bg-gray-100 rounded-[6px] flex-shrink-0" />
                          )}
                          <div className="font-['General_Sans'] font-semibold text-[16px] leading-[100%] tracking-[1%] text-[#272932] min-w-0">
                            {moreOffer.bookmaker?.name}
                          </div>
                        </div>
                        {/* Published Date - positioned on the far right */}
                        {moreOffer.published && (
                          <div className="text-sm text-gray-500 flex-shrink-0">
                            <span className="font-['General_Sans'] font-medium text-xs leading-[100%] tracking-[1%] text-[#696969]">
                              Published: {formatDate(moreOffer.published)}
                            </span>
                          </div>
                        )}
                    </div>
                      
                      {/* Offer Title */}
                      <div className="font-['General_Sans'] font-medium text-[16px] leading-[100%] tracking-[1%] text-[#272932]">
                        {moreOffer.title}
                      </div>

                      {/* Bookmaker and Bonus Type */}
                      <div className="flex gap-2 ">
                        {moreOffer.bookmaker?.name && (
                          <span className="bg-gray-100 rounded-full px-3 py-2 text-sm font-medium text-gray-700 inline-block">
                            {moreOffer.bookmaker.name}
                          </span>
                        )}
                        {moreOffer.bonusType?.name && (
                          <span className="bg-gray-100 rounded-full px-3 py-2 text-sm font-medium text-gray-700 inline-block">
                            {moreOffer.bonusType.name}
                          </span>
                        )}
                      </div>

                      {/* Offer Summary */}
                    {moreOffer.offerSummary && (
                        <div className="font-['General_Sans'] font-normal text-[16px] leading-[20px] tracking-[1%] text-[#696969] line-clamp-2">
                        <PortableText value={moreOffer.offerSummary} components={portableTextComponents} />
                      </div>
                    )}
                      
                      {/* Expiry Date */}
                    {moreOffer.expires && (
                        <div className="flex items-center gap-1 text-sm text-black mt-auto">
                        <img src="/assets/calendar.png" alt="Calendar" width="16" height="16" className="flex-shrink-0" />
                        <span className="text-xs">Expires: {formatDate(moreOffer.expires)}</span>
                      </div>
                    )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button - shown initially */}
              {!hasClickedLoadMore && totalOffers > loadMoreCount && (
                <div className="mt-4 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-full font-medium transition-all duration-200 border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingMore ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}

              {/* Sentinel for infinite scroll - shown after first load more click */}
              {hasClickedLoadMore && totalOffers > loadMoreCount && (
                <div ref={sentinelRef} className="mt-4 text-center">
                  {isLoadingMore && (
                    <div className="text-gray-500">Loading more offers...</div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
        )}
      </main>
      {/* Mobile sticky CTA bar */}
      {offer?.affiliateLink?.affiliateUrl && offer?.affiliateLink?.isActive && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-3">
          <TrackedLink
            href={offer.affiliateLink.affiliateUrl}
            linkId={offer._id}
            linkType="offer"
            linkTitle={offer.title}
            target="_blank"
            rel="noopener noreferrer"
            isAffiliate={true}
            prettyLink={offer.affiliateLink.prettyLink}
            className="w-full bg-[#018651] hover:bg-[#017a4a] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            Get Bonus
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </TrackedLink>
        </div>
      )}
    </div>
  );
}

export default OfferDetailsInner; 