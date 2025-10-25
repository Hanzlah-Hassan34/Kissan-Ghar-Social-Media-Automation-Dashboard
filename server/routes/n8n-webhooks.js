import { Router } from 'express';
import { z } from 'zod';
import { notifyClients } from './sse.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to download video from VPS to local storage
async function downloadVideoFromVPS(vpsUrl, localPath) {
  return new Promise((resolve, reject) => {
    const protocol = vpsUrl.startsWith('https') ? https : http;
    
    const file = fs.createWriteStream(localPath);
    
    protocol.get(vpsUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download video: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Video downloaded successfully to: ${localPath}`);
        resolve(localPath);
      });
      
      file.on('error', (err) => {
        fs.unlink(localPath, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Middleware to validate n8n callback token
function validateN8nToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-n8n-signature'];
  const expectedToken = process.env.N8N_CALLBACK_TOKEN;
  
  if (!expectedToken) {
    console.warn('N8N_CALLBACK_TOKEN not configured, skipping validation');
    return next();
  }
  
  if (!token || token !== expectedToken) {
    return res.status(401).json({ error: 'unauthorized', message: 'Invalid n8n callback token' });
  }
  
  next();
}

// Validation schemas
const scriptCallbackSchema = z.object({
  video_id: z.number().int(),
  script: z.string().min(1)
});

const videoCallbackSchema = z.object({
  video_id: z.number().int(),
  preview_url: z.string().url().optional(),
  duration_actual_seconds: z.number().int().optional(),
  file_size: z.number().int().optional()
});

const titleCallbackSchema = z.object({
  video_id: z.number().int(),
  title: z.string().min(1)
});

const descriptionCallbackSchema = z.object({
  video_id: z.number().int(),
  description: z.string().min(1)
});

const tagsCallbackSchema = z.object({
  video_id: z.number().int(),
  tags: z.string().min(1)
});

const uploadCallbackSchema = z.object({
  video_id: z.number().int(),
  platform: z.enum(['youtube','facebook','tiktok','instagram']),
  platform_video_id: z.string().optional(),
  url: z.string().url().optional(),
  status: z.enum(['pending','uploading','published','failed']),
  error_message: z.string().optional()
});

// Helper function is now imported from sse.js

// 4.2 POST /api/webhooks/n8n/script-callback
router.post('/script-callback', validateN8nToken, async (req, res) => {
  const parse = scriptCallbackSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'invalid_payload', details: parse.error.flatten() });
  }
  
  const { video_id, script } = parse.data;
  
  try {
    // Validate video exists
    const { rows: videoRows } = await req.db.query(
      'SELECT id FROM generatedVideos WHERE id=$1',
      [video_id]
    );
    
    if (!videoRows[0]) {
      return res.status(404).json({ error: 'video_not_found' });
    }
    
    // Update script
    // Update script in generatedVideos table
    await req.db.query(
      'UPDATE generatedVideos SET script=$1, video_status=$2, updated_at=now() WHERE id=$3',
      [script, 'script_generated', video_id]
    );
    
    // Notify clients
    notifyClients('script_generated', {
      video_id,
      script,
      status: 'generated'
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Script updated successfully' 
    });
    
  } catch (error) {
    console.error('Error processing script callback:', error);
    res.status(500).json({ error: 'processing_error', detail: error.message });
  }
});

// 4.5 POST /api/webhooks/n8n/video-callback
router.post('/video-callback', validateN8nToken, async (req, res) => {
  const parse = videoCallbackSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'invalid_payload', details: parse.error.flatten() });
  }
  
  const { video_id, preview_url, duration_actual_seconds, file_size } = parse.data;
  
  try {
    // Validate video exists
    const { rows: videoRows } = await req.db.query(
      'SELECT id FROM generatedVideos WHERE id=$1',
      [video_id]
    );
    
    if (!videoRows[0]) {
      return res.status(404).json({ error: 'video_not_found' });
    }
    
    // Prepare update fields
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;
    
    if (preview_url) {
      let localPreviewUrl = preview_url;
      
      // If preview_url is from VPS, download it locally
      if (preview_url.includes('YOUR_VPS_IP') || preview_url.includes('srv1045783') || preview_url.includes('kissan-ghar')) {
        try {
          // Create generated_videos directory if it doesn't exist
          const generatedVideosDir = path.join(__dirname, '../../generated_videos');
          if (!fs.existsSync(generatedVideosDir)) {
            fs.mkdirSync(generatedVideosDir, { recursive: true });
          }
          
          // Download video from VPS to local storage
          const localVideoPath = path.join(generatedVideosDir, `${video_id}.mp4`);
          await downloadVideoFromVPS(preview_url, localVideoPath);
          
          // Update preview_url to point to local file
          localPreviewUrl = `http://localhost:4000/generated_videos/${video_id}.mp4`;
          console.log(`Video ${video_id} downloaded from VPS and available at: ${localPreviewUrl}`);
        } catch (error) {
          console.error(`Failed to download video ${video_id} from VPS:`, error);
          // Keep original VPS URL if download fails
          localPreviewUrl = preview_url;
        }
      }
      
      updateFields.push(`preview_url=$${paramCount++}`);
      updateValues.push(localPreviewUrl);
      // When preview_url is provided, mark video as generated but pending approval
      updateFields.push(`video_status=$${paramCount++}`);
      updateValues.push('video_generated_pending');
    }
    
    if (duration_actual_seconds) {
      updateFields.push(`duration_actual_seconds=$${paramCount++}`);
      updateValues.push(duration_actual_seconds);
    }
    
    if (file_size) {
      updateFields.push(`file_size=$${paramCount++}`);
      updateValues.push(file_size);
    }
    
    updateFields.push(`updated_at=now()`);
    updateValues.push(video_id);
    
    if (updateFields.length > 1) { // More than just updated_at
      await req.db.query(
        `UPDATE generatedVideos SET ${updateFields.join(', ')} WHERE id=$${paramCount}`,
        updateValues
      );
    }
    
    // Notify clients
    const eventData = { video_id };
    if (preview_url) eventData.preview_url = preview_url;
    if (duration_actual_seconds) eventData.duration_actual_seconds = duration_actual_seconds;
    if (file_size) eventData.file_size = file_size;
    
    notifyClients('video_update', eventData);
    
    res.status(200).json({ 
      success: true, 
      message: 'Video updated successfully' 
    });
    
  } catch (error) {
    console.error('Error processing video callback:', error);
    res.status(500).json({ error: 'processing_error', detail: error.message });
  }
});

