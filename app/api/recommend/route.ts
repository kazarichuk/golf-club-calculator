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
    
    // Step A: Check Cache
    const cachedResult = await db
      .select()
      .from(schema.recommendationCache)
      .where(
        and(
          eq(schema.recommendationCache.handicap, userInput.handicap),
          eq(schema.recommendationCache.goal, userInput.goal),
          eq(schema.recommendationCache.budget, userInput.budget)
        )
      )
      .orderBy(schema.recommendationCache.createdAt)
      .limit(1);

    if (cachedResult.length > 0 && cachedResult[0].recommendedIds.length > 0) {
      console.log('Cache hit - returning cached recommendations');
      
      // Get the cached club IDs
      const cachedIds = cachedResult[0].recommendedIds;
      
      // Query the manufacturs table to get full club data including imageUrl
      const cachedClubs = await db
        .select()
        .from(schema.manufacturs)
        .where(inArray(schema.manufacturs.id, cachedIds));
      
      // Convert to frontend format and create enriched results
      const enrichedResults: RecommendationResult[] = await Promise.all(
        cachedClubs.map(async (dbClub, index) => {
          const club = dbClubToClub(dbClub);
          
          // Determine badge based on rank
          let badge: RecommendationResult['badge'];
          if (index === 0) badge = 'Best Match';
          else if (index === 1) badge = 'Top Pick';
          else if (club.pricePoint === 'Budget') badge = 'Great Value';
          else if (club.pricePoint === 'Premium') badge = 'Premium Choice';
          
          // Generate explanation for cached result
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
    }

    // Step B: Query OpenAI (Cache Miss)
    console.log('Cache miss - querying OpenAI');
    
    // First, get all available clubs from the database to provide to OpenAI
    const allClubs = await db.select().from(schema.manufacturs);
    
    // Create a list of available clubs for OpenAI
    const availableClubsList = allClubs.map(club => `${club.brand} ${club.model}`).join('\n- ');
    
    const openaiPrompt = `You are a world-class golf club fitting expert. Based on the following criteria, recommend 3-5 specific golf club models from this exact list:

AVAILABLE CLUBS:
- ${availableClubsList}

Player Profile:
- Handicap: ${userInput.handicap}
- Primary Goal: ${userInput.goal}
- Budget: ${userInput.budget}

Please return your response as a JSON object with this exact structure:
{
  "modelNames": ["Exact Brand Model Name", "Exact Brand Model Name", "Exact Brand Model Name"],
  "reasoning": "Brief explanation of your recommendations"
}

IMPORTANT: Only use the exact model names from the list above. Do not suggest any other models.

Focus on clubs that are:
1. Appropriate for the player's handicap level
2. Aligned with their primary goal (${userInput.goal})
3. Within their budget range (${userInput.budget})

Return only the JSON response, no additional text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: 'user', content: openaiPrompt }],
      max_tokens: 500,
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse OpenAI response
    let openaiRecommendation: OpenAIClubRecommendation;
    try {
      openaiRecommendation = JSON.parse(responseText);
      console.log('OpenAI response:', openaiRecommendation);
    } catch {
      console.error('Failed to parse OpenAI response:', responseText);
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
    
    for (const modelName of openaiRecommendation.modelNames) {
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
    console.log('DEBUG: OpenAI Recommendations:', openaiRecommendation.modelNames);
    console.log('DEBUG: Clubs found in DB:', existingClubs.map(c => c.model));
    console.log('DEBUG: Clubs identified as MISSING:', missingClubNames);

    // Step D: Handle Missing Clubs with SerpApi
    const newlyCreatedClubs: typeof schema.manufacturs.$inferSelect[] = [];
    
    if (missingClubNames.length > 0) {
      console.log(`Processing ${missingClubNames.length} missing clubs with SerpApi...`);
      
      for (const name of missingClubNames) {
        try {
          console.log(`Searching for image: "${name}" golf club iron`);
          
          // Search for image using SerpApi with callback approach
          const search = new GoogleSearch(process.env.SERPAPI_API_KEY);
          const searchResults = await new Promise<any>((resolve, reject) => {
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
          });
          
          // Validate search results
          if (!searchResults || !searchResults.images_results) {
            console.log(`WARNING: Invalid search results for "${name}"`);
            continue;
          }
          
          // Safely extract the URL of the first image
          const imageUrl = searchResults.images_results?.[0]?.original;
          
          if (imageUrl) {
            // Extract brand from name (first word) - handle edge cases
            const nameParts = name.split(' ');
            const brand = nameParts.length > 1 ? nameParts[0] : 'Unknown';
            
            // Insert new club into database
            const [newClub] = await db.insert(schema.manufacturs).values({
              brand: brand,
              model: name,
              category: 'Game Improvement', // Default category
              handicapRangeMin: 0, // Default values
              handicapRangeMax: 25,
              keyStrengths: ['Distance', 'Forgiveness'], // Default strengths
              pricePoint: 'Mid-range', // Default price point
              imageUrl: imageUrl,
            }).returning();
            
            // Add to newly created clubs array
            newlyCreatedClubs.push(newClub);
            foundIds.push(newClub.id);
            
            console.log(`SUCCESS: Found image for "${name}" and created new DB entry.`);
          } else {
            console.log(`WARNING: No image found for "${name}"`);
          }
        } catch (error) {
          console.error(`ERROR: Failed to process "${name}":`, error);
        }
      }
    }

    // Combine existing and newly created clubs
    const finalResults = [...existingClubs, ...newlyCreatedClubs];

    // If we found clubs, save to cache
    if (finalResults.length > 0) {
      await db.insert(schema.recommendationCache).values({
        handicap: userInput.handicap,
        goal: userInput.goal,
        budget: userInput.budget,
        recommendedIds: foundIds,
      });
      
      console.log(`Cached ${finalResults.length} recommendations`);
    }

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
    console.error('API Error:', err);
    return NextResponse.json(
      { message: 'Error processing your request.' },
      { status: 500 }
    );
  }
}
