import { Router } from 'express';
import { z } from 'zod';
import fetch from 'node-fetch';
import { ChevronsLeftIcon } from 'lucide-react';
import { notifyClients } from './sse.js';

const router = Router();

// Languages enum matching the schema
const LANGUAGES = [
  'English','Spanish','French','German','Italian','Portuguese','Russian','Urdu','Arabic',
  'Japanese','Korean','Chinese','Indonesian','Vietnamese','Thai','Dutch','Turkish',
  'Polish','Ukrainian','Swedish','Czech','Danish','Finnish','Norwegian','Romanian',
  'Greek','Hungarian','Hebrew'
];

// Validation schemas
const createVideoSchema = z.object({
  product_ids: z.array(z.number().int()).default([]),
  prompt: z.string().min(1),
  duration_seconds: z.number().int().min(1),
  screen_size: z.enum(['1:1','9:16','16:9','4:5','full']).default('16:9'),
  language: z.enum(LANGUAGES),
  additional: z.object({
    notes: z.string().optional()
  }).optional()
});

const regenerateScriptSchema = z.object({
  script_content: z.string().optional()
});

const approveScriptSchema = z.object({
  script_content: z.string().optional()
});

const generateTitleSchema = z.object({
  script: z.string().optional()
});

const approveTitleSchema = z.object({
  title: z.string().optional()
});

const generateDescriptionSchema = z.object({
  script: z.string().optional()
});

const approveDescriptionSchema = z.object({
  description: z.string().optional()
});

const generateTagsSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional()
});

const approveTagsSchema = z.object({
  tags: z.string().optional()
});

const publishSchema = z.object({
  platforms: z.array(z.enum(['youtube','facebook','tiktok','instagram'])),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()).optional()
});

// Helper function to call n8n webhook
export async function callN8nWebhook(url, payload) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_CALLBACK_TOKEN}`
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json().catch(() => ({}));
    return { status: response.status, ok: response.ok, data };
  } catch (error) {
    console.error('N8N webhook error:', error);
    return { status: 500, ok: false, data: { error: error.message } };
  }
}

// Helper function to get product snapshots with company/category names
async function getProductSnapshots(db, productIds) {
  if (!productIds.length) return [];
  
  const { rows } = await db.query(
    `SELECT p.*, 
            c.name as company_name,
            cat.name as category_name,
            sc.name as subcategory_name
     FROM products p 
     LEFT JOIN companies c ON p.company_id = c.id
     LEFT JOIN categories cat ON p.cat_id = cat.id
     LEFT JOIN subcategories sc ON p.subcat_id = sc.id
     WHERE p.id = ANY($1)`,
    [productIds]
  );
  return rows;
}

// 4.1 POST /api/videos — Create & start script generation
router.post('/', async (req, res) => {
  const parse = createVideoSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  
  const { product_ids, prompt, duration_seconds, screen_size, language, additional } = parse.data;
  
  try {
    // Start transaction
    await req.db.query('BEGIN');
    
    // Get product snapshots
    const productSnapshots = await getProductSnapshots(req.db, product_ids);
    
    // Insert video record
    const { rows: videoRows } = await req.db.query(
      `INSERT INTO generatedVideos (
        prompt, duration_seconds, screen_size, video_status, script, language
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [prompt, duration_seconds, screen_size, 'pending', '', language]
    );
    
    const videoId = videoRows[0].id;
    
    // No separate scripts table - script is stored directly in generatedVideos
    
    // Insert video references
    if (product_ids.length > 0) {
      const referenceValues = product_ids.map(id => [videoId, id]);
      await req.db.query(
        `INSERT INTO video_references (video_id, reference_product_id) VALUES ${referenceValues.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')}`,
        referenceValues.flat()
      );
    }
    
    await req.db.query('COMMIT');
    
    // Call n8n script generation webhook
    const n8nPayload = {
      video_id: videoId,
      prompt,
      duration_seconds,
      screen_size,
      language,
      product_snapshots: productSnapshots,
      additional_notes: additional?.notes || '',
      callback_url: `${process.env.NODE_BASE_URL}/api/webhooks/n8n/script-callback`
    };
    
    const n8nResult = await callN8nWebhook(process.env.N8N_SCRIPT_WEBHOOK_URL, n8nPayload);
    
    if (!n8nResult.ok) {
      console.error('N8N script webhook failed:', n8nResult);
      // Don't fail the request, just log the error
    }
    
    res.status(201).json({ 
      video_id: videoId, 
      message: "script generation started"
    });
    
  } catch (error) {
    await req.db.query('ROLLBACK');
    console.error('Error creating video:', error);
    res.status(500).json({ error: 'db_error', detail: error.message });
  }
});

