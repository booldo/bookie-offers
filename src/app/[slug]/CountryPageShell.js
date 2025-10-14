import { client } from "../../sanity/lib/client";
import { urlFor } from "../../sanity/lib/image";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Image from "next/image";
import BannerCarousel from "../../components/BannerCarousel";
import { PortableText } from '@portabletext/react';
import { Suspense } from "react";
import ExpiredOfferPage from "./[...filters]/ExpiredOfferPage";
import FAQSection from "../../components/FAQSection";

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
    h5: ({ children }) => (
      <h5 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">{children}</h5>
    ),
    h6: ({ children }) => (
      <h6 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">{children}</h6>
    ),
    normal: ({ children }) => (
      <p className="mb-4 text-gray-800 leading-relaxed">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 mb-4">{children}</blockquote>
    ),
    code: ({ children }) => (
      <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4"><code className="text-sm font-mono">{children}</code></pre>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
    ),
    checkmarks: ({ children }) => (
      <ul className="list-none mb-4 space-y-1">{children}</ul>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="text-gray-800">{children}</li>
    ),
    number: ({ children }) => (
      <li className="text-gray-800">{children}</li>
    ),
    checkmarks: ({ children }) => (
      <li className="flex items-start">
        <span className="text-green-500 mr-2">✓</span>
        <span className="text-gray-800">{children}</span>
      </li>
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
    underline: ({ children }) => (
      <span className="underline">{children}</span>
    ),
    'strike-through': ({ children }) => (
      <span className="line-through">{children}</span>
    ),
    highlight: ({ children }) => (
      <span className="bg-yellow-200 px-1 rounded">{children}</span>
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
    email: ({ children, value }) => (
      <a 
        href={`mailto:${value?.href}`}
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

// Generate static params for all active countries
export async function generateStaticParams() {
  try {
    const countries = await client.fetch(`
      *[_type == "countryPage" && isActive == true && (noindex != true) && (sitemapInclude != false)]{
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
      pageTitle,
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
    
    // Check if country is hidden and return special flag
    if (countryData.noindex === true || countryData.sitemapInclude === false) {
      return { isHidden: true, countryData };
    }
    
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
export default async function CountryPageShell({ params, children, isOfferDetailsPage = false, filterComparison = null, filterFaqs = null, hasMultipleFilters = false, hideBannerCarousel = false }) {
  const awaitedParams = await params;
  const data = await getCountryPageData(awaitedParams.slug);
  
  if (!data) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col">
        <Navbar />
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex-1">
          <div className="flex justify-center items-center py-16 sm:py-20">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 font-['General_Sans']">Country Not Found</h1>
              <p className="text-gray-600 mb-4 font-['General_Sans']">The requested country page could not be found.</p>
              <a href="/" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-['General_Sans']">
                Go Home
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Check if country is hidden and show expired offer page
  if (data.isHidden) {
    return (
      <ExpiredOfferPage 
        isHidden={true}
        contentType="country"
        countrySlug={awaitedParams.slug}
        countryName={data.countryData.country}
        embedded={false}
      />
    );
  }

  const { countryData, banners } = data;

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <Navbar />
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex-1">
        {/* Static country banner - prerendered */}
        {countryData.banner && countryData.banner._type === 'image' && countryData.banner.asset && (
          <div className="mb-4 sm:mb-6">
            <Image
              src={urlFor(countryData.banner).width(1200).height(200).url()}
              alt={countryData.bannerAlt || countryData.title}
              width={1200}
              height={200}
              className="w-full h-24 sm:h-32 md:h-48 object-contain bg-gray-50 rounded-xl"
              priority
            />
          </div>
        )}
        
        {/* Static banner carousel - prerendered; hidden on offer details and menu pages */}
        {!isOfferDetailsPage && !hideBannerCarousel && banners && banners.length > 0 && (
          <div className="flex flex-col items-center mb-4 sm:mb-6">
            <BannerCarousel banners={banners} />
          </div>
        )}
        
        {/* Dynamic offers section - uses PPR with Suspense */}
        <div className="mb-4 sm:mb-6">
          {children}
        </div>
        
        {/* Static home content + FAQ section - prerendered */}
        {!isOfferDetailsPage && ((filterComparison && filterComparison.length > 0) || (filterFaqs && filterFaqs.length > 0) || (!filterComparison && countryData.comparison && countryData.comparison.length > 0) || (filterFaqs === null && countryData.faqs && countryData.faqs.length > 0)) && (
          <section className="bg-white rounded-xl p-4 sm:p-6 mb-8 sm:mb-10 shadow-sm border border-gray-100">
            {(filterComparison && filterComparison.length > 0) || (!filterComparison && countryData.comparison && countryData.comparison.length > 0) ? (
              <div className="mb-4 sm:mb-6">
                <div className="text-gray-600 text-sm sm:text-base font-['General_Sans']">
                  <PortableText
                    value={filterComparison || countryData.comparison}
                    components={portableTextComponents}
                  />
                </div>
              </div>
            ) : null}
            {(filterFaqs !== null && filterFaqs.length > 0) || (filterFaqs === null && countryData.faqs && countryData.faqs.length > 0) ? (
              <FAQSection faqs={filterFaqs !== null && filterFaqs.length > 0 ? filterFaqs : countryData.faqs || []} />
            ) : null}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}