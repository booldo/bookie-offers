export default {
  name: "offers",
  title: "Offers",
  type: "document",
  validation: Rule => Rule.custom((doc, context) => {
    if (!doc?.slug?.current) return true // Skip validation if slug is missing
    
    // Check if another offer with the same slug exists
    const { getClient } = context
    const client = getClient({ apiVersion: '2023-05-03' })
    
    // Exclude the current document being edited
    const currentId = doc._id || 'draft'
    const query = `count(*[_type == "offers" && slug.current == $slug && _id != $currentId])`
    
    return client.fetch(query, { 
      slug: doc.slug.current,
      currentId 
    })
      .then(count => {
        if (count > 0) {
          return `An offer with this slug already exists. Please modify the slug to make it unique.`
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
      bonusTypeName: 'bonusType.name',
      bookmakerName: 'bookmaker.name',
      country: 'country',
      media: 'banner'
    },
    prepare(selection) {
      const {bonusTypeName, bookmakerName, country} = selection
      return {
        title: bonusTypeName && bookmakerName ? `${bonusTypeName} - ${bookmakerName}` : 'Untitled Offer',
        subtitle: country,
        media: selection.media
      }
    }
  },
  fields: [
    {
      name: "country",
      title: "Country",
      type: "string",
      validation: Rule => Rule.required(),
      options: {
        list: [
          { title: "Nigeria", value: "Nigeria" },
          { title: "Ghana", value: "Ghana" }
        ]
      }
    },
    {
      name: "bonusType",
      title: "Bonus Type",
      type: "reference",
      to: [{ type: "bonusType" }],
      validation: Rule => Rule.required(),
      options: {
        filter: ({document}) => {
          // If no country is selected, show all bonus types
          if (!document?.country) return {}
          
          // Filter bonus types by the selected country
          return {
            filter: 'country == $country',
            params: { country: document.country }
          }
        }
      }
    },
    {
      name: "bookmaker",
      title: "Bookmaker",
      type: "reference",
      to: [{ type: "bookmaker" }],
      validation: Rule => Rule.required(),
      options: {
        filter: ({document}) => {
          // If no country is selected, show all bookmakers
          if (!document?.country) return {}
          
          // Filter bookmakers by the selected country
          return {
            filter: 'country == $country',
            params: { country: document.country }
          }
        }
      }
    },
    { name: "affiliateLink", title: "Affiliate Link", type: "url", description: "Affiliate/tracking link for the offer (Get Bonus)" },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: async (doc, context) => {
          const { getClient } = context;
          const client = getClient({ apiVersion: '2023-05-03' });
          
          // Get the bonus type name
          let bonusTypeName = "unknown";
          if (doc.bonusType?._ref) {
            try {
              const bonusType = await client.fetch(`*[_type == "bonusType" && _id == $id][0]{
                name
              }`, { id: doc.bonusType._ref });
              bonusTypeName = bonusType?.name || "unknown";
            } catch (error) {
              console.error("Error fetching bonus type:", error);
            }
          }
          
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
          
          // Create slug: bonus-type-bookmaker-country-date
          const country = doc.country || "unknown";
          const slug = `${bonusTypeName.toLowerCase().replace(/\s+/g, '-')}-${bookmakerName.toLowerCase().replace(/\s+/g, '-')}-${country.toLowerCase()}-${dateString}`;
          
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