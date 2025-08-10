export default {
  name: 'clickTracking',
  title: 'Click Tracking',
  type: 'document',
  fields: [
    {
      name: 'linkId',
      title: 'Link ID',
      type: 'string',
      description: 'Unique identifier for the link being tracked',
      validation: Rule => Rule.required()
    },
    {
      name: 'linkType',
      title: 'Link Type',
      type: 'string',
      options: {
        list: [
          { title: 'Offer Link', value: 'offer' },
          { title: 'Bookmaker Link', value: 'bookmaker' },
          { title: 'Banner Link', value: 'banner' },
          { title: 'Custom Link', value: 'custom' }
        ]
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'linkUrl',
      title: 'Link URL',
      type: 'url',
      description: 'The actual URL that was clicked',
      validation: Rule => Rule.required()
    },
    {
      name: 'linkTitle',
      title: 'Link Title',
      type: 'string',
      description: 'Title or name of the link for reference'
    },
    {
      name: 'country',
      title: 'Country',
      type: 'reference',
      to: [{ type: 'countryPage' }],
      validation: Rule => Rule.required(),
      description: 'Country this click tracking is for',
      options: {
        filter: 'isActive == true'
      }
    },
    {
      name: 'pageUrl',
      title: 'Page URL',
      type: 'string',
      description: 'The page where the click occurred'
    },
    {
      name: 'userAgent',
      title: 'User Agent',
      type: 'text',
      description: 'Browser and device information'
    },
    {
      name: 'ipAddress',
      title: 'IP Address',
      type: 'string',
      description: 'IP address of the user (if available)'
    },
    {
      name: 'clickedAt',
      title: 'Clicked At',
      type: 'datetime',
      description: 'When the click occurred',
      validation: Rule => Rule.required()
    },
    {
      name: 'referrer',
      title: 'Referrer',
      type: 'string',
      description: 'The page that referred the user'
    },
    {
      name: 'sessionId',
      title: 'Session ID',
      type: 'string',
      description: 'Unique session identifier'
    }
  ],
  preview: {
    select: {
      title: 'linkTitle',
      linkType: 'linkType',
      country: 'country.country',
      clickedAt: 'clickedAt'
    },
    prepare(selection) {
      const { title, linkType, country, clickedAt } = selection;
      return {
        title: title || 'Untitled Link',
        subtitle: `${linkType} - ${country || 'Unknown Country'} - ${clickedAt ? new Date(clickedAt).toLocaleDateString() : 'No date'}`
      };
    }
  }
}; 