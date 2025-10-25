# Kissan Ghar Video Automation Dashboard - Developer Handoff

## 👋 Welcome Developer!

This document serves as your entry point to understanding and working with the **Kissan Ghar Video Automation Dashboard** project. All the information you need to get started, understand the architecture, and troubleshoot issues is organized in the documents below.

---

## 📚 Documentation Index

### 🎯 Start Here First

#### 1. **PROJECT_DOCUMENTATION.md** ⭐ (MUST READ)
**The complete project bible** - Read this first!

Contains:
- Complete project overview
- Technology stack details
- System architecture
- Complete database schema with all tables and relationships
- All API endpoints with request/response examples
- Frontend structure and components
- Complete video generation workflow
- N8N integration details
- Real-time updates (SSE) implementation
- Setup and installation instructions
- Environment configuration
- Key features overview
- Important notes and warnings

**Time to read:** 30-40 minutes  
**Importance:** ⭐⭐⭐⭐⭐ CRITICAL

---

#### 2. **QUICK_START_GUIDE.md** 🚀
**Get the project running in 15 minutes**

Contains:
- Step-by-step setup instructions
- Prerequisite checks
- Database setup
- Environment configuration
- Testing procedures
- Quick fixes for common issues
- Verification checklist

**Time to read:** 10 minutes  
**Time to setup:** 15-20 minutes  
**Importance:** ⭐⭐⭐⭐⭐ CRITICAL

---

### 🏗️ Understanding the System

#### 3. **ARCHITECTURE_DIAGRAM.md**
**Visual system architecture and data flows**

Contains:
- System architecture diagrams
- Data flow diagrams (video creation, script to video, publishing)
- Database relationship diagrams
- Component architecture tree
- API request/response patterns
- Security flow
- Deployment architecture
- Performance optimization recommendations

**Time to read:** 15 minutes  
**Importance:** ⭐⭐⭐⭐ HIGH

---

### 🧪 Testing and Development

#### 4. **API_TESTING_GUIDE.md**
**Complete API reference with test examples**

Contains:
- All API endpoints organized by category
- Request/response examples using curl
- N8N webhook callback examples
- SSE event stream examples
- Complete end-to-end test scenario
- Postman collection setup
- Testing checklist

**Time to read:** 20 minutes  
**Importance:** ⭐⭐⭐⭐ HIGH

---

### 🔧 Problem Solving

#### 5. **TROUBLESHOOTING_FAQ.md**
**Solutions to common issues and FAQs**

Contains:
- 10 most common issues with solutions
- Database connection problems
- N8N webhook issues
- SSE troubleshooting
- 50+ frequently asked questions
- Emergency procedures
- Debug mode setup

**Time to read:** Browse as needed  
**Importance:** ⭐⭐⭐⭐ HIGH

---

## 🎯 Quick Reference

### Project Summary

**Name:** Kissan Ghar Video Automation Dashboard

**Purpose:** Automate AI-powered video creation and social media publishing for agricultural products

**Tech Stack:**
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + PostgreSQL
- **Automation:** N8N (workflow automation)
- **Real-time:** Server-Sent Events (SSE)

**Key Features:**
1. Product management with image upload
2. AI-powered script generation (35 languages)
3. Automated video creation
4. AI-generated titles, descriptions, and tags
5. Multi-platform publishing (YouTube, Facebook, TikTok, Instagram)
6. Real-time status updates
7. Analytics dashboard

---

## 📋 Getting Started Checklist

### Day 1: Setup and Familiarization

- [ ] Read **PROJECT_DOCUMENTATION.md** (30 mins)
- [ ] Follow **QUICK_START_GUIDE.md** to setup (20 mins)
- [ ] Verify all systems working (10 mins)
- [ ] Browse through code structure (20 mins)
- [ ] Test creating a product (5 mins)
- [ ] Test creating a video request (5 mins)

**Total Time:** ~90 minutes

---

### Day 2: Understanding Architecture

- [ ] Read **ARCHITECTURE_DIAGRAM.md** (15 mins)
- [ ] Understand database schema (15 mins)
- [ ] Trace video generation workflow in code (30 mins)
- [ ] Review API routes (20 mins)
- [ ] Understand SSE implementation (15 mins)

**Total Time:** ~95 minutes

---

### Day 3: Testing and N8N

- [ ] Review **API_TESTING_GUIDE.md** (20 mins)
- [ ] Test all API endpoints with Postman/curl (30 mins)
- [ ] Set up N8N workflows (if needed) (60 mins)
- [ ] Test complete video workflow end-to-end (30 mins)

**Total Time:** ~140 minutes

---

### Ongoing: Reference

- [ ] Keep **TROUBLESHOOTING_FAQ.md** bookmarked
- [ ] Refer to **API_TESTING_GUIDE.md** when testing
- [ ] Check **PROJECT_DOCUMENTATION.md** for API details

