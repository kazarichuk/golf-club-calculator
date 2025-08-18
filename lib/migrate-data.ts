// /lib/migrate-data.ts
import { db, schema } from './db';
import { clubsData } from './clubsData';

/**
 * Migration script to populate the manufacturs table with existing data
 * Run this once after creating the database tables
 */
export async function migrateClubsData() {
  try {
    console.log('Starting data migration...');
    
    // Clear existing data (optional - remove if you want to keep existing data)
    await db.delete(schema.manufacturs);
    
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
    
    console.log(`Successfully migrated ${clubsData.length} clubs to database`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateClubsData()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
