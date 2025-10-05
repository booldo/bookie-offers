export const dynamic = "force-dynamic";

import CountryPageShell from "../CountryPageShell";
import DynamicOffers from "../DynamicOffers";
import OfferDetailsInner from "./OfferDetailsInner";
import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { client } from "../../../sanity/lib/client";
import { urlFor } from "../../../sanity/lib/image";
import { PortableText } from "@portabletext/react";

// Custom components for PortableText rendering
const portableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="mb-4 text-gray-800 leading-relaxed">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 mb-4">
        {children}
      </blockquote>
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
    bullet: ({ children }) => <li className="text-gray-800">{children}</li>,
    number: ({ children }) => <li className="text-gray-800">{children}</li>,
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    ),
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target={value?.blank ? "_blank" : "_self"}
        rel={value?.blank ? "noopener noreferrer" : undefined}
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
            alt={value.alt || ""}
            className="w-full h-auto rounded-lg shadow-sm"
          />
          {value.caption && (
            <p className="text-sm text-gray-600 mt-2 text-center italic">
              {value.caption}
            </p>
          )}
        </div>
      );
    },
  },
};

// Dynamic route - no static generation needed

// Generate metadata for filter pages and pretty links
export async function generateMetadata({ params }) {
  const awaitedParams = await params;

  // Affiliate pretty link metadata (supports multi-segment pretty links like bookmaker/bonus-type[-n])
  try {
    const segments = awaitedParams.filters || [];
    const prettyJoined = Array.isArray(segments) ? segments.join("/") : "";
    if (prettyJoined) {
      const affiliateLink = await client.fetch(
        `
        *[_type == "affiliate" && prettyLink.current == $prettyLink && isActive == true][0]{
          bookmaker->{
            name,
            logo,
            logoAlt,
            description,
            country->{ country, slug }
          },
          bonusType->{ name, description }
        }
      `,
        { prettyLink: prettyJoined }
      );

      if (affiliateLink) {
        const { bookmaker, bonusType } = affiliateLink;
        const title = `${bonusType?.name} - ${bookmaker?.name} | Booldo`;
        const description = `Get ${bonusType?.name} from ${bookmaker?.name}. ${bonusType?.description || ""}`;
        return {
          title,
          description,
          openGraph: {
            title,
            description,
            images: bookmaker?.logo ? [{ url: bookmaker.logo, alt: bookmaker.name }] : [],
          },
        };
      }
    }
  } catch (error) {
    console.error(
      "Error generating metadata for affiliate pretty link:",
      error
    );
  }

  // Check if this is an offer details page (has 2+ segments: country/bonus-type/offer-slug)
  const isOfferDetailsPage =
    awaitedParams.filters && awaitedParams.filters.length >= 2;

  if (isOfferDetailsPage) {
    try {
      const countrySlug = awaitedParams.slug;
      const offerSlug = awaitedParams.filters[awaitedParams.filters.length - 1];

      // Fetch offer metadata including SEO fields
      const offerData = await client.fetch(
        `
        *[_type == "offers" && slug.current == $offerSlug][0]{
          title,
          metaTitle,
          metaDescription,
          noindex,
          nofollow,
          canonicalUrl,
          sitemapInclude,
          bookmaker->{
            name,
            logo,
            logoAlt
          },
          bonusType->{
            name
          },
          country->{
            country
          }
        }
      `,
        { offerSlug }
      );

      if (offerData) {
        const title =
          offerData.metaTitle ||
          `${offerData.title} - ${offerData.bookmaker?.name} | Booldo`;
        const description =
          offerData.metaDescription ||
          `Get ${offerData.bonusType?.name || "exclusive"} bonus from ${offerData.bookmaker?.name}. ${offerData.title}`;

        // Build metadata object with SEO fields
        const metadata = {
          title,
          description,
          openGraph: {
            title,
            description,
            images: offerData.bookmaker?.logo
              ? [{ url: offerData.bookmaker.logo, alt: offerData.bookmaker.name }]
              : [],
          },
        };

        // Apply robots meta tags if specified
        if (offerData.noindex === true || offerData.nofollow === true) {
          const robots = [];
          if (offerData.noindex === true) robots.push("noindex");
          if (offerData.nofollow === true) robots.push("nofollow");
          if (robots.length > 0) {
            metadata.robots = robots.join(", ");
          }
        }

        // Apply canonical URL if specified
        if (offerData.canonicalUrl) {
          metadata.alternates = {
            canonical: offerData.canonicalUrl,
          };
        } else {
          // Use dynamic canonical URL based on country and offer
          metadata.alternates = {
            canonical: `https://booldo.com/${countrySlug}/offers/${offerSlug}`,
          };
        }

        return metadata;
      }
    } catch (error) {
      console.error("Error generating metadata for offer details:", error);
    }
  }

  // Check if this is a pretty link (single segment) or a single filter page
  if (awaitedParams.filters && awaitedParams.filters.length === 1) {
    const singleFilter = awaitedParams.filters[0];

    try {
      // First: Check if this is a Menu Page
      const menuDoc = await client.fetch(
        `*[_type == "hamburgerMenu" && slug.current == $slug][0]{
        title,
        metaTitle,
        metaDescription,
        noindex,
        nofollow,
        canonicalUrl,
        sitemapInclude,
        selectedPage->{
          _type,
          slug
        }
      }`,
        { slug: singleFilter }
      );

      if (
        menuDoc &&
        menuDoc.selectedPage?._type === "countryPage" &&
        menuDoc.selectedPage?.slug?.current === awaitedParams.slug
      ) {
        const title = menuDoc.metaTitle || `${menuDoc.title} | Booldo`;
        const description =
          menuDoc.metaDescription || `Learn more about ${menuDoc.title}.`;

        const metadata = {
          title,
          description,
          openGraph: {
            title,
            description,
          },
        };

        // Apply robots meta tags if specified
        if (menuDoc.noindex === true || menuDoc.nofollow === true) {
          const robots = [];
          if (menuDoc.noindex === true) robots.push("noindex");
          if (menuDoc.nofollow === true) robots.push("nofollow");
          if (robots.length > 0) {
            metadata.robots = robots.join(", ");
          }
        }

        // Apply canonical URL if specified
        if (menuDoc.canonicalUrl) {
          metadata.alternates = { canonical: menuDoc.canonicalUrl };
        } else {
          metadata.alternates = {
            canonical: `https://booldo.com/${awaitedParams.slug}/${singleFilter}`,
          };
        }

        return metadata;
      }

      // Pretty link handling
      const affiliateLink = await client.fetch(
        `
        *[_type == "affiliate" && prettyLink.current == $prettyLink && isActive == true][0]{
          bookmaker->{
            name,
            logo,
            logoAlt,
            description,
            country->{
              country,
              slug
            }
          },
          bonusType->{
            name,
            description
          }
        }
      `,
        { prettyLink: singleFilter }
      );

      if (affiliateLink) {
        const { bookmaker, bonusType } = affiliateLink;
        const title = `${bonusType?.name} - ${bookmaker?.name} | Booldo`;
        const description = `Get ${bonusType?.name} from ${bookmaker?.name}. ${bonusType?.description || ""}`;

        return {
          title,
          description,
          openGraph: {
            title,
            description,
            images: bookmaker?.logo ? [{ url: bookmaker.logo, alt: bookmaker.name }] : [],
          },
        };
      }

      // Resolve country name
      const countryDoc = await client.fetch(
        `*[_type == "countryPage" && slug.current == $slug][0]{country, metaTitle, metaDescription, noindex, nofollow, canonicalUrl}`,
        { slug: awaitedParams.slug }
      );
      const countryName = countryDoc?.country;

      if (countryName) {
        // Try bookmaker metadata by name within this country
        const bookmaker = await client.fetch(
          `*[_type == "bookmaker" && country->country == $country && name match $name][0]{
          metaTitle, metaDescription, logo, noindex, nofollow, canonicalUrl
        }`,
          { country: countryName, name: singleFilter.replace(/-/g, " ") }
        );
        if (bookmaker) {
          const title =
            bookmaker.metaTitle ||
            `${singleFilter.replace(/-/g, " ")} | Booldo`;
          const description =
            bookmaker.metaDescription ||
            `Explore offers and information for ${singleFilter.replace(/-/g, " ")} in ${countryName}.`;

          const metadata = { title, description };

          // Apply robots meta tags if specified
          if (bookmaker.noindex === true || bookmaker.nofollow === true) {
            const robots = [];
            if (bookmaker.noindex === true) robots.push("noindex");
            if (bookmaker.nofollow === true) robots.push("nofollow");
            if (robots.length > 0) {
              metadata.robots = robots.join(", ");
            }
          }

          // Apply canonical URL if specified
          if (bookmaker.canonicalUrl) {
            metadata.alternates = { canonical: bookmaker.canonicalUrl };
          } else {
            metadata.alternates = {
              canonical: `https://booldo.com/${awaitedParams.slug}/${singleFilter}`,
            };
          }

          return metadata;
        }

        // Try bonus type metadata by name within this country
        const bonusType = await client.fetch(
          `*[_type == "bonusType" && country->country == $country && name match $name][0]{
          metaTitle, metaDescription, noindex, nofollow, canonicalUrl
        }`,
          { country: countryName, name: singleFilter.replace(/-/g, " ") }
        );
        if (bonusType) {
          const title =
            bonusType.metaTitle ||
            `${singleFilter.replace(/-/g, " ")} | Booldo`;
          const description =
            bonusType.metaDescription ||
            `Discover ${singleFilter.replace(/-/g, " ")} offers in ${countryName}.`;

          const metadata = { title, description };

          // Apply robots meta tags if specified
          if (bonusType.noindex === true || bonusType.nofollow === true) {
            const robots = [];
            if (bonusType.noindex === true) robots.push("noindex");
            if (bonusType.nofollow === true) robots.push("nofollow");
            if (robots.length > 0) {
              metadata.robots = robots.join(", ");
            }
          }

          // Apply canonical URL if specified
          if (bonusType.canonicalUrl) {
            metadata.alternates = { canonical: bonusType.canonicalUrl };
          } else {
            metadata.alternates = {
              canonical: `https://booldo.com/${awaitedParams.slug}/${singleFilter}`,
            };
          }

          return metadata;
        }

        // Combination filter (contains '-') or fallback: use country page metadata
        if (singleFilter.includes("-") || countryDoc) {
          const metadata = {
            title: countryDoc.metaTitle || `${countryName} Offers | Booldo`,
            description:
              countryDoc.metaDescription ||
              `Find the best offers and bookmakers in ${countryName}.`,
          };

          // Apply robots meta tags if specified
          if (countryDoc.noindex === true || countryDoc.nofollow === true) {
            const robots = [];
            if (countryDoc.noindex === true) robots.push("noindex");
            if (countryDoc.nofollow === true) robots.push("nofollow");
            if (robots.length > 0) {
              metadata.robots = robots.join(", ");
            }
          }

          // Apply canonical URL if specified
          if (countryDoc.canonicalUrl) {
            metadata.alternates = { canonical: countryDoc.canonicalUrl };
          } else {
            metadata.alternates = {
              canonical: `https://booldo.com/${awaitedParams.slug}`,
            };
          }

          return metadata;
        }
      }
    } catch (error) {
      console.error("Error generating metadata for single filter:", error);
    }
  }

  // Default metadata for filter pages (fallback)
  return {
    title: "Offers | Booldo",
    description: "Find the best bonuses and offers.",
  };
}

