// Script to add the approximate_price column to the existing database
const { neon } = require('@neondatabase/serverless');

async function addPriceColumn() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('Adding approximate_price column to manufacturs table...');
    
    // Add the new column
    await sql`
      ALTER TABLE manufacturs 
      ADD COLUMN IF NOT EXISTS approximate_price INTEGER;
    `;
    
    console.log('✅ Successfully added approximate_price column');
    
    // Check if the column was added
    const result = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'manufacturs' AND column_name = 'approximate_price';
    `;
    
    if (result.length > 0) {
      console.log('✅ Column confirmed in database:', result[0]);
    } else {
      console.log('❌ Column not found after addition');
    }
    
  } catch (error) {
    console.error('❌ Error adding column:', error);
  }
}

addPriceColumn();