// List videos with filters
router.get('/', async (req, res) => {
  const status = req.query.status;
  try {
    if (status) {
      const { rows } = await req.db.query(
        `SELECT gv.*, pv.title, pv.description, pv.title_status, pv.description_status
         FROM generatedVideos gv
         LEFT JOIN publishedVideo pv ON pv.generatedVideos_id = gv.id
         WHERE gv.video_status=$1 
         ORDER BY gv.updated_at DESC, gv.id DESC`, 
        [status]
      );
      return res.json(rows);
    }
    const { rows } = await req.db.query(
      `SELECT gv.*, pv.title, pv.description, pv.title_status, pv.description_status
       FROM generatedVideos gv
       LEFT JOIN publishedVideo pv ON pv.generatedVideos_id = gv.id
       ORDER BY gv.updated_at DESC, gv.id DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'db_error', detail: error.message });
  }
});

// Get single video with script
router.get('/:id', async (req, res) => {
  try {
    const { rows: videoRows } = await req.db.query(
      'SELECT * FROM generatedVideos WHERE id=$1', 
      [req.params.id]
    );
    if (!videoRows[0]) return res.status(404).json({ error: 'not_found' });
    
    const video = videoRows[0];
    // Script is now directly in the video record
    
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: 'db_error', detail: error.message });
  }
});

// 4.3 POST /api/videos/:videoId/regenerate-script
router.post('/:videoId/regenerate-script', async (req, res) => {
  try {
    const videoId = parseInt(req.params.videoId);
    const { language } = req.body; // Get language from request body
    
    // Get video data
    const { rows: videoRows } = await req.db.query(
      'SELECT * FROM generatedVideos WHERE id=$1', 
      [videoId]
    );
    if (!videoRows[0]) return res.status(404).json({ error: 'video_not_found' });
    
    const video = videoRows[0];
    
    await req.db.query('BEGIN');
    
    // Clear script and reset status for regeneration
    await req.db.query(
      'UPDATE generatedVideos SET script=$1, video_status=$2 WHERE id=$3',
      ['', 'pending', videoId]
    );
    
    await req.db.query('COMMIT');
    
    // Call n8n webhook
    const n8nPayload = {
      video_id: videoId,
      prompt: video.prompt,
      duration_seconds: video.duration_seconds,
      screen_size: video.screen_size,
      language: language || 'Urdu',
      product_snapshots: [], // No product_snapshot column in schema
      callback_url: `${process.env.NODE_BASE_URL}/api/webhooks/n8n/script-callback`
    };
    
    const n8nResult = await callN8nWebhook(process.env.N8N_SCRIPT_WEBHOOK_URL, n8nPayload);
    
    res.status(202).json({ 
      message: "script regeneration started"
    });
    
  } catch (error) {
    await req.db.query('ROLLBACK');
    console.error('Error regenerating script:', error);
    res.status(500).json({ error: 'db_error', detail: error.message });
  }
});

// 4.4 POST /api/videos/:videoId/approve-script
router.post('/:videoId/approve-script', async (req, res) => {
  const parse = approveScriptSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  
  try {
    const videoId = parseInt(req.params.videoId);
    const { script_content } = parse.data;
    
    // Get video and script data
    const { rows: videoRows } = await req.db.query(
      'SELECT * FROM generatedVideos WHERE id=$1', 
      [videoId]
    );
    if (!videoRows[0]) return res.status(404).json({ error: 'video_not_found' });
    
    const video = videoRows[0];
    
    await req.db.query('BEGIN');
    
    // Update script if edited content provided
    if (script_content) {
      await req.db.query(
        'UPDATE generatedVideos SET script=$1, video_status=$2 WHERE id=$3',
        [script_content, 'script_generated', videoId]
      );
    }
    
    // Update video status to start video generation
    await req.db.query(
      'UPDATE generatedVideos SET video_status=$1 WHERE id=$2',
      ['generating_video', videoId]
    );
    await req.db.query('COMMIT');
    
    // Get final script content from generatedVideos table
    const { rows: videoRows2 } = await req.db.query(
      'SELECT script FROM generatedVideos WHERE id=$1',
      [videoId]
    );
    
    // Get product snapshots for this video
    const { rows: referenceRows } = await req.db.query(
      'SELECT reference_product_id FROM video_references WHERE video_id=$1',
      [videoId]
    );
    const referenceProductIds = referenceRows.map(row => row.reference_product_id);
    console.log(`🔍 DEBUG: Found ${referenceRows.length} product references for video ${videoId}`);
    console.log(`🔍 DEBUG: Product IDs:`, referenceProductIds);
    const productSnapshots = await getProductSnapshots(req.db, referenceProductIds);
    console.log(`🔍 DEBUG: Product snapshots count:`, productSnapshots.length);
    
    // Call n8n video generation webhook
    const n8nPayload = {
      video_id: videoId,
      script: videoRows2[0].script,
      duration_seconds: video.duration_seconds,
      screen_size: video.screen_size,
      language: video.language,
      product_snapshots: productSnapshots,
      callback_url: `${process.env.NODE_BASE_URL}/api/webhooks/n8n/video-callback`
    };
    
    
    const n8nResult = await callN8nWebhook(process.env.N8N_VIDEO_WEBHOOK_URL, n8nPayload);
    
    res.status(202).json({ message: "video generation started" });
  } catch (error) {
    await req.db.query('ROLLBACK');
    console.error('Error approving script:', error);
    res.status(500).json({ error: 'db_error', detail: error.message });
  }

});

// 4.6 POST /api/videos/:videoId/regenerate-video
router.post('/:videoId/regenerate-video', async (req, res) => {
  try {
    const videoId = parseInt(req.params.videoId);
    
    // Get video and script data
    const { rows: videoRows } = await req.db.query(
      'SELECT * FROM generatedVideos WHERE id=$1', 
      [videoId]
    );
    if (!videoRows[0]) return res.status(404).json({ error: 'video_not_found' });
    
    const video = videoRows[0];
    
    // Check if script exists
    if (!video.script) return res.status(404).json({ error: 'script_not_found' });
    
    // Update video status
    await req.db.query(
      'UPDATE generatedVideos SET video_status=$1 WHERE id=$2',
      ['generating_video', videoId]
    );
    
    // Get product snapshots for this video
    const { rows: referenceRows } = await req.db.query(
      'SELECT reference_product_id FROM video_references WHERE video_id=$1',
      [videoId]
    );
    const referenceProductIds = referenceRows.map(row => row.reference_product_id);
    const productSnapshots = await getProductSnapshots(req.db, referenceProductIds);
    console.log("referenceRows (first 3–4):", referenceRows.slice(0, 4));

    console.log("referenceProductIds (mapped):", referenceProductIds);
    console.log("referenceProducts (from getProductSnapshots):", referenceProducts);

    // Call n8n video webhook
    const n8nPayload = {
      video_id: videoId,
      script: video.script,
      duration_seconds: video.duration_seconds,
      screen_size: video.screen_size,
      language: video.language,
      product_snapshots: productSnapshots,
      callback_url: `${process.env.NODE_BASE_URL}/api/webhooks/n8n/video-callback`
    };
    
    const n8nResult = await callN8nWebhook(process.env.N8N_VIDEO_WEBHOOK_URL, n8nPayload);
    
    res.status(202).json({ message: "video regeneration started" });
    
  } catch (error) {
    console.error('Error regenerating video:', error);
    res.status(500).json({ error: 'db_error', detail: error.message });
  }
});

// 4.7 POST /api/videos/:videoId/approve-video
router.post('/:videoId/approve-video', async (req, res) => {
  try {
    const videoId = parseInt(req.params.videoId);
    
    // Get video data
    const { rows: videoRows } = await req.db.query(
      'SELECT * FROM generatedVideos WHERE id=$1', 
      [videoId]
    );
    if (!videoRows[0]) return res.status(404).json({ error: 'video_not_found' });
    
    const video = videoRows[0];
    
    // Check if video has preview_url
    if (!video.preview_url) {
      return res.status(400).json({ error: 'no_preview_url', message: 'Video must have a preview URL to be approved' });
    }
    
    await req.db.query('BEGIN');
    
    // Update video status to approved
    await req.db.query(
      'UPDATE generatedVideos SET video_status=$1 WHERE id=$2',
      ['video_generated', videoId]
    );
    
    // Create a record in publishedVideo table with status 'pending' so it appears in Generated Videos tab
    const { rows: publishedRows } = await req.db.query(
      `INSERT INTO publishedVideo (
        generatedVideos_id, title, description, platform, status, title_status, description_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        videoId, 
        null, // title will be generated later
        null, // description will be generated later  
        'All', // default platform
        'pending',
        'pending', // title_status
        'pending'  // description_status
      ]
    );
    
    await req.db.query('COMMIT');
    
    // Notify clients about video approval
    notifyClients('video_approved', { 
      video_id: videoId,
      status: 'video_generated',
      published_video_id: publishedRows[0].id
    });
    
    // Call n8n title-generate webhook
    const n8nPayload = {
      video_id: videoId,
      prompt: video.prompt,
      script: video.script,
      callback_url: `${process.env.NODE_BASE_URL}/api/webhooks/n8n/title-callback`
    };
    
    console.log('🔍 Calling n8n title webhook with payload:', n8nPayload);
    console.log('🔍 N8N_TITLE_WEBHOOK_URL:', process.env.N8N_TITLE_WEBHOOK_URL);
    
    const n8nResult = await callN8nWebhook(process.env.N8N_TITLE_WEBHOOK_URL, n8nPayload);
    console.log('🔍 n8n result:', n8nResult);
    
    res.status(200).json({ message: "video approved successfully" });
    
  } catch (error) {
    await req.db.query('ROLLBACK');
    console.error('Error approving video:', error);
    res.status(500).json({ error: 'db_error', detail: error.message });
  }
});