import { getVisibleDocOrNull } from "../../../sanity/lib/checkGoneStatus";

export default async function CountryFiltersPage({ params }) {
  const awaitedParams = await params;

  // Validate country slug at the top - CRITICAL for 404 handling
  console.log(" Validating country slug:", awaitedParams.slug);
  const validCountry = await client.fetch(
    `*[_type == "countryPage" && slug.current == $slug][0]{_id}`,
    { slug: awaitedParams.slug }
  );
  if (!validCountry) {
    console.log(" Invalid country slug, returning 404:", awaitedParams.slug);
    return notFound(); // This will render the Next.js 404 page
  }
  console.log(" Valid country found:", awaitedParams.slug);

  // Temporary debugging - remove after testing
  console.log(" DEBUG - Full params:", awaitedParams);
  console.log(" DEBUG - Slug:", awaitedParams.slug);
  console.log(" DEBUG - Filters:", awaitedParams.filters);
  console.log(
    " DEBUG - URL path:",
    `/${awaitedParams.slug}/${(awaitedParams.filters || []).join("/")}`
  );

  // Debug: Let's see what affiliate links exist in Sanity
  try {
    const allAffiliateLinks = await client.fetch(`
      *[_type == "affiliate" && isActive == true]{
        _id,
        affiliateUrl,
        prettyLink,
        bookmaker->{ name },
        bonusType->{ name }
      }
    `);
    console.log(
      "DEBUG - All active affiliate links in Sanity:",
      allAffiliateLinks
    );
  } catch (error) {
    console.error("Error fetching all affiliate links:", error);
  }

  // Handle affiliate pretty links FIRST - before any other logic
  const segments = awaitedParams.filters || [];

  // Check for pretty links in different formats
  if (segments.length > 0) {
    // Try the full joined path first (e.g., "betika/welcome-bonus-2")
    const fullPath = segments.join("/");
    console.log("DEBUG - Checking full path:", fullPath);

    // Query for active affiliate links with this pretty link
    const affiliateLink = await client.fetch(
      `
      *[_type == "affiliate" && isActive == true && prettyLink.current == $prettyLink][0]{
        _id,
        affiliateUrl,
        prettyLink
      }
    `,
      { prettyLink: fullPath }
    );

    console.log("DEBUG - Affiliate link found for full path:", affiliateLink);

    if (affiliateLink?.affiliateUrl) {
      console.log(
        "DEBUG - Redirecting to affiliate URL:",
        affiliateLink.affiliateUrl
      );
      // Redirect to the affiliate URL - this will throw NEXT_REDIRECT and exit the function
      redirect(affiliateLink.affiliateUrl);
    }

    // If no match found, try single segment (for single-segment pretty links)
    if (segments.length === 1) {
      const singleSegment = segments[0];
      console.log("DEBUG - Checking single segment:", singleSegment);

      const singleAffiliateLink = await client.fetch(
        `
        *[_type == "affiliate" && isActive == true && prettyLink.current == $prettyLink][0]{
          _id,
          affiliateUrl,
          prettyLink
        }
      `,
        { prettyLink: singleSegment }
      );

      console.log(
        "DEBUG - Single segment affiliate link:",
        singleAffiliateLink
      );

      if (singleAffiliateLink?.affiliateUrl) {
        console.log(
          "DEBUG - Redirecting single segment to affiliate URL:",
          singleAffiliateLink.affiliateUrl
        );
        // Redirect to the affiliate URL - this will throw NEXT_REDIRECT and exit the function
        redirect(singleAffiliateLink.affiliateUrl);
      }
    }

    // If still no match, check if this could be a bookmaker/bonus-type format
    // Pretty links are stored as "bookmaker/bonus-type" in Sanity
    if (segments.length === 2) {
      const bookmakerBonusType = segments.join("/");
      console.log(
        "DEBUG - Checking bookmaker/bonus-type format:",
        bookmakerBonusType
      );

      const bookmakerBonusTypeLink = await client.fetch(
        `
        *[_type == "affiliate" && isActive == true && prettyLink.current == $prettyLink][0]{
          _id,
          affiliateUrl,
          prettyLink
        }
      `,
        { prettyLink: bookmakerBonusType }
      );

      console.log(
        "DEBUG - Bookmaker/bonus-type affiliate link:",
        bookmakerBonusTypeLink
      );

      if (bookmakerBonusTypeLink?.affiliateUrl) {
        console.log(
          "DEBUG - Redirecting bookmaker/bonus-type to affiliate URL:",
          bookmakerBonusTypeLink.affiliateUrl
        );
        // Redirect to the affiliate URL - this will throw NEXT_REDIRECT and exit the function
        redirect(bookmakerBonusTypeLink.affiliateUrl);
      }
    }
  }

  console.log(
    "DEBUG - No affiliate redirect found, continuing with normal processing"
  );

  // Check if this is an offer details page (has 2+ segments: country/bonus-type/offer-slug)
  const isOfferDetailsPage =
    awaitedParams.filters && awaitedParams.filters.length >= 2;
  if (isOfferDetailsPage) {
    const offerSlug = awaitedParams.filters[awaitedParams.filters.length - 1];
    // Server-side check for gone offer
    const offer = await getVisibleDocOrNull("offers", offerSlug);
    if (!offer) {
      notFound();
    }
    // Extract the offer slug from the last segment
    return (
      <CountryPageShell params={awaitedParams} isOfferDetailsPage={true}>
        <Suspense
          fallback={
            <div className="flex justify-center items-center py-20">
              <div className="flex space-x-2">
                <div
                  className="w-3 h-3 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-3 h-3 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-3 h-3 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          }
        >
          <OfferDetailsInner slug={offerSlug} />
        </Suspense>
      </CountryPageShell>
    );
  }

  // Check if this is a multiple filters page (/offers/)
  const isMultipleFiltersPage =
    awaitedParams.filters &&
    awaitedParams.filters.length === 1 &&
    awaitedParams.filters[0] === "offers";
  if (isMultipleFiltersPage) {
    console.log("DEBUG - Handling multiple filters page");
    return (
      <CountryPageShell params={awaitedParams} hasMultipleFilters={true}>
        <Suspense
          fallback={
            <div className="flex justify-center items-center py-20">
              <div
                className="w-3 h-3 bg-gray-500 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-3 h-3 bg-gray-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-3 h-3 bg-gray-500 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
          }
        >
          <DynamicOffers
            countrySlug={awaitedParams.slug}
            initialFilter={null}
            filterInfo={null}
          />
        </Suspense>
      </CountryPageShell>
    );
  }

  // Check if this is a single filter page (country/filter) - excluding 'offers' which is handled separately
  const isSingleFilterPage =
    awaitedParams.filters &&
    awaitedParams.filters.length === 1 &&
    awaitedParams.filters[0] !== "offers";
  const singleFilter = isSingleFilterPage ? awaitedParams.filters[0] : null;

  // Check if this might be a pretty link (single segment that could be an affiliate link)
  if (isSingleFilterPage && singleFilter) {
    // First: handle Menu Page at country level: /{country}/{menuSlug}
    const menuDoc = await client.fetch(
      `*[_type == "hamburgerMenu" && slug.current == $slug][0]{
      title,
      slug,
      content,
      noindex,
      nofollow,
      canonicalUrl,
      sitemapInclude,
      selectedPage->{
        _type,
        slug
      }
    }`,
      { slug: singleFilter }
    );
    if (
      menuDoc &&
      menuDoc.selectedPage?._type == "countryPage" &&
      menuDoc.selectedPage?.slug?.current == awaitedParams.slug
    ) {
      // Render the menu page content within the country shell
      if (menuDoc.noindex === true || menuDoc.sitemapInclude === false) {
        return (
          <CountryPageShell
            params={awaitedParams}
            hasMultipleFilters={false}
            hideBannerCarousel={true}
          >
            <div className="min-h-[50vh] flex items-center justify-center">
              <div className="text-center text-gray-600">
                This menu page is hidden.
              </div>
            </div>
          </CountryPageShell>
        );
      }
      return (
        <CountryPageShell
          params={awaitedParams}
          hasMultipleFilters={false}
          hideBannerCarousel={true}
        >
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-4 sm:mb-6 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
              <Link
                href={`/${awaitedParams.slug}`}
                className="hover:underline flex items-center gap-1 flex-shrink-0 focus:outline-none"
                aria-label="Go back"
              >
                <img
                  src="/assets/back-arrow.png"
                  alt="Back"
                  width={24}
                  height={24}
                />
                Home
              </Link>
            </div>
            <div className="w-full">
              {Array.isArray(menuDoc.content) && menuDoc.content.length > 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-6 text-gray-800 leading-relaxed font-['General_Sans']">
                  <PortableText
                    value={menuDoc.content}
                    components={portableTextComponents}
                  />
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  No content available for this menu item.
                </div>
              )}
            </div>
          </div>
        </CountryPageShell>
      );
    }

    console.log(
      "DEBUG - Checking single filter for pretty link:",
      singleFilter
    );

    // Check if this is a pretty link for an affiliate
    const affiliateLink = await client.fetch(
      `
      *[_type == "affiliate" && isActive == true && prettyLink.current == $prettyLink][0]{
          _id,
          affiliateUrl,
          bookmaker->{
            _id,
            name,
            logo,
            logoAlt,
            description,
            country->{
              country,
              slug
            }
          },
          bonusType->{
            name,
            description
          }
        }
      `,
      { prettyLink: singleFilter }
    );

    console.log("DEBUG - Single filter affiliate link found:", affiliateLink);

    if (affiliateLink && affiliateLink.affiliateUrl) {
      console.log(
        "DEBUG - Redirecting single filter to affiliate URL:",
        affiliateLink.affiliateUrl
      );
      // Redirect to the affiliate URL - this will throw NEXT_REDIRECT and exit the function
      redirect(affiliateLink.affiliateUrl);
    }
  }

  // For single filters that don't match special cases, allow them to be processed as regular filters
  // The DynamicOffers component will handle filtering and show appropriate results
  if (isSingleFilterPage && singleFilter) {
    console.log("🔍 Processing single filter:", singleFilter);

    // Check if the filter matches a valid bookmaker or bonus type
    const country = await client.fetch(
      `*[_type == "countryPage" && slug.current == $slug][0]{country}`,
      { slug: awaitedParams.slug }
    );
    let isValidFilter = false;
    if (country?.country) {
      // Check bookmaker
      const bookmaker = await client.fetch(
        `*[_type == "bookmaker" && country->country == $country && name match $name][0]{_id}`,
        { country: country.country, name: singleFilter.replace(/-/g, " ") }
      );
      if (bookmaker) isValidFilter = true;
      // Check bonus type
      if (!isValidFilter) {
        const bonusType = await client.fetch(
          `*[_type == "bonusType" && country->country == $country && name match $name][0]{_id}`,
          { country: country.country, name: singleFilter.replace(/-/g, " ") }
        );
        if (bonusType) isValidFilter = true;
      }
    }
    // If not a valid filter, show 404
    if (!isValidFilter) {
      return notFound();
    }
  }

  // Check if this is a combination filter page (country/filter1-filter2)
  const isCombinationFilterPage =
    isSingleFilterPage && singleFilter && singleFilter.includes("-");
  let filterInfo = null;

  if (isCombinationFilterPage) {
    // Parse combination filter (e.g., "free-bet-1bet" -> ["free-bet", "1bet"])
    const filterParts = singleFilter.split("-");

    if (filterParts.length >= 2) {
      // Determine the type of combination based on the number of parts
      let combinationType = "unknown";
      if (filterParts.length === 2) {
        combinationType = "2-way";
      } else if (filterParts.length === 3) {
        combinationType = "3-way";
      } else if (filterParts.length === 4) {
        combinationType = "4-way";
      } else if (filterParts.length >= 5) {
        combinationType = "5-way+";
      }

      filterInfo = {
        type: "combination",
        parts: filterParts,
        original: singleFilter,
        combinationType: combinationType,
        partCount: filterParts.length,
      };
    }
  } else if (isSingleFilterPage) {
    filterInfo = {
      type: "single",
      value: singleFilter,
    };
  }

  // For single filter pages, try to load home content/faq for bookmaker or bonus type
  let filterComparison = null;
  let filterFaqs = null;
  if (isSingleFilterPage && singleFilter) {
    const country = await client.fetch(
      `*[_type == "countryPage" && slug.current == $slug][0]{country}`,
      { slug: awaitedParams.slug }
    );
    if (country?.country) {
      // Try bookmaker first
      const bookmaker = await client.fetch(
        `*[_type == "bookmaker" && country->country == $country && name match $name][0]{
        comparison,
        faqs,
        metaTitle,
        metaDescription
      }`,
        { country: country.country, name: singleFilter.replace(/-/g, " ") }
      );
      if (bookmaker) {
        filterComparison = bookmaker.comparison || null;
        filterFaqs = bookmaker.faqs || null;
      } else {
        // Try bonus type
        const bonusType = await client.fetch(
          `*[_type == "bonusType" && country->country == $country && name match $name][0]{
          comparison,
          faqs,
          metaTitle,
          metaDescription
        }`,
          { country: country.country, name: singleFilter.replace(/-/g, " ") }
        );
        if (bonusType) {
          filterComparison = bonusType.comparison || null;
          filterFaqs = bonusType.faqs || null;
        }
      }
    }
  }

  return (
    <CountryPageShell
      params={awaitedParams}
      filterComparison={filterComparison}
      filterFaqs={filterFaqs}
      hasMultipleFilters={isCombinationFilterPage}
    >
      <Suspense
        fallback={
          <div className="space-y-4">
            {/* Filter skeleton */}
            <div className="sticky top-16 z-10 bg-white sm:static sm:bg-transparent">
              <div className="flex items-center justify-between my-4">
                <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
              <div className="sm:max-w-md">
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-10 bg-gray-200 rounded animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Offer cards skeleton */}
            <div className="flex flex-col gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse"
                >
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
        }
      >
        <DynamicOffers
          countrySlug={awaitedParams.slug}
          initialFilter={singleFilter}
          filterInfo={filterInfo}
        />
      </Suspense>
    </CountryPageShell>
  );
}
