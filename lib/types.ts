// /lib/types.ts

/**
 * Represents a single golf club model in our database.
 */
export interface Club {
  id: string;
  brand: string;
  model: string;
  category: 'Game Improvement' | "Player's Distance" | "Player's Iron" | 'Blade';
  handicapRange: [number, number]; // [min, max]
  keyStrengths: ('Forgiveness' | 'Distance' | 'Feel' | 'Workability')[];
  pricePoint: 'Budget' | 'Mid-range' | 'Premium';
  approximatePrice?: number; // Approximate retail price in USD
  imageUrl: string;
}

/**
 * Database version of Club with numeric ID and separate handicap range fields
 */
export interface DbClub {
  id: number;
  brand: string;
  model: string;
  category: 'Game Improvement' | "Player's Distance" | "Player's Iron" | 'Blade';
  handicapRangeMin: number;
  handicapRangeMax: number;
  keyStrengths: ('Forgiveness' | 'Distance' | 'Feel' | 'Workability')[];
  pricePoint: 'Budget' | 'Mid-range' | 'Premium';
  approximatePrice?: number; // Approximate retail price in USD
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents the data captured from the user in the calculator form.
 */
export interface UserInput {
  handicap: number;
  goal: 'Distance' | 'Accuracy' | 'Forgiveness' | 'Feel';
  budget: 'Budget' | 'Mid-range' | 'Premium';
  preferredBrand?: string;
  age?: number;
  clubSpeed?: number;
}

/**
 * Represents the final data structure passed to the frontend for display,
 * combining the club data with the AI-generated explanation and ranking.
 */
export interface RecommendationResult extends Club {
  explanation: string;
  rank?: number;
  matchScore?: number;
  badge?: 'Best Match' | 'Top Pick' | 'Great Value' | 'Premium Choice';
}

/**
 * OpenAI API response structure for club recommendations
 */
export interface OpenAIClubRecommendation {
  modelNames: string[];
  reasoning: string;
}
