export default {
  name: "bonusType",
  title: "Bonus Type",
  type: "document",
  validation: Rule => Rule.custom((doc, context) => {
    if (!doc?.title || !doc?.bookmaker || !doc?.country) return true // Skip validation if required fields are missing
    
    // Check if another bonus type with same title, bookmaker and country exists
    const { getClient } = context
    const client = getClient({ apiVersion: '2023-05-03' })
    
    // Use a more reliable way to exclude the current document
    const currentId = doc._id || 'draft'
    const query = `count(*[_type == "bonusType" && title == $title && bookmaker._ref == $bookmakerRef && country == $country && _id != $currentId])`
    
    return client.fetch(query, { 
      title: doc.title, 
      bookmakerRef: doc.bookmaker._ref, 
      country: doc.country, 
      currentId 
    })
      .then(count => {
        if (count > 0) {
          return `A bonus type with title "${doc.title}" already exists for this bookmaker in ${doc.country}`
        }
        return true
      })
      .catch(() => {
        // If there's an error, allow the operation
        return true
      })
  }),
  preview: {
    select: {
      title: 'title',
      subtitle: 'bookmaker.country',
      bookmakerName: 'bookmaker.name',
      media: 'banner'
    },
    prepare(selection) {
      const {title, subtitle, bookmakerName} = selection
      return {
        title: title && bookmakerName ? `${title} - ${bookmakerName}` : 'Untitled Bonus Type',
        subtitle: subtitle,
        media: selection.media
      }
    }
  },
  fields: [
    { 
      name: "title", 
      title: "Title", 
      type: "string",
      validation: Rule => Rule.required(),
      options: {
        list: [
          { title: "Free Bets", value: "Free Bets" },
          { title: "Welcome Offers", value: "Welcome Offers" },
          { title: "Deposit bonus", value: "Deposit bonus" },
          { title: "ACCA Boost", value: "ACCA Boost" }
        ]
      }
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: async (doc, context) => {
          const { getClient } = context;
          const client = getClient({ apiVersion: '2023-05-03' });
          
          // Get the bookmaker name
          let bookmakerName = "unknown";
          if (doc.bookmaker?._ref) {
            try {
              const bookmaker = await client.fetch(`*[_type == "bookmaker" && _id == $id][0]{
                name
              }`, { id: doc.bookmaker._ref });
              bookmakerName = bookmaker?.name || "unknown";
            } catch (error) {
              console.error("Error fetching bookmaker:", error);
            }
          }
          
          // Get current date
          const today = new Date();
          const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
          
          // Create slug: bonus-type-bookmaker-date
          const title = doc.title || "bonus";
          const slug = `${title.toLowerCase().replace(/\s+/g, '-')}-${bookmakerName.toLowerCase().replace(/\s+/g, '-')}-${dateString}`;
          
          return slug;
        },
        maxLength: 96,
        slugify: input =>
          input
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^ 0-\u007F\w\-]+/g, '')
            .slice(0, 96)
      },
      validation: Rule => Rule.required(),
    },
    { name: "affiliateLink", title: "Affiliate Link", type: "url", description: "Affiliate/tracking link for the offer (Get Bonus)" },
    {
      name: "bookmaker",
      title: "Bookmaker",
      type: "reference",
      to: [{ type: "bookmaker" }],
      validation: Rule => Rule.required()
    },
    { name: "maxBonus", title: "Max Bonus", type: "number" },
    { name: "minDeposit", title: "Min Deposit", type: "number" },
    {
      name: "description",
      title: "Text Block 1 (offer description)",
      type: "array",
      of: [{ type: "block" }]
    },
    { name: "expires", title: "Expires", type: "date" },
    { name: "published", title: "Published", type: "date" },
    { name: "banner", title: "Banner", type: "image", description: "Banner image for this specific offer" },
    { name: "bannerAlt", title: "Banner Alt Text", type: "string", description: "Alternative text for accessibility and SEO" },
    {
      name: "howItWorks",
      title: "Text Block 2 (how it works)",
      type: "array",
      of: [{ type: "block" }]
    },
    {
      name: "terms",
      title: "Text Block 3 (terms and conditions)",
      type: "array",
      of: [{ type: "block" }]
    },
    {
      name: "faq",
      title: "FAQ",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "question",
              title: "Question",
              type: "array",
              of: [{ type: "block" }],
              validation: Rule => Rule.required()
            },
            {
              name: "answer",
              title: "Answer",
              type: "array",
              of: [{ type: "block" }],
              validation: Rule => Rule.required()
            }
          ],
          preview: {
            select: {
              title: "question"
            }
          }
        }
      ]
    },
    {
      name: "metaTitle",
      title: "Meta Title",
      type: "string",
      description: "SEO: Custom meta title for this page"
    },
    {
      name: "metaDescription",
      title: "Meta Description",
      type: "text",
      description: "SEO: Custom meta description for this page"
    },
    {
      name: "noindex",
      title: "Noindex",
      type: "boolean",
      description: "SEO: Prevent this page from being indexed by search engines"
    },
    {
      name: "nofollow",
      title: "Nofollow",
      type: "boolean",
      description: "SEO: Prevent search engines from following links on this page"
    },
    {
      name: "canonicalUrl",
      title: "Canonical URL",
      type: "url",
      description: "SEO: Canonical URL for this page (leave blank for default)"
    },
    {
      name: "sitemapInclude",
      title: "Include in Sitemap",
      type: "boolean",
      description: "SEO: Should this page be included in sitemap.xml?",
      initialValue: true
    }
  ]
}; 