// 4.8 POST /api/videos/:videoId/generate-title
router.post('/:videoId/generate-title', async (req, res) => {
  const parse = generateTitleSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  
  try {
    const videoId = parseInt(req.params.videoId);
    const { script } = parse.data;
    
    // Get video and script data
    const { rows: videoRows } = await req.db.query(
      'SELECT * FROM generatedVideos WHERE id=$1', 
      [videoId]
    );
    if (!videoRows[0]) return res.status(404).json({ error: 'video_not_found' });
    
    const video = videoRows[0];
    
    let scriptContent = script;
    if (!scriptContent) {
      scriptContent = video.script || '';
    }
    
    // Call n8n title webhook
    const n8nPayload = {
      video_id: videoId,
      script: scriptContent,
      callback_url: `${process.env.NODE_BASE_URL}/api/webhooks/n8n/title-callback`
    };
    
    const n8nResult = await callN8nWebhook(process.env.N8N_TITLE_WEBHOOK_URL, n8nPayload);
    
    res.status(202).json({ message: "title generation started" });
    
  } catch (error) {
    console.error('Error generating title:', error);
    res.status(500).json({ error: 'db_error', detail: error.message });
  }
});

// 4.9 POST /api/videos/:videoId/approve-title
router.post('/:videoId/approve-title', async (req, res) => {
  console.log('📝 approve-title endpoint called for videoId:', req.params.videoId);
  console.log('📝 Request body:', req.body);
  
  const parse = approveTitleSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  
  try {
    const videoId = parseInt(req.params.videoId);
    const { title } = parse.data;
    
    console.log('📝 Processing title approval for video:', videoId, 'with title:', title);
    
    // Create or update published video record
    const { rows: existingRows } = await req.db.query(
      'SELECT id FROM publishedVideo WHERE generatedVideos_id=$1',
      [videoId]
    );
    
    if (existingRows[0]) {
      await req.db.query(
        'UPDATE publishedVideo SET title=$1, title_status=$2 WHERE generatedVideos_id=$3',
        [title, 'approved', videoId]
      );
    } else {
      await req.db.query(
        'INSERT INTO publishedVideo (generatedVideos_id, title, title_status, platform, publish_status) VALUES ($1, $2, $3, $4, $5)',
        [videoId, title, 'approved', 'All', 'pending']
      );
    }
    
    // Notify clients about title approval
    notifyClients('title_approved', { 
      video_id: videoId,
      title: title
    });
    
    // Get video data for tags generation
    const { rows: videoRows } = await req.db.query(
      'SELECT script FROM generatedVideos WHERE id=$1', 
      [videoId]
    );
    
    // Call n8n tags-generate webhook
    const n8nPayload = {
      video_id: videoId,
      title: title,
      description: '', // Description not yet generated
      script: videoRows[0]?.script || '',
      callback_url: `${process.env.NODE_BASE_URL}/api/webhooks/n8n/tags-callback`
    };
    
    console.log('🔍 Calling n8n tags webhook after title approval');
    console.log('🔍 N8N_TAGS_WEBHOOK_URL:', process.env.N8N_TAGS_WEBHOOK_URL);
    console.log('🔍 Payload:', JSON.stringify(n8nPayload, null, 2));
    
    const n8nResult = await callN8nWebhook(process.env.N8N_TAGS_WEBHOOK_URL, n8nPayload);
    
    console.log('🔍 N8N webhook response:', n8nResult);
    
    if (!n8nResult.ok) {
      console.error('❌ N8N tags webhook failed:', n8nResult);
      // Don't fail the request, just log the error
    } else {
      console.log('✅ N8N tags webhook called successfully');
    }
    
    res.status(200).json({ message: "title approved and tags generation started" });
    
  } catch (error) {
    console.error('Error approving title:', error);
    res.status(500).json({ error: 'db_error', detail: error.message });
  }
});

