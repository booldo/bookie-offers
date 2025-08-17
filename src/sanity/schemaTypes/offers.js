export default {
  name: "offers",
  title: "Offers",
  type: "document",
  validation: Rule => Rule.custom((doc, context) => {
    if (!doc?.slug?.current) return true // Skip validation if slug is missing
    
    const { getClient } = context
    const client = getClient({ apiVersion: '2023-05-03' })

    // Exclude both draft and published versions of the current document
    const currentId = doc._id || 'draft'
    const draftId = currentId.startsWith('drafts.') ? currentId : `drafts.${currentId}`
    const publishedId = currentId.replace(/^drafts\./, '')
    const query = `count(*[_type == "offers" && slug.current == $slug && !(_id in [$draftId, $publishedId])])`

    return client.fetch(query, {
      slug: doc.slug.current,
      draftId,
      publishedId
    })
      .then(count => {
        if (count > 0) {
          return `An offer with this slug already exists. Please modify the slug to make it unique.`
        }
        return true
      })
      .catch(() => {
        // If there's an error, allow the operation
        return true
      })
  }),
  // Add draft preview functionality
  preview: {
    select: {
      title: 'title',
      bookmakerName: 'bookmaker.name',
      country: 'country.country',
      bonusType: 'bonusType.name',
      expires: 'expires',
      published: 'published',
      maxBonus: 'maxBonus',
      minDeposit: 'minDeposit',
      isDraft: '_id'
    },
    prepare(selection) {
      const {title, bookmakerName, country, bonusType, expires, published, maxBonus, minDeposit, isDraft} = selection
      
      // Check if this is a draft
      const isDraftVersion = isDraft && isDraft.startsWith('drafts.');
      
      // Format dates
      const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      };
      
      // Build subtitle with key info and draft status
      const subtitleParts = [];
      if (isDraftVersion) subtitleParts.push('🔄 DRAFT');
      if (bookmakerName) subtitleParts.push(bookmakerName);
      if (bonusType) subtitleParts.push(bonusType);
      if (country) subtitleParts.push(country);
      
      const subtitle = subtitleParts.join(' • ');
      
      // Build description with additional details
      const descriptionParts = [];
      if (maxBonus) descriptionParts.push(`Max: ${maxBonus}`);
      if (minDeposit) descriptionParts.push(`Min: ${minDeposit}`);
      if (expires) descriptionParts.push(`Expires: ${formatDate(expires)}`);
      if (published) descriptionParts.push(`Published: ${formatDate(published)}`);
      
      const description = descriptionParts.join(' | ');
      
      return {
        title: title || 'Untitled Offer',
        subtitle: subtitle || 'No details available',
        description: description || '',
        media: isDraftVersion ? '🔄' : undefined
      }
    }
  },
  // Add custom actions for draft preview
  document: {
    newDocumentOptions: (prev, context) => {
      return prev.filter((option) => option.template !== 'offers')
    },
    // Add preview action
    actions: (prev, context) => {
      const { draft, published } = context;
      const doc = draft || published;
      
      if (!doc) return prev;
      
      // Add preview action for drafts
      if (draft && !published) {
        return [
          ...prev,
          {
            label: 'Preview Draft',
            onHandle: async (props) => {
              const { draft } = props;
              if (draft) {
                // Generate preview URL
                const previewUrl = await generatePreviewUrl(draft);
                // Open in new tab
                window.open(previewUrl, '_blank');
              }
            },
            icon: () => '👁️'
          }
        ];
      }
      
      // Add preview action for published documents
      if (published) {
        return [
          ...prev,
          {
            label: 'View Live',
            onHandle: async (props) => {
              const { published } = props;
              if (published) {
                // Generate live URL
                const liveUrl = await generateLiveUrl(published);
                // Open in new tab
                window.open(liveUrl, '_blank');
              }
            },
            icon: () => '🌐'
          }
        ];
      }
      
      return prev;
    }
  },
  fields: [
    {
      name: "title",
      title: "Offer Title",
      type: "string",
      validation: Rule => Rule.required(),
      description: "The name of this offer (e.g., 'Get a €5 Free Bet Every Weekend with 1BET!')"
    },
    {
      name: "country",
      title: "Page",
      type: "reference",
      to: [{ type: "countryPage" }],
      validation: Rule => Rule.required(),
      options: {
        filter: 'isActive == true'
      }
    },
    {
      name: "bonusType",
      title: "Bonus Type",
      type: "reference",
      description: "The type of bonus this offer is (e.g., 'Free Bet', 'Deposit Bonus', 'Risk-Free Bet')",
      to: [{ type: "bonusType" }],
      validation: Rule => Rule.required(),
      options: {
        filter: ({document}) => {
          // If no country is selected, show all bonus types
          if (!document?.country?._ref) return {}
          
          // Filter bonus types by the selected country reference
          return {
            filter: 'country._ref == $countryId',
            params: { countryId: document.country._ref }
          }
        }
      }
    },
    {
      name: "bookmaker",
      title: "Bookmaker",
      type: "reference",
      to: [{ type: "bookmaker" }],
      validation: Rule => Rule.required(),
      options: {
        filter: ({document}) => {
          // If no country is selected, show all bookmakers
          if (!document?.country?._ref) return {}
          
          // Filter bookmakers by the selected country reference
          return {
            filter: 'country._ref == $countryId',
            params: { countryId: document.country._ref }
          }
        }
      }
    },
    {
      name: "affiliateLink",
      title: "Affiliate Link",
      type: "reference",
      to: [{ type: "affiliate" }],
      description: "Select an affiliate link for this offer",
      options: {
        filter: ({document}) => {
          // If no bookmaker is selected, show all affiliate links
          if (!document?.bookmaker?._ref) return {}
          
          // Filter affiliate links by the selected bookmaker and active status
          return {
            filter: 'bookmaker._ref == $bookmakerId && isActive == true',
            params: { bookmakerId: document.bookmaker._ref }
          }
        }
      }
    },
    {
      name: "slug",
      title: "Generate Pretty Link",
      type: "slug",
      description: "This will appear as www.booldo.com/pretty link",
      options: {
        source: async (doc, context) => {
          const { getClient } = context;
          const client = getClient({ apiVersion: '2023-05-03' });
          
          // Get the offer title
          const offerTitle = doc.title || "unknown";
          
          // Get the bookmaker name
          let bookmakerName = "unknown";
          if (doc.bookmaker?._ref) {
            try {
              const bookmaker = await client.fetch(`*[_type == "bookmaker" && _id == $id][0]{
                name
              }`, { id: doc.bookmaker._ref });
              bookmakerName = bookmaker?.name || "unknown";
            } catch (error) {
              console.error("Error fetching bookmaker:", error);
            }
          }
          
          // Get current date
          const today = new Date();
          const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
          
          // Create slug: title-bookmaker-date
          const slug = `${offerTitle.toLowerCase().replace(/\s+/g, '-')}-${bookmakerName.toLowerCase().replace(/\s+/g, '-')}-${dateString}`;
          
          return slug;
        },
        maxLength: 96,
        slugify: input =>
          input
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^ 0-\u007F\w\-]+/g, '')
            .slice(0, 96)
      },
      validation: Rule => Rule.required(),
    },
    { name: "maxBonus", title: "Max Bonus", type: "number" },
    { name: "minDeposit", title: "Min Deposit", type: "number" },
    {
      name: "offerSummary",
      title: "Text Block 1 (offer summary)",
      type: "array",
      of: [{ type: "block" }],
      validation: Rule => Rule.required().custom(blocks => {
        if (!blocks || blocks.length === 0) {
          return "Summary is required.";
        }

        const plainText = blocks
          .map(block => {
            if (block._type === 'block' && Array.isArray(block.children)) {
              return block.children.map(child => child.text).join('');
            }
            return '';
          })
          .join(' ');

        const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;

        if (wordCount > 15) {
          return `Offer summary must not exceed 15 words. Current count: ${wordCount}`;
        }

        return true;
      }),
      description: "A short summary of this offer (max 15 words)"
    },

  {
      name: "description",
      title: "Text Block 2 (offer description)",
      type: "array",
      of: [{ type: "block" }]
    },
    { name: "expires", title: "Expires", type: "date" },
    { name: "published", title: "Published", type: "date" },
    { name: "banner", title: "Banner", type: "image", description: "Banner image for this specific offer" },
    { name: "bannerAlt", title: "Banner Alt Text", type: "string", description: "Alternative text for accessibility and SEO" },
    {
      name: "howItWorks",
      title: "Content",
      type: "array",
      of: [{ type: "block" }]
    },
    {
      name: "faq",
      title: "FAQ",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "question",
              title: "Question",
              type: "array",
              of: [{ type: "block" }],
              validation: Rule => Rule.required()
            },
            {
              name: "answer",
              title: "Answer",
              type: "array",
              of: [{ type: "block" }],
              validation: Rule => Rule.required()
            }
          ],
          preview: {
            select: {
              title: "question"
            }
          }
        }
      ]
    },
    // Draft preview configuration
    {
      name: "draftPreview",
      title: "Draft Preview Settings",
      type: "object",
      description: "Configure how this offer appears in draft preview mode",
      fields: [
        {
          name: "previewMode",
          title: "Preview Mode",
          type: "string",
          options: {
            list: [
              { title: "Full Preview", value: "full" },
              { title: "Minimal Preview", value: "minimal" },
              { title: "Mobile Preview", value: "mobile" },
              { title: "Desktop Preview", value: "desktop" }
            ],
            layout: "radio"
          },
          initialValue: "full"
        },
        {
          name: "previewNotes",
          title: "Preview Notes",
          type: "text",
          description: "Internal notes for content creators about this draft"
        },
        {
          name: "previewExpiry",
          title: "Preview Expiry",
          type: "datetime",
          description: "When this draft preview should expire (optional)"
        }
      ]
    },
    // Publishing workflow
    {
      name: "publishingStatus",
      title: "Publishing Status",
      type: "string",
      options: {
        list: [
          { title: "Draft", value: "draft" },
          { title: "Ready for Review", value: "review" },
          { title: "Approved", value: "approved" },
          { title: "Published", value: "published" },
          { title: "Hidden", value: "hidden" },
          { title: "Expired", value: "expired" },
          { title: "Archived", value: "archived" }
        ],
        layout: "dropdown"
      },
      initialValue: "draft",
      description: "Current status of this offer in the publishing workflow"
    },
    {
      name: "isVisible",
      title: "Is Visible",
      type: "boolean",
      initialValue: true,
      description: "Whether this offer is visible in offer cards (hidden offers show 410 errors)"
    },
    {
      name: "reviewerNotes",
      title: "Reviewer Notes",
      type: "text",
      description: "Notes from content reviewers"
    },
    {
      name: "scheduledPublish",
      title: "Scheduled Publish Date",
      type: "datetime",
      description: "When this offer should be automatically published"
    },
    {
      name: "metaTitle",
      title: "Meta Title",
      type: "string",
      description: "SEO: Custom meta title for this page"
    },
    {
      name: "metaDescription",
      title: "Meta Description",
      type: "text",
      description: "SEO: Custom meta description for this page"
    },
    {
      name: "noindex",
      title: "Noindex",
      type: "boolean",
      description: "SEO: Prevent this page from being indexed by search engines"
    },
    {
      name: "nofollow",
      title: "Nofollow",
      type: "boolean",
      description: "SEO: Prevent search engines from following links on this page"
    },
    {
      name: "canonicalUrl",
      title: "Canonical URL",
      type: "url",
      description: "SEO: Canonical URL for this page (leave blank for default)"
    },
    {
      name: "sitemapInclude",
      title: "Include in Sitemap",
      type: "boolean",
      description: "SEO: Should this page be included in sitemap.xml?",
      initialValue: true
    }
  ]
}; 

// Helper functions for draft preview
async function generatePreviewUrl(draft) {
  try {
    // Get the country slug for the draft
    const countrySlug = draft.country?.slug?.current || 'ng';
    
    // Generate preview URL with draft ID
    const previewUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/preview?secret=${process.env.SANITY_PREVIEW_SECRET}&slug=${draft.slug?.current}&country=${countrySlug}&draftId=${draft._id}`;
    
    return previewUrl;
  } catch (error) {
    console.error('Error generating preview URL:', error);
    return '#';
  }
}

async function generateLiveUrl(published) {
  try {
    // Get the country slug for the published document
    const countrySlug = published.country?.slug?.current || 'ng';
    
    // Generate live URL
    const liveUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${countrySlug}/offers/${published.slug?.current}`;
    
    return liveUrl;
  } catch (error) {
    console.error('Error generating live URL:', error);
    return '#';
  }
} 