// /lib/clubsData.ts
import { Club } from './types';

export const clubsData: Club[] = [
  {
    id: 'titleist_t200_2023',
    brand: 'Titleist',
    model: 'T200 (2023)',
    category: "Player's Distance",
    handicapRange: [5, 15],
    keyStrengths: ['Distance', 'Feel'],
    pricePoint: 'Premium',
    imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&h=300&fit=crop&crop=center'
  },
  {
    id: 'callaway_rogue_st_max',
    brand: 'Callaway',
    model: 'Rogue ST Max',
    category: 'Game Improvement',
    handicapRange: [15, 30],
    keyStrengths: ['Forgiveness', 'Distance'],
    pricePoint: 'Mid-range',
    imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&h=300&fit=crop&crop=center'
  },
  {
    id: 'mizuno_jpx_923_forged',
    brand: 'Mizuno',
    model: 'JPX 923 Forged',
    category: "Player's Iron",
    handicapRange: [8, 18],
    keyStrengths: ['Feel', 'Workability'],
    pricePoint: 'Premium',
    imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&h=300&fit=crop&crop=center'
  },
  {
    id: 'taylormade_p790_2023',
    brand: 'TaylorMade',
    model: 'P790 (2023)',
    category: "Player's Distance",
    handicapRange: [5, 15],
    keyStrengths: ['Distance', 'Forgiveness'],
    pricePoint: 'Premium',
    imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&h=300&fit=crop&crop=center'
  },
  {
    id: 'ping_g430',
    brand: 'Ping',
    model: 'G430',
    category: 'Game Improvement',
    handicapRange: [12, 30],
    keyStrengths: ['Forgiveness', 'Distance'],
    pricePoint: 'Mid-range',
    imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&h=300&fit=crop&crop=center'
  },
  {
    id: 'wilson_staff_model_blade',
    brand: 'Wilson Staff',
    model: 'Model Blade',
    category: 'Blade',
    handicapRange: [0, 8],
    keyStrengths: ['Feel', 'Workability'],
    pricePoint: 'Premium',
    imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&h=300&fit=crop&crop=center'
  }
];
