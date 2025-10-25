import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('Running migration...');
    
    const migrationPath = path.join(__dirname, '..', 'migrations', '001_add_missing_columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    
    console.log('Migration completed successfully!');
    
    // Verify the migration
    const { rows } = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'generatedVideos' 
      AND column_name IN ('language', 'product_snapshot', 'created_at')
      ORDER BY column_name
    `);
    
    console.log('Verified columns:', rows);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
