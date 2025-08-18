// /app/api/setup/route.ts
import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { clubsData } from '@/lib/clubsData';

export async function POST() {
  try {
    // Check for required environment variables
    if (!process.env.DATABASE_URL) {
      console.error('Missing DATABASE_URL environment variable');
      return NextResponse.json(
        { message: 'Database connection not configured.' },
        { status: 500 }
      );
    }

    console.log('Starting database setup...');
    
    // Clear existing data (optional - remove if you want to keep existing data)
    await db.delete(schema.manufacturs);
    console.log('Cleared existing data');
    
    // Insert clubs data
    const insertPromises = clubsData.map(club => {
      return db.insert(schema.manufacturs).values({
        brand: club.brand,
        model: club.model,
        category: club.category,
        handicapRangeMin: club.handicapRange[0],
        handicapRangeMax: club.handicapRange[1],
        keyStrengths: club.keyStrengths,
        pricePoint: club.pricePoint,
        imageUrl: club.imageUrl,
      });
    });
    
    await Promise.all(insertPromises);
    
    console.log(`Successfully inserted ${clubsData.length} clubs to database`);
    
    return NextResponse.json({
      message: 'Database setup completed successfully',
      clubsInserted: clubsData.length
    });
    
  } catch (error) {
    console.error('Database setup failed:', error);
    return NextResponse.json(
      { message: 'Database setup failed. Please check the logs.' },
      { status: 500 }
    );
  }
}
