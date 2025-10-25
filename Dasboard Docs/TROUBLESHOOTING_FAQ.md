# Troubleshooting & FAQ - Kissan Ghar Dashboard

Complete troubleshooting guide and frequently asked questions.

---

## 🔧 Common Issues & Solutions

### 1. Database Connection Issues

#### Issue: "ECONNREFUSED ::1:5000" or "Could not connect to database"

**Causes:**
- PostgreSQL is not running
- Wrong port configuration
- Database doesn't exist
- Incorrect credentials

**Solutions:**

**Check if PostgreSQL is running:**
```bash
# Windows
services.msc
# Look for "postgresql" service - should be "Running"

# Mac
brew services list | grep postgresql
# Should show "started"

# Linux
sudo systemctl status postgresql
```

**Check PostgreSQL port:**
```bash
psql -U postgres -c "SHOW port;"
```

**Fix db.js configuration:**
```javascript
// server/db.js
export const pool = new Pool({
  host: 'localhost',
  port: 5000,  // ← Change this to your actual port
  user: 'postgres',
  password: '3234',
  database: 'Kissan_ghar_automation'
});
```

**Create database if missing:**
```bash
psql -U postgres
CREATE DATABASE Kissan_ghar_automation;
\q

# Then run schema
psql -U postgres -d Kissan_ghar_automation -f schema.sql
```

---

### 2. Missing Dependencies

#### Issue: "Cannot find module 'multer'" or "Cannot find module 'uuid'"

**Cause:** Package not installed

**Solution:**
```bash
cd server
npm install multer uuid
```

#### Issue: "Cannot find module '@types/react'"

**Solution:**
```bash
cd client
npm install
```

---

### 3. Port Already in Use

#### Issue: "Port 4000 is already in use"

**Solutions:**

**Windows:**
```bash
# Find process using port 4000
netstat -ano | findstr :4000

# Kill the process (replace <PID> with actual process ID)
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
# Find and kill process on port 4000
lsof -ti:4000 | xargs kill -9
```

**Or change the port:**
```bash
# In server/.env
PORT=4001
```

---

### 4. CORS Errors

#### Issue: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Cause:** Frontend running on different origin

**Current Setup:** CORS is enabled for all origins in `server/index.js`

**If still facing issues:**
```javascript
// server/index.js
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:5173',  // Specific frontend URL
  credentials: true
}));
```

---

### 5. Image Upload Failures

#### Issue: "Upload failed" or 413 Request Entity Too Large

**Solutions:**

**Check file size:**
- Maximum: 5MB per image
- Maximum: 4 images at once

**Ensure uploads directory exists:**
```bash
cd server
mkdir uploads
```

**Check permissions:**
```bash
# Mac/Linux
chmod 755 uploads/
```

**Increase body size limit (if needed):**
```javascript
// server/index.js
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

---

### 6. SSE Not Working

#### Issue: SSE events not received in frontend

**Debug Steps:**

**1. Check SSE connection in browser:**
```
DevTools → Network tab → Filter: EventStream
Look for /api/stream connection
Status should be "200" and "pending"
```

**2. Test SSE endpoint:**
```bash
curl http://localhost:4000/api/stream
# Should keep connection open and send data
```

**3. Check CORS headers:**
```javascript
// server/routes/sse.js - should have:
res.writeHead(200, {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Access-Control-Allow-Origin': '*'
});
```

**4. Verify notifyClients is called:**
```javascript
// Add console.log in server/routes/sse.js
export function notifyClients(eventType, data) {
  console.log(`📡 SSE: Sending ${eventType}`, data);
  // ... rest of code
}
```

---

### 7. N8N Webhooks Not Working

#### Issue: Videos stuck in "pending" status

**Debug Steps:**

**1. Check environment variables:**
```bash
cd server
cat .env
# Verify all N8N_*_WEBHOOK_URL variables are set
```

**2. Test webhook URLs manually:**
```bash
curl -X POST https://your-n8n.com/webhook/script-generate \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**3. Check N8N_CALLBACK_TOKEN:**
```bash
# In server/.env
N8N_CALLBACK_TOKEN=your_token

# Should match what N8N sends in Authorization header
```

