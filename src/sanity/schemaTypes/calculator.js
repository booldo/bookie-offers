export default {
  name: 'calculator',
  title: 'Calculators',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Generate URL',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: Rule => Rule.required(),
    },
    {
      name: 'calculatorImage',
      title: 'Calculator Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'calculatorImageAlt',
      title: 'Calculator Image Alt Text',
      type: 'string',
      description: 'Alternative text for image accessibility and SEO',
    },
    {
      name: 'briefDescription',
      title: 'Brief Description',
      type: 'text',
      description: 'Short description of what this calculator does',
      validation: Rule => Rule.max(200),
    },
    {
      name: 'codeOutput',
      title: 'Content',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'codeBlock' },
        {
          type: 'image',
          options: { hotspot: true },
        },
      ],
      description: 'This content will display the calculator content and embedded code',
    },
    {
      name: 'isActive',
      title: 'Is Active',
      type: 'boolean',
      description: 'Should this calculator be displayed on the site?',
      initialValue: true,
    },
    // SEO Fields
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
  ],
  preview: {
    select: {
      title: 'title',
      media: 'calculatorImage',
      description: 'briefDescription'
    },
    prepare(selection) {
      const {title, media, description} = selection;
      return {
        title: title,
        subtitle: description,
        media: media
      };
    }
  }
};
