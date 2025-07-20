export default {
  name: "offer",
  title: "Offer",
  type: "document",
  fields: [
    { name: "id", title: "ID", type: "string" },
    { name: "title", title: "Title", type: "string" },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: doc => `${doc.country}-${doc.bookmaker}-${doc.title}`,
        maxLength: 96,
        slugify: input =>
          input
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^ 0-\u007F\w\-]+/g, '')
            .slice(0, 96)
      }
    },
    { name: "url", title: "URL", type: "url", description: "External link for the offer (Get Bonus)" },
    { name: "bookmaker", title: "Bookmaker", type: "string" },
    { name: "bonusType", title: "Bonus Type", type: "string" },
    { name: "country", title: "Country", type: "string" },
    { name: "maxBonus", title: "Max Bonus", type: "number" },
    { name: "minDeposit", title: "Min Deposit", type: "number" },
    { name: "description", title: "Description", type: "text" },
    { name: "expires", title: "Expires", type: "date" },
    { name: "published", title: "Published", type: "date" },
    {
      name: "paymentMethods",
      title: "Payment Methods",
      type: "array",
      of: [{ type: "string" }]
    },
    { name: "logo", title: "Logo", type: "image" },
    {
      name: "terms",
      title: "Terms",
      type: "array",
      of: [{ type: "string" }]
    },
    {
      name: "howItWorks",
      title: "How It Works",
      type: "array",
      of: [{ type: "string" }]
    }
  ]
}; 