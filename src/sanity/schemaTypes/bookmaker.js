export default {
  name: "bookmaker",
  title: "Bookmaker",
  type: "document",
  validation: Rule => Rule.custom((doc, context) => {
    if (!doc?.name || !doc?.country) return true // Skip validation if required fields are missing
    
    // Check if another bookmaker with same name and country exists
    const { getClient } = context
    const client = getClient({ apiVersion: '2023-05-03' })
    
    // Use a more reliable way to exclude the current document
    const currentId = doc._id || 'draft'
    const query = `count(*[_type == "bookmaker" && name == $name && country == $country && _id != $currentId])`
    
    return client.fetch(query, { name: doc.name, country: doc.country, currentId })
      .then(count => {
        if (count > 0) {
          return `A bookmaker with name "${doc.name}" already exists in ${doc.country}`
        }
        return true
      })
      .catch(() => {
        // If there's an error, allow the operation
        return true
      })
  }),
  preview: {
    select: {
      title: 'name',
      subtitle: 'country',
      media: 'logo'
    }
  },
  fields: [
    { 
      name: "name", 
      title: "Bookmaker Name", 
      type: "string",
      validation: Rule => Rule.required()
    },
    { name: "logo", title: "Logo", type: "image" },
    { name: "logoAlt", title: "Logo Alt Text", type: "string", description: "Alternative text for accessibility and SEO" },
    {
      name: "country",
      title: "Country",
      type: "string",
      validation: Rule => Rule.required(),
      options: {
        list: [
          { title: "Nigeria", value: "Nigeria" },
          { title: "Ghana", value: "Ghana" }
        ]
      }
    },
    {
      name: "license",
      title: "License",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Lagos State Lotteries and Gaming Authority (LSLGA) - State level", value: "Lagos State Lotteries and Gaming Authority (LSLGA) - State level" },
          { title: "National Lottery Regulatory Commission (NLRC) - Federal", value: "National Lottery Regulatory Commission (NLRC) - Federal" },
          { title: "Ghana Gaming Commission (GCG) Licenses", value: "Ghana Gaming Commission (GCG) Licenses" }
        ]
      }
    },
    {
      name: "paymentMethods",
      title: "Payment Methods",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Mobile Money", value: "Mobile Money" },
          { title: "Credit Card", value: "Credit Card" },
          { title: "Debit Card", value: "Debit Card" },
          { title: "Bitcoin (BTC)", value: "Bitcoin (BTC)" },
          { title: "Ethereum (ETH)", value: "Ethereum (ETH)" },
          { title: "Litecoin (LTC)", value: "Litecoin (LTC)" },
          { title: "Dogecoin (DOGE)", value: "Dogecoin (DOGE)" },
          { title: "Bank Transfer", value: "Bank Transfer" },
          { title: "Internet Banking", value: "Internet Banking" },
          { title: "EWallets", value: "EWallets" }
        ]
      }
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
    }
  ]
}; 