import fs from 'fs';
import path from 'path';
import pool from '../db.js';

function parseJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8').trim();
  let data;
  try { data = JSON.parse(raw); } catch {
    const wrapped = `[${raw.replace(/,\s*$/, '')}]`;
    data = JSON.parse(wrapped);
  }
  return Array.isArray(data) ? data : [data];
}

async function setSequence(client) {
  await client.query(`SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id),1) FROM categories))`);
}

async function main() {
  const fileArg = process.argv[2] || 'data/categories.json';
  const filePath = path.resolve(process.cwd(), fileArg);
  const rows = parseJsonFile(filePath);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const r of rows) {
      const id = Number(r.id);
      const name = r.name;
      const img = r.img || null;
      const status = r.status;
      
      // Skip deleted/inactive categories (status = '2' or status = 2)
      if (status === '2' || status === 2) {
        console.log(`   Skipping deleted category: ${name} (ID: ${id})`);
        continue;
      }
      
      if (!id || !name) continue;
      await client.query(
        `INSERT INTO categories (id, name, img) VALUES ($1,$2,$3)
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, img=EXCLUDED.img`,
        [id, name, img]
      );
    }
    await setSequence(client);
    await client.query('COMMIT');
    console.log(`Imported categories: ${rows.length}`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Categories import failed:', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();


