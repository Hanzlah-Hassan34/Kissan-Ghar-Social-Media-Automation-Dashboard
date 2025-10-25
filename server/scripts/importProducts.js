import fs from 'fs';
import path from 'path';
import pool from '../db.js';

function toNumberOrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function toIdOrNull(v) {
  const n = toNumberOrNull(v);
  if (!n || n === 0) return null;
  return n;
}

function mapJsonToProduct(row) {
  // Map incoming JSON fields to DB columns (matching current schema)
  return {
    company_id: toIdOrNull(row.company ?? row.company_id),
    cat_id: toIdOrNull(row.cat ?? row.cat_id),
    subcat_id: toIdOrNull(row.subcat ?? row.subcat_id),
    pname: row.pname,
    quantity: row.quantity ?? null,
    // Note: pprice, phundcustdis, pnewcustdis, pmonthdis, skey, status removed to match current schema
    sprice: toNumberOrNull(row.sprice),
    act_price: toNumberOrNull(row.act_price),
    img: row.img ?? null,
    imgb: row.imgb ?? null,
    imgc: row.imgc ?? null,
    imgd: row.imgd ?? null,
    detail: row.detail ?? null,
    phighlights: row.phighlights ?? null,
    size1: row.size1 ?? null,
    act_ingredient: row.act_ingredient ?? null,
    weight: row.weight ?? null,
    tank_capacity: row.tank_capacity ?? null,
    sdetail: row.sdetail ?? null,
  };
}

async function insertProduct(client, product) {
  const entries = Object.entries(product).filter(([, v]) => v !== undefined);
  const cols = entries.map(([k]) => k).join(',');
  const placeholders = entries.map((_, i) => `$${i + 1}`).join(',');
  const values = entries.map(([, v]) => v);
  const text = `INSERT INTO products (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
  await client.query(text, values);
}

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Usage: node scripts/importProducts.js <path-to-json>');
    process.exit(1);
  }
  const filePath = path.resolve(process.cwd(), fileArg);
  const raw = fs.readFileSync(filePath, 'utf-8').trim();

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    // try to coerce comma-separated objects into an array
    try {
      const wrapped = `[${raw.replace(/,\s*$/, '')}]`;
      data = JSON.parse(wrapped);
    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
      process.exit(1);
    }
  }

  if (!Array.isArray(data)) data = [data];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Preload valid foreign keys
    const [compRes, catRes, subcatRes] = await Promise.all([
      client.query('SELECT id FROM companies'),
      client.query('SELECT id FROM categories'),
      client.query('SELECT id FROM subcategories'),
    ]);
    const validCompanyIds = new Set(compRes.rows.map(r => Number(r.id)));
    const validCategoryIds = new Set(catRes.rows.map(r => Number(r.id)));
    const validSubcatIds = new Set(subcatRes.rows.map(r => Number(r.id)));

    for (const row of data) {
      const product = mapJsonToProduct(row);
      if (!product.pname) continue; // require product name
      // Null-out invalid FKs to avoid FK violation
      if (product.company_id && !validCompanyIds.has(product.company_id)) product.company_id = null;
      if (product.cat_id && !validCategoryIds.has(product.cat_id)) product.cat_id = null;
      if (product.subcat_id && !validSubcatIds.has(product.subcat_id)) product.subcat_id = null;
      await insertProduct(client, product);
    }
    await client.query('COMMIT');
    console.log(`Imported ${data.length} record(s).`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Import failed:', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();


