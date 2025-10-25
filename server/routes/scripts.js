import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// List scripts for a video or product
router.get('/', async (req, res) => {
  const videoId = req.query.video_id;
  const productId = req.query.product_id;
  try {
    if (videoId) {
      const { rows } = await req.db.query('SELECT * FROM scripts WHERE video_id=$1 ORDER BY id DESC', [videoId]);
      return res.json(rows);
    }
    if (productId) {
      const { rows } = await req.db.query('SELECT * FROM scripts WHERE product_id=$1 ORDER BY id DESC', [productId]);
      return res.json(rows);
    }
    const { rows } = await req.db.query('SELECT * FROM scripts ORDER BY id DESC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'db_error', detail: e.message });
  }
});

// Create script
const createSchema = z.object({
  product_id: z.number().int(),
  video_id: z.number().int().nullable().optional(),
  content: z.string().min(1),
  script_status: z.enum(['pending','generating','generated','approved','rejected']).optional()
});

router.post('/', async (req, res) => {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { product_id, video_id, content, script_status } = parse.data;
  try {
    const { rows } = await req.db.query(
      'INSERT INTO scripts (product_id, video_id, content, script_status) VALUES ($1,$2,$3,$4) RETURNING *',
      [product_id, video_id ?? null, content, script_status ?? 'pending']
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'db_error', detail: e.message });
  }
});

// Update script content/status
router.put('/:id', async (req, res) => {
  const body = z
    .object({ content: z.string().min(1).optional(), script_status: z.enum(['pending','generating','generated','approved','rejected']).optional() })
    .partial()
    .safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });
  const entries = Object.entries(body.data);
  if (!entries.length) return res.status(400).json({ error: 'no_fields' });
  const sets = entries.map(([k], i) => `${k}=$${i + 1}`).join(',');
  const values = entries.map(([, v]) => v);
  try {
    const { rows } = await req.db.query(`UPDATE scripts SET ${sets} WHERE id=$${values.length + 1} RETURNING *`, [...values, req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'db_error', detail: e.message });
  }
});

// Delete (for regenerate)
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await req.db.query('DELETE FROM scripts WHERE id=$1', [req.params.id]);
    res.json({ deleted: rowCount });
  } catch (e) {
    res.status(500).json({ error: 'db_error', detail: e.message });
  }
});

export default router;


