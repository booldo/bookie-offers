import CountryPageShell, { generateStaticParams } from './CountryPageShell';
import OffersServer from './OffersServer';
import { Suspense } from "react";
import { client } from "../../sanity/lib/client";
import HomeNavbar from "../../components/HomeNavbar";
import Footer from "../../components/Footer";
import { PortableText } from '@portabletext/react';
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "../../sanity/lib/image";
import { notFound } from 'next/navigation';

// Custom components for PortableText rendering
const portableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{children}</h4>
    ),
    normal: ({ children }) => (
      <p className="mb-4 text-gray-800 leading-relaxed">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 mb-4">{children}</blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="text-gray-800">{children}</li>
    ),
    number: ({ children }) => (
      <li className="text-gray-800">{children}</li>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic">{children}</em>
    ),
    code: ({ children }) => (
      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
    ),
    link: ({ children, value }) => (
      <a 
        href={value?.href} 
        target={value?.blank ? '_blank' : '_self'}
        rel={value?.blank ? 'noopener noreferrer' : undefined}
        className="text-blue-600 hover:text-blue-800 underline"
      >
        {children}
      </a>
    ),
  },
  types: {
    image: ({ value }) => {
      if (!value?.asset) return null;
      return (
        <div className="my-4">
          <img 
            src={urlFor(value).width(800).height(400).url()} 
            alt={value.alt || ''} 
            className="w-full h-auto rounded-lg shadow-sm"
          />
          {value.caption && (
            <p className="text-sm text-gray-600 mt-2 text-center italic">{value.caption}</p>
          )}
        </div>
      );
    },
  },
};

// Export the static generation functions from CountryPageShell
export { generateStaticParams };

// Provide correct metadata for hamburger menu pages; fall back to country metadata otherwise
export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  
  // First check if this is a hamburger menu page
  const menuDoc = await client.fetch(`*[_type == "hamburgerMenu" && slug.current == $slug][0]{
    title,
    slug,
    metaTitle,
    metaDescription,
    noindex,
    nofollow,
    canonicalUrl,
    sitemapInclude
  }`, { slug: awaitedParams.slug });
  
  if (menuDoc && menuDoc.slug?.current) {
    return {
      title: menuDoc.metaTitle || menuDoc.title || 'Menu',
      description: menuDoc.metaDescription || undefined,
      robots: [
        menuDoc.noindex ? 'noindex' : 'index',
        menuDoc.nofollow ? 'nofollow' : 'follow'
      ].join(', '),
      alternates: {
        canonical: menuDoc.canonicalUrl || undefined,
      },
    };
  }
  
  // If not a menu page, check if it's a country page
  const countryDoc = await client.fetch(`*[_type == "countryPage" && slug.current == $slug && isActive == true][0]{
    country,
    metaTitle,
    metaDescription,
    noindex,
    nofollow,
    canonicalUrl,
    sitemapInclude
  }`, { slug: awaitedParams.slug });
  
  if (countryDoc) {
    return {
      title: countryDoc.metaTitle || `Best Betting Sites ${countryDoc.country} | Booldo`,
      description: countryDoc.metaDescription || `Discover the best betting sites in ${countryDoc.country} with exclusive bonuses and offers.`,
      robots: [
        countryDoc.noindex ? 'noindex' : 'index',
        countryDoc.nofollow ? 'nofollow' : 'follow'
      ].join(', '),
      alternates: {
        canonical: countryDoc.canonicalUrl || undefined,
      },
    };
  }
  
  // Fallback to landing page metadata (World Wide Page)
  const landing = await client.fetch(`*[_type == "landingPage"][0]{
    defaultMetaTitle,
    defaultMetaDescription,
    defaultNoindex,
    defaultNofollow,
    defaultCanonicalUrl
  }`);
  return {
    title: landing?.defaultMetaTitle || 'Booldo',
    description: landing?.defaultMetaDescription || undefined,
    robots: [
      landing?.defaultNoindex ? 'noindex' : 'index',
      landing?.defaultNofollow ? 'nofollow' : 'follow'
    ].join(', '),
    alternates: {
      canonical: landing?.defaultCanonicalUrl || undefined,
    },
  };
}

