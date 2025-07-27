export default {
  name: "seoSettings",
  title: "SEO Settings (Global)",
  type: "document",
  fields: [
    {
      name: "robotsTxt",
      title: "robots.txt Content",
      type: "text",
      description: "Content for robots.txt (editable from CMS)"
    },
    {
      name: "sitemapExtraUrls",
      title: "Extra Sitemap URLs",
      type: "array",
      of: [{ type: "url" }],
      description: "Additional URLs to include in sitemap.xml"
    },
    {
      name: "defaultMetaTitle",
      title: "Default Meta Title",
      type: "string"
    },
    {
      name: "defaultMetaDescription",
      title: "Default Meta Description",
      type: "text"
    },
    {
      name: "defaultNoindex",
      title: "Default Noindex",
      type: "boolean"
    },
    {
      name: "defaultNofollow",
      title: "Default Nofollow",
      type: "boolean"
    },
    {
      name: "defaultCanonicalUrl",
      title: "Default Canonical URL",
      type: "url"
    },
    {
      name: "defaultSitemapInclude",
      title: "Default Include in Sitemap",
      type: "boolean",
      initialValue: true
    }
  ]
}; 