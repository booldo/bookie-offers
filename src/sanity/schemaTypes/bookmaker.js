export default {
  name: "bookmaker",
  title: "Bookmaker",
  type: "document",
  validation: Rule => Rule.custom((doc, context) => {
    if (!doc?.name || !doc?.country?._ref) return true // Skip validation if required fields are missing
    
    // Check if another bookmaker with same name and country exists
    const { getClient } = context
    const client = getClient({ apiVersion: '2023-05-03' })
    
    // Exclude both draft and published versions of the current document
    const currentId = doc._id || 'draft'
    const draftId = currentId.startsWith('drafts.') ? currentId : `drafts.${currentId}`
    const publishedId = currentId.replace(/^drafts\./, '')
    const query = `count(*[_type == "bookmaker" && name == $name && country._ref == $countryId && !(_id in [$draftId, $publishedId])])`
    
    return client.fetch(query, { 
      name: doc.name, 
      countryId: doc.country._ref, 
      draftId, 
      publishedId 
    })
      .then(count => {
        if (count > 0) {
          return `A bookmaker with name "${doc.name}" already exists in this country`
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
      country: 'country.country',
      logo: 'logo'
    },
    prepare(selection) {
      const { title, country, logo } = selection;
      return {
        title: title,
        subtitle: country || 'Unknown Country',
        media: logo
      };
    }
  },
  fields: [
    { 
      name: "name", 
      title: "Bookmaker Name", 
      type: "string",
      validation: Rule => Rule.required()
    },
    { name: "logo", title: "Logo", type: "image" },
    { name: "logoAlt", title: "Logo Alt Text", type: "string", description: "Alternative text for accessibility and SEO" },
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
      name: "license",
      title: "License",
      type: "array",
      of: [{ type: "reference", to: [{ type: "licenses" }] }],
      description: "Select the licenses this bookmaker holds",
      options: {
        filter: 'isActive == true'
      }
    },
    {
      name: "paymentMethods",
      title: "Payment Methods",
      type: "array",
      of: [{ type: "reference", to: [{ type: "paymentOptions" }] }],
      description: "Select the payment methods this bookmaker accepts",
      options: {
        filter: 'isActive == true'
      }
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