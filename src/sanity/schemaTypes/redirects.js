export default {
  name: 'redirects',
  title: 'Redirects',
  type: 'document',
  fields: [
    {
      name: 'sourcePath',
      title: 'Source URL (Redirect FROM)',
      type: 'string',
      description: 'The URL path that should redirect to another page (e.g., "/source-page", "/ke/old-offer"). This is what gets redirected FROM.',
      validation: Rule => Rule.required(),
      placeholder: '/source-url-path'
    },
    {
      name: 'targetUrl',
      title: 'Target URL (Redirect TO)',
      type: 'string',
      description: 'The URL where users should be redirected TO. This is the destination page. Can be relative path (e.g., "/target-page") or full URL.',
      validation: Rule => Rule.custom((value, context) => {
        const redirectType = context?.parent?.redirectType;
        if (redirectType === '410') {
          return true;
        }
        return value ? true : 'Target URL is required unless Redirect Type is 410';
      }),
      placeholder: '/target-page-url'
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
      isActive: 'isActive',
      redirectType: 'redirectType'
    },
    prepare(selection) {
      const {title, subtitle, isActive, redirectType} = selection;
      return {
        title: `${title || 'Old URL'} → ${subtitle || 'New URL'}`,
        subtitle: `${redirectType || '301'} redirect ${isActive ? '(Active)' : '(Inactive)'}`
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
