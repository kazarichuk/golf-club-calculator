// /lib/schema.ts
import { pgTable, serial, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

/**
 * Table for storing golf club manufacturers and their products
 * This replaces the static clubsData array with a database table
 */
export const manufacturs = pgTable('manufacturs', {
  id: serial('id').primaryKey(),
  brand: varchar('brand', { length: 100 }).notNull(),
  model: varchar('model', { length: 200 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(), // 'Game Improvement' | "Player's Distance" | "Player's Iron" | 'Blade'
  handicapRangeMin: integer('handicap_range_min').notNull(),
  handicapRangeMax: integer('handicap_range_max').notNull(),
  keyStrengths: varchar('key_strengths', { length: 50 }).array().notNull(), // ['Forgiveness', 'Distance', 'Feel', 'Workability']
  pricePoint: varchar('price_point', { length: 20 }).notNull(), // 'Budget' | 'Mid-range' | 'Premium'
  imageUrl: varchar('image_url', { length: 500 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Table for caching AI recommendations to improve performance and reduce costs
 */
export const recommendationCache = pgTable('recommendation_cache', {
  id: serial('id').primaryKey(),
  handicap: integer('handicap').notNull(),
  goal: varchar('goal', { length: 50 }).notNull(), // 'Distance' | 'Accuracy' | 'Forgiveness' | 'Feel'
  budget: varchar('budget', { length: 20 }).notNull(), // 'Budget' | 'Mid-range' | 'Premium'
  recommendedIds: integer('recommended_ids').array().notNull(), // Array of club IDs from manufacturs table
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Type definitions for TypeScript
export type Manufactur = typeof manufacturs.$inferSelect;
export type NewManufactur = typeof manufacturs.$inferInsert;
export type RecommendationCache = typeof recommendationCache.$inferSelect;
export type NewRecommendationCache = typeof recommendationCache.$inferInsert;
