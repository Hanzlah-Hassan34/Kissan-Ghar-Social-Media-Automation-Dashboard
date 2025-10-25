import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runUserMigration() {
  try {
    console.log('Running user migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/005_add_users_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ User migration completed successfully!');
    console.log('User table created with default user:');
    console.log('Email: waqaschohan@gmail.com');
    console.log('Password: 654321');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

runUserMigration();
