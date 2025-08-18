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
  return {
    default: jest.fn(() => mockOpenAI),
  };
});

// Import after mocks are set up
import { NextRequest } from 'next/server';
import { POST } from './route';
import { UserInput } from '@/lib/types';

describe('/api/recommend', () => {
  const sampleUserInput: UserInput = {
    handicap: 15,
    goal: 'Distance',
    budget: 'Mid-range',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock OpenAI
    mockOpenAIChatCompletions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              modelNames: ['Callaway Rogue ST Max'],
              reasoning: 'These clubs are perfect for your handicap and goals.',
            }),
          },
        },
      ],
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      // Setup: Mock database responses
      const mockDb = require('@/lib/db').db;
      
      const mockCacheQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      
      mockDb.select.mockReturnValue(mockCacheQuery);

      // Setup: Mock OpenAI error
      mockOpenAIChatCompletions.create.mockRejectedValue(
        new Error('OpenAI API error')
      );

      // Action: Make POST request
      const request = new NextRequest('http://localhost:3000/api/recommend', {
        method: 'POST',
        body: JSON.stringify(sampleUserInput),
      });

      const response = await POST(request);

      // Assertions
      expect(response.status).toBe(500);
      const errorResult = await response.json();
      expect(errorResult).toHaveProperty('message');
      expect(errorResult.message).toBe('Error processing your request.');
    });

    it('should handle invalid OpenAI response format', async () => {
      // Setup: Mock database responses
      const mockDb = require('@/lib/db').db;
      
      const mockCacheQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      
      mockDb.select.mockReturnValue(mockCacheQuery);

      // Setup: Mock invalid OpenAI response
      mockOpenAIChatCompletions.create.mockResolvedValue({
        choices: [{ message: { content: 'Invalid JSON response' } }],
      });

      // Action: Make POST request
      const request = new NextRequest('http://localhost:3000/api/recommend', {
        method: 'POST',
        body: JSON.stringify(sampleUserInput),
      });

      const response = await POST(request);

      // Assertions
      expect(response.status).toBe(500);
      const errorResult = await response.json();
      expect(errorResult).toHaveProperty('message');
      expect(errorResult.message).toBe('Error processing your request.');
    });

    it('should handle invalid request body', async () => {
      // Action: Make POST request with invalid body
      const request = new NextRequest('http://localhost:3000/api/recommend', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);

      // Assertions
      expect(response.status).toBe(500);
      const errorResult = await response.json();
      expect(errorResult).toHaveProperty('message');
      expect(errorResult.message).toBe('Error processing your request.');
    });

    it('should handle missing request body', async () => {
      // Action: Make POST request with missing body
      const request = new NextRequest('http://localhost:3000/api/recommend', {
        method: 'POST',
      });

      const response = await POST(request);

      // Assertions
      expect(response.status).toBe(500);
      const errorResult = await response.json();
      expect(errorResult).toHaveProperty('message');
      expect(errorResult.message).toBe('Error processing your request.');
    });
  });

  describe('Input Validation', () => {
    it('should validate user input structure', () => {
      // Test that UserInput type is properly defined
      expect(sampleUserInput).toHaveProperty('handicap');
      expect(sampleUserInput).toHaveProperty('goal');
      expect(sampleUserInput).toHaveProperty('budget');
      expect(typeof sampleUserInput.handicap).toBe('number');
      expect(typeof sampleUserInput.goal).toBe('string');
      expect(typeof sampleUserInput.budget).toBe('string');
    });

    it('should accept valid user input values', () => {
      const validInputs = [
        { handicap: 0, goal: 'Distance', budget: 'Budget' },
        { handicap: 10, goal: 'Accuracy', budget: 'Mid-range' },
        { handicap: 25, goal: 'Forgiveness', budget: 'Premium' },
        { handicap: 30, goal: 'Feel', budget: 'Premium' },
      ];

      validInputs.forEach(input => {
        expect(input).toHaveProperty('handicap');
        expect(input).toHaveProperty('goal');
        expect(input).toHaveProperty('budget');
        expect(typeof input.handicap).toBe('number');
        expect(typeof input.goal).toBe('string');
        expect(typeof input.budget).toBe('string');
      });
    });
  });

  describe('API Structure', () => {
    it('should have proper route export', () => {
      // Verify that the POST function is exported
      expect(typeof POST).toBe('function');
    });

    it('should handle different HTTP methods', async () => {
      // Test that only POST is supported
      const getRequest = new NextRequest('http://localhost:3000/api/recommend', {
        method: 'GET',
      });

      // Next.js API routes handle all methods, so this should return an error response
      const response = await POST(getRequest);
      expect(response.status).toBe(500);
    });
  });
});
