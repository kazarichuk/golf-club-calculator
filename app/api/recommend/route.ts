// /app/api/recommend/route.ts
import { NextResponse } from 'next/server';
import { UserInput } from '@/lib/types';
import { clubsData } from '@/lib/clubsData';
import { getRecommendations } from '@/lib/engine';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    // 1. Initialize OpenAI client
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 2. Parse the request body to get user input
    const userInput: UserInput = await request.json();

    // 3. Log the input to the server console (for testing)
    console.log('Received user input:', userInput);

    // 4. Get recommendations using the engine
    const recommendedClubs = getRecommendations(userInput, clubsData);

    // 5. Check for results
    if (recommendedClubs.length === 0) {
      return NextResponse.json([]);
    }

    // 6. Select top club
    const topClub = recommendedClubs[0];

    // 7. Construct prompt for OpenAI
    const prompt = `You are a world-class golf club fitting expert. A user with a handicap of ${userInput.handicap} whose main goal is ${userInput.goal} has been recommended the ${topClub.brand} ${topClub.model}. Explain in 2-3 concise sentences why this specific club is an excellent choice for this user, referencing their goal and handicap.`;

    // 8. Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
    });

    // 9. Extract explanation
    const explanation = completion.choices[0].message.content;

    // 10. Create enriched result
    const enrichedResults = [
      { ...topClub, explanation },
      ...recommendedClubs.slice(1)
    ];

    // 11. Return enriched data
    return NextResponse.json(enrichedResults);

  } catch (error) {
    // Handle potential errors, e.g., invalid JSON
    console.error('API Error:', error);
    return NextResponse.json(
      { message: 'Error processing your request.' },
      { status: 500 }
    );
  }
}
