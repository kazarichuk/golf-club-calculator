// /app/api/recommend/route.ts
import { NextResponse } from 'next/server';
import { UserInput, RecommendationResult, OpenAIClubRecommendation } from '@/lib/types';
import { db, schema } from '@/lib/db';
import { dbClubToClub } from '@/lib/utils';
import OpenAI from 'openai';
import { eq, and, inArray } from 'drizzle-orm';

// Import SerpApi with type assertion
const { GoogleSearch } = require('google-search-results-nodejs');

export async function POST(request: Request) {
  try {
    // Check for required environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error('Missing OPENAI_API_KEY environment variable');
      return NextResponse.json(
        { message: 'OpenAI API key not configured. Please contact support.' },
        { status: 500 }
      );
    }

    if (!process.env.DATABASE_URL) {
      console.error('Missing DATABASE_URL environment variable');
      return NextResponse.json(
        { message: 'Database connection not configured. Please contact support.' },
        { status: 500 }
      );
    }

    if (!process.env.SERPAPI_API_KEY) {
      console.error('Missing SERPAPI_API_KEY environment variable');
      return NextResponse.json(
        { message: 'SerpApi key not configured. Please contact support.' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const userInput: UserInput = await request.json();
    
    console.log('Received user input:', userInput);
    
    // Step A: Check Cache (temporarily disabled due to database schema issues)
    console.log('Cache check temporarily disabled - proceeding to OpenAI query');

    // Step B: Query OpenAI (Cache Miss)
    console.log('Cache miss - querying OpenAI');
    
    // First, get all available clubs from the database to provide to OpenAI
    const allClubs = await db.select().from(schema.manufacturs);
    
    // Create a list of available clubs for OpenAI
    const availableClubsList = allClubs.map(club => `${club.brand} ${club.model}`).join('\n- ');
    
    const searchPrompt = `You are a golf expert assistant. Find the top 3 most recommended golf iron sets in 2025 for a player with a handicap of ${userInput.handicap} whose primary goal is ${userInput.goal}. Return ONLY a valid JSON array of the model names. Example: ["TaylorMade Qi10", "Callaway Paradym Ai Smoke", "Titleist T200 2025"]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Use a model that supports web search well
      messages: [{ role: 'user', content: searchPrompt }],
      max_tokens: 500,
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse OpenAI response - new format returns array directly
    let modelNames: string[];
    try {
      console.log('Raw OpenAI response:', responseText);
      const parsedResponse = JSON.parse(responseText);
      console.log('Parsed OpenAI response:', parsedResponse);
      // Handle both array format and object format for backward compatibility
      modelNames = Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.modelNames || [];
      console.log('OpenAI web search response - model names:', modelNames);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText);
      console.error('Parse error:', parseError);
      throw new Error('Invalid response format from OpenAI');
    }

    // Step C: Normalize and Match Names
    console.log('Normalizing and matching club names with database records');
    
    // A. Normalization function
    const normalizeName = (name: string): string => {
      return name
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    };
    
    const existingClubs: typeof schema.manufacturs.$inferSelect[] = [];
    const foundIds: number[] = [];

    // B. Create a Set of normalized existing club names for fast lookups
    const normalizedExistingNames = new Set(
      allClubs.map(club => normalizeName(club.model))
    );
    
    console.log('Normalized existing club names:', Array.from(normalizedExistingNames));

    // C. Correctly identify missing clubs
    const missingClubNames: string[] = [];
    
    for (const modelName of modelNames) {
      const normalizedModelName = normalizeName(modelName);
      console.log(`Checking: "${modelName}" -> normalized: "${normalizedModelName}"`);
      
      if (normalizedExistingNames.has(normalizedModelName)) {
        // Found in database - add to existing clubs
        const matchingClub = allClubs.find(club => 
          normalizeName(club.model) === normalizedModelName
        );
        if (matchingClub) {
          existingClubs.push(matchingClub);
          foundIds.push(matchingClub.id);
          console.log(`✓ Found in DB: ${matchingClub.model}`);
        }
      } else {
        // Not found in database - add to missing clubs
        missingClubNames.push(modelName); // Keep original name for SerpApi search
        console.log(`✗ Missing from DB: ${modelName}`);
      }
    }

    // Verification log to show found vs missing clubs
    console.log({
      found: existingClubs.map(c => c.model),
      missing: missingClubNames,
    });

    console.log('DEBUG: Preparing to search for missing clubs.');
    console.log('DEBUG: OpenAI Recommendations:', modelNames);
    console.log('DEBUG: Clubs found in DB:', existingClubs.map(c => c.model));
    console.log('DEBUG: Clubs identified as MISSING:', missingClubNames);

    // Step D: Handle Missing Clubs with SerpApi
    const newlyCreatedClubs: typeof schema.manufacturs.$inferSelect[] = [];
    
    if (missingClubNames.length > 0) {
      console.log(`Processing ${missingClubNames.length} missing clubs with SerpApi...`);
      
      for (const name of missingClubNames) {
        try {
          console.log(`Processing missing club: "${name}" - starting two-factor enrichment`);
          
          // Step 1: Perform Two Parallel API Calls
          const [searchResults, openaiData] = await Promise.all([
            // Call 1: SerpApi for image
            new Promise<any>((resolve, reject) => {
              const search = new GoogleSearch(process.env.SERPAPI_API_KEY);
              search.json({
                q: `${name} golf club iron`,
                engine: 'google_images',
                num: 1
              }, (data: any) => {
                if (data.error) {
                  reject(new Error(data.error));
                } else {
                  resolve(data);
                }
              });
            }),
            
            // Call 2: OpenAI for structured data
            (async () => {
              const dataPrompt = `You are a golf equipment data expert. For the club named "${name}", provide a JSON object with the following keys: "category" (one of ["Game Improvement", "Player's Distance", "Player's Iron", "Blade"]), "handicapRangeMin" (number), "handicapRangeMax" (number), "keyStrengths" (an array of strings), and "pricePoint" (one of ["Budget", "Mid-range", "Premium"]). Return ONLY the valid JSON object.`;
              
              const completion = await openai.chat.completions.create({
                model: "gpt-4o", // Use powerful model for expert analysis
                messages: [{ role: 'user', content: dataPrompt }],
                max_tokens: 200,
              });
              
              return completion.choices[0].message.content;
            })()
          ]);
          
          // Step 2: Consolidate and Validate Data
          // Validate SerpApi results
          if (!searchResults || !searchResults.images_results) {
            console.log(`WARNING: Invalid search results for "${name}"`);
            continue;
          }
          
          const imageUrl = searchResults.images_results?.[0]?.original;
          
          // Validate OpenAI results and parse JSON
          let jsonData;
          try {
            jsonData = JSON.parse(openaiData || '{}');
            console.log(`OpenAI structured data for "${name}":`, jsonData);
          } catch (parseError) {
            console.log(`WARNING: Invalid JSON response from OpenAI for "${name}":`, openaiData);
            continue;
          }
          
          // Step 3: Insert Complete Record into Database
          if (imageUrl && jsonData.category && jsonData.handicapRangeMin !== undefined) {
            // Extract brand from name (first word) - handle edge cases
            const nameParts = name.split(' ');
            const brand = nameParts.length > 1 ? nameParts[0] : 'Unknown';
            
            // Insert new club into database with complete data
            const [newClub] = await db.insert(schema.manufacturs).values({
              brand: brand,
              model: name,
              category: jsonData.category,
              handicapRangeMin: jsonData.handicapRangeMin,
              handicapRangeMax: jsonData.handicapRangeMax,
              keyStrengths: jsonData.keyStrengths || ['Distance', 'Forgiveness'],
              pricePoint: jsonData.pricePoint || 'Mid-range',
              imageUrl: imageUrl,
            }).returning();
            
            // Add to newly created clubs array
            newlyCreatedClubs.push(newClub);
            foundIds.push(newClub.id);
            
            console.log(`SUCCESS: Two-factor enrichment complete for "${name}" - image found and structured data saved to database`);
          } else {
            console.log(`WARNING: Missing required data for "${name}" - imageUrl: ${!!imageUrl}, category: ${!!jsonData.category}`);
          }
        } catch (error) {
          console.error(`ERROR: Failed to process "${name}":`, error);
        }
      }
    }

    // Combine existing and newly created clubs
    const finalResults = [...existingClubs, ...newlyCreatedClubs];

    // Cache insertion temporarily disabled due to database schema issues
    console.log(`Would cache ${finalResults.length} recommendations (cache disabled)`);

    // Create enriched results
    const enrichedResults: RecommendationResult[] = await Promise.all(
      finalResults.map(async (dbClub: typeof schema.manufacturs.$inferSelect, index: number) => {
        const club = dbClubToClub(dbClub);
        
        // Determine badge based on rank
        let badge: RecommendationResult['badge'];
        if (index === 0) badge = 'Best Match';
        else if (index === 1) badge = 'Top Pick';
        else if (club.pricePoint === 'Budget') badge = 'Great Value';
        else if (club.pricePoint === 'Premium') badge = 'Premium Choice';
        
        // Generate explanation
        const prompt = `You are a world-class golf club fitting expert. A user with a handicap of ${userInput.handicap} whose main goal is ${userInput.goal} and budget is ${userInput.budget} has been recommended the ${club.brand} ${club.model}. Explain in 2-3 concise sentences why this specific club is an excellent choice for this user, referencing their goal, handicap, and budget.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 120,
        });

        const explanation = completion.choices[0].message.content;

        return {
          ...club,
          explanation: explanation || 'No explanation available',
          rank: index + 1,
          matchScore: 100 - (index * 15),
          badge
        };
      })
    );

    return NextResponse.json(enrichedResults);

  } catch (err) {
    const error = err as Error;
    console.error('API Error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { message: 'Error processing your request.', error: error.message },
      { status: 500 }
    );
  }
}