---

## 🗂️ Project Structure Quick Reference

```
kissan-ghar-dashboard/
├── 📄 Dashboard Docs (YOU ARE HERE)
│   ├── PROJECT_DOCUMENTATION.md        ← Complete project guide
│   ├── QUICK_START_GUIDE.md           ← Setup instructions
│   ├── ARCHITECTURE_DIAGRAM.md        ← System architecture
│   ├── API_TESTING_GUIDE.md           ← API reference
│   ├── TROUBLESHOOTING_FAQ.md         ← Problem solutions
│   └── README_FOR_DEVELOPER.md        ← This file
│
├── 📁 client/                         ← React frontend
│   ├── src/
│   │   ├── pages/                     ← All page components
│   │   ├── components/                ← Reusable components
│   │   ├── hooks/                     ← Custom hooks (SSE)
│   │   └── lib/                       ← API utilities
│   └── package.json
│
├── 📁 server/                         ← Express backend
│   ├── routes/                        ← API route handlers
│   │   ├── products.js                ← Product CRUD
│   │   ├── videos.js                  ← Video workflow
│   │   ├── publishedVideos.js         ← Publishing
│   │   ├── n8n-webhooks.js            ← N8N callbacks
│   │   ├── sse.js                     ← Real-time updates
│   │   ├── analytics.js               ← Analytics data
│   │   └── upload.js                  ← Image upload
│   ├── data/                          ← Seed data (JSON)
│   ├── migrations/                    ← Database migrations
│   ├── scripts/                       ← Utility scripts
│   ├── uploads/                       ← Product images
│   ├── db.js                          ← Database connection
│   ├── index.js                       ← Server entry point
│   └── package.json
│
├── 📁 generated_videos/               ← Generated video files
├── 📄 schema.sql                      ← Database schema
└── 📄 package.json                    ← Root scripts
```

---

## 🎓 Learning Path

### Beginner Path (New to the project)

1. **Day 1:** Read docs + Setup ✅
2. **Day 2:** Understand architecture ✅
3. **Day 3:** Test and explore ✅
4. **Day 4-5:** Make small changes (add a field, modify UI)
5. **Week 2:** Implement new features

### Intermediate Path (Familiar with similar projects)

1. **Day 1:** Quick start + Setup ✅
2. **Day 1:** Browse architecture and test APIs ✅
3. **Day 2:** Deep dive into video workflow
4. **Day 2-3:** Set up N8N and test end-to-end
5. **Week 2:** Optimize and extend

### Expert Path (Want to contribute immediately)

1. **Hour 1:** Setup ✅
2. **Hour 2:** Skim all docs ✅
3. **Hour 3-4:** Test everything ✅
4. **Day 2:** Start development ✅

---

## 🚀 Key Workflows to Understand

### 1. Video Creation Workflow (CRITICAL)

```
User creates video 
  → Server creates DB record
  → Server calls N8N script webhook
  → N8N generates script via AI
  → N8N calls back to server
  → Server updates DB + notifies frontend via SSE
  → User sees script in "In Progress"
```

**Where to look:**
- Frontend: `client/src/pages/CreateVideo.tsx`
- Backend: `server/routes/videos.js` (POST /)
- N8N Callback: `server/routes/n8n-webhooks.js` (script-callback)

---

### 2. Script to Video Workflow

```
User approves script
  → Server updates status
  → Server calls N8N video webhook
  → N8N generates video
  → N8N uploads to VPS
  → N8N calls back with video URL
  → Server downloads video locally
  → Server notifies frontend via SSE
  → User sees video in "In Progress"
```

**Where to look:**
- Frontend: `client/src/pages/InProgress.tsx` (approveScript)
- Backend: `server/routes/videos.js` (approve-script, video-callback)

---

### 3. Publishing Workflow

```
User approves video
  → Auto-generates title
User approves title
  → Auto-generates tags
User approves tags
  → Auto-generates description
User approves description + selects platform
  → Server duplicates record
  → Server calls N8N upload webhook
  → N8N uploads to platform (YouTube/etc)
  → N8N calls back with video URL
  → Appears in "Uploaded History"
```

**Where to look:**
- Frontend: `client/src/pages/GeneratedVideos.tsx`
- Backend: `server/routes/videos.js` (approve-video, approve-title, etc.)
- Publishing: `server/routes/publishedVideos.js` (approve-and-upload)

---

## ⚠️ Critical Things to Know

### 1. Missing Dependencies ⚠️

The `server/package.json` is **missing** `multer` and `uuid`. You MUST install them:

```bash
cd server
npm install multer uuid
```

### 2. Hardcoded Database Credentials ⚠️

Database credentials are **hardcoded** in `server/db.js`. Update these to match your setup:

```javascript
{
  host: 'localhost',
  port: 5000,        // ← YOUR POSTGRESQL PORT
  user: 'postgres',
  password: '3234',  // ← YOUR POSTGRESQL PASSWORD
  database: 'Kissan_ghar_automation'
}
```

