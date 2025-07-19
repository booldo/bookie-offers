export default {
  name: "banner",
  title: "Banner",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      validation: Rule => Rule.required(),
    },
    {
      name: "image",
      title: "Banner Image",
      type: "image",
      validation: Rule => Rule.required(),
      options: {
        hotspot: true,
      },
    },
    {
      name: "country",
      title: "Country",
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
      name: "order",
      title: "Display Order",
      type: "number",
      validation: Rule => Rule.required().min(1),
    },
    {
      name: "isActive",
      title: "Active",
      type: "boolean",
      initialValue: true,
    },
  ],
  orderings: [
    {
      title: "Display Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      country: "country",
      media: "image",
    },
    prepare(selection) {
      const { title, country, media } = selection;
      return {
        title: title,
        subtitle: country,
        media: media,
      };
    },
  },
}; 