import dotenv from 'dotenv';
import pkg from 'pg';
dotenv.config();
const { Pool } = pkg;

export const pool = new Pool({
  host: 'localhost',
  port: 5000,
  user: 'postgres',
  password: '3234',
  database: 'Kissan_ghar_automation', // hardcoded DB name
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
});

export default pool;
