export default {
  name: 'footer',
  title: 'Footer',
  type: 'document',
  fields: [
    {
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Whether this footer configuration is active',
      initialValue: true
    },
    // Social Media Section
    {
      name: 'socialMedia',
      title: 'Social Media',
      type: 'object',
      fields: [
        {
          name: 'isActive',
          title: 'Active',
          type: 'boolean',
          description: 'Whether this section is displayed',
          initialValue: true
        },
        {
          name: 'title',
          title: 'Section Title',
          type: 'string',
          description: 'Title above social media icons (e.g., "Follow us on")',
          initialValue: 'Follow us on'
        },
        {
          name: 'platforms',
          title: 'Social Media Platforms',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'name',
                  title: 'Platform Name',
                  type: 'string',
                  description: 'e.g., X (Twitter), Telegram, Facebook',
                  validation: Rule => Rule.required()
                },
                {
                  name: 'icon',
                  title: 'Icon Image',
                  type: 'image',
                  description: 'Social media icon image',
                  options: {
                    hotspot: true
                  }
                },
                {
                  name: 'url',
                  title: 'Profile URL',
                  type: 'url',
                  description: 'Link to social media profile',
                  validation: Rule => Rule.required()
                },
                {
                  name: 'isActive',
                  title: 'Active',
                  type: 'boolean',
                  description: 'Whether this platform is displayed',
                  initialValue: true
                }
              ],
              preview: {
                select: {
                  title: 'name',
                  subtitle: 'url',
                  media: 'icon'
                }
              }
            }
          ],
          validation: Rule => Rule.min(1)
        }
      ]
    },
    // Navigation Links Section (includes default and hamburger menu items)
    {
      name: 'navigationLinks',
      title: 'Navigation Links',
      type: 'object',
      fields: [
        {
          name: 'menuItems',
          title: 'Menu Items',
          type: 'array',
          description: 'Select which menu items to display in footer',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'type',
                  title: 'Item Type',
                  type: 'string',
                  options: {
                    list: [
                      {title: 'Home', value: 'home'},
                      {title: 'Blog', value: 'blog'},
                      {title: 'Calculators', value: 'calculators'},
                      {title: 'FAQ', value: 'faq'},
                      {title: 'Other pages', value: 'hamburger'}
                    ]
                  },
                  validation: Rule => Rule.required()
                },
                {
                  name: 'hamburgerMenuItem',
                  title: 'Other pages item',
                  type: 'reference',
                  to: [{ type: 'hamburgerMenu' }],
                  description: 'Select a specific item from Other pages to display',
                  hidden: ({parent}) => parent?.type !== 'hamburger'
                },
                {
                  name: 'isActive',
                  title: 'Active',
                  type: 'boolean',
                  description: 'Whether this menu item is displayed',
                  initialValue: true
                }
              ],
              preview: {
                select: {
                  title: 'type',
                  subtitle: 'hamburgerMenuItem.title',
                  isActive: 'isActive'
                },
                prepare(selection) {
                  const {title, subtitle, isActive} = selection;
                  const labels = {
                    home: 'Home',
                    blog: 'Blog',
                    calculators: 'Calculators',
                    faq: 'FAQ',
                    hamburger: subtitle || 'Other pages'
                  };
                  return {
                    title: labels[title] || title,
                    subtitle: isActive ? 'Active' : 'Inactive'
                  };
                }
              }
            }
          ]
        }
      ]
    },
    // Affiliate Disclosure Section
    {
      name: 'affiliateDisclosure',
      title: 'Affiliate Disclosure',
      type: 'object',
      fields: [
        {
          name: 'title',
          title: 'Section Title',
          type: 'string',
          description: 'Title for affiliate disclosure section',
          initialValue: 'Affiliate Disclosure'
        },
        {
          name: 'content',
          title: 'Content',
          type: 'array',
          of: [
            {
              type: 'block'
            }
          ],
          description: 'Affiliate disclosure text content'
        },
        {
          name: 'isActive',
          title: 'Active',
          type: 'boolean',
          description: 'Whether this section is displayed',
          initialValue: true
        }
      ]
    },
    // Responsible Gambling Section
    {
      name: 'responsibleGambling',
      title: 'Responsible Gambling',
      type: 'object',
      fields: [
        {
          name: 'title',
          title: 'Section Title',
          type: 'string',
          description: 'Title for responsible gambling section',
          initialValue: 'Responsible Gambling'
        },
        {
          name: 'content',
          title: 'Content',
          type: 'array',
          of: [
            {
              type: 'block'
            }
          ],
          description: 'Responsible gambling text content'
        },
        {
          name: 'isActive',
          title: 'Active',
          type: 'boolean',
          description: 'Whether this section is displayed',
          initialValue: true
        }
      ]
    },
    // Gambling Resources Section
    {
      name: 'gamblingResources',
      title: 'Gambling Resources',
      type: 'object',
      fields: [
        {
          name: 'title',
          title: 'Section Title',
          type: 'string',
          description: 'Title above gambling resources (e.g., "Need help? Visit these responsible gambling resources")',
          initialValue: 'Need help? Visit these responsible gambling resources'
        },
        {
          name: 'resources',
          title: 'Resource Links',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'name',
                  title: 'Resource Name',
                  type: 'string',
                  description: 'Name of the gambling resource (e.g., GambleAlert, BeGambleAware)',
                  validation: Rule => Rule.required()
                },
                {
                  name: 'url',
                  title: 'Resource URL',
                  type: 'url',
                  description: 'Link to the gambling resource website',
                  validation: Rule => Rule.required()
                },
                {
                  name: 'isActive',
                  title: 'Active',
                  type: 'boolean',
                  description: 'Whether this resource is displayed',
                  initialValue: true
                }
              ],
              preview: {
                select: {
                  title: 'name',
                  subtitle: 'url'
                }
              }
            }
          ],
          validation: Rule => Rule.min(1)
        }
      ]
    },
    // Bottom Row Links (slug auto-generated from label)
    {
      name: 'bottomRowLinks',
      title: 'Bottom Row Links',
      type: 'object',
      fields: [
        {
          name: 'links',
          title: 'Bottom Links',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'label',
                  title: 'Link Label',
                  type: 'string',
                  description: 'Text to display for the link',
                  validation: Rule => Rule.required()
                },
                {
                  name: 'slug',
                  title: 'Slug',
                  type: 'slug',
                  options: {
                    source: 'label',
                    maxLength: 96,
                    slugify: input =>
                      input
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^ 0-\u007F\w\-]+/g, '')
                        .replace(/(^-|-$)+/g, '')
                        .slice(0, 96)
                  },
                  description: 'Slug used to generate the internal page URL when content is provided. Click "Generate" after typing a label.'
                },
                {
                  name: 'content',
                  title: 'Content',
                  type: 'array',
                  of: [{ type: 'block' }],
                  description: 'Portable text content that will be shown on the internal page when this link is clicked'
                },
                {
                  name: 'url',
                  title: 'External URL (optional)',
                  type: 'url',
                  description: 'If provided and no content is set, the link will point to this external URL'
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
                  description: 'Whether this link is displayed',
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
                  title: 'label',
                  subtitle: 'slug.current'
                }
              }
            }
          ],
          validation: Rule => Rule.min(1)
        },
        {
          name: 'copyrightText',
          title: 'Copyright Text',
          type: 'string',
          description: 'Copyright notice text',
          initialValue: '© Copyright 2025 BOOLDO'
        }
      ]
    },
    // Removed legacy hamburgerMenuItems section; use navigationLinks instead
  ],
  preview: {
    select: {
      title: 'isActive',
      subtitle: 'socialMedia'
    },
    prepare(selection) {
      const {title, subtitle} = selection;
      return {
        title: title ? 'Active Footer' : 'Inactive Footer',
        subtitle: subtitle?.title || 'Footer Configuration'
      };
    }
  }
}