// 4.8 POST /api/webhooks/n8n/title-callback
router.post('/title-callback', validateN8nToken, async (req, res) => {
  const parse = titleCallbackSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'invalid_payload', details: parse.error.flatten() });
  }
  
  const { video_id, title } = parse.data;
  
  try {
    // Validate video exists
    const { rows: videoRows } = await req.db.query(
      'SELECT id FROM generatedVideos WHERE id=$1',
      [video_id]
    );
    
    if (!videoRows[0]) {
      return res.status(404).json({ error: 'video_not_found' });
    }
    
    // Create or update published video record
    const { rows: existingRows } = await req.db.query(
      'SELECT id FROM publishedVideo WHERE generatedVideos_id=$1',
      [video_id]
    );
    
    if (existingRows[0]) {
      await req.db.query(
        'UPDATE publishedVideo SET title=$1, title_status=$2 WHERE generatedVideos_id=$3',
        [title, 'generated', video_id]
      );
    } else {
      await req.db.query(
        'INSERT INTO publishedVideo (generatedVideos_id, title, title_status, platform, publish_status) VALUES ($1, $2, $3, $4, $5)',
        [video_id, title, 'generated', 'All', 'pending']
      );
    }
    
    // Notify clients
    notifyClients('title_generated', {
      video_id,
      title,
      status: 'generated'
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Title updated successfully' 
    });
    
  } catch (error) {
    console.error('Error processing title callback:', error);
    res.status(500).json({ error: 'processing_error', detail: error.message });
  }
});

