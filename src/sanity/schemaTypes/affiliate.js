export default {
  name: "affiliate",
  title: "Affiliate Links",
  type: "document",
  preview: {
    select: {
      bookmakerName: 'bookmaker.name',
      url: 'affiliateUrl'
    },
    prepare(selection) {
      const {bookmakerName, url} = selection
      return {
        title: bookmakerName || 'Untitled Affiliate Link',
        subtitle: url ? `${url.substring(0, 50)}...` : 'No URL',
        media: bookmakerName ? undefined : undefined
      }
    }
  },
  fields: [
    {
      name: "bookmaker",
      title: "Bookmaker",
      type: "reference",
      to: [{ type: "bookmaker" }],
      validation: Rule => Rule.required()
    },
    {
      name: "affiliateUrl",
      title: "Affiliate Link URL",
      type: "url",
      validation: Rule => Rule.required(),
      description: "The actual affiliate/tracking link"
    },
    {
      name: "isActive",
      title: "Active",
      type: "boolean",
      initialValue: true,
      description: "Whether this affiliate link is currently active"
    }
  ]
}; 