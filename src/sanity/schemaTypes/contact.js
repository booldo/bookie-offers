export default {
  name: 'contact',
  title: 'Contact',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      initialValue: 'Contact Us',
      validation: Rule => Rule.required(),
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: Rule => Rule.required().email(),
    },
    {
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      description: 'Short description sentence under the title',
    },
    {
      name: 'note',
      title: 'Note',
      type: 'text',
      rows: 3,
      description: 'Small note displayed under the email',
    },
    {
      name: '_updatedAt',
      title: 'Last Updated',
      type: 'datetime',
      readOnly: true,
      description: 'Automatically updated when the document is modified'
    }
  ],
}


