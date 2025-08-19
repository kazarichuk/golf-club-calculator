// /app/api/recommend/route.ts
import { NextResponse } from 'next/server';
import { UserInput, RecommendationResult, OpenAIClubRecommendation } from '@/lib/types';
import { db, schema } from '@/lib/db';
import { dbClubToClub } from '@/lib/utils';
import OpenAI from 'openai';
import { eq, and, inArray } from 'drizzle-orm';

// Import SerpApi with type assertion
const { getJson } = require('google-search-results-nodejs');

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

    // Step C: Match Names and Populate Cache
    console.log('Matching club names with database records');
    
    // Search for each recommended club by model name
    const existingClubs: typeof schema.manufacturs.$inferSelect[] = [];
    const foundIds: number[] = [];

    // Search for each recommended club by model name
    for (const modelName of openaiRecommendation.modelNames) {
      console.log('Searching for club:', modelName);
      
      // Find matching club with flexible matching
      const matchingClub = allClubs.find(club => {
        const clubModel = club.model.toLowerCase();
        const searchModel = modelName.toLowerCase();
        
        // Exact match
        if (clubModel === searchModel) return true;
        
        // Contains match
        if (clubModel.includes(searchModel) || searchModel.includes(clubModel)) return true;
        
        // Brand + model match (e.g., "Callaway Rogue ST Max" matches "Rogue ST Max")
        const clubWords = clubModel.split(' ');
        const searchWords = searchModel.split(' ');
        
        // Check if search words are contained in club model
        const hasAllSearchWords = searchWords.every(word => 
          clubWords.some(clubWord => clubWord.includes(word) || word.includes(clubWord))
        );
        
        return hasAllSearchWords;
      });
      
      console.log('Matching club found:', matchingClub ? matchingClub.model : 'None');
      
      if (matchingClub) {
        existingClubs.push(matchingClub);
        foundIds.push(matchingClub.id);
      }
    }

    // New Logic: Compare original modelNames with existingClubs to find missing clubs
    const missingClubNames = openaiRecommendation.modelNames.filter(modelName => {
      // Check if this model name was found in the database
      return !existingClubs.some(club => {
        const clubModel = club.model.toLowerCase();
        const searchModel = modelName.toLowerCase();
        
        // Exact match
        if (clubModel === searchModel) return true;
        
        // Contains match
        if (clubModel.includes(searchModel) || searchModel.includes(clubModel)) return true;
        
        // Brand + model match
        const clubWords = clubModel.split(' ');
        const searchWords = searchModel.split(' ');
        
        const hasAllSearchWords = searchWords.every(word => 
          clubWords.some(clubWord => clubWord.includes(word) || word.includes(clubWord))
        );
        
        return hasAllSearchWords;
      });
    });

    // Verification log to show found vs missing clubs
    console.log({
      found: existingClubs.map(c => c.model),
      missing: missingClubNames,
    });

    // Step D: Handle Missing Clubs with SerpApi
    const newlyCreatedClubs: typeof schema.manufacturs.$inferSelect[] = [];
    
    if (missingClubNames.length > 0) {
      console.log(`Processing ${missingClubNames.length} missing clubs with SerpApi...`);
      
      for (const name of missingClubNames) {
        try {
          console.log(`Searching for image: "${name}" golf club iron`);
          
          // Search for image using SerpApi
          const searchResults = await getJson({
            q: `${name} golf club iron`,
            api_key: process.env.SERPAPI_API_KEY,
            engine: 'google_images',
            num: 1
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
