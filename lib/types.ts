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
  imageUrl: string;
}

/**
 * Represents the data captured from the user in the calculator form.
 */
export interface UserInput {
  handicap: number;
  goal: 'Distance' | 'Accuracy' | 'Forgiveness' | 'Feel';
  budget: 'Budget' | 'Mid-range' | 'Premium';
}

/**
 * Represents the final data structure passed to the frontend for display,
 * combining the club data with the AI-generated explanation.
 */
export interface RecommendationResult extends Club {
  explanation: string;
}