**4. Check N8N workflow is active:**
- Log into N8N
- Verify workflow is "Active" (not paused)
- Check execution history for errors

**5. Test callback authentication:**
```bash
curl -X POST http://localhost:4000/api/webhooks/n8n/script-callback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{"video_id": 1, "script": "test"}'
  
# Should return: {"success": true, ...}
# If 401: Token mismatch
```

---

### 8. Videos Not Downloading from VPS

#### Issue: preview_url points to VPS but video not downloaded

**Debug Steps:**

**1. Check VPS URL accessibility:**
```bash
curl -I https://vps.example.com/video.mp4
# Should return 200 OK
```

**2. Ensure generated_videos directory exists:**
```bash
cd "E:\Clients Work\kissan Ghar\Kissan Ghar Dashboard"
mkdir generated_videos
```

**3. Check download logic in n8n-webhooks.js:**
```javascript
// server/routes/n8n-webhooks.js
// Look for this condition:
if (preview_url.includes('YOUR_VPS_IP') || preview_url.includes('srv1045783'))
```

**4. Add more VPS domains if needed:**
```javascript
if (preview_url.includes('your-vps.com') || 
    preview_url.includes('vps.example.com')) {
  // Download logic
}
```

---

### 9. Frontend Shows Blank Page

#### Issue: React app doesn't load

**Debug Steps:**

**1. Check browser console (F12):**
- Look for error messages
- Check Network tab for failed requests

**2. Verify backend is running:**
```bash
curl http://localhost:4000/health
# Should return: {"ok": true}
```

**3. Check Vite dev server:**
```bash
cd client
npm run dev
# Should show: Local: http://localhost:5173
```

**4. Clear cache and rebuild:**
```bash
# Delete node_modules and reinstall
cd client
rm -rf node_modules
npm install
npm run dev
```

**5. Check for build errors:**
```bash
cd client
npm run build
# Look for TypeScript or build errors
```

---

### 10. Database Migration Errors

#### Issue: "Relation already exists" or migration fails

**Solutions:**

**1. Check which migrations have run:**
```bash
psql -U postgres -d Kissan_ghar_automation
\dt
# Look for existing tables
```

**2. Reset database (CAUTION: Deletes all data):**
```bash
psql -U postgres
DROP DATABASE Kissan_ghar_automation;
CREATE DATABASE Kissan_ghar_automation;
\q

psql -U postgres -d Kissan_ghar_automation -f schema.sql
```

**3. Run specific migration:**
```bash
cd server
node scripts/run-migration.js migrations/004_add_tags_columns.sql
```

**4. Handle duplicate column errors:**
```sql
-- Use IF NOT EXISTS in migrations
ALTER TABLE publishedVideo 
ADD COLUMN IF NOT EXISTS tags TEXT;
```

---

## ❓ Frequently Asked Questions

### General Questions

**Q: What is the purpose of this project?**

A: Automate video creation for agricultural product marketing. The system generates scripts, creates videos, and publishes them to social media platforms using AI.

---

**Q: Do I need N8N to run the project?**

A: For basic setup (products, database), no. But for actual video generation and AI features, yes. You can test the frontend/backend without N8N, but videos will stay in "pending" status.

---

**Q: Can I use this project without PostgreSQL?**

A: No, PostgreSQL is required. The project uses PostgreSQL-specific features like ENUM types and specific SQL syntax.

---

### Database Questions

**Q: How do I change the database password?**

A: Edit `server/db.js`:
```javascript
password: 'your_new_password'
```

---

**Q: Can I use a remote PostgreSQL database?**

A: Yes, change the host in `server/db.js`:
```javascript
host: 'your-database.com',
port: 5432,
user: 'your_user',
password: 'your_password'
```

---

**Q: How do I backup the database?**

