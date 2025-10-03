export default {
  name: 'article',
  title: 'Blogs',
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
      name: 'mainImage',
      title: 'Blog Cover Image',
      type: 'url',
      description: 'Direct URL to the blog cover image (e.g. https://example.com/image.jpg).'
    },
    {
      name: 'mainImageAlt',
      title: 'Blog Image Alt Text',
      type: 'string',
      description: 'Alternative text for image accessibility and SEO',
    },
    {
      name: 'content',
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
    },
    {
      name: "faq",
      title: "FAQ",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "question",
              title: "Question",
              type: "array",
              of: [{ type: "block" }],
              validation: (Rule) => Rule.required(),
            },
            {
              name: "answer",
              title: "Answer",
              type: "array",
              of: [{ type: "block" }],
              validation: (Rule) => Rule.required(),
            },
          ],
        },
      ],
      description: "Frequently asked questions related to this article"
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


  ],
};
