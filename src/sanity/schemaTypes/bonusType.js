export default {
  name: "bonusType",
  title: "Bonus Types",
  type: "document",
  validation: Rule => Rule.custom((doc, context) => {
    if (!doc?.name || !doc?.country?._ref) return true // Skip validation if required fields are missing
    
    // Check if another bonus type with same name and country exists
    const { getClient } = context
    const client = getClient({ apiVersion: '2023-05-03' })
    
    // Exclude both draft and published versions of the current document
    const currentId = doc._id || 'draft'
    const draftId = currentId.startsWith('drafts.') ? currentId : `drafts.${currentId}`
    const publishedId = currentId.replace(/^drafts\./, '')
    const query = `count(*[_type == "bonusType" && name == $name && country._ref == $countryId && !(_id in [$draftId, $publishedId])])`
    
    return client.fetch(query, { 
      name: doc.name, 
      countryId: doc.country._ref, 
      draftId, 
      publishedId 
    })
      .then(count => {
        if (count > 0) {
          return `A bonus type with name "${doc.name}" already exists in this country`
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
      title: 'name',
      country: 'country.country'
    },
    prepare(selection) {
      const { title, country } = selection;
      return {
        title: title,
        subtitle: country || 'Unknown Country'
      };
    }
  },
  fields: [
    { 
      name: "name", 
      title: "Bonus Name", 
      type: "string",
      validation: Rule => Rule.required(),
      options: {
        list: [
          { title: "Free Bet", value: "Free Bet" },
          { title: "Welcome Offer", value: "Welcome Offer" },
          { title: "Deposit bonus", value: "Deposit bonus" },
          { title: "ACCA Boost", value: "ACCA Boost" }
        ]
      }
    },
    {
      name: "country",
      title: "Country",
      type: "reference",
      to: [{ type: "countryPage" }],
      validation: Rule => Rule.required(),
      description: "Country (must match a country from Countries section)",
      options: {
        filter: 'isActive == true'
      }
    },
    {
      name: "comparison",
      title: "Comparison Section",
      type: "array",
      of: [{ type: 'block' }],
      description: "Portable text comparison content for this bonus type"
    },
    {
      name: "faqs",
      title: "FAQs",
      type: "array",
      of: [{
        type: "object",
        fields: [
          {
            name: "question",
            title: "Question",
            type: "string",
            validation: Rule => Rule.required()
          },
          {
            name: "answer",
            title: "Answer",
            type: "text",
            validation: Rule => Rule.required()
          }
        ]
      }],
      description: "Frequently asked questions related to this bonus type"
    },
    {
      name: "metaTitle",
      title: "Meta Title",
      type: "string",
      description: "SEO: Custom meta title for this bonus type page"
    },
    {
      name: "metaDescription",
      title: "Meta Description",
      type: "text",
      description: "SEO: Custom meta description for this bonus type page"
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