```bash
pg_dump -U postgres Kissan_ghar_automation > backup.sql
```

**Q: How do I restore from backup?**

```bash
psql -U postgres -d Kissan_ghar_automation < backup.sql
```

---

### Video Workflow Questions

**Q: What's the complete video generation workflow?**

1. User creates video with prompt
2. N8N generates script using AI
3. User approves/edits script
4. N8N generates video
5. User approves video
6. N8N generates title
7. User approves title → Tags auto-generated
8. User approves tags → Description auto-generated
9. User approves description and selects platform
10. N8N uploads to platform
11. Video appears in "Uploaded History"

---

**Q: Can I skip the approval steps?**

A: Currently no. Each step requires manual approval. You could modify the code to auto-approve, but that's not recommended for quality control.

---

**Q: Why do I see duplicate videos in Generated Videos page?**

A: This is intentional. When you upload a video, the system:
1. Updates the current record to "uploading"
2. Creates a new "pending" record

This allows reusing the same video for multiple platform uploads without showing duplicates.

---

**Q: How long does video generation take?**

A: Depends on your N8N workflow and AI service:
- Script generation: 10-30 seconds
- Video generation: 2-10 minutes
- Title/Tags/Description: 5-15 seconds each
- Platform upload: 1-5 minutes

Total: ~15-30 minutes per video

---

### Configuration Questions

**Q: Where do I configure N8N webhook URLs?**

A: In `server/.env`:
```env
N8N_SCRIPT_WEBHOOK_URL=...
N8N_VIDEO_WEBHOOK_URL=...
N8N_TITLE_WEBHOOK_URL=...
N8N_DESCRIPTION_WEBHOOK_URL=...
N8N_TAGS_WEBHOOK_URL=...
N8N_UPLOAD_WEBHOOK_URL=...
```

---

**Q: How do I change the callback token?**

A: Edit `server/.env`:
```env
N8N_CALLBACK_TOKEN=your_new_secure_token_here
```

Make sure to update N8N workflows to use the same token.

---

**Q: Can I add more languages?**

A: Yes, but requires database change:

```sql
ALTER TYPE languageType ADD VALUE 'NewLanguage';
```

Then update the LANGUAGES array in:
- `server/routes/videos.js`
- `client/src/pages/CreateVideo.tsx`

---

**Q: How do I change the server port?**

Create/edit `server/.env`:
```env
PORT=4001
```

---

### N8N Integration Questions

**Q: What should my N8N workflow look like?**

**Example Script Generation Workflow:**
```
1. Webhook Trigger (POST)
2. Receive: video_id, prompt, product_snapshots
3. HTTP Request to OpenAI API
4. Transform response to script
5. HTTP Request to callback URL:
   POST {NODE_BASE_URL}/api/webhooks/n8n/script-callback
   Headers: Authorization: Bearer {token}
   Body: { video_id, script }
```

Similar structure for other workflows.

---

**Q: What AI services can I use?**

- **Script/Title/Description/Tags:** OpenAI GPT-4, Claude, Gemini
- **Video Generation:** Synthesia, D-ID, HeyGen, Runway ML
- **Platform Upload:** YouTube API, Facebook Graph API, etc.

---

**Q: How do I test N8N workflows locally?**

1. Use ngrok to expose localhost:
```bash
ngrok http 4000
```

2. Update NODE_BASE_URL in server/.env:
```env
NODE_BASE_URL=https://abc123.ngrok.io
```

3. Test webhook callbacks

---

### Product Management Questions

**Q: How do I bulk import products?**

A: Add products to `server/data/products.json` then:
```bash
cd server
npm run import-data
```

---

**Q: What image formats are supported?**

A: All common image formats: JPG, JPEG, PNG, GIF, WEBP

Maximum size: 5MB per image

---

**Q: Where are uploaded images stored?**

A: `server/uploads/` directory

Images are served at: `http://localhost:4000/uploads/filename.jpg`

---

### Analytics Questions

**Q: How often are analytics updated?**

