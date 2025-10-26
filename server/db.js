import dotenv from 'dotenv';
import pkg from 'pg';
dotenv.config();
const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kissan_ghar_automation',
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
});

export default pool;
