import { Router } from 'express';
import { z } from 'zod';
import { notifyClients } from './sse.js';

const router = Router();

// List published videos
router.get('/', async (req, res) => {
  try {
    const status = req.query.status;
    let query = `SELECT pv.*, gv.preview_url, gv.prompt, gv.script
                 FROM publishedVideo pv
                 LEFT JOIN generatedVideos gv ON gv.id = pv.generatedVideos_id`;
    
    if (status) {
      query += ` WHERE pv.status = $1`;
      const { rows } = await req.db.query(query + ` ORDER BY pv.uploaded_at DESC NULLS LAST, pv.id DESC`, [status]);
      return res.json(rows);
    }
    
    const { rows } = await req.db.query(query + ` ORDER BY pv.uploaded_at DESC NULLS LAST, pv.id DESC`);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'db_error', detail: e.message });
  }
});

const createSchema = z.object({
  generatedVideos_id: z.number().int(),
  title: z.string().nullable().optional(),
  title_status: z.enum(['pending','generating','generated','approved','rejected']).optional(),
  description: z.string().nullable().optional(),
  description_status: z.string().optional(),
  publish_status: z.enum(['pending','Uploading','uploaded']).optional(),
  video_id: z.number().int().nullable().optional(),
  platform: z.enum(['All','youtube','facebook','tiktok','instagram']),
  platform_video_id: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  status: z.string().optional(),
  uploaded_at: z.string().nullable().optional()
});

router.post('/', async (req, res) => {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const fields = Object.keys(parse.data);
  const values = Object.values(parse.data);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(',');
  const cols = fields.join(',');
  try {
    const { rows } = await req.db.query(`INSERT INTO publishedVideo (${cols}) VALUES (${placeholders}) RETURNING *`, values);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'db_error', detail: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await req.db.query('SELECT * FROM publishedVideo WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'db_error', detail: e.message });
  }
});

router.put('/:id', async (req, res) => {
  const body = createSchema.partial().safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });
  const entries = Object.entries(body.data);
  if (!entries.length) return res.status(400).json({ error: 'no_fields' });
  const sets = entries.map(([k], i) => `${k}=$${i + 1}`).join(',');
  const values = entries.map(([, v]) => v);
  try {
    const { rows } = await req.db.query(`UPDATE publishedVideo SET ${sets} WHERE id=$${values.length + 1} RETURNING *`, [...values, req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'db_error', detail: e.message });
  }
});

// Approve and upload endpoint - implements the duplication fix logic
router.post('/:id/approve-and-upload', async (req, res) => {
  const approveUploadSchema = z.object({
    platform: z.string(),
    title: z.string(),
    description: z.string(),
    tags: z.string().optional()
  });
  
  const parse = approveUploadSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  
  try {
    const publishedVideoId = parseInt(req.params.id);
    const { platform, title, description, tags } = parse.data;
    
    console.log('📤 Approve and upload called with:', { platform, title, description, tags });
    
    // Get the current published video record
    const { rows: currentRows } = await req.db.query(
      `SELECT pv.*, gv.preview_url, gv.prompt, gv.script
       FROM publishedVideo pv
       LEFT JOIN generatedVideos gv ON gv.id = pv.generatedVideos_id
       WHERE pv.id = $1`, 
      [publishedVideoId]
    );
    
    if (!currentRows[0]) {
      return res.status(404).json({ error: 'published_video_not_found' });
    }
    
    const currentVideo = currentRows[0];
    
    console.log('🔍 Current video data:', {
      id: currentVideo.id,
      generatedVideos_id: currentVideo.generatedVideos_id,
      generatedvideos_id: currentVideo.generatedvideos_id, // Check both cases
      title: currentVideo.title,
      status: currentVideo.status
    });
    
    // Ensure we have a valid generatedVideos_id
    const generatedVideoId = currentVideo.generatedVideos_id || currentVideo.generatedvideos_id;
    if (!generatedVideoId) {
      console.error('❌ No generatedVideos_id found for published video:', currentVideo.id);
      return res.status(400).json({ error: 'no_generated_video_id', message: 'Published video must be linked to a generated video' });
    }
    
    await req.db.query('BEGIN');
    
    // Step 1: Update the current record status to 'uploading' and mark description as approved
    await req.db.query(
      'UPDATE publishedVideo SET status = $1, title = $2, description = $3, platform = $4, description_status = $5 WHERE id = $6',
      ['uploading', title, description, platform, 'approved', publishedVideoId]
    );
    
    // Step 2: Create a new record with status 'pending' (this will show in Generated Videos tab)
    const { rows: newRows } = await req.db.query(
      `INSERT INTO publishedVideo (
        generatedVideos_id, title, description, platform, status, title_status, description_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [generatedVideoId, title, description, null, 'pending', 'approved', 'approved']
    );
    
    await req.db.query('COMMIT');
    
    // Notify clients about video upload approval
    notifyClients('video_upload_approved', { 
      published_video_id: publishedVideoId,
      new_pending_video_id: newRows[0].id,
      platform: platform,
      status: 'uploading'
    });
    
    // Call n8n upload webhook for the uploading video
    const n8nPayload = {
      video_id: currentVideo.generatedVideos_id,
      published_video_id: publishedVideoId,
      preview_url: currentVideo.preview_url,
      title,
      description,
      platform,
      tags: tags || currentVideo.tags || '',
      callback_url: `${process.env.NODE_BASE_URL}/api/webhooks/n8n/upload-callback`
    };
    
    console.log('📤 Sending to n8n upload webhook:', n8nPayload);
    
    // Import the callN8nWebhook function
    const { callN8nWebhook } = await import('./videos.js');
    const n8nResult = await callN8nWebhook(process.env.N8N_UPLOAD_WEBHOOK_URL, n8nPayload);
    
    res.status(202).json({ 
      message: "approval and upload started",
      uploading_video_id: publishedVideoId,
      new_pending_video_id: newRows[0].id
    });
    
  } catch (error) {
    await req.db.query('ROLLBACK');
    console.error('Error in approve-and-upload:', error);
    res.status(500).json({ error: 'db_error', detail: error.message });
  }
});

export default router;


