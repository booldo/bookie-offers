# Preview Mode Implementation Guide

## Overview

Your application now has **two separate preview systems**:

1. **Draft Mode** - For live editing in Sanity Studio (Presentation Tool)
2. **Preview Mode** - For shareable preview links with expiry

---

## 1. Draft Mode (Live Editing)

### Purpose
Content editors work directly in Sanity Studio with real-time preview.

### How to Use
1. Open Sanity Studio: `http://localhost:3000/studio`
2. Open any offer document
3. Click the **"Presentation"** tab in the top navigation
4. Edit content and see live updates in the iframe
5. Click "Exit Preview Mode" button to disable

### Technical Details
- **Route**: `/api/draft/enable`
- **Trigger**: Presentation Tool in Sanity Studio
- **Expiry**: Session-based (ends when you close the browser)
- **Access**: Only through Sanity Studio
- **Component**: `<VisualEditing />` + `<DisableDraftMode />`

---

## 2. Preview Mode (Shareable Links)

### Purpose
Share temporary preview links with stakeholders/clients to review unpublished content.

### How to Generate Preview Links

#### Step 1: Get Required Information
You need:
- `SANITY_PREVIEW_SECRET` (from your `.env.local`)
- `draftId` (the Sanity document ID, e.g., `drafts.offer-123`)

#### Step 2: Construct Preview URL

**For Offers:**
```
http://localhost:3000/api/preview?secret=YOUR_SECRET&draftId=drafts.offer-123
```

**For Articles:**
```
http://localhost:3000/api/preview?secret=YOUR_SECRET&draftId=drafts.article-456
```

**For Country Pages:**
```
http://localhost:3000/api/preview?secret=YOUR_SECRET&draftId=drafts.country-789
```

#### Step 3: Share the Link
The API will:
1. Validate the secret
2. Fetch the draft document
3. Check expiry (if set)
4. Redirect to the actual page with `?preview=true&draftId=...`

### Example Preview URLs

**Offer Preview:**
```
/ke/welcome-bonus/betika-bonus?preview=true&draftId=drafts.offer-123
```

**Article Preview:**
```
/briefly/how-to-bet?preview=true&draftId=drafts.article-456
```

### Visual Indicators

When viewing a preview:
- **Yellow banner** at the top: "👁️ Preview Mode - You are viewing unpublished content"
- **Red banner** if expired: "⚠️ Preview Expired - This preview link has expired"
- **Exit Preview** button to return to published content
- Expiry date shown in banner (if set)

---

## Setting Preview Expiry

### In Sanity Studio

Add a `draftPreview` field to your document schema:

```javascript
{
  name: 'draftPreview',
  title: 'Draft Preview Settings',
  type: 'object',
  fields: [
    {
      name: 'previewExpiry',
      title: 'Preview Link Expiry',
      type: 'datetime',
      description: 'When should the preview link expire?',
    },
  ],
}
```

### Setting Expiry Date
1. Open the document in Sanity Studio
2. Find "Draft Preview Settings"
3. Set "Preview Link Expiry" to desired date/time
4. Save the document

---

## Environment Variables Required

### `.env.local`
```env
# Public
NEXT_PUBLIC_SANITY_PROJECT_ID="your_project_id"
NEXT_PUBLIC_SANITY_DATASET="production"
NEXT_PUBLIC_SANITY_API_VERSION="2025-07-13"
NEXT_PUBLIC_SANITY_STUDIO_URL="http://localhost:3000/studio"

# Private
SANITY_VIEWER_TOKEN="your_viewer_token"
SANITY_PREVIEW_SECRET="your_secret_key_here"
```

### Production Environment
Add the same variables to your hosting platform (Vercel/Netlify):
- Update `NEXT_PUBLIC_SANITY_STUDIO_URL` to your production URL
- Use a strong random string for `SANITY_PREVIEW_SECRET`

---

## Testing Preview Mode

### Test Offer Preview

1. **Create a draft offer** in Sanity Studio (don't publish)
2. **Get the draft ID** from the URL: `drafts.{documentId}`
3. **Generate preview URL**:
   ```
   http://localhost:3000/api/preview?secret=YOUR_SECRET&draftId=drafts.{documentId}
   ```
4. **Open the URL** - should redirect to offer page with preview banner
5. **Verify**:
   - Yellow banner appears at top
   - Draft content is displayed
   - "Exit Preview" button works

### Test Expired Preview

1. Set `previewExpiry` to a past date in Sanity
2. Open the preview URL
3. Should see red "Preview Expired" banner

---

## Comparison Table

| Feature | Draft Mode | Preview Mode |
|---------|-----------|--------------|
| **Access** | Sanity Studio only | Direct URL with secret |
| **Use Case** | Live editing | Stakeholder review |
| **Expiry** | Session-based | Time-based (optional) |
| **Visual Editing** | ✅ Yes | ❌ No |
| **Shareable** | ❌ No | ✅ Yes |
| **Route** | `/api/draft/enable` | `/api/preview` |
| **Query Params** | None | `?preview=true&draftId=...` |

---

## Files Modified

### New Files
- `/src/components/PreviewBanner.js` - Preview mode banner
- `/src/app/api/draft/enable/route.js` - Draft mode endpoint
- `/src/app/actions.js` - Draft mode disable action
- `/src/components/DisableDraftMode.js` - Draft mode exit button

### Updated Files
- `/src/app/api/preview/route.js` - Multi-type preview support
- `/src/app/[slug]/[...filters]/page.js` - Preview mode handling
- `/src/app/[slug]/[...filters]/OfferDetailsInner.js` - Draft content fetching
- `/src/app/layout.js` - Visual editing components
- `/src/sanity/lib/client.ts` - Stega encoding
- `/sanity.config.ts` - Presentation Tool

---

## Troubleshooting

### Preview Link Not Working
- ✅ Check `SANITY_PREVIEW_SECRET` matches in URL and `.env.local`
- ✅ Verify `draftId` is correct (should start with `drafts.`)
- ✅ Check document exists in Sanity

### Preview Banner Not Showing
- ✅ Verify URL has `?preview=true&draftId=...` query params
- ✅ Check browser console for errors
- ✅ Ensure `PreviewBanner` component is imported

### Draft Mode Not Working in Studio
- ✅ Check `SANITY_VIEWER_TOKEN` is set
- ✅ Verify Presentation Tool is configured in `sanity.config.ts`
- ✅ Ensure `/api/draft/enable` route exists

### Content Not Updating
- ✅ Clear browser cache
- ✅ Check `useCdn: false` in client config for drafts
- ✅ Verify document is saved in Sanity

---

## Security Notes

1. **Never expose `SANITY_PREVIEW_SECRET`** in client-side code
2. **Use strong random strings** for preview secrets
3. **Set expiry dates** for sensitive previews
4. **Rotate secrets** periodically in production
5. **Monitor preview access** in server logs

---

## Next Steps

1. ✅ Test draft mode in Sanity Studio
2. ✅ Generate a preview link and test
3. ✅ Add `draftPreview` field to your schemas
4. ✅ Set up preview expiry for sensitive content
5. ✅ Deploy to production with environment variables

---

## Support

For issues or questions:
- Check browser console for errors
- Review server logs for API route errors
- Verify all environment variables are set
- Test in incognito mode to rule out cache issues
