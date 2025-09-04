export default {
  name: 'about',
  title: 'About',
  type: 'document',
  validation: Rule => Rule.custom((doc, context) => {
    const { getClient } = context
    const client = getClient({ apiVersion: '2023-05-03' })

    const currentId = doc._id || 'draft'
    const draftId = currentId.startsWith('drafts.') ? currentId : `drafts.${currentId}`
    const publishedId = currentId.replace(/^drafts\./, '')

    const query = `count(*[_type == "about" && title == $title && ((defined(country) && country._ref == $countryRef) || (!defined(country) && !defined($countryRef))) && !(_id in [$draftId, $publishedId])])`
    const defaultCountQuery = `count(*[_type == "about" && !defined(country) && !(_id in [$draftId, $publishedId])])`

    return client.fetch(query, {
      title: doc.title || '',
      countryRef: doc.country?._ref || null,
      draftId,
      publishedId
    }).then(count => {
      if (count > 0) {
        return 'about page already exist in the the country page'
      }
      // Enforce only one default (no country)
      if (!doc.country) {
        return client.fetch(defaultCountQuery, { draftId, publishedId }).then(defaultCount => {
          if (defaultCount > 0) {
            return 'Only one default About (no country) is allowed'
          }
          return true
        })
      }
      return true
    }).catch(() => true)
  }),
  preview: {
    select: {
      title: 'title',
      country: 'country.country'
    },
    prepare(selection) {
      const { title, country } = selection
      return {
        title: title || 'About',
        subtitle: country || 'Default'
      }
    }
  },
  fields: [
    {
      name: 'country',
      title: 'Country',
      type: 'reference',
      to: [{ type: 'countryPage' }],
      description: 'Select a country for this About page. Leave empty for Landing page.',
      options: { disableNew: true }
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'content',
      title: 'Content',
      description: 'Main About Us content (Portable Text)',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'image', options: { hotspot: true } },
      ],
      validation: Rule => Rule.required(),
    },
    // Metadata fields for SEO
    {
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      description: 'Title for SEO (appears in browser tab and search results)',
      validation: Rule => Rule.max(60).warning('Should be under 60 characters')
    },
    {
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      description: 'Description for SEO (appears in search results)',
      validation: Rule => Rule.max(160).warning('Should be under 160 characters')
    },
    {
      name: 'keywords',
      title: 'Keywords',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Keywords for SEO (comma separated)',
      options: {
        layout: 'tags'
      }
    },
    {
      name: 'sitemapInclude',
      title: 'Include in Sitemap',
      type: 'boolean',
      description: 'SEO: Should this page be included in sitemap.xml?',
      initialValue: true
    },
    {
      name: 'noindex',
      title: 'Noindex',
      type: 'boolean',
      description: 'SEO: Prevent this page from being indexed by search engines'
    },
    {
      name: 'nofollow',
      title: 'Nofollow',
      type: 'boolean',
      description: 'SEO: Prevent search engines from following links on this page'
    },
    {
      name: 'canonicalUrl',
      title: 'Canonical URL',
      type: 'url',
      description: 'SEO: Canonical URL for this page (leave blank for default)'
    }
  ],
}


