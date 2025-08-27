export default {
  name: "banner",
  title: "Homepage Banners",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      validation: Rule => Rule.required(),
    },
    {
      name: "country",
      title: "Country",
      type: "reference",
      to: [{ type: "countryPage" }],
      validation: Rule => Rule.required(),
      description: "Country this banner is for",
      options: {
        filter: 'isActive == true'
      }
    },
    {
      name: "image",
      title: "Banner Image",
      type: "image",
      validation: Rule => Rule.required(),
      options: {
        hotspot: true,
      },
    },
    {
      name: "imageAlt",
      title: "Banner Image Alt Text",
      type: "string",
      description: "Alternative text for accessibility and SEO",
    },
    {
      name: "order",
      title: "Display Order",
      type: "number",
      validation: Rule => Rule.required().min(1),
    },
    {
      name: "isActive",
      title: "Active",
      type: "boolean",
      initialValue: true,
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
  orderings: [
    {
      title: "Display Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      country: 'country.country',
      image: 'image'
    },
    prepare(selection) {
      const { title, country, image } = selection;
      return {
        title: title,
        subtitle: country || 'Unknown Country',
        media: image
      };
    }
  },
}; 