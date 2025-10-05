import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Validate URL
    new URL(url);
  } catch (error) {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  try {
    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)",
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 seconds
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract metadata using regex (simple approach)
    const metadata = extractMetadata(html, url);

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Error fetching link metadata:", error);
    return NextResponse.json(
      { error: "Failed to fetch metadata", details: error.message },
      { status: 500 }
    );
  }
}

function extractMetadata(html, url) {
  const metadata = {
    title: "",
    description: "",
    image: "",
    siteName: "",
    url: url,
  };

  // Extract Open Graph and meta tags
  const ogTitle = html.match(
    /<meta\s+property="og:title"\s+content="([^"]*)"[^>]*>/i
  );
  const ogDescription = html.match(
    /<meta\s+property="og:description"\s+content="([^"]*)"[^>]*>/i
  );
  const ogImage = html.match(
    /<meta\s+property="og:image"\s+content="([^"]*)"[^>]*>/i
  );
  const ogSiteName = html.match(
    /<meta\s+property="og:site_name"\s+content="([^"]*)"[^>]*>/i
  );

  // Fallback to regular meta tags
  const metaTitle = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const metaDescription = html.match(
    /<meta\s+name="description"\s+content="([^"]*)"[^>]*>/i
  );

  // Twitter Card fallbacks
  const twitterTitle = html.match(
    /<meta\s+name="twitter:title"\s+content="([^"]*)"[^>]*>/i
  );
  const twitterDescription = html.match(
    /<meta\s+name="twitter:description"\s+content="([^"]*)"[^>]*>/i
  );
  const twitterImage = html.match(
    /<meta\s+name="twitter:image"\s+content="([^"]*)"[^>]*>/i
  );

  // Set title (priority: og:title > twitter:title > title tag)
  metadata.title =
    (ogTitle && ogTitle[1]) ||
    (twitterTitle && twitterTitle[1]) ||
    (metaTitle && metaTitle[1]) ||
    url;

  // Set description (priority: og:description > twitter:description > meta description)
  metadata.description =
    (ogDescription && ogDescription[1]) ||
    (twitterDescription && twitterDescription[1]) ||
    (metaDescription && metaDescription[1]) ||
    "";

  // Set image (priority: og:image > twitter:image)
  let imageUrl =
    (ogImage && ogImage[1]) || (twitterImage && twitterImage[1]) || "";

  // Convert relative URLs to absolute
  if (imageUrl && !imageUrl.startsWith("http")) {
    try {
      const baseUrl = new URL(url);
      if (imageUrl.startsWith("//")) {
        imageUrl = baseUrl.protocol + imageUrl;
      } else if (imageUrl.startsWith("/")) {
        imageUrl = baseUrl.origin + imageUrl;
      } else {
        imageUrl = new URL(imageUrl, url).href;
      }
    } catch (error) {
      console.error("Error resolving image URL:", error);
      imageUrl = "";
    }
  }

  metadata.image = imageUrl;

  // Set site name
  metadata.siteName = (ogSiteName && ogSiteName[1]) || "";

  // If no site name, try to extract from URL
  if (!metadata.siteName) {
    try {
      const urlObj = new URL(url);
      metadata.siteName = urlObj.hostname.replace(/^www\./, "");
    } catch (error) {
      // Ignore error
    }
  }

  // Clean up HTML entities
  Object.keys(metadata).forEach((key) => {
    if (typeof metadata[key] === "string") {
      metadata[key] = metadata[key]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")
        .trim();
    }
  });

  return metadata;
}