// 4.10 POST /api/videos/:videoId/generate-description
router.post('/:videoId/generate-description', async (req, res) => {
  const parse = generateDescriptionSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  
  try {
    const videoId = parseInt(req.params.videoId);
    const { script } = parse.data;
    
    // Get video and script data
    const { rows: videoRows } = await req.db.query(
      'SELECT * FROM generatedVideos WHERE id=$1', 
      [videoId]
    );
    if (!videoRows[0]) return res.status(404).json({ error: 'video_not_found' });
    
    const video = videoRows[0];
    
    let scriptContent = script;
    if (!scriptContent) {
      scriptContent = video.script || '';
    }
    
    // Call n8n description webhook
    const n8nPayload = {
      video_id: videoId,
      script: scriptContent,
      callback_url: `${process.env.NODE_BASE_URL}/api/webhooks/n8n/description-callback`
    };
    
    console.log('🔍 Calling n8n description webhook with payload:', n8nPayload);
    console.log('🔍 N8N_DESCRIPTION_WEBHOOK_URL:', process.env.N8N_DESCRIPTION_WEBHOOK_URL);
    
    const n8nResult = await callN8nWebhook(process.env.N8N_DESCRIPTION_WEBHOOK_URL, n8nPayload);
    
    console.log('🔍 n8n result:', n8nResult);
    
    res.status(202).json({ message: "description generation started" });
    
  } catch (error) {
    console.error('Error generating description:', error);
    res.status(500).json({ error: 'db_error', detail: error.message });
  }
});

