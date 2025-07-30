export default {
  name: "comparison",
  title: "Comparison Content",
  type: "document",
  preview: {
    select: {
      title: 'title',
      subtitle: 'country'
    },
    prepare(selection) {
      const {title, subtitle} = selection
      return {
        title: title || 'Untitled Comparison',
        subtitle: subtitle
      }
    }
  },
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      validation: Rule => Rule.required(),
      description: "The main heading for the comparison section"
    },
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
      },
      description: "Which country this comparison content is for"
    },
    {
      name: "content",
      title: "Content",
      type: "array",
      of: [{ type: "block" }],
      validation: Rule => Rule.required(),
      description: "The main content paragraphs for the comparison section"
    },
    {
      name: "isActive",
      title: "Is Active",
      type: "boolean",
      initialValue: true,
      description: "Whether this comparison content should be displayed"
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