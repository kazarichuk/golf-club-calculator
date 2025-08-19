// /app/api/test-serpapi/route.ts
import { NextResponse } from 'next/server';

// Import SerpApi with require for Next.js compatibility
const { GoogleSearch } = require('google-search-results-nodejs');

export async function GET(request: Request) {
  try {
    console.log('TEST SERPAPI: Endpoint hit. Making request...');

    const search = new GoogleSearch(process.env.SERPAPI_API_KEY);
    console.log('TEST SERPAPI: API Key length:', process.env.SERPAPI_API_KEY?.length);
    console.log('TEST SERPAPI: API Key (first 10 chars):', process.env.SERPAPI_API_KEY?.substring(0, 10));
    
    // Use callback approach for SerpApi
    const searchResults = await new Promise((resolve, reject) => {
      search.json({
        engine: "google_images",
        q: "TaylorMade P790 golf club",
      }, (data) => {
        if (data.error) {
          reject(new Error(data.error));
        } else {
          resolve(data);
        }
      });
    });

    console.log('TEST SERPAPI: Request successful.');
    console.log('TEST SERPAPI: Response type:', typeof searchResults);
    
    console.log('TEST SERPAPI: Raw response:', searchResults);
    console.log('TEST SERPAPI: Response type:', typeof searchResults);
    
    if (searchResults && typeof searchResults === 'object') {
      console.log('TEST SERPAPI: Response keys:', Object.keys(searchResults));
      return NextResponse.json({ success: true, data: searchResults });
    } else {
      console.log('TEST SERPAPI: Response is not an object:', searchResults);
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid response format',
        responseType: typeof searchResults,
        responseValue: String(searchResults)
      });
    }

  } catch (error) {
    console.error('TEST SERPAPI: CRITICAL ERROR', error);
    return NextResponse.json(
      { message: 'SerpApi test failed.', error: (error as Error).message },
      { status: 500 }
    );
  }
}
