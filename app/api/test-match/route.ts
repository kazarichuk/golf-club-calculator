import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';

export async function GET() {
  try {
    const allClubs = await db.select().from(schema.manufacturs);
    
    const testSearches = [
      'Callaway Rogue ST Max',
      'Rogue ST Max',
      'Callaway Rogue',
      'Ping G430',
      'G430'
    ];
    
    const results = testSearches.map(searchTerm => {
      const matches = allClubs.filter(club => {
        const clubModel = club.model.toLowerCase();
        const searchModel = searchTerm.toLowerCase();
        
        // Exact match
        if (clubModel === searchModel) return true;
        
        // Contains match
        if (clubModel.includes(searchModel) || searchModel.includes(clubModel)) return true;
        
        // Word match
        const clubWords = clubModel.split(' ');
        const searchWords = searchModel.split(' ');
        
        const hasAllSearchWords = searchWords.every(word => 
          clubWords.some(clubWord => clubWord.includes(word) || word.includes(clubWord))
        );
        
        return hasAllSearchWords;
      });
      
      return {
        searchTerm,
        matches: matches.map(m => `${m.brand} ${m.model}`),
        matchCount: matches.length
      };
    });
    
    return NextResponse.json({
      allClubs: allClubs.map(c => `${c.brand} ${c.model}`),
      testResults: results
    });
  } catch (error) {
    console.error('Test match failed:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}