// 4.10 POST /api/webhooks/n8n/description-callback
router.post('/description-callback', validateN8nToken, async (req, res) => {
  const parse = descriptionCallbackSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'invalid_payload', details: parse.error.flatten() });
  }
  
  const { video_id, description } = parse.data;
  
  try {
    // Validate video exists
    const { rows: videoRows } = await req.db.query(
      'SELECT id FROM generatedVideos WHERE id=$1',
      [video_id]
    );
    
    if (!videoRows[0]) {
      return res.status(404).json({ error: 'video_not_found' });
    }
    
    // Create or update published video record
    const { rows: existingRows } = await req.db.query(
      'SELECT id FROM publishedVideo WHERE generatedVideos_id=$1',
      [video_id]
    );
    
    if (existingRows[0]) {
      await req.db.query(
        'UPDATE publishedVideo SET description=$1, description_status=$2 WHERE generatedVideos_id=$3',
        [description, 'generated', video_id]
      );
    } else {
      await req.db.query(
        'INSERT INTO publishedVideo (generatedVideos_id, description, description_status, platform, publish_status) VALUES ($1, $2, $3, $4, $5)',
        [video_id, description, 'generated', 'All', 'pending']
      );
    }
    
    // Notify clients
    notifyClients('description_generated', {
      video_id,
      description,
      status: 'generated'
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Description updated successfully' 
    });
    
  } catch (error) {
    console.error('Error processing description callback:', error);
    res.status(500).json({ error: 'processing_error', detail: error.message });
  }
});

// 4.11.5 POST /api/webhooks/n8n/tags-callback
router.post('/tags-callback', validateN8nToken, async (req, res) => {
  const parse = tagsCallbackSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'invalid_payload', details: parse.error.flatten() });
  }
  
  const { video_id, tags } = parse.data;
  
  try {
    // Validate video exists
    const { rows: videoRows } = await req.db.query(
      'SELECT id FROM generatedVideos WHERE id=$1',
      [video_id]
    );
    
    if (!videoRows[0]) {
      return res.status(404).json({ error: 'video_not_found' });
    }
    
    // Create or update published video record
    const { rows: existingRows } = await req.db.query(
      'SELECT id, tags_generated_count FROM publishedVideo WHERE generatedVideos_id=$1',
      [video_id]
    );
    
    if (existingRows[0]) {
      const currentCount = existingRows[0].tags_generated_count || 0;
      await req.db.query(
        'UPDATE publishedVideo SET tags=$1, tags_status=$2, tags_generated_count=$3 WHERE generatedVideos_id=$4',
        [tags, 'generated', currentCount + 1, video_id]
      );
    } else {
      await req.db.query(
        'INSERT INTO publishedVideo (generatedVideos_id, tags, tags_status, tags_generated_count, platform) VALUES ($1, $2, $3, $4, $5)',
        [video_id, tags, 'generated', 1, 'All']
      );
    }
    
    // Notify clients
    notifyClients('tags_generated', {
      video_id,
      tags,
      status: 'generated'
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Tags updated successfully' 
    });
    
  } catch (error) {
    console.error('Error processing tags callback:', error);
    res.status(500).json({ error: 'processing_error', detail: error.message });
  }
});

// 4.12 POST /api/webhooks/n8n/upload-callback
router.post('/upload-callback', validateN8nToken, async (req, res) => {
  const parse = uploadCallbackSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'invalid_payload', details: parse.error.flatten() });
  }
  
  const { video_id, platform, platform_video_id, url, status, error_message } = parse.data;
  
  try {
    // Validate video exists
    const { rows: videoRows } = await req.db.query(
      'SELECT id FROM generatedVideos WHERE id=$1',
      [video_id]
    );
    
    if (!videoRows[0]) {
      return res.status(404).json({ error: 'video_not_found' });
    }
    
    // Update published video record
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;
    
    if (platform_video_id) {
      updateFields.push(`platform_video_id=$${paramCount++}`);
      updateValues.push(platform_video_id);
    }
    
    if (url) {
      updateFields.push(`url=$${paramCount++}`);
      updateValues.push(url);
    }
    
    updateFields.push(`status=$${paramCount++}`);
    updateValues.push(status);
    
    if (status === 'published') {
      updateFields.push(`uploaded_at=now()`);
      updateFields.push(`publish_status=$${paramCount++}`);
      updateValues.push('uploaded');
    } else if (status === 'uploading') {
      updateFields.push(`publish_status=$${paramCount++}`);
      updateValues.push('Uploading');
    }
    
    updateValues.push(video_id, platform);
    
    await req.db.query(
      `UPDATE publishedVideo SET ${updateFields.join(', ')} WHERE generatedVideos_id=$${paramCount} AND platform=$${paramCount + 1}`,
      updateValues
    );
    
    // Notify clients
    notifyClients('upload_update', {
      video_id,
      platform,
      status,
      platform_video_id,
      url,
      error_message
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Upload status updated successfully' 
    });
    
  } catch (error) {
    console.error('Error processing upload callback:', error);
    res.status(500).json({ error: 'processing_error', detail: error.message });
  }
});

export default router;
