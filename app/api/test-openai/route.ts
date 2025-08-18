import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  try {
    const openaiPrompt = `You are a world-class golf club fitting expert. Based on the following criteria, recommend 3-5 specific golf club models from this exact list:

AVAILABLE CLUBS:
- Titleist T200 (2023)
- Callaway Rogue ST Max
- Mizuno JPX 923 Forged
- TaylorMade P790 (2023)
- Ping G430
- Wilson Staff Model Blade

Player Profile:
- Handicap: 20
- Primary Goal: Forgiveness
- Budget: Mid-range

Please return your response as a JSON object with this exact structure:
{
  "modelNames": ["Exact Brand Model Name", "Exact Brand Model Name", "Exact Brand Model Name"],
  "reasoning": "Brief explanation of your recommendations"
}

IMPORTANT: Only use the exact model names from the list above. Do not suggest any other models.

Return only the JSON response, no additional text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: 'user', content: openaiPrompt }],
      max_tokens: 500,
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content;
    
    return NextResponse.json({
      rawResponse: responseText,
      parsed: responseText ? JSON.parse(responseText) : null
    });
  } catch (error) {
    console.error('OpenAI test failed:', error);
    return NextResponse.json({ error: 'OpenAI test failed', details: error.message }, { status: 500 });
  }
}
