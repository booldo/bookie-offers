import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "../env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // Enable CDN for production - reduces API calls by 80-90%
  token: process.env.SANITY_VIEWER_TOKEN, // For draft content
  perspective: 'published', // Only fetch published content for better caching
  stega: {
    studioUrl:
      process.env.NEXT_PUBLIC_SANITY_STUDIO_URL ||
      "http://localhost:3000/studio",
  },
});

// import { createClient } from "next-sanity";
// import { apiVersion, dataset, projectId } from "../env";

// export const client = createClient({
//   projectId,
//   dataset,
//   apiVersion,
//   useCdn: true, // Enable CDN for production
//   token: process.env.SANITY_VIEWER_TOKEN, // For draft content
//   stega: {
//     studioUrl:
//       process.env.NEXT_PUBLIC_SANITY_STUDIO_URL ||
//       "http://localhost:3000/studio",
//   },
// });