// Force dynamic rendering so middleware can intercept and return 410 when needed
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CountryPage({ params }) {
  const awaitedParams = await params;
  
  // CRITICAL: Validate that this is either a valid country or hamburger menu page
  console.log('🔍 [slug]/page.js - Validating slug:', awaitedParams.slug);
  
  // Check if it's a hamburger menu page first
  const menuDoc = await client.fetch(`*[_type == "hamburgerMenu" && slug.current == $slug][0]{_id}`, { slug: awaitedParams.slug });
  
  // If not a menu page, check if it's a valid country
  if (!menuDoc) {
    const validCountry = await client.fetch(`*[_type == "countryPage" && slug.current == $slug][0]{_id}`, { slug: awaitedParams.slug });
    if (!validCountry) {
      console.log('❌ [slug]/page.js - Invalid slug, returning 404:', awaitedParams.slug);
      return notFound();
    }
  }
  
  console.log('✅ [slug]/page.js - Valid slug found:', awaitedParams.slug);
  
  // Render Menu Page if a matching slug exists (fetch full details)
  const fullMenuDoc = await client.fetch(`*[_type == "hamburgerMenu" && slug.current == $slug][0]{
    title,
    slug,
    content,
    metaTitle,
    metaDescription,
    noindex,
    nofollow,
    canonicalUrl,
    sitemapInclude
  }`, { slug: awaitedParams.slug });
  const menuSlug = fullMenuDoc?.slug?.current || null;
  if (fullMenuDoc && menuSlug) {
    if (fullMenuDoc.noindex === true || fullMenuDoc.sitemapInclude === false) {
      return (
        <div className="min-h-screen flex flex-col bg-[#fafbfc]">
          <HomeNavbar />
          <main className="flex-1 max-w-6xl mx-auto py-10 px-4 w-full">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4 font-['General_Sans']">Content Not Available</h1>
              <p className="text-gray-600 font-['General_Sans']">This menu page is hidden.</p>
            </div>
          </main>
          <Footer />
        </div>
      );
    }
    // Server-rendered menu page with articles sidebar
    // Fetch recent articles for sidebar
    const articles = await client.fetch(`*[_type == "article" && (noindex != true) && (sitemapInclude != false)]|order(_createdAt desc)[0...5]{
      _id,
      title,
      slug,
      mainImage
    }`);

    return (
      <div className="min-h-screen flex flex-col bg-[#fafbfc]">
        <HomeNavbar />
        <main className="flex-1 max-w-6xl mx-auto py-10 px-4 w-full">
          <div className="mt-0 mb-4 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
            <a href="/" className="hover:underline flex items-center gap-1 flex-shrink-0 font-['General_Sans']" aria-label="Go back">
              <Image src="/assets/back-arrow.png" alt="Back" width={24} height={24} />
              Back
            </a>
          </div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm p-6 text-gray-800 leading-relaxed font-['General_Sans']">
                {fullMenuDoc.content && fullMenuDoc.content.length > 0 ? (
                  <PortableText value={fullMenuDoc.content} components={portableTextComponents} />
                ) : (
                  <div className="text-center text-gray-500 py-12">No content available for this menu item.</div>
                )}
              </div>
            </div>
            {/* Sidebar - Articles */}
            <aside className="w-full md:w-80 flex-shrink-0">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <span className="text-blue-600 text-xl">●</span>
                  <h2 className="text-lg sm:text-xl font-semibold font-['General_Sans']">Articles</h2>
                </div>
                <div className="flex flex-col gap-3 sm:gap-4">
                  {articles.map((a) => (
                    <Link
                      key={a._id}
                      href={`/briefly/${a.slug?.current || a.slug}`}
                      className="flex gap-3 items-center bg-gray-50 rounded-lg p-2 sm:p-3 transition hover:bg-gray-100 hover:scale-[1.02] cursor-pointer"
                    >
                      <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                        {a.mainImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={urlFor(a.mainImage).width(64).height(64).url()} alt={a.title} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full bg-gray-200" />
                        )}
                      </div>
                      <div className="text-sm font-semibold text-gray-900 leading-tight font-['General_Sans']">
                        {a.title}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <CountryPageShell params={awaitedParams} hasMultipleFilters={false}>
      {/* Dynamic offers section with proper PPR streaming */}
      <Suspense fallback={
        <div className="space-y-6">
          
          {/* Filter skeleton */}
          <div className="sticky top-16 z-10 bg-white sm:static sm:bg-transparent">
            <div className="flex items-center justify-between my-4">
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
            <div className="sm:max-w-md">
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Offer cards skeleton */}
          <div className="flex flex-col gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        </div>
      }>
        <OffersServer countrySlug={awaitedParams.slug} initialFilter={null} />
      </Suspense>
    </CountryPageShell>
  );
}