// 4.10 POST /api/videos/:videoId/approve-description
router.post('/:videoId/approve-description', async (req, res) => {
  const parse = approveDescriptionSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  
  try {
    const videoId = parseInt(req.params.videoId);
    const { description } = parse.data;
    
    // Create or update published video record
    const { rows: existingRows } = await req.db.query(
      'SELECT id FROM publishedVideo WHERE generatedVideos_id=$1',
      [videoId]
    );
    
    if (existingRows[0]) {
      await req.db.query(
        'UPDATE publishedVideo SET description=$1, description_status=$2 WHERE generatedVideos_id=$3',
        [description, 'approved', videoId]
      );
    } else {
      await req.db.query(
        'INSERT INTO publishedVideo (generatedVideos_id, description, description_status, platform, publish_status) VALUES ($1, $2, $3, $4, $5)',
        [videoId, description, 'approved', 'All', 'pending']
      );
    }
    
    // Notify clients about description approval
    notifyClients('description_approved', { 
      video_id: videoId,
      description: description
    });
    
    res.status(200).json({ message: "description approved" });
    
  } catch (error) {
    console.error('Error approving description:', error);
    res.status(500).json({ error: 'db_error', detail: error.message });
  }
});

// 4.10.5 POST /api/videos/:videoId/generate-tags
router.post('/:videoId/generate-tags', async (req, res) => {
  const parse = generateTagsSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  
  try {
    const videoId = parseInt(req.params.videoId);
    const { title, description } = parse.data;
    
    // Get video data
    const { rows: videoRows } = await req.db.query(
      'SELECT * FROM generatedVideos WHERE id=$1', 
      [videoId]
    );
    if (!videoRows[0]) return res.status(404).json({ error: 'video_not_found' });
    
    const video = videoRows[0];
    
    // Get published video data for title and description
    const { rows: publishedRows } = await req.db.query(
      'SELECT title, description FROM publishedVideo WHERE generatedVideos_id=$1',
      [videoId]
    );
    
    const titleContent = title || publishedRows[0]?.title || '';
    const descriptionContent = description || publishedRows[0]?.description || '';
    
    if (!titleContent || !descriptionContent) {
      return res.status(400).json({ 
        error: 'missing_content', 
        message: 'Title and description are required for tag generation' 
      });
    }
    
    // Call n8n tags-generate webhook
    const n8nPayload = {
      video_id: videoId,
      title: titleContent,
      description: descriptionContent,
      script: video.script,
      callback_url: `${process.env.NODE_BASE_URL}/api/webhooks/n8n/tags-callback`
    };
    
    const n8nResult = await callN8nWebhook(process.env.N8N_TAGS_WEBHOOK_URL, n8nPayload);
    
    if (!n8nResult.ok) {
      console.error('N8N tags webhook failed:', n8nResult);
      return res.status(500).json({ error: 'n8n_webhook_failed' });
    }
    
    res.status(202).json({ message: "tags generation started" });
    
  } catch (error) {
    console.error('Error generating tags:', error);
    res.status(500).json({ error: 'db_error', detail: error.message });
  }
});

