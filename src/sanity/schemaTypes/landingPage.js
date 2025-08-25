export default {
  name: "landingPage",
  title: "Landing Page Metadata",
  type: "document",
  preview: {
    select: {
      title: "defaultMetaTitle"
    },
    prepare({ title }) {
      return {
        title: title || "Untitled",
        subtitle: "Landing page SEO settings"
      };
    }
  },
  fields: [
    {
      name: "defaultMetaTitle",
      title: "Default Page Title",
      type: "string"
    },
    {
      name: "defaultMetaDescription",
      title: "Default Page Description",
      type: "text"
    },
    {
      name: "defaultNoindex",
      title: "Default Search Engine Indexing",
      type: "boolean"
    },
    {
      name: "defaultNofollow",
      title: "Default Link Following",
      type: "boolean"
    },
    {
      name: "defaultCanonicalUrl",
      title: "Default Canonical URL",
      type: "url"
    },
    {
      name: "defaultSitemapInclude",
      title: "Default Sitemap Inclusion",
      type: "boolean",
      initialValue: true
    },
    {
      name: "sitemapExtraUrls",
      title: "Additional Sitemap URLs",
      type: "array",
      of: [{ type: "url" }],
      description: "Additional URLs to include in sitemap.xml"
    },
    {
      name: "robotsTxt",
      title: "Robots.txt Configuration",
      type: "text",
      description: "Content for robots.txt"
    },
    {
      name: "mostSearches",
      title: "Most Popular Searches",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "searchTerm",
              title: "Search Term",
              type: "string",
              validation: Rule => Rule.required().min(1).max(100)
            },
            {
              name: "isActive",
              title: "Active",
              type: "boolean",
              initialValue: true,
              description: "Whether this search term should be displayed"
            },
            {
              name: "order",
              title: "Display Order",
              type: "number",
              initialValue: 1,
              description: "Order in which this search term appears (lower numbers appear first)"
            }
          ],
          preview: {
            select: {
              title: "searchTerm",
              subtitle: "isActive",
              order: "order"
            },
            prepare({ title, subtitle, order }) {
              return {
                title: title || "Untitled",
                subtitle: `${subtitle ? 'Active' : 'Inactive'} - Order: ${order || 1}`
              };
            }
          }
        }
      ],
      description: "Popular search terms to display on the landing page and in search suggestions",
      validation: Rule => Rule.max(20)
    }
  ]
};
