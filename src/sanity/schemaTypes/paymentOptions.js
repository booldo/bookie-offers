export default {
  name: "paymentOptions",
  title: "Payment Options",
  type: "document",
  preview: {
    select: {
      title: 'name',
      isActive: 'isActive'
    },
    prepare(selection) {
      const { title, isActive } = selection
      return {
        title: title || 'Untitled Payment Option',
        subtitle: isActive ? 'Active' : 'Inactive'
      }
    }
  },
  fields: [
    {
      name: "name",
      title: "Payment Option Name",
      type: "string",
      validation: Rule => Rule.required(),
      description: "The name of the payment option (e.g., 'Mobile Money', 'Credit Card')"
    },
    {
      name: "description",
      title: "Description",
      type: "text",
      description: "Optional description of the payment option"
    },
    {
      name: "isActive",
      title: "Active",
      type: "boolean",
      initialValue: true,
      description: "Whether this payment option is currently active"
    }
  ]
};
