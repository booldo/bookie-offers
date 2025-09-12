export default {
  name: "comparison",
  title: "Country Page Content",
  type: "document",
  preview: {
    select: {
      title: 'title',
      country: 'country.country'
    },
    prepare(selection) {
      const { title, country } = selection;
      return {
        title: title,
        subtitle: country || 'Unknown Country'
      };
    }
  },
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      validation: Rule => Rule.required(),
      description: "The main heading for the Country Page Content section"
    },
    {
      name: "country",
      title: "Country",
      type: "reference",
      to: [{ type: "countryPage" }],
      validation: Rule => Rule.required(),
      description: "Country this Country Page Content is for",
      options: {
        filter: 'isActive == true'
      }
    },
    {
      name: "content",
      title: "Content",
      type: "array",
      of: [{ type: "block" }],
      validation: Rule => Rule.required(),
      description: "The main content paragraphs for the Country Page Content section"
    },
    {
      name: "isActive",
      title: "Is Active",
      type: "boolean",
      initialValue: true,
      description: "Whether this Country Page Content content should be displayed"
    },
    {
      name: "order",
      title: "Order",
      type: "number",
      initialValue: 1,
      description: "Order of display (lower numbers appear first)"
    }
  ]
}; 