import { getRecommendations } from './engine';
import { clubsData } from './clubsData';
import { UserInput } from './types';

describe('getRecommendations', () => {
  it('should filter clubs based on handicap range', () => {
    // Test case: User with handicap 15
    const userInput: UserInput = {
      handicap: 15,
      goal: 'Forgiveness',
      budget: 'Mid-range'
    };

    const recommendations = getRecommendations(userInput, clubsData);

    // Should return clubs where 15 falls within the handicap range
    expect(recommendations).toHaveLength(5); // Expected number of clubs for handicap 15

    // Check that returned clubs have appropriate handicap ranges
    recommendations.forEach(club => {
      const [minHandicap, maxHandicap] = club.handicapRange;
      expect(userInput.handicap).toBeGreaterThanOrEqual(minHandicap);
      expect(userInput.handicap).toBeLessThanOrEqual(maxHandicap);
    });

    // Verify specific clubs that should be included for handicap 15
    const clubModels = recommendations.map(club => club.model);
    expect(clubModels).toContain('T200 (2023)'); // handicapRange: [5, 15]
    expect(clubModels).toContain('JPX 923 Forged'); // handicapRange: [8, 18]
    expect(clubModels).toContain('P790 (2023)'); // handicapRange: [5, 15]
    expect(clubModels).toContain('Rogue ST Max'); // handicapRange: [15, 30]
    expect(clubModels).toContain('G430'); // handicapRange: [12, 30]

    // Verify clubs that should NOT be included for handicap 15
    expect(clubModels).not.toContain('Model Blade'); // handicapRange: [0, 8] - should NOT be included
  });

  it('should return empty array for handicap outside all ranges', () => {
    // Test case: User with handicap 35 (outside all club ranges)
    const userInput: UserInput = {
      handicap: 35,
      goal: 'Distance',
      budget: 'Premium'
    };

    const recommendations = getRecommendations(userInput, clubsData);

    expect(recommendations).toHaveLength(0);
  });

  it('should handle edge cases correctly', () => {
    // Test case: User with handicap 0 (minimum)
    const userInput: UserInput = {
      handicap: 0,
      goal: 'Feel',
      budget: 'Premium'
    };

    const recommendations = getRecommendations(userInput, clubsData);

    // Should only include clubs that start at 0
    expect(recommendations.length).toBeGreaterThan(0);
    recommendations.forEach(club => {
      const [minHandicap] = club.handicapRange;
      expect(minHandicap).toBeLessThanOrEqual(0);
    });
  });
});