A: Every time you access the `/api/analytics` endpoint. It calculates and upserts today's data automatically.

---

**Q: Can I see analytics for a specific date range?**

A: Currently shows last 30 days. To customize, modify `server/routes/analytics.js`.

---

**Q: What metrics are tracked?**

- Total products
- Scripts generated
- Videos generated
- Videos published
- Pending approvals

---

### Performance Questions

**Q: How many concurrent video generations can the system handle?**

A: Depends on your N8N setup and AI service limits. The dashboard itself can handle multiple concurrent requests, but generation is sequential (one at a time per video).

---

**Q: How much disk space do I need?**

- Database: ~100MB for 1000 videos
- Generated videos: ~50-200MB per video
- Product images: ~500KB per product

Plan accordingly based on volume.

---

**Q: Can I use this on Windows, Mac, and Linux?**

A: Yes, the project is cross-platform. Just ensure PostgreSQL and Node.js are installed.

---

### Security Questions

**Q: Is user authentication implemented?**

A: No, there's currently no authentication. Anyone with access to the URL can use the dashboard.

To add auth, consider:
- JWT tokens
- Auth0
- Firebase Authentication
- Custom login system

---

**Q: How secure are the N8N callbacks?**

A: They use Bearer token authentication. Make sure:
1. Use a strong random token
2. Use HTTPS in production
3. Keep token secret (don't commit to git)

---

**Q: Should I use this in production as-is?**

A: No, add these first:
- User authentication
- HTTPS/SSL
- Environment-based configuration
- Input sanitization
- Rate limiting
- Logging and monitoring

---

## 🚨 Emergency Procedures

### Complete Reset (Nuclear Option)

**WARNING:** This deletes ALL data!

```bash
# 1. Drop database
psql -U postgres
DROP DATABASE Kissan_ghar_automation;
CREATE DATABASE Kissan_ghar_automation;
\q

# 2. Recreate schema
psql -U postgres -d Kissan_ghar_automation -f schema.sql

# 3. Clear uploaded files
rm -rf server/uploads/*
rm -rf generated_videos/*

# 4. Import seed data
cd server
npm run import-data
npm run verify-data
```

---

### Restart Everything

```bash
# 1. Kill all Node processes
# Windows
taskkill /F /IM node.exe

# Mac/Linux
pkill -9 node

# 2. Restart PostgreSQL
# Windows (in services.msc)
# Mac
brew services restart postgresql

# Linux
sudo systemctl restart postgresql

# 3. Clear node_modules and reinstall
cd server
rm -rf node_modules
npm install

cd ../client
rm -rf node_modules
npm install

# 4. Start fresh
cd ..
npm run dev
```

---

## 📞 Getting Help

### Before Asking for Help

1. ✅ Check this troubleshooting guide
2. ✅ Check browser console for errors (F12)
3. ✅ Check server terminal for errors
4. ✅ Check PostgreSQL is running
5. ✅ Verify `.env` configuration
6. ✅ Try the emergency reset

### When Reporting Issues

Include:
- Operating system
- Node.js version (`node --version`)
- PostgreSQL version
- Complete error message
- Steps to reproduce
- Screenshots if applicable

---

## 🔍 Debug Mode

### Enable Detailed Logging

Add console.logs in key places:

**1. API Requests:**
```javascript
// server/routes/videos.js
router.post('/', async (req, res) => {
  console.log('📝 Create video request:', req.body);
  // ... rest of code
});
```

**2. N8N Webhooks:**
```javascript
// server/routes/n8n-webhooks.js
router.post('/script-callback', async (req, res) => {
  console.log('📨 N8N script callback:', req.body);
  // ... rest of code
});
```

**3. SSE Events:**
```javascript
// server/routes/sse.js
export function notifyClients(eventType, data) {
  console.log(`📡 SSE Broadcasting: ${eventType}`, data);
  // ... rest of code
}
```

---

**Document Version:** 1.0  
**Last Updated:** October 25, 2025  
**Total Q&A:** 50+

