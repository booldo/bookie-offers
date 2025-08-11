import { client } from "../../sanity/lib/client";
import { urlFor } from "../../sanity/lib/image";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Image from "next/image";
import BannerCarousel from "../../components/BannerCarousel";
import { PortableText } from '@portabletext/react';
import { Suspense } from "react";

// Generate static params for all active countries
export async function generateStaticParams() {
  try {
    const countries = await client.fetch(`
      *[_type == "countryPage" && isActive == true]{
        slug
      }
    `);
    
    return countries.map((country) => ({
      slug: country.slug.current,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Static data fetching for country page
async function getCountryPageData(slug) {
  try {
    // Get country data
    const countryQuery = `*[_type == "countryPage" && slug.current == $slug && isActive == true][0]{
      title,
      country,
      metaTitle,
      metaDescription,
      banner,
      bannerAlt,
      content,
      noindex,
      nofollow,
      canonicalUrl,
      sitemapInclude
    }`;
    
    const countryData = await client.fetch(countryQuery, { slug });
    
    if (!countryData) return null;
    
    // Get banners for this country
    const bannersQuery = `*[_type == "banner" && country->country == $country && isActive == true] | order(order asc) {
      _id,
      title,
      description,
      image,
      imageAlt,
      link,
      linkText,
      order
    }`;

    // Get comparison content for this country
    const comparisonQuery = `*[_type == "comparison" && country->country == $country && isActive == true] | order(order asc)[0] {
      _id,
      title,
      content,
      order
    }`;

    // Get SEO settings for this country
    const seoSettingsQuery = `*[_type == "seoSettings" && country->country == $country][0] {
      defaultMetaTitle,
      defaultMetaDescription,
      defaultNoindex,
      defaultNofollow,
      defaultCanonicalUrl
    }`;

    const [banners, comparison, seoSettings] = await Promise.all([
      client.fetch(bannersQuery, { country: countryData.country }),
      
      client.fetch(comparisonQuery, { country: countryData.country }),
      
      client.fetch(seoSettingsQuery, { country: countryData.country })
    ]);

    return { 
      countryData, 
      banners: banners.map(b => ({
        ...b,
        imageUrl: b.image ? urlFor(b.image).width(1200).height(200).url() : undefined,
        imageAlt: b.imageAlt || b.title
      })),
      comparison,
      seoSettings
    };
  } catch (error) {
    console.error('Error fetching country page data:', error);
    return null;
  }
}

// Static metadata generation
export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const data = await getCountryPageData(awaitedParams.slug);
  
  if (!data) {
    return {
      title: 'Country Not Found | Booldo',
      description: 'The requested country page could not be found.'
    };
  }

  const { countryData, seoSettings } = data;
  
  return {
    title: countryData.metaTitle || seoSettings?.defaultMetaTitle || `Best Betting Sites ${countryData.country} | Booldo`,
    description: countryData.metaDescription || seoSettings?.defaultMetaDescription || `Discover the best betting sites in ${countryData.country} with exclusive bonuses and offers.`,
    robots: [
      (countryData.noindex || seoSettings?.defaultNoindex) ? "noindex" : "index",
      (countryData.nofollow || seoSettings?.defaultNofollow) ? "nofollow" : "follow"
    ].join(", "),
    alternates: {
      canonical: countryData.canonicalUrl || seoSettings?.defaultCanonicalUrl || undefined,
    },
  };
}

// Main country page shell component
export default async function CountryPageShell({ params, children, isOfferDetailsPage = false }) {
  const awaitedParams = await params;
  const data = await getCountryPageData(awaitedParams.slug);
  
  if (!data) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col">
        <Navbar />
        <main className="max-w-7xl mx-auto w-full px-2 sm:px-4 flex-1">
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Country Not Found</h1>
              <p className="text-gray-600 mb-4">The requested country page could not be found.</p>
              <a href="/" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                Go Home
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { countryData, banners, comparison } = data;

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <Navbar />
      <main className="max-w-7xl mx-auto w-full px-2 sm:px-4 flex-1">
        {/* Static country banner - prerendered */}
        {countryData.banner && (
          <div className="mb-6">
            <Image
              src={urlFor(countryData.banner).width(1200).height(200).url()}
              alt={countryData.bannerAlt || countryData.title}
              width={1200}
              height={200}
              className="w-full h-24 sm:h-48 object-cover rounded-xl"
              priority
            />
          </div>
        )}
        
        {/* Static banner carousel - prerendered; hidden on offer details */}
        {!isOfferDetailsPage && banners && banners.length > 0 && (
          <div className="flex flex-col items-center mb-6">
            <BannerCarousel banners={banners} />
          </div>
        )}
        
        {/* Dynamic offers section - uses PPR with Suspense */}
        <div className="mb-6">
          {children}
        </div>
        
        {/* Static comparison section - prerendered */}
        {comparison && (
          <section className="bg-white rounded-xl p-4 sm:p-6 mb-10 shadow-sm border border-gray-100">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">{comparison.title}</h2>
            <div className="text-gray-600 text-sm">
              <PortableText value={comparison.content} />
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}