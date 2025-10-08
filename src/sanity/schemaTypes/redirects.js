export default {
  name: 'redirects',
  title: 'Redirects',
  type: 'document',
  fields: [
    {
      name: 'sourcePath',
      title: 'Old URL (Source Path)',
      type: 'string',
      description: 'The OLD URL path from previous domain that users are visiting (e.g., "/old-page", "/ng/old-offer"). This is what gets redirected FROM.',
      validation: Rule => Rule.required(),
      placeholder: '/old-url-path'
    },
    {
      name: 'targetUrl',
      title: 'New URL (Target Destination)',
      type: 'string',
      description: 'The NEW URL where users should be redirected TO. Use the current page URL you are on. Can be relative path (e.g., "/new-page") or full URL.',
      validation: Rule => Rule.custom((value, context) => {
        const redirectType = context?.parent?.redirectType;
        if (redirectType === '410') {
          return true;
        }
        return value ? true : 'Target URL is required unless Redirect Type is 410';
      }),
      placeholder: '/current-page-url'
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
