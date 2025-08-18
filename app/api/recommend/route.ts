// /app/api/recommend/route.ts
import { NextResponse } from 'next/server';
import { UserInput, RecommendationResult, OpenAIClubRecommendation } from '@/lib/types';
import { db, schema } from '@/lib/db';
import { dbClubToClub } from '@/lib/utils';
import OpenAI from 'openai';
import { eq, and, ilike, inArray } from 'drizzle-orm';

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

    if (cachedResult.length > 0) {
      console.log('Cache hit - returning cached recommendations');
      
      // Get the cached club IDs
      const cachedIds = cachedResult[0].recommendedIds;
      
      // Query the manufacturs table to get full club data
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
    
    const openaiPrompt = `You are a world-class golf club fitting expert. Based on the following criteria, recommend 3-5 specific golf club models that would be ideal for this player:

Player Profile:
- Handicap: ${userInput.handicap}
- Primary Goal: ${userInput.goal}
- Budget: ${userInput.budget}

Please return your response as a JSON object with this exact structure:
{
  "modelNames": ["Brand Model Name", "Brand Model Name", "Brand Model Name"],
  "reasoning": "Brief explanation of your recommendations"
}

Focus on clubs that are:
1. Appropriate for the player's handicap level
2. Aligned with their primary goal (${userInput.goal})
3. Within their budget range (${userInput.budget})
4. From well-known, reputable brands

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
    } catch {
      console.error('Failed to parse OpenAI response:', responseText);
      throw new Error('Invalid response format from OpenAI');
    }

    // Step C: Match Names and Populate Cache
    console.log('Matching club names with database records');
    
    const foundClubs: typeof schema.manufacturs.$inferSelect[] = [];
    const foundIds: number[] = [];

    // Search for each recommended club by model name
    for (const modelName of openaiRecommendation.modelNames) {
      const clubs = await db
        .select()
        .from(schema.manufacturs)
        .where(ilike(schema.manufacturs.model, `%${modelName}%`));
      
      if (clubs.length > 0) {
        foundClubs.push(clubs[0]); // Take the first match
        foundIds.push(clubs[0].id);
      }
    }

    // If we found clubs, save to cache
    if (foundClubs.length > 0) {
      await db.insert(schema.recommendationCache).values({
        handicap: userInput.handicap,
        goal: userInput.goal,
        budget: userInput.budget,
        recommendedIds: foundIds,
      });
      
      console.log(`Cached ${foundClubs.length} recommendations`);
    }

    // Create enriched results
    const enrichedResults: RecommendationResult[] = await Promise.all(
      foundClubs.map(async (dbClub, index) => {
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
