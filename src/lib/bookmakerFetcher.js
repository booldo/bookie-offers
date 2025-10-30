import { client } from "../sanity/lib/client";

/**
 * Enhanced bookmaker fetching utility that ensures all bookmakers for a country
 * are included in dropdown options, even those with zero offers.
 * Based on the OffersServer approach with fallback mechanisms.
 */
export async function fetchBookmakersForCountry(countryId, countryName) {
  let allBookmakers = [];
  
  if (countryId) {
    console.log("DEBUG: Fetching bookmakers for countryId:", countryId, "countryName:", countryName);
    
    try {
      // Primary query: fetch by country reference with content check
      const bmList = await client.fetch(
        `*[_type == "bookmaker" && country._ref == $cid] | order(name asc){ 
          name, 
          country,
          "hasContent": (defined(comparison) && count(comparison) > 0) || (defined(faqs) && count(faqs) > 0)
        }`,
        { cid: countryId }
      );
      console.log("DEBUG: Primary bmList result:", bmList);
      
      allBookmakers = bmList || [];
      
      // Fallback query: if no bookmakers found by reference, try by country name
      if (allBookmakers.length === 0 && countryName) {
        console.log("DEBUG: Primary query returned empty, trying fallback by country name");
        const bmListByName = await client.fetch(
          `*[_type == "bookmaker" && country->country == $countryName] | order(name asc){ 
            name, 
            country,
            "hasContent": (defined(comparison) && count(comparison) > 0) || (defined(faqs) && count(faqs) > 0)
          }`,
          { countryName }
        );
        console.log("DEBUG: Fallback bmListByName result:", bmListByName);
        allBookmakers = bmListByName || [];
      }
    } catch (error) {
      console.error("Error fetching bookmakers:", error);
      allBookmakers = [];
    }
  }
  
  console.log("DEBUG: Final allBookmakers:", allBookmakers);
  return allBookmakers;
}

/**
 * Process bookmaker options by merging offer counts with complete bookmaker list
 * This ensures all bookmakers appear in dropdowns, even with 0 offers
 */
export function processBookmakerOptions(offers, allBookmakers) {
  // Count bookmakers from actual offers
  const bookmakerCount = {};
  offers.forEach((offer) => {
    const bm = offer.bookmaker?.name || "Other";
    bookmakerCount[bm] = (bookmakerCount[bm] || 0) + 1;
  });
  
  // Create a map of bookmaker names to their hasContent status
  const bookmakerContentMap = {};
  allBookmakers.forEach((bm) => {
    if (typeof bm === 'object' && bm.name) {
      bookmakerContentMap[bm.name] = bm.hasContent || false;
    }
  });
  
  // Merge with complete bookmaker list to include zero-offer bookmakers
  const bookmakerNames = allBookmakers.map(bm => typeof bm === 'object' ? bm.name : bm).filter(Boolean);
  const bookmakerSet = new Set([
    ...Object.keys(bookmakerCount), 
    ...bookmakerNames
  ]);
  
  const bookmakerOptions = Array.from(bookmakerSet)
    .map((name) => ({ 
      name, 
      count: bookmakerCount[name] || 0,
      hasContent: bookmakerContentMap[name] || false
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  console.log("DEBUG: Processed bookmakerOptions (including 0 offers):", bookmakerOptions);
  return bookmakerOptions;
}

/**
 * Fetch bonus types for a country (used for consistency)
 */
export async function fetchBonusTypesForCountry(countryId) {
  if (!countryId) return [];
  
  try {
    const btList = await client.fetch(
      `*[_type == "bonusType" && country._ref == $cid] | order(name asc){ name }`,
      { cid: countryId }
    );
    return btList?.map((b) => b.name).filter(Boolean) || [];
  } catch (error) {
    console.error("Error fetching bonus types:", error);
    return [];
  }
}
