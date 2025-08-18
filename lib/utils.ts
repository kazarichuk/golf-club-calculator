import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Club, DbClub } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert database club format to frontend club format
 */
export function dbClubToClub(dbClub: {
  id: number;
  brand: string;
  model: string;
  category: string;
  handicapRangeMin: number;
  handicapRangeMax: number;
  keyStrengths: string[];
  pricePoint: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}): Club {
  return {
    id: dbClub.id.toString(),
    brand: dbClub.brand,
    model: dbClub.model,
    category: dbClub.category as 'Game Improvement' | "Player's Distance" | "Player's Iron" | 'Blade',
    handicapRange: [dbClub.handicapRangeMin, dbClub.handicapRangeMax],
    keyStrengths: dbClub.keyStrengths as ('Forgiveness' | 'Distance' | 'Feel' | 'Workability')[],
    pricePoint: dbClub.pricePoint as 'Budget' | 'Mid-range' | 'Premium',
    imageUrl: dbClub.imageUrl,
  };
}

/**
 * Convert frontend club format to database club format
 */
export function clubToDbClub(club: Club): Omit<DbClub, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    brand: club.brand,
    model: club.model,
    category: club.category,
    handicapRangeMin: club.handicapRange[0],
    handicapRangeMax: club.handicapRange[1],
    keyStrengths: club.keyStrengths,
    pricePoint: club.pricePoint,
    imageUrl: club.imageUrl,
  };
}
