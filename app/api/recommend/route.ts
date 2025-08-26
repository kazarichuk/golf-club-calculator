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
    
    // Build a comprehensive prompt that handles all user parameters
    let searchPrompt = `You are a golf expert assistant. Find the top 3 most recommended golf iron sets for a player with the following characteristics:
- Handicap: ${userInput.handicap}
- Primary goal: ${userInput.goal}
- Budget: ${userInput.budget}`;
    
    if (userInput.preferredBrand && userInput.preferredBrand.trim()) {
      searchPrompt += `\n- Preferred brand: ${userInput.preferredBrand}`;
    }
    
    if (userInput.age) {
      searchPrompt += `\n- Age: ${userInput.age} years old`;
    }
    
    if (userInput.swingSpeed) {
      searchPrompt += `\n- The player describes their swing as ${userInput.swingSpeed}.`;
    }
    
    searchPrompt += `\n\nFocus on models available in 2023 or earlier to ensure accuracy. Consider the budget constraint: Budget clubs should be under $500, Mid-range clubs should be $500-$1000, and Premium clubs can be over $1000. For age and club speed, consider that older players or those with slower swing speeds typically benefit from more forgiving clubs with lighter shafts. Return ONLY a valid JSON array of the model names. Example: ["TaylorMade Stealth", "Callaway Apex", "Titleist T200"]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Use a model that supports web search well
      messages: [{ role: 'user', content: searchPrompt }],
      max_tokens: 500,
    });

    const responseText = completion.choices[0].message.content;
    console.log('=== OPENAI RESPONSE DEBUG ===');
    console.log('Response text:', responseText);
    console.log('Response type:', typeof responseText);
    console.log('Response length:', responseText?.length);
    console.log('=== END DEBUG ===');
    
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse OpenAI response - handle markdown code blocks
    let modelNames: string[];
    try {
      console.log('Raw OpenAI response:', responseText);
      
      // Extract JSON from markdown code blocks if present
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
      }
      
      console.log('Extracted JSON text:', jsonText);
      const parsedResponse = JSON.parse(jsonText);
      console.log('Parsed OpenAI response:', parsedResponse);
      
      // Handle both array format and object format for backward compatibility
      modelNames = Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.modelNames || [];
      console.log('OpenAI web search response - model names:', modelNames);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText);
      console.error('Parse error:', parseError);
      
      // Check if OpenAI returned an error message about knowledge cutoff
      if (responseText.includes("cannot provide information about products released after") || 
          responseText.includes("my last update") ||
          responseText.includes("knowledge cutoff")) {
        
        console.log('OpenAI returned knowledge cutoff error, using fallback recommendations');
        
        // Provide fallback recommendations based on available clubs in database
        const fallbackRecommendations = allClubs
          .filter(club => {
            // Filter by handicap range
            const handicap = userInput.handicap;
            const isGoodForHandicap = (handicap <= 10 && club.category === 'Player\'s Distance') ||
                                    (handicap > 10 && handicap <= 20 && club.category === 'Game Improvement') ||
                                    (handicap > 20 && club.category === 'Super Game Improvement');
            
            // Filter by brand preference if specified
            const matchesBrand = !userInput.preferredBrand || 
                               !userInput.preferredBrand.trim() || 
                               club.brand.toLowerCase().includes(userInput.preferredBrand.toLowerCase());
            
            // Filter by budget
            const matchesBudget = club.pricePoint === userInput.budget;
            
            // Filter by age
            const matchesAge = !userInput.age || 
                             (userInput.age >= 50 && (club.category === 'Game Improvement' || club.category === 'Super Game Improvement')) ||
                             (userInput.age >= 40 && userInput.age < 50 && (club.category === 'Game Improvement' || club.category === "Player's Distance")) ||
                             (userInput.age < 40);
            
            // Filter by swing speed
            const matchesSpeed = !userInput.swingSpeed || 
                               (userInput.swingSpeed === 'Slow' && (club.category === 'Game Improvement' || club.category === 'Super Game Improvement')) ||
                               (userInput.swingSpeed === 'Average' && (club.category === 'Game Improvement' || club.category === "Player's Distance")) ||
                               (userInput.swingSpeed === 'Fast' || userInput.swingSpeed === 'Very Fast');
            
            return isGoodForHandicap && matchesBrand && matchesBudget && matchesAge && matchesSpeed;
          })
          .slice(0, 3)
          .map(club => `${club.brand} ${club.model}`);
        
        modelNames = fallbackRecommendations;
        console.log('Using fallback recommendations:', modelNames);
      } else {
        throw new Error(`Invalid response format from OpenAI. Raw response: ${responseText}`);
      }
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
    
    // B. Budget filtering function
    const matchesBudget = (club: typeof schema.manufacturs.$inferSelect): boolean => {
      return club.pricePoint === userInput.budget;
    };
    
    // C. Brand preference filtering function
    const matchesBrand = (club: typeof schema.manufacturs.$inferSelect): boolean => {
      if (!userInput.preferredBrand || !userInput.preferredBrand.trim()) {
        return true; // No brand preference specified, so all brands match
      }
      return club.brand.toLowerCase().includes(userInput.preferredBrand.toLowerCase());
    };
    
    // D. Age-based filtering function
    const matchesAge = (club: typeof schema.manufacturs.$inferSelect): boolean => {
      if (!userInput.age) {
        return true; // No age specified, so all clubs match
      }
      
      // Age-based logic: older players typically need more forgiving clubs
      if (userInput.age >= 50) {
        // Seniors typically benefit from Game Improvement or Super Game Improvement clubs
        return club.category === 'Game Improvement' || club.category === 'Super Game Improvement';
      } else if (userInput.age >= 40) {
        // Middle-aged players can use Game Improvement or Player's Distance
        return club.category === 'Game Improvement' || club.category === "Player's Distance";
      }
      // Younger players can use any category
      return true;
    };
    
    // E. Swing speed filtering function
    const matchesClubSpeed = (club: typeof schema.manufacturs.$inferSelect): boolean => {
      if (!userInput.swingSpeed) {
        return true; // No swing speed specified, so all clubs match
      }
      
      // Swing speed-based logic: slower swings need more forgiving clubs
      if (userInput.swingSpeed === 'Slow') {
        // Slow swing speeds benefit from Game Improvement clubs
        return club.category === 'Game Improvement' || club.category === 'Super Game Improvement';
      } else if (userInput.swingSpeed === 'Average') {
        // Average swing speeds can use Game Improvement or Player's Distance
        return club.category === 'Game Improvement' || club.category === "Player's Distance";
      }
      // Fast and Very Fast swing speeds can use any category
      return true;
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
        // Found in database - check if it matches budget
        const matchingClub = allClubs.find(club => 
          normalizeName(club.model) === normalizedModelName
        );
        if (matchingClub) {
          const budgetMatch = matchesBudget(matchingClub);
          const brandMatch = matchesBrand(matchingClub);
          const ageMatch = matchesAge(matchingClub);
          const speedMatch = matchesClubSpeed(matchingClub);
          
          if (budgetMatch && brandMatch && ageMatch && speedMatch) {
            existingClubs.push(matchingClub);
            foundIds.push(matchingClub.id);
            console.log(`✓ Found in DB (all criteria match): ${matchingClub.model} (${matchingClub.pricePoint}, ${matchingClub.brand}, ${matchingClub.category})`);
          } else {
            const mismatches = [];
            if (!budgetMatch) mismatches.push(`budget: ${matchingClub.pricePoint} vs ${userInput.budget}`);
            if (!brandMatch) mismatches.push(`brand: ${matchingClub.brand} vs ${userInput.preferredBrand}`);
            if (!ageMatch) mismatches.push(`age: ${userInput.age} vs category ${matchingClub.category}`);
            if (!speedMatch) mismatches.push(`swing speed: ${userInput.swingSpeed} vs category ${matchingClub.category}`);
            
            console.log(`✗ Found in DB but criteria mismatch: ${matchingClub.model} (${mismatches.join(', ')})`);
            missingClubNames.push(modelName); // Add to missing to find better alternatives
          }
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
            // Call 1: SerpApi for image with better search strategy
            new Promise<any>((resolve, reject) => {
              const search = new GoogleSearch(process.env.SERPAPI_API_KEY);
              search.json({
                q: `${name} golf club iron ${userInput.budget} price ${userInput.preferredBrand ? userInput.preferredBrand + ' ' : ''}${userInput.age ? userInput.age + ' age ' : ''}${userInput.swingSpeed ? userInput.swingSpeed + ' swing ' : ''}official product image`,
                engine: 'google_images',
                num: 5, // Get more results to find better sources
                safe: 'active',
                img_type: 'photo',
                img_size: 'large'
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
              const dataPrompt = `You are a golf equipment data expert. For the club named "${name}", provide a JSON object with the following keys: "category" (one of ["Game Improvement", "Player's Distance", "Player's Iron", "Blade"]), "handicapRangeMin" (number), "handicapRangeMax" (number), "keyStrengths" (an array of strings), "pricePoint" (one of ["Budget", "Mid-range", "Premium"]), and "approximatePriceUSD" (a number representing the approximate retail price in USD). 

