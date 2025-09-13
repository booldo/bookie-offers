import { client } from "../../sanity/lib/client";

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
      if (!country.slug?.current) continue;
      
      const countrySlug = country.slug.current;
      
      // Add base country page
      params.push({ slug: [countrySlug] });
      
      // Add bonus type pages
      if (country.bonusTypes) {
        for (const bonusType of country.bonusTypes) {
          if (bonusType.name) {
            const bonusTypeSlug = bonusType.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            params.push({ slug: [countrySlug, bonusTypeSlug] });
          }
        }
      }
      
      // Add bookmaker pages
      if (country.bookmakers) {
        for (const bookmaker of country.bookmakers) {
          if (bookmaker.name) {
            const bookmakerSlug = bookmaker.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            params.push({ slug: [countrySlug, bookmakerSlug] });
          }
        }
      }
      
      // Add payment method pages
      if (country.paymentMethods) {
        const uniquePaymentMethods = new Set();
        country.paymentMethods.forEach(offer => {
          if (offer.bookmaker?.paymentMethods) {
            offer.bookmaker.paymentMethods.forEach(pm => {
              if (pm.name) {
                uniquePaymentMethods.add(pm.name);
              }
            });
          }
        });
        
        for (const paymentMethod of uniquePaymentMethods) {
          const paymentMethodSlug = paymentMethod.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          params.push({ slug: [countrySlug, paymentMethodSlug] });
        }
      }
    }
    
    console.log(`Generated ${params.length} static params for countries`);
    return params;
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}
