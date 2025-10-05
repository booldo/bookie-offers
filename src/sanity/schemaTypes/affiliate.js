import React, { useEffect, useState } from 'react'
import { useClient } from 'sanity'

// Custom input component for bonus type selection
function BonusTypeInput(props) {
  const { value, onChange, document } = props
  const client = useClient()
  const [bonusTypes, setBonusTypes] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchBonusTypes = async () => {
      if (!document?.bookmaker?._ref) {
        setBonusTypes([])
        return
      }

      setLoading(true)
      try {
        // First get the bookmaker's country
        const bookmakerQuery = `*[_type == "bookmaker" && _id == $bookmakerId][0]{
          country->{
            _id
          }
        }`
        
        const bookmaker = await client.fetch(bookmakerQuery, {
          bookmakerId: document.bookmaker._ref
        })

        if (bookmaker?.country?._id) {
          // Then get bonus types for that country
          const bonusTypesQuery = `*[_type == "bonusType" && country._ref == $countryId && isActive == true] | order(name asc) {
            _id,
            name,
            description
          }`
          
          const result = await client.fetch(bonusTypesQuery, {
            countryId: bookmaker.country._id
          })
          
          setBonusTypes(result)
        } else {
          setBonusTypes([])
        }
      } catch (error) {
        console.error('Error fetching bonus types:', error)
        setBonusTypes([])
      } finally {
        setLoading(false)
      }
    }

    fetchBonusTypes()
  }, [document?.bookmaker?._ref, client])

  const handleChange = (e) => {
    const selectedId = e.target.value
    onChange(selectedId ? { _ref: selectedId, _type: 'bonusType' } : null)
  }

  return (
    <div>
      <select 
        value={value?._ref || ''} 
        onChange={handleChange}
        disabled={loading}
        style={{ 
          width: '100%', 
          padding: '8px', 
          border: '1px solid #ccc', 
          borderRadius: '4px',
          backgroundColor: loading ? '#f5f5f5' : 'white'
        }}
      >
        <option value="">
          {loading ? 'Loading bonus types...' : 'Select a bonus type'}
        </option>
        {bonusTypes.map((bonusType) => (
          <option key={bonusType._id} value={bonusType._id}>
            {bonusType.name}
          </option>
        ))}
      </select>
      {bonusTypes.length === 0 && !loading && document?.bookmaker?._ref && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          No bonus types found for this bookmaker's country. Please create bonus types for this country first.
        </div>
      )}
    </div>
  )
}

export default {
  name: "affiliate",
  title: "Pretty Links",
  type: "document",
  preview: {
    select: {
      label: 'label',
      bookmakerName: 'bookmaker.name',
      url: 'affiliateUrl',
      prettyLink: 'prettyLink.current'
    },
    prepare(selection) {
      const {label, bookmakerName, url, prettyLink} = selection
      return {
        title: label || bookmakerName || 'Untitled Pretty Link',
        subtitle: prettyLink ? `/${prettyLink}` : (url ? `${url.substring(0, 50)}...` : 'No URL')
      }
    }
  },
  fields: [
    {
      name: "label",
      title: "Label",
      type: "string",
      description: "A descriptive label for this affiliate link",
      validation: Rule => Rule.required().min(3).max(100)
    },
    {
      name: "bookmaker",
      title: "Bookmaker",
      type: "reference",
      to: [{ type: "bookmaker" }],
      validation: Rule => Rule.required()
    },
    {
      name: "bonusType",
      title: "Bonus Type",
      type: "reference",
      to: [{ type: "bonusType" }],
      validation: Rule => Rule.required(),
      description: "The type of bonus this pretty link is for (filtered by bookmaker's country)",
      inputComponent: BonusTypeInput
    },
    {
      name: "affiliateUrl",
      title: "Affiliate Link URL",
      type: "url",
      validation: Rule => Rule.required(),
      description: "The actual affiliate/tracking link"
    },
    {
      name: "prettyLink",
      title: "Generate pretty Link",
      type: "slug",
      description: "Pretty link in format: bookmaker/bonustype (e.g., betika/free-bet). Click the Generate button to create automatically.",
      options: {
        source: async (doc, context) => {
          const { getClient } = context;
          const client = getClient({ apiVersion: '2023-05-03' });
          
          // If no bookmaker or bonus type selected, return empty
          if (!doc.bookmaker?._ref || !doc.bonusType?._ref) {
            return "Please select bookmaker and bonus type first";
          }
          
          try {
            // Fetch bookmaker and bonus type data
            const query = `{
              "bookmaker": *[_type == "bookmaker" && _id == $bookmakerId][0]{
                name
              },
              "bonusType": *[_type == "bonusType" && _id == $bonusTypeId][0]{
                name
              }
            }`;

            const result = await client.fetch(query, {
              bookmakerId: doc.bookmaker._ref,
              bonusTypeId: doc.bonusType._ref
            });

            if (result.bookmaker && result.bonusType) {
              const bookmakerName = result.bookmaker.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
              const bonusTypeName = result.bonusType.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

              if (bookmakerName && bonusTypeName) {
                const baseSlug = `${bookmakerName}/${bonusTypeName}`;

                // Fetch existing prettyLinks for this bookmaker/bonusType to determine next available numeric suffix
                const existingQuery = `
                  *[_type == "affiliate" && bookmaker._ref == $bookmakerId && bonusType._ref == $bonusTypeId && defined(prettyLink.current) && _id != $currentId]{
                    prettyLink
                  }
                `;
                const existing = await client.fetch(existingQuery, {
                  bookmakerId: doc.bookmaker._ref,
                  bonusTypeId: doc.bonusType._ref,
                  currentId: doc._id || ''
                });

                const existingSlugs = (existing || [])
                  .map(e => (typeof e.prettyLink === 'string' ? e.prettyLink : e.prettyLink?.current) || '')
                  .filter(Boolean);

                if (!existingSlugs.length) {
                  return baseSlug;
                }

                // Determine the highest suffix used for this base
                let maxSuffix = 1;
                existingSlugs.forEach(slugVal => {
                  if (slugVal === baseSlug) {
                    maxSuffix = Math.max(maxSuffix, 1);
                  } else if (slugVal.startsWith(baseSlug + '-')) {
                    const tail = slugVal.substring(baseSlug.length + 1);
                    const n = parseInt(tail, 10);
                    if (!Number.isNaN(n)) {
                      maxSuffix = Math.max(maxSuffix, n);
                    }
                  }
                });

                if (existingSlugs.includes(baseSlug)) {
                  return `${baseSlug}-${maxSuffix + 1}`;
                }
                return baseSlug;
              }
            }
            
            return "Could not generate link";
          } catch (error) {
            console.error('Error generating pretty link:', error);
            return "Error generating link";
          }
        },
        maxLength: 96,
        slugify: input =>
          input
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^ 0-\u007F\w\-/]+/g, '')
            .slice(0, 96)
      },
      validation: Rule => Rule.required().custom((doc, context) => {
        return true;
      })
    },
    {
      name: "isActive",
      title: "Active",
      type: "boolean",
      initialValue: true,
      description: "Whether this affiliate link is currently active"
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