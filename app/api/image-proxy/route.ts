import { NextRequest, NextResponse } from 'next/server';

// Import SerpApi with type assertion
const { GoogleSearch } = require('google-search-results-nodejs');

// Simple in-memory cache for failed URLs (in production, use Redis or similar)
const failedUrlCache = new Set<string>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing image URL', { status: 400 });
  }

  // Check if this URL has already failed recently
  if (failedUrlCache.has(imageUrl)) {
    console.log(`Skipping known failed URL: ${imageUrl}`);
    return new NextResponse('Image unavailable', { 
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600', // Cache error for 1 hour
      }
    });
  }

  try {
    // Try multiple approaches to fetch the image
    const approaches = [
      // Approach 1: Standard fetch with enhanced headers
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          const response = await fetch(imageUrl, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'DNT': '1',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
              'Sec-Fetch-Dest': 'image',
              'Sec-Fetch-Mode': 'no-cors',
              'Sec-Fetch-Site': 'cross-site',
            },
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }
          
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      },
      
      // Approach 2: Try with different User-Agent
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        try {
          const response = await fetch(imageUrl, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
              'Referer': 'https://www.google.com/',
            },
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }
          
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      },
      
      // Approach 3: Minimal headers approach
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          const response = await fetch(imageUrl, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; GolfClubBot/1.0)',
            },
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }
          
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }
    ];

    let response;
    let lastError;

    // Try each approach until one works
    for (let i = 0; i < approaches.length; i++) {
      try {
        console.log(`Trying image fetch approach ${i + 1} for: ${imageUrl}`);
        response = await approaches[i]();
        console.log(`✓ Success with approach ${i + 1}`);
        break;
      } catch (error) {
        console.log(`✗ Approach ${i + 1} failed:`, (error as Error).message);
        lastError = error;
        continue;
      }
    }

    // If all direct approaches failed, try SerpAPI as fallback
    if (!response && process.env.SERPAPI_API_KEY) {
      console.log(`All direct approaches failed, trying SerpAPI fallback for: ${imageUrl}`);
      
      try {
        // Extract product name from URL for SerpAPI search
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const productName = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, '').replace(/[_-]/g, ' ');
        
        console.log(`Searching SerpAPI for: ${productName}`);
        
        const search = new GoogleSearch(process.env.SERPAPI_API_KEY);
        
        const searchResults = await new Promise<any>((resolve, reject) => {
          search.json({
            q: `${productName} golf club image`,
            tbm: 'isch', // Image search
            num: 5, // Get 5 results
          }, (result: any) => {
            if (result && result.images_results && result.images_results.length > 0) {
              resolve(result);
            } else {
              reject(new Error('No SerpAPI results'));
            }
          });
        });
        
        // Try to fetch the first SerpAPI result
        if (searchResults && searchResults.images_results && searchResults.images_results.length > 0) {
          const serpImageUrl = searchResults.images_results[0].original;
          console.log(`Trying SerpAPI image: ${serpImageUrl}`);
          
          const serpResponse = await fetch(serpImageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
            },
          });
          
          if (serpResponse.ok) {
            console.log(`✓ Success with SerpAPI image`);
            response = serpResponse;
          } else {
            throw new Error(`SerpAPI image fetch failed: ${serpResponse.status}`);
          }
        }
      } catch (serpError) {
        console.log(`SerpAPI fallback failed:`, (serpError as Error).message);
        // Continue to error handling
      }
    }

    if (!response) {
      console.error('All image fetch approaches failed for:', imageUrl);
      console.error('Last error:', lastError);
      
      // Add to failed URL cache to avoid repeated attempts
      if (imageUrl) {
        failedUrlCache.add(imageUrl);
      }
      
      // Limit cache size to prevent memory leaks
      if (failedUrlCache.size > 1000) {
        const firstItem = failedUrlCache.values().next().value;
        if (firstItem) {
          failedUrlCache.delete(firstItem);
        }
      }
      
      // Return a placeholder image or error response
      return new NextResponse('Image unavailable', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'public, max-age=3600', // Cache error for 1 hour
        }
      });
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return new NextResponse('Failed to load image', { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600', // Cache error for 1 hour
      }
    });
  }
}

