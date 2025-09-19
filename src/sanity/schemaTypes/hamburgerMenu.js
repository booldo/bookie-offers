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
      validation: Rule => Rule.required()
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
      name: 'url',
      title: 'External URL (Optional)',
      type: 'url',
      description: 'If provided, clicking the menu title will redirect to this URL instead of showing the page content. Leave blank to use the page content.',
      validation: Rule => Rule.uri({
        allowRelative: true,
        scheme: ['http', 'https', 'mailto', 'tel']
      })
    },
    {
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      description: 'URL path for this menu (e.g., \'stack\'). Multiple entries can have the same slug if they belong to different countries.',
      options: {
        source: 'title',
        maxLength: 96,
        slugify: input => (input || '').toString().toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'),
        isUnique: (slug, context) => {
          // Allow duplicate slugs if they belong to different countries
          const { document } = context;
          if (!document?.selectedPage?._ref) return true; // Allow if no country selected

          // Check if another document has the same slug but different country
          return context.getClient({ apiVersion: '2023-01-01' })
            .fetch(`*[_type == "hamburgerMenu" && slug.current == $slug && _id != $id]{
              selectedPage->{
                _type,
                _id
              }
            }`, { slug: slug.current, id: document._id })
            .then(existingDocs => {
              // If no existing docs, allow
              if (!existingDocs || existingDocs.length === 0) return true;

              // Check if any existing doc has the same country
              const currentCountryId = document.selectedPage._ref;
              const hasSameCountry = existingDocs.some(doc =>
                doc.selectedPage?._type === 'countryPage' && doc.selectedPage._id === currentCountryId
              );

              // Allow if no existing doc has the same country
              return !hasSameCountry;
            })
            .catch(() => true); // Allow on error to prevent blocking
        }
      },
      validation: Rule => Rule
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
    {
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      description: 'SEO: Custom meta title for this page',
      validation: Rule => Rule.max(60).warning('Should be under 60 characters')
    },
    {
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      description: 'SEO: Custom meta description for this page',
      validation: Rule => Rule.max(160).warning('Should be under 160 characters')
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
      name: 'sitemapInclude',
      title: 'Include in Sitemap',
      type: 'boolean',
      description: 'SEO: Should this page be included in sitemap.xml?',
      initialValue: true
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
      title: 'title',
      selectedPage: 'selectedPage',
      slug: 'slug'
    },
    prepare(selection) {
      const {title, selectedPage, slug} = selection;

      // Generate subtitle based on selected page
      let subtitle = '';
      if (selectedPage) {
        if (selectedPage._type === 'countryPage') {
          subtitle = `Country Page: ${selectedPage.country || selectedPage.title || 'Unknown'}`;
        } else if (selectedPage._type === 'landingPage') {
          subtitle = `Landing Page: ${selectedPage.defaultMetaTitle || selectedPage.title || 'Global'}`;
        }
      } else {
        subtitle = 'No page selected';
      }

      // Add slug info if available
      if (slug?.current) {
        subtitle += ` | /${slug.current}`;
      }

      return {
        title: title || 'Hamburger Menu',
        subtitle: subtitle
      };
    }
  }
}
