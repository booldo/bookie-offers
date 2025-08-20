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
        slug,
        country,
        "bonusTypes": *[_type == "bonusType" && country._ref == ^._id]{
          name
        },
        "bookmakers": *[_type == "bookmaker" && country._ref == ^._id]{
          name
        },
        "paymentMethods": *[_type == "offers" && country._ref == ^._id]{
          bookmaker->{
            paymentMethods[]->{
              name
            }
          }
        }
      }
    `);
    
    const params = [];
    
    for (const country of countries) {
      const countrySlug = country.slug.current;
      
      // Add base country page
      params.push({ slug: countrySlug });
      
      // Add bonus type filter pages
      country.bonusTypes?.forEach(bonusType => {
        if (bonusType.name) {
          params.push({ 
            slug: countrySlug,
            filters: [bonusType.name.toLowerCase().replace(/\s+/g, '-')]
          });
        }
      });
      
      // Add bookmaker filter pages
      country.bookmakers?.forEach(bookmaker => {
        if (bookmaker.name) {
          params.push({ 
            slug: countrySlug,
            filters: [bookmaker.name.toLowerCase().replace(/\s+/g, '-')]
          });
        }
      });
      
      // Add payment method filter pages (unique payment methods)
      const uniquePaymentMethods = new Set();
      country.paymentMethods?.forEach(offer => {
        offer.bookmaker?.paymentMethods?.forEach(pm => {
          if (pm?.name) {
            uniquePaymentMethods.add(pm.name);
          }
        });
      });
      
      uniquePaymentMethods.forEach(pmName => {
        params.push({ 
          slug: countrySlug,
          filters: [pmName.toLowerCase().replace(/\s+/g, '-')]
        });
      });

      // Generate combination filter pages
      // Bonus Type + Bookmaker combinations
      country.bonusTypes?.forEach(bonusType => {
        country.bookmakers?.forEach(bookmaker => {
          if (bonusType.name && bookmaker.name) {
            params.push({ 
              slug: countrySlug,
              filters: [`${bonusType.name.toLowerCase().replace(/\s+/g, '-')}-${bookmaker.name.toLowerCase().replace(/-/g, ' ')}`]
            });
          }
        });
      });

      // Bonus Type + Payment Method combinations
      country.bonusTypes?.forEach(bonusType => {
        uniquePaymentMethods.forEach(pmName => {
          if (bonusType.name && pmName) {
            params.push({ 
              slug: countrySlug,
              filters: [`${bonusType.name.toLowerCase().replace(/\s+/g, '-')}-${pmName.toLowerCase().replace(/\s+/g, '-')}`]
            });
          }
        });
      });

      // Bookmaker + Payment Method combinations
      country.bookmakers?.forEach(bookmaker => {
        uniquePaymentMethods.forEach(pmName => {
          if (bookmaker.name && pmName) {
            params.push({ 
              slug: countrySlug,
              filters: [`${bookmaker.name.toLowerCase().replace(/\s+/g, '-')}-${pmName.toLowerCase().replace(/\s+/g, '-')}`]
            });
          }
        });
      });

      // Three-way combinations: Bonus Type + Bookmaker + Payment Method
      country.bonusTypes?.forEach(bonusType => {
        country.bookmakers?.forEach(bookmaker => {
          uniquePaymentMethods.forEach(pmName => {
            if (bonusType.name && bookmaker.name && pmName) {
              params.push({ 
                slug: countrySlug,
                filters: [`${bonusType.name.toLowerCase().replace(/\s+/g, '-')}-${bookmaker.name.toLowerCase().replace(/\s+/g, '-')}-${pmName.toLowerCase().replace(/\s+/g, '-')}`]
              });
            }
          });
        });
      });

      // Four-way combinations: Bonus Type + Bookmaker + Payment Method + Country-specific
      country.bonusTypes?.forEach(bonusType => {
        country.bookmakers?.forEach(bookmaker => {
          uniquePaymentMethods.forEach(pmName => {
            if (bonusType.name && bookmaker.name && pmName) {
              // Add a country-specific identifier
              const countryIdentifier = countrySlug.toUpperCase();
              params.push({ 
                slug: countrySlug,
                filters: [`${bonusType.name.toLowerCase().replace(/\s+/g, '-')}-${bookmaker.name.toLowerCase().replace(/\s+/g, '-')}-${pmName.toLowerCase().replace(/\s+/g, '-')}-${countryIdentifier}`]
              });
            }
          });
        });
      });

      // Five-way combinations: Bonus Type + Bookmaker + Payment Method + Country + Special
      country.bonusTypes?.forEach(bonusType => {
        country.bookmakers?.forEach(bookmaker => {
          uniquePaymentMethods.forEach(pmName => {
            if (bonusType.name && bookmaker.name && pmName) {
              // Add multiple identifiers for comprehensive filtering
              const countryIdentifier = countrySlug.toUpperCase();
              const specialIdentifier = 'premium';
              params.push({ 
                slug: countrySlug,
                filters: [`${bonusType.name.toLowerCase().replace(/\s+/g, '-')}-${bookmaker.name.toLowerCase().replace(/\s+/g, '-')}-${pmName.toLowerCase().replace(/\s+/g, '-')}-${countryIdentifier}-${specialIdentifier}`]
              });
            }
          });
        });
      });

      // Note: Pretty links are handled dynamically by the route handler to enable redirects
      // We don't generate static params for them to ensure the redirect logic works properly
    }
    
    return params;
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
      sitemapInclude,
      comparison,
      faqs
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

    const [banners] = await Promise.all([
      client.fetch(bannersQuery, { country: countryData.country }),
    ]);

    return { 
      countryData, 
      banners: banners.map(b => {
        // Validate image object before processing
        let imageUrl = undefined;
        if (b.image && b.image._type === 'image' && b.image.asset) {
          try {
            imageUrl = urlFor(b.image).width(1200).height(200).url();
          } catch (error) {
            console.warn('Invalid banner image structure:', b.image);
            imageUrl = undefined;
          }
        }
        
        return {
          ...b,
          imageUrl,
          imageAlt: b.imageAlt || b.title
        };
      }).filter(b => b.imageUrl) // Only include banners with valid images
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

  const { countryData } = data;
  
  return {
    title: countryData.metaTitle || `Best Betting Sites ${countryData.country} | Booldo`,
    description: countryData.metaDescription || `Discover the best betting sites in ${countryData.country} with exclusive bonuses and offers.`,
    robots: [
      countryData.noindex ? "noindex" : "index",
      countryData.nofollow ? "nofollow" : "follow"
    ].join(", "),
    alternates: {
      canonical: countryData.canonicalUrl || undefined,
    },
  };
}

// Main country page shell component
export default async function CountryPageShell({ params, children, isOfferDetailsPage = false, filterComparison = null, filterFaqs = null }) {
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

  const { countryData, banners } = data;

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <Navbar />
      <main className="max-w-7xl mx-auto w-full px-2 sm:px-4 flex-1">
        {/* Static country banner - prerendered */}
        {countryData.banner && countryData.banner._type === 'image' && countryData.banner.asset && (
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
        
        {/* Static comparison + FAQ section - prerendered */}
        {((filterComparison) || (filterFaqs && filterFaqs.length > 0) || countryData.comparison || (countryData.faqs && countryData.faqs.length > 0)) && (
          <section className="bg-white rounded-xl p-4 sm:p-6 mb-10 shadow-sm border border-gray-100">
            {(filterComparison || countryData.comparison) && (
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold mb-3">Comparison</h2>
                <div className="text-gray-600 text-sm">
                  <PortableText value={filterComparison || countryData.comparison} />
                </div>
              </div>
            )}
            {((filterFaqs && filterFaqs.length > 0) || (countryData.faqs && countryData.faqs.length > 0)) && (
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold mb-3">FAQs</h2>
                <div className="space-y-3">
                  {(filterFaqs || countryData.faqs).map((faq, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3">
                      <div className="font-medium text-gray-900 mb-1">{faq.question}</div>
                      <div className="text-gray-700 text-sm whitespace-pre-line">{faq.answer}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}