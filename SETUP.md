# AI Recommender with Caching - Setup Guide

## Overview
This implementation replaces the static recommendation engine with an AI-powered system that uses OpenAI for recommendations and caches results in a Neon PostgreSQL database for performance and cost optimization.

## Database Setup

### 1. Create Neon Database
1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string (DATABASE_URL)

### 2. Set Environment Variables
Create a `.env.local` file in the root directory:

```env
DATABASE_URL=your_neon_connection_string_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Create Database Tables
Run the following commands to set up the database schema:

```bash
# Generate migration files
npm run db:generate

# Push schema to database
npm run db:push

# Populate with initial data
npm run migrate:data
```

## Database Schema

### `manufacturs` Table
Stores golf club data:
- `id` (serial, primary key)
- `brand` (varchar)
- `model` (varchar)
- `category` (varchar)
- `handicap_range_min` (integer)
- `handicap_range_max` (integer)
- `key_strengths` (array of varchar)
- `price_point` (varchar)
- `image_url` (varchar)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### `recommendation_cache` Table
Caches AI recommendations:
- `id` (serial, primary key)
- `handicap` (integer)
- `goal` (varchar)
- `budget` (varchar)
- `recommended_ids` (array of integers)
- `created_at` (timestamp)

## API Flow

### Cache Hit Flow
1. User submits recommendation request
2. System checks cache for matching criteria
3. If found, retrieves club data from `manufacturs` table
4. Generates explanations for each club
5. Returns results immediately

### Cache Miss Flow
1. User submits recommendation request
2. System checks cache - no match found
3. Constructs detailed prompt for OpenAI
4. Calls OpenAI API for club recommendations
5. Matches returned club names with database records
6. Saves recommendation to cache
7. Returns results with explanations

## Key Features

### Performance Optimization
- **Caching**: Repeated requests served instantly from database
- **Cost Control**: OpenAI API calls only for new combinations
- **Scalability**: Database-backed storage for growing data

### AI Integration
- **Smart Recommendations**: OpenAI analyzes user profile and suggests optimal clubs
- **Dynamic Explanations**: Each recommendation includes personalized reasoning
- **Flexible Matching**: Case-insensitive search for club model names

### Error Handling
- **Robust API Calls**: All external calls wrapped in try-catch blocks
- **Graceful Degradation**: System continues working even if OpenAI is unavailable
- **Input Validation**: Proper validation of user inputs and API responses

## Available Scripts

```bash
# Database management
npm run db:generate    # Generate migration files
npm run db:push        # Push schema to database
npm run db:migrate     # Run migrations
npm run db:studio      # Open Drizzle Studio

# Data migration
npm run migrate:data   # Populate database with initial club data
```

## Testing the Implementation

1. Start the development server: `npm run dev`
2. Navigate to the application
3. Submit a recommendation request
4. Check the console for cache hit/miss logs
5. Verify that subsequent identical requests are served from cache

## Monitoring

The system logs important events:
- Cache hits and misses
- OpenAI API calls
- Database operations
- Error conditions

Check the console output for detailed logging information.

## Security Considerations

- All API keys stored in environment variables
- No sensitive data logged
- Input validation on all user inputs
- Proper error handling prevents data leakage
