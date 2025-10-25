import pool from '../db.js';

async function clearAllData() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Clearing all existing data...');
    
    await client.query('BEGIN');
    
    // Clear data in reverse order of dependencies to avoid foreign key constraints
    console.log('   • Clearing video references...');
    await client.query('DELETE FROM video_references');
    
    console.log('   • Clearing published videos...');
    await client.query('DELETE FROM publishedVideo');
    
    console.log('   • Clearing generated videos...');
    await client.query('DELETE FROM generatedVideos');
    
    // Scripts table no longer exists - scripts are stored in generatedVideos
    
    console.log('   • Clearing products...');
    await client.query('DELETE FROM products');
    
    console.log('   • Clearing subcategories...');
    await client.query('DELETE FROM subcategories');
    
    console.log('   • Clearing companies...');
    await client.query('DELETE FROM companies');
    
    console.log('   • Clearing categories...');
    await client.query('DELETE FROM categories');
    
    console.log('   • Clearing analytics...');
    await client.query('DELETE FROM analytics');
    
    // Reset sequences to start from 1
    console.log('   • Resetting sequences...');
    await client.query("SELECT setval('categories_id_seq', 1, false)");
    await client.query("SELECT setval('companies_id_seq', 1, false)");
    await client.query("SELECT setval('subcategories_id_seq', 1, false)");
    await client.query("SELECT setval('products_id_seq', 1, false)");
    // Scripts sequence no longer exists
    await client.query("SELECT setval('generatedVideos_id_seq', 1, false)");
    await client.query("SELECT setval('publishedVideo_id_seq', 1, false)");
    await client.query("SELECT setval('video_references_id_seq', 1, false)");
    await client.query("SELECT setval('analytics_id_seq', 1, false)");
    
    await client.query('COMMIT');
    
    console.log('✅ All data cleared successfully!');
    console.log('🔄 Database is now ready for fresh data import.');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error clearing data:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

clearAllData().catch((error) => {
  console.error('💥 Clear data process failed:', error.message);
  process.exit(1);
});
