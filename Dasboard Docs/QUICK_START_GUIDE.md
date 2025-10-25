# Quick Start Guide - Kissan Ghar Dashboard

## 🚀 Get Up and Running in 15 Minutes

This guide will help you quickly set up and run the Kissan Ghar Video Automation Dashboard.

---

## Prerequisites Check

Before starting, ensure you have:

- ✅ Node.js 18+ installed (`node --version`)
- ✅ PostgreSQL 14+ installed and running (`psql --version`)
- ✅ Git installed (if cloning)
- ✅ N8N instance accessible (optional for testing without AI features)

---

## Step-by-Step Setup

### 1️⃣ Navigate to Project Directory

```bash
cd "E:\Clients Work\kissan Ghar\Kissan Ghar Dashboard"
```

### 2️⃣ Install All Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install missing packages
npm install multer uuid

# Install client dependencies
cd ../client
npm install

# Return to root
cd ..
```

### 3️⃣ Setup PostgreSQL Database

```bash
# Open PostgreSQL CLI
psql -U postgres

# Create database
CREATE DATABASE Kissan_ghar_automation;

# Exit PostgreSQL CLI
\q

# Import schema
psql -U postgres -d Kissan_ghar_automation -f schema.sql
```

**Note:** The default database password is `3234` as configured in `server/db.js`.

### 4️⃣ Configure Database Connection

Open `server/db.js` and verify these settings match your PostgreSQL setup:

```javascript
export const pool = new Pool({
  host: 'localhost',
  port: 5000,        // ← Make sure this matches your PostgreSQL port
  user: 'postgres',
  password: '3234',
  database: 'Kissan_ghar_automation'
});
```

### 5️⃣ Run Database Migrations

```bash
cd server
npm run migrate
```

### 6️⃣ Import Seed Data (Optional but Recommended)

```bash
npm run import-data
npm run verify-data
```

This imports sample companies, categories, subcategories, and products.

### 7️⃣ Setup Environment Variables

Create a `.env` file in the `server/` directory:

```bash
cd server
# On Windows
type nul > .env

# On Mac/Linux
touch .env
```

Add the following content to `.env`:

```env
PORT=4000
NODE_BASE_URL=http://localhost:4000

# N8N Webhooks (Update these with your N8N URLs)
N8N_SCRIPT_WEBHOOK_URL=https://your-n8n.com/webhook/script-generate
N8N_VIDEO_WEBHOOK_URL=https://your-n8n.com/webhook/video-generate
N8N_TITLE_WEBHOOK_URL=https://your-n8n.com/webhook/title-generate
N8N_DESCRIPTION_WEBHOOK_URL=https://your-n8n.com/webhook/description-generate
N8N_TAGS_WEBHOOK_URL=https://your-n8n.com/webhook/tags-generate
N8N_UPLOAD_WEBHOOK_URL=https://your-n8n.com/webhook/upload-video

# Security Token (Generate a random string)
N8N_CALLBACK_TOKEN=your_secure_random_token_12345
```

**Quick Token Generation:**
```bash
# Generate random token (Mac/Linux)
openssl rand -hex 32

# Or use online generator
# https://www.random.org/strings/
```

### 8️⃣ Start the Application

From the **root directory**:

```bash
# Start both frontend and backend together
npm run dev
```

Or run them separately:

```bash
# Terminal 1: Start backend
npm run server

# Terminal 2: Start frontend
npm run client
```

### 9️⃣ Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000
- **API Health Check:** http://localhost:4000/health

---

## 🧪 Testing the Setup

### Test 1: Add a Product

1. Go to http://localhost:5173/add-product
2. Fill in product details
3. Click "Save Product"
4. You should see success message

### Test 2: View Analytics

1. Go to http://localhost:5173/analytics
2. You should see dashboard with metrics

### Test 3: Create a Test Video (Without N8N)

1. Go to http://localhost:5173/create-video
2. Fill in the form:
   - Prompt: "Test video"
   - Duration: 30
   - Language: English
3. Click "Generate Video"
4. Go to "In Progress" page
5. Video should appear with status "pending"

**Note:** Without N8N configured, the video will stay in "pending" status. That's expected!

---

## 🔧 Quick Fixes for Common Issues

### Issue: "ECONNREFUSED ::1:5000"

**Problem:** PostgreSQL is not running or wrong port.

**Fix:**
```bash
# Check if PostgreSQL is running
# Windows
services.msc  # Look for PostgreSQL service

# Mac
brew services list

# Linux
sudo systemctl status postgresql

# Check your PostgreSQL port in pgAdmin or:
psql -U postgres -c "SHOW port;"
```

Update `server/db.js` with the correct port.

---

### Issue: "Database does not exist"

**Problem:** Database not created.

**Fix:**
```bash
psql -U postgres -c "CREATE DATABASE Kissan_ghar_automation;"
psql -U postgres -d Kissan_ghar_automation -f schema.sql
```

---

### Issue: "Cannot find module 'multer'"

**Problem:** Missing packages.

**Fix:**
```bash
cd server
npm install multer uuid
```

---

### Issue: "Port 4000 already in use"

**Problem:** Another process is using port 4000.

**Fix:**
```bash
# Windows - Kill process on port 4000
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:4000 | xargs kill -9

