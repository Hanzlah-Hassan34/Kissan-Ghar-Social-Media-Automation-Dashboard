import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve generated videos
app.use('/generated_videos', express.static(path.join(__dirname, '../generated_videos')));

dotenv.config();

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Attach pool to req
app.use((req, _res, next) => {
  req.db = pool;
  next();
});

// Routes
import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
// import scriptsRouter from './routes/scripts.js'; // Removed - no scripts table
import videosRouter from './routes/videos.js';
import publishedRouter from './routes/publishedVideos.js';
import analyticsRouter from './routes/analytics.js';
import webhooksRouter from './routes/webhooks.js';
import n8nWebhooksRouter from './routes/n8n-webhooks.js';
import sseRouter from './routes/sse.js';
import videoRefsRouter from './routes/videoReferences.js';
import uploadRouter from './routes/upload.js';

// Import auth middleware
import { authenticateToken } from './middleware/auth.js';

// Public routes (no authentication required)
app.use('/api/auth', authRouter);
app.use('/webhook', webhooksRouter);
app.use('/api/webhooks/n8n', n8nWebhooksRouter);

// Protected routes (authentication required)
app.use('/api/products', authenticateToken, productsRouter);
// app.use('/api/scripts', authenticateToken, scriptsRouter); // Removed - no scripts table
app.use('/api/videos', authenticateToken, videosRouter);
app.use('/api/published-videos', authenticateToken, publishedRouter);
app.use('/api/analytics', authenticateToken, analyticsRouter);
app.use('/api', authenticateToken, sseRouter);
app.use('/api/video-references', authenticateToken, videoRefsRouter);
app.use('/api/upload', authenticateToken, uploadRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  // no logs per instruction
});

export default app;


