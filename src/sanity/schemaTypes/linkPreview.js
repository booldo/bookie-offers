export default {
  name: "linkPreview",
  title: "Link Preview",
  type: "object",
  fields: [
    {
      name: "url",
      title: "URL",
      type: "url",
      validation: (Rule) => Rule.required(),
      description: "The URL to create a preview for",
    },
    {
      name: "title",
      title: "Title",
      type: "string",
      description: "Override the auto-fetched title (optional)",
    },
    {
      name: "description",
      title: "Description",
      type: "text",
      description: "Override the auto-fetched description (optional)",
    },
    {
      name: "image",
      title: "Preview Image",
      type: "url",
      description: "Override the auto-fetched image URL (optional)",
    },
    {
      name: "siteName",
      title: "Site Name",
      type: "string",
      description: "Override the auto-fetched site name (optional)",
    },
    {
      name: "displayStyle",
      title: "Display Style",
      type: "string",
      options: {
        list: [
          { title: "Card (Large)", value: "card" },
          { title: "Compact", value: "compact" },
          { title: "Inline", value: "inline" },
        ],
      },
      initialValue: "card",
    },
  ],
  preview: {
    select: {
      title: "title",
      url: "url",
      image: "image",
    },
    prepare(selection) {
      const { title, url, image } = selection;
      return {
        title: title || url || "Link Preview",
        subtitle: url,
        media: image || undefined,
      };
    },
  },
};