# Or change port in server/.env
PORT=4001
```

---

### Issue: Frontend shows blank page

**Problem:** Vite build error or wrong URL.

**Fix:**
1. Check browser console for errors
2. Ensure backend is running (http://localhost:4000/health should return `{"ok":true}`)
3. Clear browser cache
4. Restart Vite dev server

---

## 📋 Verification Checklist

After setup, verify everything works:

- [ ] Backend health check returns `{"ok": true}`
- [ ] Frontend loads at http://localhost:5173
- [ ] Can navigate to all pages (Analytics, Add Product, etc.)
- [ ] Can add a product with image upload
- [ ] Can create a video request (will be pending without N8N)
- [ ] Can view products list
- [ ] Analytics page shows data
- [ ] No errors in browser console
- [ ] No errors in server terminal

---

## 🎯 Next Steps

### 1. Configure N8N Workflows

To enable AI features, you need to set up N8N workflows:

1. **Script Generation Workflow**
   - Trigger: Webhook POST
   - Action: Call OpenAI/Claude API
   - Callback: POST to `NODE_BASE_URL/api/webhooks/n8n/script-callback`

2. **Video Generation Workflow**
   - Trigger: Webhook POST
   - Action: Call Video AI API (e.g., Synthesia, D-ID)
   - Callback: POST to `NODE_BASE_URL/api/webhooks/n8n/video-callback`

3. **Title/Description/Tags Generation Workflows**
   - Similar structure to script generation
   - Use appropriate callbacks

4. **Upload Workflow**
   - Trigger: Webhook POST
   - Actions: Upload to YouTube/Facebook/TikTok/Instagram
   - Callback: POST to `NODE_BASE_URL/api/webhooks/n8n/upload-callback`

### 2. Test End-to-End Workflow

With N8N configured:

1. Create a video with prompt
2. Wait for script generation (check "In Progress")
3. Approve script
4. Wait for video generation
5. Approve video
6. Approve title, tags, description
7. Select platform and upload
8. Check "Uploaded History" for result

### 3. Customize and Extend

- Add more product categories in database
- Customize UI colors in `client/src/styles.css`
- Add more languages to the enum
- Implement additional analytics metrics
- Add user authentication (currently no auth)

---

## 📚 Useful Commands

### Database Operations

```bash
# Connect to database
psql -U postgres -d Kissan_ghar_automation

# View all tables
\dt

# View table structure
\d products

# Count records
SELECT COUNT(*) FROM products;

# Exit psql
\q
```

### Development Commands

```bash
# Root directory
npm run dev          # Run both servers
npm run server       # Run backend only
npm run client       # Run frontend only

# Server directory
npm run start        # Production mode
npm run dev          # Development mode (nodemon)
npm run migrate      # Run migrations
npm run import-data  # Import seed data
npm run clear-data   # Clear all data
npm run reset-db     # Clear + Import + Verify
npm run verify-data  # Verify imported data

# Client directory
npm run dev          # Development mode
npm run build        # Production build
npm run preview      # Preview production build
```

### Troubleshooting Commands

```bash
# Check Node version
node --version

# Check npm version
npm --version

# Check PostgreSQL version
psql --version

# Test PostgreSQL connection
psql -U postgres -c "SELECT version();"

# View PostgreSQL port
psql -U postgres -c "SHOW port;"

# Check running processes
# Windows
netstat -ano | findstr :4000
netstat -ano | findstr :5173

# Mac/Linux
lsof -i :4000
lsof -i :5173
```

---

## 🆘 Getting Help

If you're stuck:

1. **Check Logs:** Look at terminal output for error messages
2. **Browser Console:** Check for JavaScript errors (F12)
3. **Database Logs:** Check PostgreSQL logs
4. **Verify Config:** Double-check `server/db.js` and `.env` files
5. **Review Documentation:** See `PROJECT_DOCUMENTATION.md` for details

---

## 📞 Support Resources

- **Main Documentation:** `PROJECT_DOCUMENTATION.md`
- **Architecture:** `ARCHITECTURE_DIAGRAM.md`
- **API Testing:** `API_TESTING_GUIDE.md` (if available)

---

## ✅ Success Indicators

You've successfully set up the project when:

✅ Both servers start without errors  
✅ Frontend loads and is responsive  
✅ Can add products with images  
✅ Can create video requests  
✅ Analytics page shows data  
✅ Database has sample data  
✅ SSE connection established (check Network tab)  
✅ No CORS errors in console  

---

**Happy Coding! 🚀**

---

**Document Version:** 1.0  
**Last Updated:** October 25, 2025  
**Estimated Setup Time:** 15-20 minutes

