export default {
  name: 'about',
  title: 'About',
  type: 'document',
  preview: {
    select: {
      title: 'title',
      country: 'country'
    },
    prepare(selection) {
      const { title, country } = selection
      return {
        title: title || 'About',
        subtitle: country || 'No Country Selected'
      }
    }
  },
  fields: [
    {
      name: 'country',
      title: 'Country',
      type: 'string',
      description: 'Select a country for this about page. Choose "Landing Page" for homepage navbar.',
      validation: Rule => Rule.required(),
      options: {
        list: [
          { title: 'Landing Page', value: 'Landing Page' },
          { title: 'Nigeria', value: 'Nigeria' },
          { title: 'Ghana', value: 'Ghana' }
        ]
      },
      initialValue: 'Landing Page'
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


