import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "../env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // Always fetch fresh data from Sanity, disables CDN caching
  token: process.env.SANITY_VIEWER_TOKEN, // For draft content
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