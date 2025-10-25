import { Router } from 'express';

const router = Router();

// List references for a video
router.get('/:videoId', async (req, res) => {
  try {
    const { rows } = await req.db.query(
      'SELECT * FROM video_references WHERE video_id=$1 ORDER BY id ASC',
      [req.params.videoId]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'db_error', detail: e.message });
  }
});

// Replace references for a video (idempotent)
router.put('/:videoId', async (req, res) => {
  const { reference_product_ids } = req.body || {};
  if (!Array.isArray(reference_product_ids)) return res.status(400).json({ error: 'invalid_body' });
  const client = await req.db.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM video_references WHERE video_id=$1', [req.params.videoId]);
    for (const pid of reference_product_ids) {
      await client.query(
        'INSERT INTO video_references (video_id, reference_product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [req.params.videoId, pid]
      );
    }
    await client.query('COMMIT');
    const { rows } = await req.db.query('SELECT * FROM video_references WHERE video_id=$1 ORDER BY id ASC', [req.params.videoId]);
    res.json(rows);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'db_error', detail: e.message });
  } finally {
    client.release();
  }
});

export default router;


