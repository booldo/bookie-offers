// Sanity schema for the Worldwide Page
export default {
  name: 'worldwidePage',
  title: 'Worldwide Page',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3
    },
    // Add more fields as needed for your worldwide page content
    {
      name: 'mainContent',
      title: 'Main Content',
      type: 'array',
      of: [{ type: 'block' }]
    },
    // Example: banners, featured offers, etc.
    {
      name: 'banners',
      title: 'Banners',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'banner' }] }]
    }
  ]
}
