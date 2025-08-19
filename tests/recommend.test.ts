// /app/api/recommend/route.test.ts

// Mock external dependencies BEFORE importing the route
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
  schema: {
    recommendationCache: {
      id: 'id',
      handicap: 'handicap',
      goal: 'goal',
      budget: 'budget',
      recommendedIds: 'recommended_ids',
      createdAt: 'created_at',
    },
    manufacturs: {
      id: 'id',
      brand: 'brand',
      model: 'model',
      category: 'category',
      handicapRangeMin: 'handicap_range_min',
      handicapRangeMax: 'handicap_range_max',
      keyStrengths: 'key_strengths',
      pricePoint: 'price_point',
      imageUrl: 'image_url',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
}));

// Mock OpenAI with a factory function
const mockOpenAIChatCompletions = {
  create: jest.fn(),
};

const mockOpenAI = {
  chat: {
    completions: mockOpenAIChatCompletions,
  },
};

jest.mock('openai', () => {
  return jest.fn(() => mockOpenAI);
});

// Import after mocks are set up
import { NextRequest } from 'next/server';
import { POST } from '../app/api/recommend/route';
import { UserInput } from '@/lib/types';

describe('/api/recommend Integration Tests', () => {
  const sampleUserInput: UserInput = {
    handicap: 15,
    goal: 'Distance',
    budget: 'Mid-range',
  };

  const mockClubs = [
    {
      id: 1,
      brand: 'Callaway',
      model: 'Rogue ST Max',
      category: 'Game Improvement',
      handicapRangeMin: 15,
      handicapRangeMax: 30,
      keyStrengths: ['Forgiveness', 'Distance'],
      pricePoint: 'Mid-range',
      imageUrl: 'https://example.com/callaway-rogue-st-max.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      brand: 'Titleist',
      model: 'T200 (2023)',
      category: "Player's Distance",
      handicapRangeMin: 5,
      handicapRangeMax: 15,
      keyStrengths: ['Distance', 'Feel'],
      pricePoint: 'Premium',
      imageUrl: 'https://example.com/titleist-t200.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockOpenAIRecommendation = {
    modelNames: ['Callaway Rogue ST Max', 'Titleist T200 (2023)'],
    reasoning: 'These clubs are perfect for your handicap and goals.',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock OpenAI response
    mockOpenAIChatCompletions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(mockOpenAIRecommendation),
          },
        },
      ],
    });

    // Setup environment variables
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.DATABASE_URL = 'test-database-url';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.OPENAI_API_KEY;
    delete process.env.DATABASE_URL;
  });

  describe('Database-First Architecture Validation', () => {
    it('should successfully process cache miss and return database-driven results', async () => {
      // Setup: Mock database responses
      const mockDb = require('@/lib/db').db;
      
      // Mock cache miss
      const mockCacheChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      
      // Mock all clubs query for OpenAI prompt
      const mockAllClubsQuery = {
        from: jest.fn().mockResolvedValue(mockClubs),
      };
      
      // Mock manufacturs query for specific clubs
      const mockManufactursQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockClubs),
      };
      
      // Mock insert for cache
      const mockInsert = {
        values: jest.fn().mockResolvedValue(undefined),
      };
      
      mockDb.select
        .mockReturnValueOnce(mockCacheChain) // First call: cache query
        .mockReturnValueOnce(mockAllClubsQuery) // Second call: all clubs for OpenAI
        .mockReturnValueOnce(mockManufactursQuery); // Third call: specific clubs
      
      mockDb.insert.mockReturnValue(mockInsert);

      // Action: Make POST request
      const request = new NextRequest('http://localhost:3000/api/recommend', {
        method: 'POST',
        body: JSON.stringify(sampleUserInput),
      });

      const response = await POST(request);

      // Assertions
      expect(response.status).toBe(200);
      const result = await response.json();
      
      // Verify database-first approach: OpenAI prompt includes clubs from database
      expect(mockOpenAIChatCompletions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('Callaway Rogue ST Max'),
            }),
          ]),
        })
      );
      
      // Verify that the final response contains data from the database
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('imageUrl', 'https://example.com/callaway-rogue-st-max.jpg');
      expect(result[1]).toHaveProperty('imageUrl', 'https://example.com/titleist-t200.jpg');
      
      // Verify that database was queried for all available clubs
      expect(mockDb.select).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing environment variables', async () => {
      // Save original values
      const originalOpenAIKey = process.env.OPENAI_API_KEY;
      const originalDatabaseUrl = process.env.DATABASE_URL;
      
      // Remove environment variables
      delete process.env.OPENAI_API_KEY;
      delete process.env.DATABASE_URL;

      const request = new NextRequest('http://localhost:3000/api/recommend', {
        method: 'POST',
        body: JSON.stringify(sampleUserInput),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const errorResult = await response.json();
      expect(errorResult.message).toContain('not configured');
      
      // Restore original values
      if (originalOpenAIKey) process.env.OPENAI_API_KEY = originalOpenAIKey;
      if (originalDatabaseUrl) process.env.DATABASE_URL = originalDatabaseUrl;
    });

    it('should handle OpenAI API errors gracefully', async () => {
      const mockDb = require('@/lib/db').db;
      
      const mockCacheChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      
      const mockAllClubsQuery = {
        from: jest.fn().mockResolvedValue(mockClubs),
      };
      
      mockDb.select
        .mockReturnValueOnce(mockCacheChain)
        .mockReturnValueOnce(mockAllClubsQuery);
      
      // Mock OpenAI error
      mockOpenAIChatCompletions.create.mockRejectedValue(
        new Error('OpenAI API error')
      );

      const request = new NextRequest('http://localhost:3000/api/recommend', {
        method: 'POST',
        body: JSON.stringify(sampleUserInput),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const errorResult = await response.json();
      expect(errorResult.message).toBe('Error processing your request.');
    });

    it('should handle invalid OpenAI response format', async () => {
      const mockDb = require('@/lib/db').db;
      
      const mockCacheChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      
      const mockAllClubsQuery = {
        from: jest.fn().mockResolvedValue(mockClubs),
      };
      
      mockDb.select
        .mockReturnValueOnce(mockCacheChain)
        .mockReturnValueOnce(mockAllClubsQuery);
      
      // Mock invalid OpenAI response
      mockOpenAIChatCompletions.create.mockResolvedValue({
        choices: [{ message: { content: 'Invalid JSON response' } }],
      });

      const request = new NextRequest('http://localhost:3000/api/recommend', {
        method: 'POST',
        body: JSON.stringify(sampleUserInput),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const errorResult = await response.json();
      expect(errorResult.message).toBe('Error processing your request.');
    });
  });
});
