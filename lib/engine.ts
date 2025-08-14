// /lib/engine.ts
import { Club, UserInput } from './types';

export function getRecommendations(input: UserInput, clubs: Club[]): Club[] {
  return clubs.filter(club => {
    const [minHandicap, maxHandicap] = club.handicapRange;
    return input.handicap >= minHandicap && input.handicap <= maxHandicap;
  });
}
