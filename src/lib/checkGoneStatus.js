import { client } from '../sanity/lib/client';

/**
 * Generic check for hidden/expired/gone status for any Sanity type+slug.
 * Returns { shouldReturn410, doc }
 */
export async function checkGoneStatus(type, slug) {
  try {
    // Map type to Sanity fields if needed
    let query = '';
    if (type === 'offers') {
      query = `*[_type == "offers" && slug.current == $slug][0]{ title, bookmaker->{name}, expires, noindex, sitemapInclude }`;
    } else if (type === 'article') {
      query = `*[_type == "article" && slug.current == $slug][0]{ title, noindex, sitemapInclude }`;
    } else if (type === 'footer') {
      query = `*[_type == "footer" && isActive == true][0]{ bottomRowLinks{ links[]{ label, slug, content, noindex, sitemapInclude } } }`;
    } else {
      // Default: just check for noindex/sitemapInclude
      query = `*[_type == $type && slug.current == $slug][0]{ title, noindex, sitemapInclude }`;
    }
    const doc = await client.fetch(query, { type, slug });
    if (!doc) return { shouldReturn410: true, doc: null };
    // Special handling for footer links (array)
    if (type === 'footer') {
      const link = doc.bottomRowLinks?.links?.find(l => l?.slug?.current === slug);
      if (!link || link.noindex === true || link.sitemapInclude === false) {
        return { shouldReturn410: true, doc: link };
      }
      return { shouldReturn410: false, doc: link };
    }
    if (doc.noindex === true || doc.sitemapInclude === false) {
      return { shouldReturn410: true, doc };
    }
    return { shouldReturn410: false, doc };
  } catch (e) {
    return { shouldReturn410: false, doc: null };
  }
}
