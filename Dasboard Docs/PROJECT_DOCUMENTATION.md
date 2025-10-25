# Kissan Ghar Video Automation Dashboard - Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [Backend API Documentation](#backend-api-documentation)
6. [Frontend Structure](#frontend-structure)
7. [Video Generation Workflow](#video-generation-workflow)
8. [N8N Integration](#n8n-integration)
9. [Real-Time Updates (SSE)](#real-time-updates-sse)
10. [Setup & Installation](#setup--installation)
11. [Environment Configuration](#environment-configuration)
12. [Key Features](#key-features)
13. [Important Notes](#important-notes)

---

## 🎯 Project Overview

**Kissan Ghar Dashboard** is an AI-powered video automation platform that generates marketing videos for agricultural products. The system automates the entire workflow from script generation to video creation and social media publishing.

### Purpose
- Automate video creation for product marketing
- Generate scripts, titles, descriptions, and tags using AI
- Publish videos to multiple social media platforms (YouTube, Facebook, TikTok, Instagram)
- Track analytics and video performance

### Target Audience
Agricultural product manufacturers and marketers who need to create promotional videos at scale.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.6
- **Routing**: React Router DOM 6.26.2
- **Styling**: Tailwind CSS 3.4.13
- **Animations**: Framer Motion 11.5.4
- **Charts**: Recharts 2.12.7
- **Icons**: Lucide React 0.453.0
- **HTTP Client**: Axios 1.7.7

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 4.18.2
- **Database**: PostgreSQL 8.11.3
- **Validation**: Zod 3.22.4
- **CORS**: Enabled for cross-origin requests
- **File Upload**: Multer (for image uploads)
- **UUID**: For unique file naming

### Database
- **PostgreSQL** with custom ENUM types
- Connection: localhost:5000
- Database Name: `Kissan_ghar_automation`
- User: postgres

### External Integrations
- **N8N**: Workflow automation for AI script/video generation, title/description/tags generation, and video upload to platforms

---

## 🏗️ System Architecture

```
┌─────────────────┐
│   React Client  │
│   (Port 5173)   │
└────────┬────────┘
         │
         │ HTTP/SSE
         ▼
┌─────────────────┐
│  Express Server │
│   (Port 4000)   │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐   ┌──────────┐
│   PostgreSQL    │   │   N8N    │
│   (Port 5000)   │   │ Webhooks │
└─────────────────┘   └──────────┘
```

### Directory Structure
```
kissan-ghar-dashboard/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # API utilities
│   │   ├── types/            # TypeScript definitions
│   │   └── styles.css        # Global styles
│   ├── public/
│   └── package.json
├── server/                    # Express backend
│   ├── routes/               # API route handlers
│   ├── data/                 # Seed data (JSON)
│   ├── scripts/              # Utility scripts
│   ├── migrations/           # Database migrations
│   ├── uploads/              # Uploaded product images
│   ├── db.js                 # Database connection
│   ├── index.js              # Server entry point
│   └── package.json
├── generated_videos/          # Generated video files
├── schema.sql                # Database schema
└── package.json              # Root package.json
```

---

## 💾 Database Schema

### Core Tables

#### 1. **companies**
Stores product manufacturer/company information.
```sql
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    img VARCHAR(255)
);
```

#### 2. **categories**
Product categories (e.g., Fertilizers, Pesticides).
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    img VARCHAR(255)
);
```

#### 3. **subcategories**
Subcategories linked to categories.
```sql
CREATE TABLE subcategories (
    id SERIAL PRIMARY KEY,
    cat_id INT REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    UNIQUE(cat_id, name)
);
```

#### 4. **products**
Main product catalog.
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    company_id INT REFERENCES companies(id) ON DELETE SET NULL,
    cat_id INT REFERENCES categories(id) ON DELETE SET NULL,
    subcat_id INT REFERENCES subcategories(id) ON DELETE SET NULL,
    pname VARCHAR(255) NOT NULL,
    quantity VARCHAR(100),
    sprice NUMERIC(10,2),
    act_price NUMERIC(10,2),
    img VARCHAR(255),          -- Primary image
    imgb VARCHAR(255),         -- Additional images
    imgc VARCHAR(255),
    imgd VARCHAR(255),
    detail TEXT,
    phighlights TEXT,
    size1 VARCHAR(100),
    act_ingredient VARCHAR(255),
    weight VARCHAR(100),
    tank_capacity VARCHAR(100),
    sdetail TEXT
);
```

#### 5. **generatedVideos**
Core video generation tracking table.
```sql
CREATE TABLE generatedVideos (
    id SERIAL PRIMARY KEY,
    prompt VARCHAR(500),               -- User input prompt
    duration_seconds INT,              -- Desired video length
    screen_size screen_size DEFAULT '16:9',
    video_status video_status DEFAULT 'pending',
    script TEXT,                       -- Generated script stored here
    language languageType DEFAULT 'Urdu',
    file_path VARCHAR(255),            -- Local video file path
    file_size BIGINT,
    duration_actual_seconds INT,
    preview_url VARCHAR(255),          -- URL to preview video
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**video_status ENUM values:**
- `pending`: Video creation initiated
- `generating_script`: Script generation in progress
- `script_generated`: Script ready for approval
- `generating_video`: Video generation in progress
- `video_generated_pending`: Video ready, pending approval
- `video_generated`: Video approved

#### 6. **publishedVideo**
Tracks videos ready for/in publishing.
```sql
CREATE TABLE publishedVideo (
    id SERIAL PRIMARY KEY,
    generatedVideos_id INT REFERENCES generatedVideos(id) ON DELETE SET NULL,
    title TEXT,
    title_status status DEFAULT 'pending',
    description TEXT,
    description_status VARCHAR(50) DEFAULT 'pending',
    tags TEXT,
    tags_status VARCHAR(50) DEFAULT 'pending',
    tags_generated_count INT DEFAULT 0,
    publish_status publish_status DEFAULT 'pending',
    platform upload_platform,
    platform_video_id VARCHAR(255),   -- ID from platform (e.g., YouTube video ID)
    url VARCHAR(1000),                -- Published video URL
    status VARCHAR(50) DEFAULT 'pending', -- pending/uploading/published/failed
    uploaded_at TIMESTAMP WITH TIME ZONE
);
```

#### 7. **video_references**
Many-to-many relationship between videos and reference products.
```sql
CREATE TABLE video_references (
    id SERIAL PRIMARY KEY,
    video_id INT REFERENCES generatedVideos(id) ON DELETE CASCADE,
    reference_product_id INT REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(video_id, reference_product_id)
);
```

#### 8. **analytics**
Daily aggregated analytics data.
```sql
CREATE TABLE analytics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_products INT DEFAULT 0,
    scripts_generated INT DEFAULT 0,
    videos_generated INT DEFAULT 0,
    videos_published INT DEFAULT 0,
    pending_approvals INT DEFAULT 0
);
```

### ENUM Types

```sql
CREATE TYPE product_status AS ENUM ('active','inactive');

CREATE TYPE video_status AS ENUM (
    'pending',
    'generating_script',
    'script_generated',
    'generating_video',
    'video_generated_pending',
    'video_generated'
);

CREATE TYPE status AS ENUM ('pending','generating','generated','approved','rejected');

CREATE TYPE languageType AS ENUM (
    'English','Spanish','French','German','Italian','Portuguese','Russian','Urdu','Arabic',
    'Japanese','Korean','Chinese','Indonesian','Vietnamese','Thai','Dutch','Turkish',
    'Polish','Ukrainian','Swedish','Czech','Danish','Finnish','Norwegian','Romanian',
    'Greek','Hungarian','Hebrew'
);

CREATE TYPE publish_status AS ENUM ('pending','Uploading','uploaded');

CREATE TYPE screen_size AS ENUM ('1:1','9:16','16:9','4:5','full');

CREATE TYPE upload_platform AS ENUM ('All','youtube','facebook','tiktok','instagram');
```

---

## 🔌 Backend API Documentation

### Base URL: `http://localhost:4000`

### Products API (`/api/products`)

#### Create Product
- **POST** `/api/products`
- **Body:**
```json
{
  "company_id": 1,
  "cat_id": 2,
  "subcat_id": 3,
  "pname": "Product Name",
  "quantity": "1 Liter",
  "sprice": 1500.00,
  "act_price": 1800.00,
  "img": "/uploads/image.jpg",
  "detail": "Product details"
}
```
- **Response:** Created product object

#### List Products
- **GET** `/api/products?q=search_term`
- **Response:** Array of products with joined company and subcategory names

#### Get Single Product
- **GET** `/api/products/:id`

#### Update Product
- **PUT** `/api/products/:id`

#### Delete Product
- **DELETE** `/api/products/:id`

#### Get Reference Data
- **GET** `/api/products/refs/all`
- **Response:**
```json
{
  "companies": [...],
  "categories": [...],
  "subcategories": [...]
}
```

---

### Videos API (`/api/videos`)

#### Create Video (Start Script Generation)
- **POST** `/api/videos`
- **Body:**
```json
{
  "product_ids": [1, 2, 3],
  "prompt": "Create a promotional video for this fertilizer",
  "duration_seconds": 90,
  "screen_size": "16:9",
  "language": "Urdu",
  "additional": {
    "notes": "Focus on organic features"
  }
}
```
- **Process:**
  1. Creates video record with status `pending`
  2. Stores product references in `video_references` table
  3. Calls N8N script generation webhook
  4. Returns `video_id`

#### List Videos
- **GET** `/api/videos?status=script_generated`
- **Query Params:** `status` (optional) - Filter by video_status

#### Get Single Video
- **GET** `/api/videos/:id`
- Returns video with script included

#### Regenerate Script
- **POST** `/api/videos/:videoId/regenerate-script`
- **Body:**
```json
{
  "language": "English"
}
```
- Resets script and calls N8N webhook

#### Approve Script (Start Video Generation)
- **POST** `/api/videos/:videoId/approve-script`
- **Body:**
```json
{
  "script_content": "Optional edited script"
}
```
- Updates video_status to `generating_video`
- Calls N8N video generation webhook

#### Regenerate Video
- **POST** `/api/videos/:videoId/regenerate-video`
- Calls N8N video webhook with existing script

#### Approve Video (Start Title Generation)
- **POST** `/api/videos/:videoId/approve-video`
- Updates status to `video_generated`
- Creates `publishedVideo` record
- Calls N8N title generation webhook

#### Generate Title
- **POST** `/api/videos/:videoId/generate-title`
- **Body:**
```json
{
  "script": "Optional script override"
}
```

#### Approve Title (Start Tags Generation)
- **POST** `/api/videos/:videoId/approve-title`
- **Body:**
```json
{
  "title": "Approved title text"
}
```
- Updates `publishedVideo.title` and `title_status`
- Automatically triggers tags generation

#### Generate Tags
- **POST** `/api/videos/:videoId/generate-tags`
- **Body:**
```json
{
  "title": "Video title",
  "description": "Video description"
}
```

#### Approve Tags (Start Description Generation)
- **POST** `/api/videos/:videoId/approve-tags`
- **Body:**
```json
{
  "tags": "tag1, tag2, tag3"
}
```
- Automatically triggers description generation

#### Generate Description
- **POST** `/api/videos/:videoId/generate-description`
- **Body:**
```json
{
  "script": "Optional script override"
}
```

#### Approve Description
- **POST** `/api/videos/:videoId/approve-description`
- **Body:**
```json
{
  "description": "Approved description text"
}
```

---

### Published Videos API (`/api/published-videos`)

#### List Published Videos
- **GET** `/api/published-videos?status=pending`
- **Query Params:** `status` (optional)

#### Create Published Video Record
- **POST** `/api/published-videos`

#### Get Single Published Video
- **GET** `/api/published-videos/:id`

#### Update Published Video
- **PUT** `/api/published-videos/:id`

#### Approve and Upload
- **POST** `/api/published-videos/:id/approve-and-upload`
- **Body:**
```json
{
  "platform": "youtube",
  "title": "Final title",
  "description": "Final description",
  "tags": "tag1, tag2"
}
```
- **Process:**
  1. Updates current record to `uploading`
  2. Creates new record with `pending` status for reuse
  3. Calls N8N upload webhook

---

### Upload API (`/api/upload`)

#### Upload Multiple Images
- **POST** `/api/upload/images`
- **Form Data:** `images` (max 4 files, 5MB each)
- **Response:**
```json
{
  "success": true,
  "images": ["/uploads/uuid1.jpg", "/uploads/uuid2.jpg"],
  "count": 2
}
```

#### Upload Single Image
- **POST** `/api/upload/image`
- **Form Data:** `image`

---

### Analytics API (`/api/analytics`)

#### Get Analytics Data
- **GET** `/api/analytics`
- Automatically computes and upserts today's data
- Returns last 30 days of analytics

#### Upsert Analytics
- **POST** `/api/analytics/upsert`
- Manual analytics update

---

### SSE (Server-Sent Events) (`/api/stream`)

#### Real-Time Event Stream
- **GET** `/api/stream`
- **Event Types:**
  - `script_generated` - Script ready
  - `video_update` - Video generation update
  - `video_approved` - Video approved
  - `title_generated` - Title generated
  - `title_approved` - Title approved
  - `description_generated` - Description generated
  - `description_approved` - Description approved
  - `tags_generated` - Tags generated
  - `tags_approved` - Tags approved
  - `video_upload_approved` - Upload started
  - `upload_update` - Upload status update

---

### N8N Webhooks (Callbacks) (`/api/webhooks/n8n`)

All webhooks require Bearer token authentication via `N8N_CALLBACK_TOKEN`.

#### Script Callback
- **POST** `/api/webhooks/n8n/script-callback`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
```json
{
  "video_id": 1,
  "script": "Generated script content"
}
```

#### Video Callback
- **POST** `/api/webhooks/n8n/video-callback`
- **Body:**
```json
{
  "video_id": 1,
  "preview_url": "https://vps.example.com/video.mp4",
  "duration_actual_seconds": 95,
  "file_size": 12345678
}
```
- **Note:** Downloads video from VPS to local storage if URL contains VPS domain

#### Title Callback
- **POST** `/api/webhooks/n8n/title-callback`
- **Body:**
```json
{
  "video_id": 1,
  "title": "Generated video title"
}
```

#### Description Callback
- **POST** `/api/webhooks/n8n/description-callback`
- **Body:**
```json
{
  "video_id": 1,
  "description": "Generated video description"
}
```

#### Tags Callback
- **POST** `/api/webhooks/n8n/tags-callback`
- **Body:**
```json
{
  "video_id": 1,
  "tags": "tag1, tag2, tag3"
}
```

#### Upload Callback
- **POST** `/api/webhooks/n8n/upload-callback`
- **Body:**
```json
{
  "video_id": 1,
  "platform": "youtube",
  "platform_video_id": "dQw4w9WgXcQ",
  "url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
  "status": "published"
}
```

---

## 🎨 Frontend Structure

### Pages

#### 1. **AddProduct** (`/add-product`)
- Add new products to the catalog
- Upload up to 4 product images
- Select company, category, subcategory
- Search and view existing products

#### 2. **CreateVideo** (`/create-video`)
- Enter video prompt
- Select duration, screen size, language
- Select reference products (optional)
- Submit to start video generation

#### 3. **InProgress** (`/in-progress`)
- View videos in various generation stages
- Approve/reject/edit scripts
- Approve/regenerate videos
- Real-time status updates via SSE

#### 4. **GeneratedVideos** (`/generated-videos`)
- View videos ready for publishing
- Edit and approve titles
- Generate and approve tags
- Generate and approve descriptions
- Select platform and upload

#### 5. **UploadedHistory** (`/uploaded-videos`)
- View all uploaded/publishing videos
- Track upload status
- Access published video URLs

#### 6. **Analytics** (`/analytics`)
- Dashboard with key metrics
- Charts showing trends over 30 days
- Metrics: Total products, scripts generated, videos generated, videos published, pending approvals

### Components

#### **Layout.tsx**
Main application layout with sidebar navigation.

#### **Sidebar.tsx**
Navigation menu with icons and links.

#### **Neon.tsx**
Reusable neon-styled UI components:
- `NeonCard`: Glass-morphism card
- `NeonButton`: Styled button
- `NeonInput`: Styled input field
- `NeonSelect`: Styled select dropdown
- `NeonTextarea`: Styled textarea

### Custom Hooks

#### **useSSE**
React hook for Server-Sent Events.
```typescript
useSSE(['event_type1', 'event_type2'], (eventType, data) => {
  // Handle event
});
```

### API Client (`lib/api.ts`)
Centralized Axios-based API client with helper functions:
- `listProducts(query)`
- `createProduct(data)`
- `getRefs()`
- `listVideos(status)`
- `listPublished()`
- `uploadImages(files)`

---

## 🎬 Video Generation Workflow

### Complete Lifecycle

```
1. CREATE VIDEO (User Action)
   ↓
2. SCRIPT GENERATION (N8N → OpenAI/LLM)
   ↓ [webhook callback]
3. SCRIPT APPROVAL (User Action)
   ↓
4. VIDEO GENERATION (N8N → Video AI Service)
   ↓ [webhook callback]
5. VIDEO APPROVAL (User Action)
   ↓
6. TITLE GENERATION (N8N → OpenAI/LLM)
   ↓ [webhook callback]
7. TITLE APPROVAL (User Action)
   ↓
8. TAGS GENERATION (N8N → OpenAI/LLM)
   ↓ [webhook callback]
9. TAGS APPROVAL (User Action)
   ↓
10. DESCRIPTION GENERATION (N8N → OpenAI/LLM)
   ↓ [webhook callback]
11. DESCRIPTION APPROVAL (User Action)
   ↓
12. VIDEO UPLOAD (N8N → YouTube/Facebook/TikTok/Instagram API)
   ↓ [webhook callback]
13. PUBLISHED (Final State)
```

### Status Flow

#### generatedVideos.video_status
```
pending 
  → generating_script 
  → script_generated 
  → generating_video 
  → video_generated_pending 
  → video_generated
```

#### publishedVideo.status
```
pending 
  → uploading 
  → published
```

---

## 🔗 N8N Integration

### Overview
N8N is used as the middleware for all AI operations and platform uploads. The server sends webhook requests to N8N, which processes them and sends results back via callback URLs.

### Required N8N Environment Variables

```env
# N8N Webhook URLs (Outgoing from server to N8N)
N8N_SCRIPT_WEBHOOK_URL=https://n8n.example.com/webhook/script-generate
N8N_VIDEO_WEBHOOK_URL=https://n8n.example.com/webhook/video-generate
N8N_TITLE_WEBHOOK_URL=https://n8n.example.com/webhook/title-generate
N8N_DESCRIPTION_WEBHOOK_URL=https://n8n.example.com/webhook/description-generate
N8N_TAGS_WEBHOOK_URL=https://n8n.example.com/webhook/tags-generate
N8N_UPLOAD_WEBHOOK_URL=https://n8n.example.com/webhook/upload-video

# Callback Security
N8N_CALLBACK_TOKEN=your_secure_token_here

# Base URL for callbacks (so N8N knows where to send results)
NODE_BASE_URL=http://localhost:4000
```

### N8N Workflow Structure

Each N8N workflow should:
1. Receive webhook POST request with data
2. Process the request (call AI APIs, generate video, upload to platform)
3. Send results back to the callback URL with authentication token

### Example N8N Callback Request

```bash
POST http://localhost:4000/api/webhooks/n8n/script-callback
Authorization: Bearer {N8N_CALLBACK_TOKEN}
Content-Type: application/json

{
  "video_id": 123,
  "script": "Generated script content here..."
}
```

---

## ⚡ Real-Time Updates (SSE)

### Server-Side Implementation

**File:** `server/routes/sse.js`

The server maintains a Map of active SSE connections and broadcasts events to all connected clients.

```javascript
// Send event to all clients
notifyClients('script_generated', {
  video_id: 123,
  script: "Script content"
});
```

### Client-Side Implementation

**Hook:** `client/src/hooks/useSSE.ts`

```typescript
useSSE(['script_generated', 'video_update'], (eventType, data) => {
  console.log(`Received ${eventType}:`, data);
  // Update UI
});
```

### Event Types and Usage

| Event Type | Triggered When | Listeners |
|------------|---------------|-----------|
| `script_generated` | Script is ready | InProgress |
| `video_update` | Video generation updates | InProgress |
| `video_approved` | Video approved | InProgress, GeneratedVideos |
| `title_generated` | Title generated | GeneratedVideos |
| `title_approved` | Title approved | GeneratedVideos |
| `tags_generated` | Tags generated | GeneratedVideos |
| `tags_approved` | Tags approved | GeneratedVideos |
| `description_generated` | Description generated | GeneratedVideos |
| `description_approved` | Description approved | GeneratedVideos |
| `video_upload_approved` | Upload started | GeneratedVideos, UploadedHistory |
| `upload_update` | Upload status changes | UploadedHistory |

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+ (with ES Module support)
- PostgreSQL 14+
- N8N instance (self-hosted or cloud)

### Step 1: Clone Repository
```bash
cd "E:\Clients Work\kissan Ghar\Kissan Ghar Dashboard"
```

### Step 2: Install Dependencies

#### Root
```bash
npm install
```

#### Server
```bash
cd server
npm install
```

#### Client
```bash
cd client
npm install
```

### Step 3: Database Setup

#### Create Database
```bash
psql -U postgres
CREATE DATABASE Kissan_ghar_automation;
\q
```

#### Run Schema
```bash
psql -U postgres -d Kissan_ghar_automation -f schema.sql
```

#### Configure Database Connection
Edit `server/db.js`:
```javascript
export const pool = new Pool({
  host: 'localhost',
  port: 5000,
  user: 'postgres',
  password: '3234',
  database: 'Kissan_ghar_automation'
});
```

#### Run Migrations
```bash
cd server
npm run migrate
```

### Step 4: Seed Data (Optional)

#### Import seed data:
```bash
cd server
npm run import-data
npm run verify-data
```

This imports data from `server/data/*.json` files:
- companies.json
- categories.json
- sub_categories.json
- products.json

### Step 5: Environment Variables

Create `.env` file in `server/` directory:

```env
PORT=4000
NODE_BASE_URL=http://localhost:4000

# Database (already configured in db.js)
# Optionally override via env vars if needed

# N8N Webhooks
N8N_SCRIPT_WEBHOOK_URL=https://your-n8n.com/webhook/script-generate
N8N_VIDEO_WEBHOOK_URL=https://your-n8n.com/webhook/video-generate
N8N_TITLE_WEBHOOK_URL=https://your-n8n.com/webhook/title-generate
N8N_DESCRIPTION_WEBHOOK_URL=https://your-n8n.com/webhook/description-generate
N8N_TAGS_WEBHOOK_URL=https://your-n8n.com/webhook/tags-generate
N8N_UPLOAD_WEBHOOK_URL=https://your-n8n.com/webhook/upload-video

# Security
N8N_CALLBACK_TOKEN=your_secure_random_token_here
```

### Step 6: Run Development Servers

From project root:
```bash
npm run dev
```

This runs both:
- Backend: `http://localhost:4000`
- Frontend: `http://localhost:5173`

Or run separately:
```bash
# Server only
npm run server

# Client only
npm run client
```

---

## ⚙️ Environment Configuration

### Server Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 4000 |
| `NODE_BASE_URL` | Base URL for N8N callbacks | Yes | - |
| `N8N_SCRIPT_WEBHOOK_URL` | Script generation webhook | Yes | - |
| `N8N_VIDEO_WEBHOOK_URL` | Video generation webhook | Yes | - |
| `N8N_TITLE_WEBHOOK_URL` | Title generation webhook | Yes | - |
| `N8N_DESCRIPTION_WEBHOOK_URL` | Description generation webhook | Yes | - |
| `N8N_TAGS_WEBHOOK_URL` | Tags generation webhook | Yes | - |
| `N8N_UPLOAD_WEBHOOK_URL` | Video upload webhook | Yes | - |
| `N8N_CALLBACK_TOKEN` | Security token for callbacks | Yes | - |

### Database Configuration

Hardcoded in `server/db.js`:
```javascript
{
  host: 'localhost',
  port: 5000,
  user: 'postgres',
  password: '3234',
  database: 'Kissan_ghar_automation'
}
```

---

## 🎯 Key Features

### 1. Product Management
- CRUD operations for agricultural products
- Multi-image upload (up to 4 images per product)
- Category and subcategory organization
- Company/brand association
- Search functionality

### 2. AI-Powered Script Generation
- Natural language prompts
- Multi-language support (35 languages)
- Product reference integration
- Script editing before approval

### 3. Automated Video Generation
- Multiple aspect ratios (1:1, 9:16, 16:9, 4:5, full)
- Configurable duration
- AI-powered video creation
- Preview before publishing

### 4. Content Optimization
- AI-generated titles
- SEO-friendly descriptions
- Relevant tag generation
- Platform-specific optimization

### 5. Multi-Platform Publishing
- YouTube
- Facebook
- TikTok
- Instagram
- Automatic upload via N8N

### 6. Real-Time Updates
- Server-Sent Events (SSE)
- Live status updates
- No page refresh needed

### 7. Analytics Dashboard
- Daily metrics tracking
- 30-day trend visualization
- Key performance indicators
- Production insights

---

## 📝 Important Notes

### Missing Dependencies

The `server/routes/upload.js` file uses Multer and UUID but they are NOT in `server/package.json`. You need to install:

```bash
cd server
npm install multer uuid
```

### Database Connection

The database connection is **hardcoded** in `server/db.js` with specific credentials. Make sure:
- PostgreSQL is running on port 5000
- Database `Kissan_ghar_automation` exists
- User `postgres` with password `3234` has access

### Video Download from VPS

When N8N sends back a `preview_url` from a VPS, the server automatically downloads it to `generated_videos/` folder and updates the URL to point to localhost. This happens in `server/routes/n8n-webhooks.js`.

### SSE Connection Management

The SSE implementation maintains persistent connections. Make sure to:
- Handle reconnection on client side
- Monitor active connections on server
- Set appropriate timeouts

### Security Considerations

1. **N8N Callback Token**: Use a strong random token for `N8N_CALLBACK_TOKEN`
2. **CORS**: Currently allows all origins - restrict in production
3. **File Upload**: 5MB limit per image, only image types allowed
4. **Database Credentials**: Move to environment variables in production

### Data Migrations

Run migrations in order:
```bash
cd server
node scripts/run-migration.js migrations/001_add_missing_columns.sql
node scripts/run-migration.js migrations/002_add_video_generated_pending.sql
node scripts/run-migration.js migrations/003_remove_publish_status.sql
node scripts/run-migration.js migrations/004_add_tags_columns.sql
```

Or use the npm script:
```bash
npm run migrate
```

### Workflow Sequence

**CRITICAL**: The workflow must follow this exact sequence:
1. Video creation → Script generation
2. Script approval → Video generation
3. Video approval → Title generation
4. Title approval → Tags generation
5. Tags approval → Description generation
6. Description approval → Platform upload

Each step triggers the next automatically via N8N webhooks and callbacks.

### publishedVideo Duplication Strategy

When a user approves and uploads a video:
1. The current `publishedVideo` record is updated to status `uploading`
2. A NEW `publishedVideo` record is created with status `pending`
3. This allows the same video to be used for multiple uploads without duplication issues

See: `server/routes/publishedVideos.js` - `approve-and-upload` endpoint

---

## 🔧 Utility Scripts

Located in `server/scripts/`:

### Data Management
```bash
# Clear all data
npm run clear-data

# Import all data from JSON files
npm run import-data

# Verify imported data
npm run verify-data

# Complete reset (clear + import + verify)
npm run reset-db
```

### Individual Import Scripts
- `importCategories.js` - Import categories
- `importCompanies.js` - Import companies
- `importSubcategories.js` - Import subcategories
- `importProducts.js` - Import products

### Migration Script
```bash
npm run migrate [migration_file.sql]
```

---

## 🐛 Debugging & Troubleshooting

### Enable Logs

The server has most console logs removed. To debug:
1. Check SSE events in browser DevTools (Network → EventStream)
2. Add `console.log` statements in route handlers
3. Check PostgreSQL logs for query errors

### Common Issues

#### 1. Database Connection Failed
- Verify PostgreSQL is running on port 5000
- Check credentials in `server/db.js`
- Ensure database exists

#### 2. N8N Webhooks Not Working
- Verify webhook URLs in `.env`
- Check `N8N_CALLBACK_TOKEN` matches on both sides
- Test webhooks manually with curl/Postman

#### 3. SSE Not Updating
- Check browser DevTools Network tab for `/api/stream` connection
- Verify `notifyClients()` is being called in route handlers
- Check for CORS issues

#### 4. Image Upload Failed
- Ensure `server/uploads/` directory exists and is writable
- Check file size (max 5MB)
- Verify file type is an image

#### 5. Video Not Downloaded from VPS
- Check VPS URL accessibility
- Ensure `generated_videos/` directory exists
- Check network connectivity

---

## 📚 Additional Resources

### Database Diagram

```
companies ─┐
           ├─→ products ─→ video_references ─→ generatedVideos ─→ publishedVideo
categories ─┤                                          ↓
subcategories ─┘                                  analytics
```

### API Call Flow Example

```javascript
// 1. Create video
POST /api/videos
{ prompt, duration_seconds, screen_size, language, product_ids }
→ Server calls N8N script webhook

// 2. N8N sends script back
POST /api/webhooks/n8n/script-callback
{ video_id, script }
→ Server notifies clients via SSE

// 3. User approves script
POST /api/videos/:id/approve-script
{ script_content }
→ Server calls N8N video webhook

// 4. N8N sends video back
POST /api/webhooks/n8n/video-callback
{ video_id, preview_url }
→ Server downloads video and notifies clients

// And so on...
```

---

## 📞 Contact & Support

For questions or issues with this project:
- Review this documentation first
- Check the code comments in critical files
- Test API endpoints with Postman/curl
- Verify N8N workflows are active and configured

---

## ✅ Checklist for Developer

Before starting development, ensure:

- [ ] PostgreSQL installed and running
- [ ] Database created and schema applied
- [ ] All npm packages installed (root, server, client)
- [ ] Missing packages added (multer, uuid)
- [ ] Environment variables configured
- [ ] N8N instance set up with workflows
- [ ] N8N callback token configured on both ends
- [ ] Data imported and verified
- [ ] Both servers running (frontend + backend)
- [ ] SSE connection established
- [ ] Test product created successfully
- [ ] Test video workflow completed end-to-end

---

**Document Version:** 1.0  
**Last Updated:** October 25, 2025  
**Project:** Kissan Ghar Video Automation Dashboard

