import React, { useEffect, useState } from 'react'
import { useClient } from 'sanity'

// Custom input component for affiliate link selection
function AffiliateLinkInput(props) {
  const { value, onChange, document } = props
  const client = useClient()
  const [affiliateLinks, setAffiliateLinks] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchAffiliateLinks = async () => {
      if (!document?.bookmaker?._ref) {
        setAffiliateLinks([])
        return
      }

      setLoading(true)
      try {
        const query = `*[_type == "affiliate" && bookmaker._ref == $bookmakerId && isActive == true] | order(label asc) {
          _id,
          label,
          affiliateUrl,
          prettyLink,
          bonusType->{
            name
          }
        }`
        
        const result = await client.fetch(query, {
          bookmakerId: document.bookmaker._ref
        })
        
        setAffiliateLinks(result)
      } catch (error) {
        console.error('Error fetching affiliate links:', error)
        setAffiliateLinks([])
      } finally {
        setLoading(false)
      }
    }

    fetchAffiliateLinks()
  }, [document?.bookmaker?._ref, client])

  const handleChange = (e) => {
    const selectedId = e.target.value
    onChange(selectedId ? { _ref: selectedId, _type: 'affiliate' } : null)
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
          {loading ? 'Loading affiliate links...' : 'Select an affiliate link'}
        </option>
        {affiliateLinks.map((link) => (
          <option key={link._id} value={link._id}>
            {link.label} - {link.affiliateUrl}
          </option>
        ))}
      </select>
      {affiliateLinks.length === 0 && !loading && document?.bookmaker?._ref && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          No affiliate links found for this bookmaker. Please create affiliate links for this bookmaker first.
        </div>
      )}
    </div>
  )
}

// Custom input component for canonical URL auto-generation
function CanonicalUrlInput(props) {
  const { value, onChange, document } = props
  const client = useClient()
  const [canonicalUrl, setCanonicalUrl] = useState(value || '')
  const [isGenerating, setIsGenerating] = useState(false)

  // Function to generate canonical URL
  const generateCanonicalUrl = async () => {
    if (!document?.country?._ref || !document?.bonusType?._ref || !document?.slug?.current) {
      return ''
    }

    setIsGenerating(true)
    try {
      // Fetch country and bonus type data
      const [countryData, bonusTypeData] = await Promise.all([
        client.fetch(`*[_type == "countryPage" && _id == $id][0]{slug}`, { id: document.country._ref }),
        client.fetch(`*[_type == "bonusType" && _id == $id][0]{name}`, { id: document.bonusType._ref })
      ])

      if (countryData?.slug?.current && bonusTypeData?.name) {
        // Slugify bonus type name to match the actual URL structure
        const bonusTypeSlug = bonusTypeData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
          .replace(/-+/g, "-")

        // Generate canonical URL matching actual offer URL structure
        const newCanonicalUrl = `https://booldo.com/${countryData.slug.current}/${bonusTypeSlug}/${document.slug.current}`
        setCanonicalUrl(newCanonicalUrl)
        onChange(newCanonicalUrl)
        return newCanonicalUrl
      }
    } catch (error) {
      console.error('Error generating canonical URL:', error)
    } finally {
      setIsGenerating(false)
    }
    return ''
  }

  // Auto-generate when dependencies change
  useEffect(() => {
    if (document?.country?._ref && document?.bonusType?._ref && document?.slug?.current) {
      generateCanonicalUrl()
    }
  }, [document?.country?._ref, document?.bonusType?._ref, document?.slug?.current])

  const handleManualChange = (e) => {
    const newValue = e.target.value
    setCanonicalUrl(newValue)
    onChange(newValue)
  }

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <input
          type="url"
          value={canonicalUrl}
          onChange={handleManualChange}
          placeholder="Canonical URL (auto-generated)"
          disabled={isGenerating}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: isGenerating ? '#f5f5f5' : 'white'
          }}
        />
      </div>
      <button
        type="button"
        onClick={generateCanonicalUrl}
        disabled={isGenerating || !document?.country?._ref || !document?.bonusType?._ref || !document?.slug?.current}
        style={{
          padding: '6px 12px',
          backgroundColor: '#2276fc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          opacity: isGenerating ? 0.6 : 1
        }}
      >
        {isGenerating ? 'Generating...' : 'Auto-Generate URL'}
      </button>
      {(!document?.country?._ref || !document?.bonusType?._ref || !document?.slug?.current) && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          Please select country, bonus type, and generate slug to auto-generate canonical URL.
        </div>
      )}
    </div>
  )
}

