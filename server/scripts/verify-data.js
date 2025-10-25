import pool from '../db.js';

async function verifyData() {
  const client = await pool.connect();
  
  try {
    console.log('📊 Kissan Ghar Database Verification:\n');
    
    const categories = await client.query('SELECT COUNT(*) FROM categories');
    const companies = await client.query('SELECT COUNT(*) FROM companies');
    const subcategories = await client.query('SELECT COUNT(*) FROM subcategories');
    const products = await client.query('SELECT COUNT(*) FROM products');
    
    console.log('✅ Data Import Results:');
    console.log(`   • Categories: ${categories.rows[0].count}`);
    console.log(`   • Companies: ${companies.rows[0].count}`);
    console.log(`   • Subcategories: ${subcategories.rows[0].count}`);
    console.log(`   • Products: ${products.rows[0].count}`);
    
    // Show some sample data
    console.log('\n📋 Sample Categories:');
    const sampleCats = await client.query('SELECT id, name FROM categories ORDER BY id LIMIT 5');
    sampleCats.rows.forEach(cat => {
      console.log(`   ${cat.id}. ${cat.name}`);
    });
    
    console.log('\n🏢 Sample Companies:');
    const sampleComps = await client.query('SELECT id, name FROM companies ORDER BY id LIMIT 5');
    sampleComps.rows.forEach(comp => {
      console.log(`   ${comp.id}. ${comp.name}`);
    });
    
    console.log('\n📦 Sample Products:');
    const sampleProds = await client.query(`
      SELECT p.id, p.pname, c.name as company, cat.name as category 
      FROM products p 
      LEFT JOIN companies c ON p.company_id = c.id 
      LEFT JOIN categories cat ON p.cat_id = cat.id 
      ORDER BY p.id LIMIT 5
    `);
    sampleProds.rows.forEach(prod => {
      console.log(`   ${prod.id}. ${prod.pname} (${prod.company || 'N/A'} • ${prod.category || 'N/A'})`);
    });
    
    console.log('\n✨ Database is ready with all Kissan Ghar reference data!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

verifyData().catch((error) => {
  console.error('💥 Verification process failed:', error.message);
  process.exit(1);
});
