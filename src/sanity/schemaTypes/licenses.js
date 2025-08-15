export default {
  name: "licenses",
  title: "Licenses",
  type: "document",
  preview: {
    select: {
      title: 'name',
      isActive: 'isActive'
    },
    prepare(selection) {
      const { title, isActive } = selection
      return {
        title: title || 'Untitled License',
        subtitle: isActive ? 'Active' : 'Inactive',
        media: isActive ? undefined : undefined
      }
    }
  },
  fields: [
    {
      name: "name",
      title: "License Name",
      type: "string",
      validation: Rule => Rule.required(),
      description: "The name of the license (e.g., 'Lagos State Lotteries and Gaming Authority (LSLGA)')"
    },
    {
      name: "description",
      title: "Description",
      type: "text",
      description: "Optional description of the license"
    },
    {
      name: "isActive",
      title: "Active",
      type: "boolean",
      initialValue: true,
      description: "Whether this license is currently active"
    }
  ]
};
