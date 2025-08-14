// /app/api/recommend/route.ts
import { NextResponse } from 'next/server';
import { UserInput, RecommendationResult } from '@/lib/types';
import { clubsData } from '@/lib/clubsData';
import { getRecommendations } from '@/lib/engine';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const userInput: UserInput = await request.json();
    
    console.log('Received user input:', userInput);
    
    const recommendedClubs = getRecommendations(userInput, clubsData);
    
    if (recommendedClubs.length === 0) {
      return NextResponse.json([]);
    }

    // Create enriched results with explanations for all clubs
    const enrichedResults: RecommendationResult[] = [];
    
    for (let i = 0; i < recommendedClubs.length; i++) {
      const club = recommendedClubs[i];
      
      // Determine badge based on rank
      let badge: RecommendationResult['badge'];
      if (i === 0) badge = 'Best Match';
      else if (i === 1) badge = 'Top Pick';
      else if (club.pricePoint === 'Budget') badge = 'Great Value';
      else if (club.pricePoint === 'Premium') badge = 'Premium Choice';
      
      // Create prompt for this specific club
      const prompt = `You are a world-class golf club fitting expert. A user with a handicap of ${userInput.handicap} whose main goal is ${userInput.goal} and budget is ${userInput.budget} has been recommended the ${club.brand} ${club.model}. Explain in 2-3 concise sentences why this specific club is an excellent choice for this user, referencing their goal, handicap, and budget.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 120,
      });

      const explanation = completion.choices[0].message.content;

      enrichedResults.push({
        ...club,
        explanation: explanation || 'No explanation available',
        rank: i + 1,
        matchScore: 100 - (i * 15), // Simple scoring
        badge
      });
    }

    return NextResponse.json(enrichedResults);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { message: 'Error processing your request.' },
      { status: 500 }
    );
  }
}
