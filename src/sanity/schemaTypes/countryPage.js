export default {
  name: "countryPage",
  title: "Country Pages",
  type: "document",
  validation: Rule => Rule.custom((doc, context) => {
    if (!doc?.slug?.current) return true // Skip validation if slug is missing
    
    const { getClient } = context
    const client = getClient({ apiVersion: '2023-05-03' })

    // Exclude both draft and published versions of the current document
    const currentId = doc._id || 'draft'
    const draftId = currentId.startsWith('drafts.') ? currentId : `drafts.${currentId}`
    const publishedId = currentId.replace(/^drafts\./, '')
    const query = `count(*[_type == "countryPage" && slug.current == $slug && !(_id in [$draftId, $publishedId])])`

    return client.fetch(query, {
      slug: doc.slug.current,
      draftId,
      publishedId
    })
      .then(count => {
        if (count > 0) {
          return `A country page with this slug already exists. Please modify the slug to make it unique.`
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
      country: 'country',
      countryCode: 'countryCode',
      media: 'pageFlag'
    },
    prepare(selection) {
      const {country, countryCode} = selection
      return {
        title: `${country} Country Page`,
        subtitle: `Country Code: ${countryCode}`,
        media: selection.media
      }
    }
  },
  fields: [
    {
      name: "countryCode",
      title: "Country Code",
      type: "string",
      validation: Rule => Rule.required(),
      description: "ISO country code (e.g., 'ng' for Nigeria, 'gh' for Ghana)",
      
    },
    {
      name: "country",
      title: "Country Name",
      type: "string",
      validation: Rule => Rule.required(),
      description: "Full country name (e.g., 'Nigeria', 'Ghana')",
    },
    {
      name: "slug",
      title: "Country Page URL",
      type: "slug",
      description: "This will appear as for example, www.booldo.com/gh",
      options: {
        source: 'countryCode',
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
    {
      name: "pageFlag",
      title: "Page Flag",
      type: "image",
      description: "add offer card flag",
      options: {
        hotspot: true,
      },
      validation: Rule => Rule.required(),
    },
    {
      name: "navigationBarFlag",
      title: "Navigation Bar Flag",
      type: "image",
      description: "Flag image for navigation bar display",
      options: {
        hotspot: true,
      },
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
    {
      name: "comparison",
      title: "Comparison Section",
      type: "array",
      of: [{ type: 'block' }],
      description: "Portable text comparison content for this country homepage"
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
      description: "Frequently asked questions shown under the comparison section"
    },
    {
      name: "isActive",
      title: "Is Active",
      type: "boolean",
      initialValue: true,
      description: "Whether this country page should be displayed"
    },
    {
      name: "_updatedAt",
      title: "Last Updated",
      type: "datetime",
      readOnly: true,
      description: "Automatically updated when the document is modified"
    }
  ]
};
