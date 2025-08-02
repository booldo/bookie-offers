export default {
  name: "seoSettings",
  title: "HomePages Metadata",
  type: "document",
  preview: {
    select: {
      title: 'defaultMetaTitle',
      subtitle: 'country'
    }
  },
  fields: [
    {
      name: "country",
      title: "Country Page",
      type: "string",
      validation: Rule => Rule.required(),
      options: {
        list: [
          { title: "Ghana", value: "Ghana" },
          { title: "Nigeria", value: "Nigeria" },
        ],
      },
    },
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
    }
  ]
}; 