User context: Budget is ${userInput.budget}${userInput.preferredBrand ? `, preferred brand is ${userInput.preferredBrand}` : ''}${userInput.age ? `, age is ${userInput.age} years old` : ''}${userInput.swingSpeed ? `, swing speed is ${userInput.swingSpeed}` : ''}.

For pricePoint, consider that Budget should be under $500, Mid-range should be $500-$1000, and Premium should be over $1000. For category, consider that older players (50+) and slower swing speeds (<80 mph) typically benefit from Game Improvement clubs, while younger players with faster swings can use Player's Distance or Player's Iron clubs. Return ONLY the valid JSON object.`;
              
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
          
          // Smart image URL selection - prefer reliable sources
          let imageUrl = null;
          if (searchResults.images_results && searchResults.images_results.length > 0) {
            // Prefer images from reliable sources that don't block access
            const preferredDomains = [
              'golfdigest.com',
              'golf.com',
              'pga.com',
              'golfchannel.com',
              'golfwrx.com',
              'mygolfspy.com',
              'golf.com',
              'golfdigest.sports.sndimg.com',
              'cdn11.bigcommerce.com',
              'golfdiscount.com'
            ];
            
            // Try to find an image from a preferred domain
            for (const result of searchResults.images_results) {
              const url = result.original;
              if (url && preferredDomains.some(domain => url.includes(domain))) {
                imageUrl = url;
                break;
              }
            }
            
            // If no preferred domain found, use the first result
            if (!imageUrl) {
              imageUrl = searchResults.images_results[0]?.original;
            }
          }
          
          // Validate OpenAI results and parse JSON - handle markdown code blocks
          let jsonData;
          try {
            console.log(`Raw OpenAI structured data for "${name}":`, openaiData);
            
            // Extract JSON from markdown code blocks if present
            let jsonText = openaiData?.trim() || '{}';
            if (jsonText.startsWith('```json')) {
              jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
            } else if (jsonText.startsWith('```')) {
              jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
            }
            
            console.log(`Extracted JSON text for "${name}":`, jsonText);
            jsonData = JSON.parse(jsonText);
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
              approximatePrice: jsonData.approximatePriceUSD || null,
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
