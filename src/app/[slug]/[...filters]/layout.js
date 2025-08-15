import { client } from '../../../sanity/lib/client';

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  
  // Check if this is a single filter page (country/filter)
  const isSingleFilterPage = awaitedParams.filters && awaitedParams.filters.length === 1;
  
  if (!isSingleFilterPage) {
    return {
      title: 'Offers | Booldo',
      description: 'Discover the best betting offers and bonuses.'
    };
  }
  
  try {
    const countrySlug = awaitedParams.slug;
    const filterSlug = awaitedParams.filters[0];
    
    // Fetch country and filter data
    const data = await client.fetch(`
      *[_type == "countryPage" && slug.current == $countrySlug && isActive == true][0]{
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
    `, { countrySlug });
    
    if (!data) {
      return {
        title: 'Filter Not Found | Booldo',
        description: 'The requested filter page could not be found.'
      };
    }
    
    // Find the matching filter
    let filterName = null;
    let filterType = null;
    let combinationInfo = null;
    
    // Check if this is a combination filter
    if (filterSlug.includes('-')) {
      const filterParts = filterSlug.split('-');
      const partCount = filterParts.length;
      
      if (partCount >= 2) {
        // This is a combination filter
        combinationInfo = {
          type: partCount === 2 ? '2-way' : partCount === 3 ? '3-way' : partCount === 4 ? '4-way' : '5-way+',
          parts: filterParts,
          count: partCount
        };
        
        // Try to identify the components of the combination
        let bonusType = null;
        let bookmaker = null;
        let paymentMethod = null;
        let license = null;
        let features = [];
        
        // Parse each part intelligently
        filterParts.forEach((part, index) => {
          const partLower = part.toLowerCase();
          
          // First part: likely bonus type
          if (index === 0) {
            const matchingBonusType = data.bonusTypes?.find(bt => 
              bt.name.toLowerCase().replace(/\s+/g, '-') === partLower
            );
            if (matchingBonusType) bonusType = matchingBonusType.name;
          }
          
          // Second part: likely bookmaker
          if (index === 1) {
            const matchingBookmaker = data.bookmakers?.find(bm => 
              bm.name.toLowerCase().replace(/\s+/g, '-') === partLower
            );
            if (matchingBookmaker) bookmaker = matchingBookmaker.name;
          }
          
          // Third part: likely payment method
          if (index === 2) {
            const uniquePaymentMethods = new Set();
            data.paymentMethods?.forEach(offer => {
              offer.bookmaker?.paymentMethods?.forEach(pm => {
                if (pm?.name) uniquePaymentMethods.add(pm.name);
              });
            });
            
            const matchingPaymentMethod = Array.from(uniquePaymentMethods).find(pm => 
              pm.toLowerCase().replace(/\s+/g, '-') === partLower
            );
            if (matchingPaymentMethod) paymentMethod = matchingPaymentMethod;
          }
          
          // Fourth part: likely license
          if (index === 3) {
            const uniqueLicenses = new Set();
            data.bookmakers?.forEach(bm => {
              if (Array.isArray(bm.license)) {
                bm.license.forEach(lc => {
                  if (lc && typeof lc === 'string') uniqueLicenses.add(lc);
                });
              }
            });
            
            const matchingLicense = Array.from(uniqueLicenses).find(lc => 
              lc.toLowerCase().replace(/\s+/g, '-') === partLower
            );
            if (matchingLicense) license = matchingLicense;
          }
          
          // Fifth+ parts: likely features
          if (index >= 4) {
            const featureMap = {
              'mobile-optimized': 'Mobile Optimized',
              'live-betting': 'Live Betting',
              'instant-withdrawal': 'Instant Withdrawal',
              '24-7-support': '24/7 Support'
            };
            
            const feature = featureMap[partLower] || part;
            features.push(feature);
          }
        });
        
        // Generate combination-specific metadata
        if (bonusType || bookmaker || paymentMethod || license || features.length > 0) {
          filterType = 'combination';
          filterName = [bonusType, bookmaker, paymentMethod, license, ...features].filter(Boolean).join(' + ');
        }
      }
    }
    
    // If not a combination filter, check single filters
    if (!combinationInfo) {
      // Check bonus types
      const matchingBonusType = data.bonusTypes?.find(bt => 
        bt.name.toLowerCase().replace(/\s+/g, '-') === filterSlug
      );
      if (matchingBonusType) {
        filterName = matchingBonusType.name;
        filterType = 'bonus type';
      }
      
      // Check bookmakers
      if (!filterName) {
        const matchingBookmaker = data.bookmakers?.find(bm => 
          bm.name.toLowerCase().replace(/\s+/g, '-') === filterSlug
        );
        if (matchingBookmaker) {
          filterName = matchingBookmaker.name;
          filterType = 'bookmaker';
        }
      }
      
      // Check payment methods
      if (!filterName) {
        const uniquePaymentMethods = new Set();
        data.paymentMethods?.forEach(offer => {
          offer.bookmaker?.paymentMethods?.forEach(pm => {
            if (pm?.name) uniquePaymentMethods.add(pm.name);
          });
        });
        
        const matchingPaymentMethod = Array.from(uniquePaymentMethods).find(pm => 
          pm.toLowerCase().replace(/\s+/g, '-') === filterSlug
        );
        if (matchingPaymentMethod) {
          filterName = matchingPaymentMethod;
          filterType = 'payment method';
        }
      }
    }
    
    if (!filterName) {
      return {
        title: 'Filter Not Found | Booldo',
        description: 'The requested filter page could not be found.'
      };
    }
    
    // Generate metadata based on filter type
    let title, description;
    
    if (filterType === 'bonus type') {
      title = `Best ${filterName} Offers in ${data.country} | Booldo`;
      description = `Discover the best ${filterName.toLowerCase()} betting offers in ${data.country}. Compare bonuses, find exclusive deals, and get started today.`;
    } else if (filterType === 'bookmaker') {
      title = `${filterName} Betting Offers in ${data.country} | Booldo`;
      description = `Explore ${filterName} betting offers and bonuses in ${data.country}. Get exclusive deals and start betting with the best odds.`;
    } else if (filterType === 'payment method') {
      title = `${filterName} Payment Method Betting Sites in ${data.country} | Booldo`;
      description = `Find betting sites in ${data.country} that accept ${filterName} payments. Compare offers and start betting with your preferred payment method.`;
    } else if (filterType === 'combination') {
      title = `${filterName} Offers in ${data.country} | Booldo`;
      description = `Discover the best ${filterName.toLowerCase()} betting offers in ${data.country}. Compare bonuses, find exclusive deals, and get started today.`;
    }
    
    return {
      title,
      description,
      robots: 'index, follow',
      alternates: {
        canonical: `https://yourdomain.com/${countrySlug}/${filterSlug}`,
      },
    };
    
  } catch (error) {
    console.error('Error generating filter metadata:', error);
    return {
      title: 'Filter Page | Booldo',
      description: 'Discover the best betting offers and bonuses.'
    };
  }
}

export default function FilterLayout({ children }) {
  return children;
}