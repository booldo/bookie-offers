import { NextResponse } from 'next/server';
import { client } from '../sanity/lib/client';

// Function to check if an offer should return 410 status
export async function checkOfferStatus(countrySlug, offerSlug) {
  try {
    const offerData = await client.fetch(`*[_type == "offers" && slug.current == $offerSlug][0]{
      title,
      bookmaker->{ name },
      expires,
      noindex,
      sitemapInclude
    }`, { offerSlug });

    const now = new Date();
    const isExpired = offerData?.expires ? new Date(offerData.expires) < now : false;
    const isHidden = offerData && (offerData.noindex === true || offerData.sitemapInclude === false);

    if (!offerData || isExpired || isHidden) {
      return {
        shouldReturn410: true,
        offer: offerData ? {
          title: offerData.title,
          bookmaker: offerData.bookmaker?.name,
          expires: offerData.expires ? new Date(offerData.expires).toISOString().split('T')[0] : undefined
        } : null,
        isExpired,
        isHidden,
        countrySlug
      };
    }

    return { shouldReturn410: false };
  } catch (error) {
    console.error('Error checking offer status:', error);
    return { shouldReturn410: false };
  }
}

// Function to generate 410 HTML response
export function generate410Html(offerInfo) {
  const { offer, isExpired, isHidden, countrySlug } = offerInfo;
  
  let title, description, buttonText, buttonLink;
  
  if (isHidden) {
    title = "Content No Longer Available";
    description = "This offer has been intentionally removed or hidden and is no longer accessible.";
    buttonText = "Go Home";
    buttonLink = "/";
  } else if (!offer) {
    title = "Content Does Not Exist";
    description = "The offer you're looking for doesn't exist or may have been removed. Please check the URL or browse our available content.";
    buttonText = "Browse Available Content";
    buttonLink = `/${countrySlug || 'ng'}`;
  } else {
    title = "Content Has Expired";
    description = "This offer is no longer available. The promotion has ended and cannot be claimed.";
    buttonText = "View Active Content";
    buttonLink = `/${countrySlug || 'ng'}`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>410 - ${title} | Booldo</title>
    <meta name="description" content="${description}">
    <meta name="robots" content="noindex, nofollow">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .animate-bounce {
            animation: bounce 1s infinite;
        }
        @keyframes bounce {
            0%, 20%, 53%, 80%, 100% {
                animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
                transform: translate3d(0, 0, 0);
            }
            40%, 43% {
                animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
                transform: translate3d(0, -30px, 0);
            }
            70% {
                animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
                transform: translate3d(0, -15px, 0);
            }
            90% {
                transform: translate3d(0, -4px, 0);
            }
        }
    </style>
</head>
<body class="min-h-screen bg-gray-50 flex flex-col">
    <main class="max-w-7xl mx-auto w-full px-4 flex-1 flex items-center justify-center">
        <div class="text-center">
            <!-- 410 Status Icon -->
            <div class="mb-8">
                <div class="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="text-red-600">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                </div>
            </div>

            <!-- Error Code -->
            <h1 class="text-6xl font-bold text-red-600 mb-4">410</h1>
            
            <!-- Main Message -->
            <h2 class="text-2xl font-semibold text-gray-900 mb-4">${title}</h2>
            
            ${!isHidden && offer ? `
            <!-- Content Details -->
            <div class="bg-white rounded-lg border border-gray-200 p-6 mb-8 max-w-md mx-auto">
                <h3 class="font-semibold text-gray-900 mb-2">${offer.title}</h3>
                <p class="text-gray-600 text-sm mb-2">Bookmaker: ${offer.bookmaker}</p>
                <p class="text-red-600 text-sm font-medium">Expired: ${offer.expires}</p>
            </div>
            ` : ''}
            
            ${!isHidden && !offer ? `
            <!-- Non-existent content message -->
            <div class="bg-white rounded-lg border border-gray-200 p-6 mb-8 max-w-md mx-auto">
                <h3 class="font-semibold text-gray-900 mb-2">The requested content could not be found</h3>
                <p class="text-gray-600 text-sm mb-2">This content may have been removed or the URL may be incorrect</p>
            </div>
            ` : ''}
            
            <!-- Description -->
            <p class="text-gray-600 mb-8 max-w-md mx-auto">${description}</p>
            
            <!-- Action Button -->
            <div class="flex justify-center">
                <a href="${buttonLink}" class="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-6 py-3 transition inline-flex items-center gap-2">
                    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    ${buttonText}
                </a>
            </div>
            
            <!-- Additional Info -->
            <div class="mt-8 text-sm text-gray-500">
                <p>Looking for similar content? Check out our latest offerings!</p>
            </div>
        </div>
    </main>
</body>
</html>`;
}
