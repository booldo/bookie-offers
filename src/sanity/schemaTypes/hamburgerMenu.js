export default {
  name: 'hamburgerMenu',
  title: 'Menu Pages',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'The title that appears at the bottom of the hamburger menu',
      validation: Rule => Rule.required().custom(async (value, context) => {
        const { document, getClient } = context;
        if (!value) return true;
        const normalizedTitle = (value || '').toString().trim().toLowerCase();
        const selectedRef = document?.selectedPage?._ref || null;
        // Only enforce uniqueness when a selected page is set
        if (!selectedRef) return true;
        const client = getClient({ apiVersion: '2023-10-01' });
        const currentId = document?._id || '';
        const publishedId = currentId.startsWith('drafts.') ? currentId.replace('drafts.', '') : currentId;
        const query = `count(*[_type == "hamburgerMenu" && lower(title) == $title && selectedPage._ref == $ref && !(_id in [$currentId, $publishedId, "drafts." + $publishedId])])`;
        const params = { title: normalizedTitle, ref: selectedRef, currentId, publishedId };
        try {
          const count = await client.fetch(query, params);
          if (count > 0) {
            return 'A menu page with this title already exists for the selected page.';
          }
        } catch (e) {
          // If validation fails to query, allow save to avoid blocking edits
          return true;
        }
        return true;
      })
    },
    {
      name: 'selectedPage',
      title: 'Select Page',
      type: 'reference',
      to: [
        { type: 'landingPage' },
        { type: 'countryPage' }
      ],
      options: {
        disableNew: true
      },
      description: 'Link this menu page to an existing Landing Page or Country Page document'
    },
    {
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      description: 'URL path for this menu (e.g., \'stack\')',
      options: {
        source: 'title',
        maxLength: 96,
        slugify: input => (input || '').toString().toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'content',
      title: 'Content Block',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H1', value: 'h1'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'H4', value: 'h4'},
            {title: 'H5', value: 'h5'},
            {title: 'H6', value: 'h6'},
            {title: 'Quote', value: 'blockquote'},
            {title: 'Code Block', value: 'code'}
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Number', value: 'number'},
            {title: 'Checkmarks', value: 'checkmarks'}
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
              {title: 'Code', value: 'code'},
              {title: 'Underline', value: 'underline'},
              {title: 'Strike', value: 'strike-through'},
              {title: 'Highlight', value: 'highlight'}
            ],
            annotations: [
              {
                title: 'URL',
                name: 'link',
                type: 'object',
                fields: [
                  {
                    title: 'URL',
                    name: 'href',
                    type: 'url',
                    validation: Rule => Rule.uri({
                      allowRelative: true,
                      scheme: ['http', 'https', 'mailto', 'tel']
                    })
                  },
                  {
                    title: 'Open in new tab',
                    name: 'blank',
                    type: 'boolean'
                  }
                ]
              },
              {
                title: 'Email',
                name: 'email',
                type: 'object',
                fields: [
                  {
                    title: 'Email',
                    name: 'href',
                    type: 'email'
                  }
                ]
              }
            ]
          }
        },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative Text',
              description: 'Important for SEO and accessibility.',
              validation: Rule => Rule.required()
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption'
            }
          ]
        }
      ],
      description: 'The content that will be displayed when the hamburger menu title is clicked'
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
    },

    {
      name: 'updatedAt',
      title: 'Last Updated',
      type: 'datetime',
      readOnly: true,
      description: 'Automatically updated when the document is modified'
    }
  ],
  preview: {
    select: {
      title: 'title'
    },
    prepare(selection) {
      const {title} = selection;
      return {
        title: title || 'Hamburger Menu'
      };
    }
  }
}
