import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  try {
    // Get real-time analytics data from the database
    const today = new Date().toISOString().slice(0, 10);
    
    // Get total products count
    const { rows: productRows } = await req.db.query('SELECT COUNT(*) as count FROM products');
    const totalProducts = parseInt(productRows[0].count);
    
    // Get scripts generated count (videos with script_generated or higher status)
    const { rows: scriptRows } = await req.db.query(`
      SELECT COUNT(*) as count FROM generatedVideos 
      WHERE video_status IN ('script_generated', 'generating_video', 'video_generated', 'video_generated_pending')
    `);
    const scriptsGenerated = parseInt(scriptRows[0].count);
    
    // Get videos generated count (videos with video_generated or higher status)
    const { rows: videoRows } = await req.db.query(`
      SELECT COUNT(*) as count FROM generatedVideos 
      WHERE video_status IN ('video_generated', 'video_generated_pending')
    `);
    const videosGenerated = parseInt(videoRows[0].count);
    
    // Get videos published count
    const { rows: publishedRows } = await req.db.query(`
      SELECT COUNT(*) as count FROM publishedVideo 
      WHERE status IN ('uploading', 'published')
    `);
    const videosPublished = parseInt(publishedRows[0].count);
    
    // Get pending approvals count
    const { rows: pendingRows } = await req.db.query(`
      SELECT COUNT(*) as count FROM publishedVideo 
      WHERE status = 'pending'
    `);
    const pendingApprovals = parseInt(pendingRows[0].count);
    
    // Create today's analytics record
    const analyticsData = {
      date: today,
      total_products: totalProducts,
      scripts_generated: scriptsGenerated,
      videos_generated: videosGenerated,
      videos_published: videosPublished,
      pending_approvals: pendingApprovals
    };
    
    // Upsert today's data
    await req.db.query(
      `INSERT INTO analytics (date, total_products, scripts_generated, videos_generated, videos_published, pending_approvals)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (date)
       DO UPDATE SET 
         total_products = EXCLUDED.total_products,
         scripts_generated = EXCLUDED.scripts_generated,
         videos_generated = EXCLUDED.videos_generated,
         videos_published = EXCLUDED.videos_published,
         pending_approvals = EXCLUDED.pending_approvals`,
      [today, totalProducts, scriptsGenerated, videosGenerated, videosPublished, pendingApprovals]
    );
    
    // Get last 30 days of analytics data
    const { rows } = await req.db.query('SELECT * FROM analytics ORDER BY date DESC LIMIT 30');
    res.json(rows);
  } catch (e) {
    console.error('Analytics error:', e);
    res.status(500).json({ error: 'db_error', detail: e.message });
  }
});

// Optional upsert for today's metrics
router.post('/upsert', async (req, res) => {
  try {
    const { date, total_products, scripts_generated, videos_generated, videos_published, pending_approvals } = req.body || {};
    const d = date || new Date().toISOString().slice(0, 10);
    const { rows } = await req.db.query(
      `INSERT INTO analytics (date, total_products, scripts_generated, videos_generated, videos_published, pending_approvals)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (date)
       DO UPDATE SET total_products=EXCLUDED.total_products, scripts_generated=EXCLUDED.scripts_generated,
                     videos_generated=EXCLUDED.videos_generated, videos_published=EXCLUDED.videos_published,
                     pending_approvals=EXCLUDED.pending_approvals
       RETURNING *`,
      [d, total_products ?? 0, scripts_generated ?? 0, videos_generated ?? 0, videos_published ?? 0, pending_approvals ?? 0]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'db_error', detail: e.message });
  }
});

export default router;


