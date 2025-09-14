export default {
  name: "landingPage",
  title: "World Wide Page",
  type: "document",
  preview: {
    select: {
      title: "defaultMetaTitle"
    },
    prepare({ title }) {
      return {
        title: title || "Untitled",
        subtitle: "Global landing page SEO settings"
      };
    }
  },
  fields: [
    {
      name: "siteHeading1",
      title: "Site Heading 1",
      type: "string",
      description: "Main heading displayed on the landing page"
    },
    {
      name: "siteHeading2",
      title: "Site Heading 2",
      type: "string",
      description: "Secondary heading displayed on the landing page"
    },
    {
      name: "siteDescription",
      title: "Site Description",
      type: "array",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H1", value: "h1" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
            { title: "H4", value: "h4" },
            { title: "Quote", value: "blockquote" }
          ],
          lists: [
            { title: "Bullet", value: "bullet" },
            { title: "Number", value: "number" }
          ],
          marks: {
            decorators: [
              { title: "Strong", value: "strong" },
              { title: "Emphasis", value: "em" },
              { title: "Code", value: "code" }
            ],
            annotations: [
              {
                title: "URL",
                name: "link",
                type: "object",
                fields: [
                  {
                    title: "URL",
                    name: "href",
                    type: "url"
                  }
                ]
              }
            ]
          }
        }
      ],
      description: "Description text displayed on the landing page"
    },
    {
      name: "defaultMetaTitle",
      title: "Meta Title",
      type: "string"
    },
    {
      name: "defaultMetaDescription",
      title: "Meta Description",
      type: "text"
    },
    {
      name: "defaultNoindex",
      title: "NoIndex",
      type: "boolean"
    },
    {
      name: "defaultNofollow",
      title: "No Follow",
      type: "boolean"
    },
    {
      name: "defaultCanonicalUrl",
      title: "Set Canonical URL",
      type: "url"
    },
    {
      name: "defaultSitemapInclude",
      title: "Sitemap Inclusion",
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
    },

  ]
};
