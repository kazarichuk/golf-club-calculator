// /lib/engine.ts
import { Club, UserInput } from './types';

interface ScoredClub extends Club {
  score: number;
  matchReason: string;
}

export function getRecommendations(input: UserInput, clubs: Club[]): Club[] {
  // Step 1: Filter by handicap range
  const handicapFiltered = clubs.filter(club => {
    const [minHandicap, maxHandicap] = club.handicapRange;
    return input.handicap >= minHandicap && input.handicap <= maxHandicap;
  });

  // Step 2: Score and rank clubs based on goal and budget
  const scoredClubs: ScoredClub[] = handicapFiltered.map(club => {
    let score = 0;
    const reasons: string[] = [];

    // Goal matching (40% weight)
    if (input.goal !== 'Accuracy' && club.keyStrengths.includes(input.goal)) {
      score += 40;
      reasons.push(`Perfect for ${input.goal}`);
    } else if (input.goal === 'Accuracy' && club.keyStrengths.includes('Workability')) {
      score += 30;
      reasons.push('Great for accuracy');
    }

    // Budget matching (30% weight)
    if (club.pricePoint === input.budget) {
      score += 30;
      reasons.push(`Matches your ${input.budget} budget`);
    } else if (
      (input.budget === 'Mid-range' && club.pricePoint === 'Budget') ||
      (input.budget === 'Premium' && (club.pricePoint === 'Mid-range' || club.pricePoint === 'Budget'))
    ) {
      score += 15;
      reasons.push('Within budget range');
    }

    // Handicap optimization (20% weight)
    const [minHandicap, maxHandicap] = club.handicapRange;
    const handicapCenter = (minHandicap + maxHandicap) / 2;
    const distanceFromCenter = Math.abs(input.handicap - handicapCenter);
    const handicapScore = Math.max(0, 20 - distanceFromCenter * 2);
    score += handicapScore;
    reasons.push('Optimal for your handicap');

    // Category bonus (10% weight)
    if (input.handicap > 20 && club.category === 'Game Improvement') {
      score += 10;
      reasons.push('Ideal game improvement category');
    } else if (input.handicap < 10 && club.category === "Player's Distance") {
      score += 10;
      reasons.push('Perfect player distance category');
    }

    return {
      ...club,
      score,
      matchReason: reasons.join(', ')
    };
  });

  // Step 3: Sort by score and return top 6
  return scoredClubs
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ score: _unused, matchReason: _unused2, ...club }) => club);
}
