export default {
  name: 'redirects',
  title: 'Redirects',
  type: 'document',
  fields: [
    {
      name: 'sourcePath',
      title: 'Source Path',
      type: 'string',
      description: 'The original URL path that should redirect (e.g., "/old-page" or "/ng/old-offer")',
      validation: Rule => Rule.required()
    },
    {
      name: 'targetUrl',
      title: 'Target URL',
      type: 'url',
      description: 'Destination URL. Not required when Redirect Type is 410 (Gone).',
      validation: Rule => Rule.custom((value, context) => {
        const redirectType = context?.parent?.redirectType;
        if (redirectType === '410') {
          return true;
        }
        return value ? true : 'Target URL is required unless Redirect Type is 410';
      })
    },
    {
      name: 'redirectType',
      title: 'Redirect Type',
      type: 'string',
      options: {
        list: [
          {title: '301 (Permanent)', value: '301'},
          {title: '302 (Temporary)', value: '302'},
          {title: '410 (Gone)', value: '410'}
        ]
      },
      initialValue: '301',
      description: 'Type of redirect to perform'
    },
    {
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Whether this redirect is currently active',
      initialValue: true
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Optional description of why this redirect exists'
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      readOnly: true,
      description: 'When this redirect was created'
    },
    {
      name: 'updatedAt',
      title: 'Updated At',
      type: 'datetime',
      readOnly: true,
      description: 'When this redirect was last modified'
    }
  ],
  preview: {
    select: {
      title: 'sourcePath',
      subtitle: 'targetUrl',
      isActive: 'isActive'
    },
    prepare(selection) {
      const {title, subtitle, isActive} = selection;
      return {
        title: title || 'Source Path',
        subtitle: `${subtitle || 'Target URL'} ${isActive ? '(Active)' : '(Inactive)'}`
      };
    }
  },
  orderings: [
    {
      title: 'Source Path A-Z',
      name: 'sourcePathAsc',
      by: [{field: 'sourcePath', direction: 'asc'}]
    },
    {
      title: 'Most Recent',
      name: 'updatedAtDesc',
      by: [{field: 'updatedAt', direction: 'desc'}]
    }
  ]
};
