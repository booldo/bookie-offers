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
      title: "Country",
      type: "reference",
      to: [{ type: "countryPage" }],
      validation: Rule => Rule.required(),
      description: "Country these SEO settings are for",
      options: {
        filter: 'isActive == true'
      }
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