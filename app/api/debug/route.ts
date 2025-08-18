// /app/api/debug/route.ts
import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';

export async function GET() {
  try {
    // Check for required environment variables
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { message: 'Database connection not configured.' },
        { status: 500 }
      );
    }

    console.log('Fetching all clubs from database...');
    
    // Get all clubs from the database
    const allClubs = await db
      .select()
      .from(schema.manufacturs);
    
    console.log('Found clubs:', allClubs.length);
    console.log('Club details:', allClubs);
    
    return NextResponse.json({
      message: 'Database debug info',
      totalClubs: allClubs.length,
      clubs: allClubs
    });
    
  } catch (error) {
    console.error('Debug failed:', error);
    return NextResponse.json(
      { message: 'Debug failed. Please check the logs.' },
      { status: 500 }
    );
  }
}
