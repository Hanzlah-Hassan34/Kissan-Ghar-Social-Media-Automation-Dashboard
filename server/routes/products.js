import { Router } from 'express';
import { z } from 'zod';

const router = Router();

const productSchema = z.object({
  company_id: z.number().int().nullable().optional(),
  cat_id: z.number().int().nullable().optional(),
  subcat_id: z.number().int().nullable().optional(),
  pname: z.string().min(1),
  quantity: z.number().int().optional().nullable(),
  pprice: z.number().optional().nullable(),
  sprice: z.number().optional().nullable(),
  phundcustdis: z.number().optional().nullable(),
  pnewcustdis: z.number().optional().nullable(),
  pmonthdis: z.number().optional().nullable(),
  act_price: z.number().optional().nullable(),
  img: z.string().optional().nullable(),
  imgb: z.string().optional().nullable(),
  imgc: z.string().optional().nullable(),
  imgd: z.string().optional().nullable(),
  detail: z.string().optional().nullable(),
  phighlights: z.string().optional().nullable(),
  size1: z.string().optional().nullable(),
  act_ingredient: z.string().optional().nullable(),
  weight: z.string().optional().nullable(),
  tank_capacity: z.string().optional().nullable(),
  skey: z.string().optional().nullable(),
  sdetail: z.string().optional().nullable(),
  status: z.enum(['active','inactive']).optional()
});

// Create product
router.post('/', async (req, res) => {
  console.log('Backend: Received product creation request:', req.body);
  
  const parse = productSchema.safeParse(req.body);
  if (!parse.success) {
    console.log('Backend: Validation failed:', parse.error.flatten());
    return res.status(400).json({ error: parse.error.flatten() });
  }
  
  const fields = Object.keys(parse.data);
  const values = Object.values(parse.data);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(',');
  const cols = fields.join(',');
  const text = `INSERT INTO products (${cols}) VALUES (${placeholders}) RETURNING *`;
  
  console.log('Backend: SQL Query:', text);
  console.log('Backend: Values:', values);
  
  try {
    const { rows } = await req.db.query(text, values);
    console.log('Backend: Product created successfully:', rows[0]);
    res.json(rows[0]);
  } catch (e) {
    console.error('Backend: Database error:', e.message);
    res.status(500).json({ error: 'db_error', detail: e.message });
  }
});

// List products (basic, with search)
router.get('/', async (req, res) => {
  const q = (req.query.q || '').toString();
  try {
    const query = q 
      ? `SELECT p.*, c.name as company_name, s.name as subcategory_name 
         FROM products p 
         LEFT JOIN companies c ON p.company_id = c.id 
         LEFT JOIN subcategories s ON p.subcat_id = s.id 
         WHERE p.pname ILIKE $1 
         ORDER BY p.id DESC`
      : `SELECT p.*, c.name as company_name, s.name as subcategory_name 
         FROM products p 
         LEFT JOIN companies c ON p.company_id = c.id 
         LEFT JOIN subcategories s ON p.subcat_id = s.id 
         ORDER BY p.id DESC`;
    
    const { rows } = await req.db.query(query, q ? [`%${q}%`] : []);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'db_error', detail: e.message });
  }
});

// Single product
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await req.db.query('SELECT * FROM products WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'db_error', detail: e.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  const parse = productSchema.partial().safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const entries = Object.entries(parse.data);
  const sets = entries.map(([k], i) => `${k}=$${i + 1}`).join(',');
  const values = entries.map(([, v]) => v);
  if (!sets) return res.status(400).json({ error: 'no_fields' });
  try {
    const { rows } = await req.db.query(
      `UPDATE products SET ${sets} WHERE id=$${values.length + 1} RETURNING *`,
      [...values, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'db_error', detail: e.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await req.db.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    res.json({ deleted: rowCount });
  } catch (e) {
    res.status(500).json({ error: 'db_error', detail: e.message });
  }
});

// Reference dropdown data (companies, categories, subcategories)
router.get('/refs/all', async (req, res) => {
  try {
    const [companies, categories, subcategories] = await Promise.all([
      req.db.query('SELECT id,name FROM companies ORDER BY name'),
      req.db.query('SELECT id,name FROM categories ORDER BY name'),
      req.db.query('SELECT id,name,cat_id FROM subcategories ORDER BY name')
    ]);
    res.json({ companies: companies.rows, categories: categories.rows, subcategories: subcategories.rows });
  } catch (e) {
    res.status(500).json({ error: 'db_error', detail: e.message });
  }
});

export default router;


