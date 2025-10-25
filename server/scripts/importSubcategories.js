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
  await client.query(`SELECT setval('subcategories_id_seq', (SELECT COALESCE(MAX(id),1) FROM subcategories))`);
}

async function main() {
  const fileArg = process.argv[2] || 'data/sub_categories.json';
  const filePath = path.resolve(process.cwd(), fileArg);
  const rows = parseJsonFile(filePath);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const r of rows) {
      const id = Number(r.id);
      const cat_id = Number(r.cat);
      const name = r.name;
      const status = r.status;
      
      // Skip deleted/inactive subcategories (status = '2' or status = 2)
      if (status === '2' || status === 2) {
        console.log(`   Skipping deleted subcategory: ${name} (ID: ${id})`);
        continue;
      }
      
      if (!id || !cat_id || !name) continue;
      await client.query(
        `INSERT INTO subcategories (id, cat_id, name) VALUES ($1,$2,$3)
         ON CONFLICT (id) DO UPDATE SET cat_id=EXCLUDED.cat_id, name=EXCLUDED.name`,
        [id, cat_id, name]
      );
    }
    await setSequence(client);
    await client.query('COMMIT');
    console.log(`Imported subcategories: ${rows.length}`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Subcategories import failed:', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();


