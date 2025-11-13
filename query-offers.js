const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'your-project-id',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: true,
  apiVersion: '2023-05-03'
});

async function queryOffers() {
  try {
    console.log('Querying offers...');
    
    const offers = await client.fetch(`
      *[_type == "offers"][0...10]{
        title,
        slug,
        canonicalUrl,
        country->{
          country,
          slug
        },
        bonusType->{
          name
        }
      }
    `);
    
    console.log('Found', offers.length, 'offers:');
    console.log('');
    
    offers.forEach((offer, index) => {
      console.log(`${index + 1}. ${offer.title}`);
      console.log(`   Slug: ${offer.slug?.current || 'No slug'}`);
      console.log(`   Country: ${offer.country?.country || 'No country'} (${offer.country?.slug?.current || 'No country slug'})`);
      console.log(`   Bonus Type: ${offer.bonusType?.name || 'No bonus type'}`);
      console.log(`   Canonical URL: ${offer.canonicalUrl || 'Not set'}`);
      
      // Calculate what the actual URL should be
      if (offer.country?.slug?.current && offer.bonusType?.name && offer.slug?.current) {
        const bonusTypeSlug = offer.bonusType.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "").replace(/-+/g, "-");
        const actualUrl = `https://booldo.com/${offer.country.slug.current}/${bonusTypeSlug}/${offer.slug.current}`;
        console.log(`   Actual URL should be: ${actualUrl}`);
      }
      
      console.log('');
    });
    
  } catch (error) {
    console.error('Error querying offers:', error);
  }
}

queryOffers();
