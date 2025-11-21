import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "../env";

// Main client with CDN enabled for public content (CRITICAL for CPU optimization)
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // Enable CDN for better performance and reduced CPU usage
  perspective: 'published', // Only fetch published content
  // No token for public content - this allows better caching
  stega: {
    studioUrl:
      process.env.NEXT_PUBLIC_SANITY_STUDIO_URL ||
      "http://localhost:3000/studio",
  },
});

// Separate client for draft/preview content (bypasses CDN)
export const previewClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Disable CDN for draft content
  perspective: 'previewDrafts', // Include draft content
  token: process.env.SANITY_VIEWER_TOKEN, // Required for draft access
  stega: {
    studioUrl:
      process.env.NEXT_PUBLIC_SANITY_STUDIO_URL ||
      "http://localhost:3000/studio",
  },
});