// 4.10.6 POST /api/videos/:videoId/approve-tags
router.post('/:videoId/approve-tags', async (req, res) => {
  const parse = approveTagsSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  
  try {
    const videoId = parseInt(req.params.videoId);
    const { tags } = parse.data;
    
    // Create or update published video record
    const { rows: existingRows } = await req.db.query(
      'SELECT id FROM publishedVideo WHERE generatedVideos_id=$1',
      [videoId]
    );
    
    if (existingRows[0]) {
      await req.db.query(
        'UPDATE publishedVideo SET tags=$1, tags_status=$2 WHERE generatedVideos_id=$3',
        [tags, 'approved', videoId]
      );
    } else {
      await req.db.query(
        'INSERT INTO publishedVideo (generatedVideos_id, tags, tags_status, platform) VALUES ($1, $2, $3, $4)',
        [videoId, tags, 'approved', 'All']
      );
    }
    
    // Notify clients about tags approval
    notifyClients('tags_approved', { 
      video_id: videoId,
      tags: tags
    });
    
    // Get video data for description generation
    const { rows: videoRows } = await req.db.query(
      'SELECT script FROM generatedVideos WHERE id=$1', 
      [videoId]
    );
    
    // Get title from published video
    const { rows: publishedRows } = await req.db.query(
      'SELECT title FROM publishedVideo WHERE generatedVideos_id=$1',
      [videoId]
    );
    
    // Call n8n description-generate webhook
    const n8nPayload = {
      video_id: videoId,
      script: videoRows[0]?.script || '',
      title: publishedRows[0]?.title || '',
      tags: tags,
      callback_url: `${process.env.NODE_BASE_URL}/api/webhooks/n8n/description-callback`
    };
    
    console.log('🔍 Calling n8n description webhook after tags approval:', n8nPayload);
    const n8nResult = await callN8nWebhook(process.env.N8N_DESCRIPTION_WEBHOOK_URL, n8nPayload);
    
    if (!n8nResult.ok) {
      console.error('N8N description webhook failed:', n8nResult);
      // Don't fail the request, just log the error
    }
    
    res.status(200).json({ message: "tags approved and description generation started" });
    
  } catch (error) {
    console.error('Error approving tags:', error);
    res.status(500).json({ error: 'db_error', detail: error.message });
  }
});