### 3. N8N Configuration Required ⚠️

Without N8N configured:
- Videos will stay in "pending" status
- No script/video/title/description/tags generation
- No platform uploads

You can test the UI without N8N, but full workflow requires it.

### 4. Duplication Strategy 🎯

When uploading a video, the system intentionally **duplicates** the `publishedVideo` record:
- Original → status = "uploading"
- New copy → status = "pending"

This allows the same video to be uploaded to multiple platforms.

**See:** `server/routes/publishedVideos.js` - `approve-and-upload` endpoint

### 5. Video Download from VPS 📥

When N8N sends a video URL from VPS, the server automatically:
1. Downloads the video to `generated_videos/`
2. Updates preview_url to point to localhost

**See:** `server/routes/n8n-webhooks.js` - `video-callback` endpoint

---

## 🔑 Environment Variables

Create `server/.env` with:

```env
PORT=4000
NODE_BASE_URL=http://localhost:4000

# N8N Webhook URLs
N8N_SCRIPT_WEBHOOK_URL=https://n8n.example.com/webhook/script-generate
N8N_VIDEO_WEBHOOK_URL=https://n8n.example.com/webhook/video-generate
N8N_TITLE_WEBHOOK_URL=https://n8n.example.com/webhook/title-generate
N8N_DESCRIPTION_WEBHOOK_URL=https://n8n.example.com/webhook/description-generate
N8N_TAGS_WEBHOOK_URL=https://n8n.example.com/webhook/tags-generate
N8N_UPLOAD_WEBHOOK_URL=https://n8n.example.com/webhook/upload-video

# Security Token (generate a random string)
N8N_CALLBACK_TOKEN=your_secure_random_token_here
```

---

## 🛠️ Development Commands

### Start Development

```bash
# Start both frontend and backend
npm run dev

# Or separately:
npm run server   # Backend only
npm run client   # Frontend only
```

### Database Operations

```bash
cd server

# Run migrations
npm run migrate

# Import seed data
npm run import-data

# Verify data
npm run verify-data

# Complete reset (clear + import + verify)
npm run reset-db
```

### Testing

```bash
# Test backend health
curl http://localhost:4000/health

# Open frontend
# Navigate to http://localhost:5173
```

---

## 📞 Getting Help

### When Stuck

1. **Check TROUBLESHOOTING_FAQ.md** - Most issues are covered here
2. **Check browser console** - Look for JavaScript errors (F12)
3. **Check server terminal** - Look for backend errors
4. **Verify PostgreSQL is running** - Most errors are DB-related
5. **Test API endpoints** - Use API_TESTING_GUIDE.md

### Reporting Issues

Include:
- Operating system
- Node.js version
- PostgreSQL version
- Complete error message
- Steps to reproduce
- What you've already tried

---

## 🎯 Next Steps

### After Reading This Document

1. ✅ Read **PROJECT_DOCUMENTATION.md** (if not already)
2. ✅ Follow **QUICK_START_GUIDE.md** to setup
3. ✅ Browse **ARCHITECTURE_DIAGRAM.md**
4. ✅ Test APIs using **API_TESTING_GUIDE.md**
5. ✅ Bookmark **TROUBLESHOOTING_FAQ.md**
6. 🚀 Start developing!

---

## ✅ Final Checklist

Before starting development, ensure:

- [ ] All documentation read
- [ ] Project setup completed
- [ ] PostgreSQL running and database created
- [ ] Both servers (frontend + backend) starting without errors
- [ ] Can add products
- [ ] Can create video requests
- [ ] Can view analytics
- [ ] SSE connection works (check Network tab)
- [ ] Understand video workflow
- [ ] N8N configured (or understand it's optional for testing)

---

## 📊 Project Statistics

- **Total Lines of Code:** ~10,000+
- **Backend Routes:** 40+ endpoints
- **Frontend Pages:** 6 main pages
- **Database Tables:** 8 tables
- **API Endpoints:** 40+ endpoints
- **Supported Languages:** 35 languages
- **Platforms:** YouTube, Facebook, TikTok, Instagram
- **Documentation Pages:** 6 comprehensive guides

---

## 🎉 You're Ready!

All the information you need is in these 6 documentation files. Take your time to understand the system, and don't hesitate to dive into the code.

**The code is well-structured and commented. Happy coding! 🚀**

---

## 📧 Project Information

**Project Name:** Kissan Ghar Video Automation Dashboard  
**Client:** Kissan Ghar  
**Purpose:** Agricultural product video marketing automation  
**Tech Stack:** React + Node.js + PostgreSQL + N8N  
**Development Start:** 2025  
**Documentation Version:** 1.0  
**Last Updated:** October 25, 2025  

---

**Welcome aboard! Let's build something amazing! 🌟**

