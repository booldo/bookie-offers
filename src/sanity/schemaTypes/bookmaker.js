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
  }).custom((doc, context) => {
    if (!doc?.slug?.current) return true // Skip validation if slug is missing
    
    // Check if another bookmaker with same slug exists (globally unique)
    const { getClient } = context
    const client = getClient({ apiVersion: '2023-05-03' })
    
    // Exclude both draft and published versions of the current document
    const currentId = doc._id || 'draft'
    const draftId = currentId.startsWith('drafts.') ? currentId : `drafts.${currentId}`
    const publishedId = currentId.replace(/^drafts\./, '')
    const query = `count(*[_type == "bookmaker" && slug.current == $slug && !(_id in [$draftId, $publishedId])])`
    
    return client.fetch(query, { 
      slug: doc.slug.current, 
      draftId, 
      publishedId 
    })
      .then(count => {
        if (count > 0) {
          return `A bookmaker with slug "${doc.slug.current}" already exists. Slugs must be unique across all countries.`
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
      name: "slug",
      title: "URL Slug",
      type: "slug",
      description: "URL slug for this bookmaker (e.g., 'ng/betika', 'gh/mozzart')",
      options: {
        source: async (doc, context) => {
          const { getClient } = context;
          const client = getClient({ apiVersion: '2023-05-03' });
          if (!doc.country?._ref || !doc.name) {
            return "Please select country and enter bookmaker name first";
          }
          try {
            const query = `*[_type == "countryPage" && _id == $countryId][0]{ countryCode }`;
            const result = await client.fetch(query, { countryId: doc.country._ref });
            if (result?.countryCode && doc.name) {
              const countryCode = result.countryCode.toLowerCase();
              const bookmakerName = doc.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
              return `${countryCode}/${bookmakerName}`;
            }
            return "Could not generate slug";
          } catch (error) {
            console.error('Error generating slug:', error);
            return "Error generating slug";
          }
        },
        maxLength: 96,
        slugify: input => input.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-\/]/g, '')
      },
      validation: Rule => Rule.required(),
    },
    { name: "logo", title: "Logo", type: "image" },
    { name: "logoAlt", title: "Logo Alt Text", type: "string", description: "Alternative text for accessibility and SEO" },
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
      name: "comparison",
      title: "Bookmaker Content",
      type: "array",
      of: [{ type: 'block' }],
      description: "Portable text content for this bookmaker"
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
      description: "Frequently asked questions related to this bookmaker"
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
    },

  ]
}; 