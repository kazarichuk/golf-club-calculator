// /app/api/test-search/route.ts
import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, ilike } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('Testing database search...');
    
    // Test 1: Get all clubs
    const allClubs = await db.select().from(schema.manufacturs);
    console.log('Total clubs in database:', allClubs.length);
    
    // Test 2: Search for exact match
    const exactMatch = await db
      .select()
      .from(schema.manufacturs)
      .where(eq(schema.manufacturs.model, 'Callaway Rogue ST Max'));
    console.log('Exact match for "Callaway Rogue ST Max":', exactMatch.length);
    
    // Test 3: Search for partial match
    const partialMatch = await db
      .select()
      .from(schema.manufacturs)
      .where(ilike(schema.manufacturs.model, '%Callaway%'));
    console.log('Partial match for "%Callaway%":', partialMatch.length);
    
    // Test 4: Search by brand
    const brandMatch = await db
      .select()
      .from(schema.manufacturs)
      .where(eq(schema.manufacturs.brand, 'Callaway'));
    console.log('Brand match for "Callaway":', brandMatch.length);
    
    return NextResponse.json({
      message: 'Search test results',
      totalClubs: allClubs.length,
      exactMatch: exactMatch.length,
      partialMatch: partialMatch.length,
      brandMatch: brandMatch.length,
      sampleClub: allClubs[0]
    });
    
  } catch (error) {
    console.error('Search test failed:', error);
    return NextResponse.json(
      { message: 'Search test failed', error: error.message },
      { status: 500 }
    );
  }
}
