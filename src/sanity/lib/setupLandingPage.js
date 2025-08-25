// Utility script to set up the initial landing page document
// This can be run from Sanity Studio or used as a reference

export const defaultLandingPageData = {
  _type: "landingPage",
  defaultMetaTitle: "Booldo - No Bias. No Hype. Just Betting Options.",
  defaultMetaDescription: "Booldo is built to help you bet smarter. We show you all the top bookmakers and offers, even those we don't partner with, so you can decide with confidence.",
  defaultNoindex: false,
  defaultNofollow: false,
  defaultCanonicalUrl: "https://booldo.com",
  defaultSitemapInclude: true,
  robotsTxt: "User-agent: *\nAllow: /\n\nSitemap: https://booldo.com/sitemap.xml",
  mostSearches: [
    {
      searchTerm: "Welcome bonus",
      isActive: true,
      order: 1
    },
    {
      searchTerm: "Deposit bonus",
      isActive: true,
      order: 2
    },
    {
      searchTerm: "Free bets",
      isActive: true,
      order: 3
    },
    {
      searchTerm: "Best bookies",
      isActive: true,
      order: 4
    },
    {
      searchTerm: "Cashback offers",
      isActive: true,
      order: 5
    },
    {
      searchTerm: "No deposit bonus",
      isActive: true,
      order: 6
    },
    {
      searchTerm: "Reload bonus",
      isActive: true,
      order: 7
    },
    {
      searchTerm: "VIP programs",
      isActive: true,
      order: 8
    }
  ]
};

// Instructions for setting up in Sanity Studio:
// 1. Go to Sanity Studio
// 2. Look for "Landing Page Metadata" in the document types
// 3. Create a new document
// 4. Use the structure above as a reference
// 5. Customize the search terms as needed
// 6. Set the order and active status for each search term
