export default {
  name: 'hamburgerMenu',
  title: 'Hamburger Menu',
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
            {title: 'Quote', value: 'blockquote'}
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Number', value: 'number'}
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
              {title: 'Code', value: 'code'}
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
      name: 'additionalMenuItems',
      title: 'Additional Menu Items',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'label',
              title: 'Menu Label',
              type: 'string',
              validation: Rule => Rule.required()
            },
            {
              name: 'content',
              title: 'Content',
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
                    {title: 'Quote', value: 'blockquote'}
                  ],
                  lists: [
                    {title: 'Bullet', value: 'bullet'},
                    {title: 'Number', value: 'number'}
                  ],
                  marks: {
                    decorators: [
                      {title: 'Strong', value: 'strong'},
                      {title: 'Emphasis', value: 'em'},
                      {title: 'Code', value: 'code'}
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
              description: 'The content that will be displayed when this menu item is clicked'
            },
            {
              name: 'isActive',
              title: 'Active',
              type: 'boolean',
              description: 'Whether this menu item should be displayed',
              initialValue: true
            }
          ],
          preview: {
            select: {
              title: 'label',
              subtitle: 'isActive'
            },
            prepare(selection) {
              const {title, subtitle} = selection;
              return {
                title: title || 'Menu Item',
                subtitle: subtitle ? 'Active' : 'Inactive'
              };
            }
          }
        }
      ],
      description: 'Additional menu items that will appear below the default menu items'
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
    },

    {
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Whether the hamburger menu is active',
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
      subtitle: 'additionalMenuItems'
    },
    prepare(selection) {
      const {title, subtitle} = selection;
      const itemCount = subtitle ? subtitle.length : 0;
      return {
        title: title || 'Hamburger Menu',
        subtitle: `${itemCount} additional menu item${itemCount !== 1 ? 's' : ''}`
      };
    }
  }
}
