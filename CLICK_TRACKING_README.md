# Click Tracking System for Pretty Links

This system allows you to track clicks on pretty links across all pages in your Sanity-powered website.

## Features

- ✅ **Automatic Click Tracking**: Tracks clicks on pretty links with detailed analytics
- ✅ **Country-Based Tracking**: Automatically detects and tracks clicks by country (Nigeria, Ghana, World Wide)
- ✅ **Session Management**: Tracks user sessions for better analytics
- ✅ **Rich Analytics**: Provides detailed insights including top links, country breakdown, and recent clicks
- ✅ **Sanity Integration**: All data is stored in Sanity for easy management and querying
- ✅ **Privacy Compliant**: Only tracks necessary data, respects user privacy

## Setup

### 1. Schema Configuration

The click tracking schema has been added to your Sanity configuration:

```typescript
// src/sanity/schemaTypes/clickTracking.js
// This schema defines the structure for tracking click data
```

### 2. Offer Schema Updates

The offer schema now includes tracking fields:

- `prettyLink`: The affiliate/pretty link URL
- `trackingId`: Unique identifier for tracking (optional, uses `_id` if not provided)
- `affiliateLink`: Direct affiliate link (if different from pretty link)

### 3. Components

#### TrackedLink Component

Use this component to wrap any link you want to track:

```tsx
import TrackedLink from '../components/TrackedLink';

<TrackedLink
  href="https://example.com/affiliate-link"
  linkId="unique-link-id"
  linkType="offer"
  linkTitle="Offer Title"
  target="_blank"
  rel="noopener noreferrer"
  className="your-css-classes"
>
  Click Here
</TrackedLink>
```

#### useClickTracking Hook

For custom tracking implementation:

```tsx
import { useClickTracking } from '../hooks/useClickTracking';

const { trackLinkClick } = useClickTracking();

const handleClick = async () => {
  await trackLinkClick(
    'unique-link-id',
    'offer',
    'https://example.com/link',
    'Link Title'
  );
  // Your custom logic here
};
```

## Usage Examples

### 1. Tracking Offer Links

In your offer detail pages, the "Get Bonus" button now automatically tracks clicks:

```tsx
{offer.prettyLink && (
  <TrackedLink
    href={offer.prettyLink}
    linkId={offer.trackingId || offer._id}
    linkType="offer"
    linkTitle={offer.title}
    target="_blank"
    rel="noopener noreferrer"
    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg"
  >
    Get Bonus
  </TrackedLink>
)}
```

### 2. Tracking Banner Links

For banner carousels or promotional links:

```tsx
<TrackedLink
  href={banner.linkUrl}
  linkId={`banner-${banner._id}`}
  linkType="banner"
  linkTitle={banner.title}
  target="_blank"
>
  <Image src={banner.imageUrl} alt={banner.imageAlt} />
</TrackedLink>
```

### 3. Tracking Bookmaker Links

For bookmaker-specific links:

```tsx
<TrackedLink
  href={bookmaker.website}
  linkId={`bookmaker-${bookmaker._id}`}
  linkType="bookmaker"
  linkTitle={bookmaker.name}
  target="_blank"
>
  Visit {bookmaker.name}
</TrackedLink>
```

## Analytics

### Viewing Analytics in Sanity Studio

1. Go to your Sanity Studio
2. Navigate to "Click Tracking" in the content menu
3. View individual click records with detailed information

### Programmatic Analytics

Use the analytics functions to build custom dashboards:

```tsx
import { getClickAnalytics, getLinkSpecificAnalytics } from '../sanity/lib/analytics';

// Get overall analytics
const analytics = await getClickAnalytics(
  '2024-01-01T00:00:00Z', // startDate
  '2024-12-31T23:59:59Z'  // endDate
);

// Get analytics for a specific link
const linkAnalytics = await getLinkSpecificAnalytics('your-link-id');
```

### Analytics Dashboard Component

Use the built-in dashboard component:

```tsx
import AnalyticsDashboard from '../components/AnalyticsDashboard';

<AnalyticsDashboard className="your-custom-classes" />
```

## Data Structure

Each click tracking record includes:

- **linkId**: Unique identifier for the link
- **linkType**: Type of link (offer, bookmaker, banner, custom)
- **linkUrl**: The actual URL that was clicked
- **linkTitle**: Human-readable title for the link
- **country**: Country where the click occurred (Nigeria, Ghana, World Wide)
- **pageUrl**: The page where the click occurred
- **userAgent**: Browser and device information
- **clickedAt**: Timestamp of the click
- **referrer**: The page that referred the user
- **sessionId**: Unique session identifier

## Privacy & Compliance

- Only tracks necessary data for analytics
- No personal information is stored
- Session IDs are generated client-side
- IP addresses are not collected by default
- Complies with GDPR and other privacy regulations

## Performance

- Click tracking is asynchronous and non-blocking
- Failed tracking attempts don't affect user experience
- Data is batched and optimized for Sanity
- Minimal impact on page load times

## Troubleshooting

### Click Tracking Not Working

1. Check that the `prettyLink` field is populated in your offer documents
2. Verify that the `TrackedLink` component is properly imported
3. Check browser console for any JavaScript errors
4. Ensure your Sanity client is properly configured

### Analytics Not Loading

1. Verify that the `clickTracking` schema is added to your schema index
2. Check that you have proper permissions in Sanity
3. Ensure the analytics functions are properly imported
4. Check network requests in browser developer tools

### Performance Issues

1. Consider implementing click debouncing for high-traffic sites
2. Monitor Sanity API usage and rate limits
3. Implement error boundaries for tracking components
4. Consider caching analytics data for better performance

## Future Enhancements

- [ ] Real-time analytics dashboard
- [ ] A/B testing for different link formats
- [ ] Conversion tracking integration
- [ ] Advanced filtering and segmentation
- [ ] Export functionality for analytics data
- [ ] Email notifications for high-performing links

## Support

For questions or issues with the click tracking system:

1. Check this documentation first
2. Review the Sanity Studio for data structure
3. Check browser console for error messages
4. Verify all components are properly imported and used 