// 4.11 POST /api/videos/:videoId/publish
router.post('/:videoId/publish', async (req, res) => {
  const parse = publishSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  
  try {
    const videoId = parseInt(req.params.videoId);
    const { platforms, title, description, tags } = parse.data;
    
    // Get video data
    const { rows: videoRows } = await req.db.query(
      'SELECT * FROM generatedVideos WHERE id=$1', 
      [videoId]
    );
    if (!videoRows[0]) return res.status(404).json({ error: 'video_not_found' });
    
    const video = videoRows[0];
    
    if (!video.preview_url) {
      return res.status(400).json({ error: 'no_preview_url' });
    }
    
    await req.db.query('BEGIN');
    
    // Create published video records for each platform
    const publishedVideoIds = [];
    for (const platform of platforms) {
      const { rows: publishedRows } = await req.db.query(
        `INSERT INTO publishedVideo (
          generatedVideos_id, title, description, platform, publish_status, status
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [videoId, title, description, platform, 'pending', 'pending']
      );
      publishedVideoIds.push(publishedRows[0].id);
    }
    
    await req.db.query('COMMIT');
    
    // Call n8n upload webhook for each platform
    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      const publishedVideoId = publishedVideoIds[i];
      
      const n8nPayload = {
        video_id: videoId,
        published_video_id: publishedVideoId,
        preview_url: video.preview_url,
        title,
        description,
        platform,
        tags: tags || [],
        callback_url: `${process.env.NODE_BASE_URL}/api/webhooks/n8n/upload-callback`
      };
      
      const n8nResult = await callN8nWebhook(process.env.N8N_UPLOAD_WEBHOOK_URL, n8nPayload);
    }
    
    res.status(202).json({ 
      message: "publishing started",
      published_video_ids: publishedVideoIds
    });
    
  } catch (error) {
    await req.db.query('ROLLBACK');
    console.error('Error publishing video:', error);
    res.status(500).json({ error: 'db_error', detail: error.message });
  }
});

export default router;