export default {
  name: "offers",
  title: "Offers",
  type: "document",
  validation: (Rule) =>
    Rule.custom((doc, context) => {
      if (!doc?.slug?.current) return true; // Skip validation if slug is missing

      const { getClient } = context;
      const client = getClient({ apiVersion: "2023-05-03" });

      // Exclude both draft and published versions of the current document
      const currentId = doc._id || "draft";
      const draftId = currentId.startsWith("drafts.")
        ? currentId
        : `drafts.${currentId}`;
      const publishedId = currentId.replace(/^drafts\./, "");
      const query = `count(*[_type == "offers" && slug.current == $slug && !(_id in [$draftId, $publishedId])])`;

      return client
        .fetch(query, {
          slug: doc.slug.current,
          draftId,
          publishedId,
        })
        .then((count) => {
          if (count > 0) {
            return `An offer with this slug already exists. Please modify the slug to make it unique.`;
          }
          return true;
        })
        .catch(() => {
          // If there's an error, allow the operation
          return true;
        });
    }),

  fields: [
    {
      name: "title",
      title: "Offer Title",
      type: "string",
      validation: (Rule) => Rule.required(),
      description:
        "The name of this offer (e.g., 'Get a €5 Free Bet Every Weekend with 1BET!')",
    },
    {
      name: "country",
      title: "Page",
      type: "reference",
      to: [{ type: "countryPage" }],
      validation: (Rule) => Rule.required(),
      options: {
        filter: "isActive == true",
      },
    },
    {
      name: "bonusType",
      title: "Bonus Type",
      type: "reference",
      description:
        "The type of bonus this offer is (e.g., 'Free Bet', 'Deposit Bonus', 'Risk-Free Bet')",
      to: [{ type: "bonusType" }],
      validation: (Rule) => Rule.required(),
      options: {
        filter: ({ document }) => {
          // If no country is selected, show all bonus types
          if (!document?.country?._ref) return {};

          // Filter bonus types by the selected country reference
          return {
            filter: "country._ref == $countryId",
            params: { countryId: document.country._ref },
          };
        },
      },
    },
    {
      name: "bookmaker",
      title: "Bookmaker",
      type: "reference",
      to: [{ type: "bookmaker" }],
      validation: (Rule) => Rule.required(),
      options: {
        filter: ({ document }) => {
          // If no country is selected, show all bookmakers
          if (!document?.country?._ref) return {};

          // Filter bookmakers by the selected country reference
          return {
            filter: "country._ref == $countryId",
            params: { countryId: document.country._ref },
          };
        },
      },
    },
    {
      name: "affiliateLink",
      title: "Pretty Link",
      type: "reference",
      to: [{ type: "affiliate" }],
      description: "Select a Pretty link for this offer",
      inputComponent: AffiliateLinkInput,
    },
    {
      name: "slug",
      title: "Generate Slug",
      type: "slug",
      description: "This will appear as URL link",
      options: {
        source: async (doc, context) => {
          const { getClient } = context;
          const client = getClient({ apiVersion: "2023-05-03" });

          // Get the offer title
          const offerTitle = doc.title || "unknown";

          // Get the bookmaker name
          let bookmakerName = "unknown";
          if (doc.bookmaker?._ref) {
            try {
              const bookmaker = await client.fetch(
                `*[_type == "bookmaker" && _id == $id][0]{
                name
              }`,
                { id: doc.bookmaker._ref }
              );
              bookmakerName = bookmaker?.name || "unknown";
            } catch (error) {
              console.error("Error fetching bookmaker:", error);
            }
          }

          // Get current date
          const today = new Date();
          const dateString = today.toISOString().split("T")[0]; // YYYY-MM-DD format

          // Create slug: title-bookmaker-date
          const slug = `${offerTitle.toLowerCase().replace(/\s+/g, "-")}-${bookmakerName.toLowerCase().replace(/\s+/g, "-")}-${dateString}`;

          return slug;
        },
        maxLength: 96,
        slugify: (input) =>
          input
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^ 0-\u007F\w\-]+/g, "")
            .slice(0, 96),
      },
      validation: (Rule) => Rule.required(),
    },
    { name: "maxBonus", title: "Max Bonus", type: "number" },
    { name: "minDeposit", title: "Min Deposit", type: "number" },
    {
      name: "offerSummary",
      title: "Text Block 1 (offer summary)",
      type: "array",
      of: [{ type: "block" }],
      validation: (Rule) =>
        Rule.required().custom((blocks) => {
          if (!blocks || blocks.length === 0) {
            return "Summary is required.";
          }

          const plainText = blocks
            .map((block) => {
              if (block._type === "block" && Array.isArray(block.children)) {
                return block.children.map((child) => child.text).join("");
              }
              return "";
            })
            .join(" ");

          const wordCount = plainText
            .trim()
            .split(/\s+/)
            .filter(Boolean).length;

          if (wordCount > 15) {
            return `Offer summary must not exceed 15 words. Current count: ${wordCount}`;
          }

          return true;
        }),
      description: "A short summary of this offer (max 15 words)",
    },
    {
      name: "published",
      title: "Published",
      type: "date",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "expires",
      title: "Expires",
      type: "date",
      description: "Optional expiry date for this offer"
    },
    {
      name: "banner",
      title: "Banner",
      type: "image",
      description: "Banner image for this specific offer",
    },
    {
      name: "bannerAlt",
      title: "Banner Alt Text",
      type: "string",
      description: "Alternative text for accessibility and SEO",
    },
    {
      name: "howItWorks",
      title: "Content",
      type: "array",
      of: [
        { type: "block" },
        {
          type: "codeBlock",
          title: "Code Block",
        },
         {
          type: 'image',
          options: { hotspot: true },
        },
      ],
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
              validation: (Rule) => Rule.required(),
            },
            {
              name: "answer",
              title: "Answer",
              type: "array",
              of: [{ type: "block" }],
              validation: (Rule) => Rule.required(),
            },
          ],
        },
      ],
    },

    // Removed custom publishing workflow fields; publish via Sanity's built-in workflow
    {
      name: "metaTitle",
      title: "Meta Title",
      type: "string",
      validation: (Rule) => Rule.required(),
      description: "SEO: Custom meta title for this page",
    },
    {
      name: "metaDescription",
      title: "Meta Description",
      type: "text",
      validation: (Rule) => Rule.required(),
      description: "SEO: Custom meta description for this page",
    },
    {
      name: "noindex",
      title: "Noindex",
      type: "boolean",
      description:
        "SEO: Prevent this page from being indexed by search engines",
    },
    {
      name: "nofollow",
      title: "Nofollow",
      type: "boolean",
      description:
        "SEO: Prevent search engines from following links on this page",
    },
    {
      name: "canonicalUrl",
      title: "Canonical URL",
      type: "string",
      description: "SEO: Canonical URL for this page (auto-generated to match actual URL)",
      inputComponent: CanonicalUrlInput,
    },
    {
      name: "sitemapInclude",
      title: "Include in Sitemap",
      type: "boolean",
      description: "SEO: Should this page be included in sitemap.xml?",
      initialValue: true,
    },
  ],
  preview: {
    select: {
      title: 'title',
      country: 'country.country',
      bookmaker: 'bookmaker.name',
      banner: 'banner'
    },
    prepare(selection) {
      const { title, country, bookmaker, banner } = selection;
      return {
        title: title,
        subtitle: `${bookmaker || 'Unknown Bookmaker'} - ${country || 'Unknown Country'}`,
        media: banner
      };
    }
  },
}; 
