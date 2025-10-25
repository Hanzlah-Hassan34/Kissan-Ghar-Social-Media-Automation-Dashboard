# Kissan Ghar Dashboard - Technical Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           React Frontend (Vite + TypeScript)               │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │ │
│  │  │ Add      │ │ Create   │ │ In       │ │ Generated    │ │ │
│  │  │ Product  │ │ Video    │ │ Progress │ │ Videos       │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │ │
│  │  ┌──────────┐ ┌──────────────────────────────────────────┐ │ │
│  │  │ Uploaded │ │        Analytics Dashboard              │ │ │
│  │  │ History  │ │        (Charts & Metrics)               │ │ │
│  │  └──────────┘ └──────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              │ HTTP + SSE (Real-time updates)    │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER (Node.js)                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    API Routes Layer                        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐  │  │
│  │  │ Products │ │ Videos   │ │ Published│ │ Analytics   │  │  │
│  │  │ /api/    │ │ /api/    │ │ Videos   │ │ /api/       │  │  │
│  │  │ products │ │ videos   │ │ /api/    │ │ analytics   │  │  │
│  │  └──────────┘ └──────────┘ │ published│ └─────────────┘  │  │
│  │                              │-videos   │                  │  │
│  │  ┌──────────┐ ┌────────────┐└─────────┘┌─────────────┐  │  │
│  │  │ Upload   │ │ SSE Stream │ │ N8N     │ │ Video Refs │  │  │
│  │  │ /api/    │ │ /api/      │ │ Webhooks│ │ /api/      │  │  │
│  │  │ upload   │ │ stream     │ │ /api/   │ │ video-     │  │  │
│  │  └──────────┘ └────────────┘ │ webhooks│ │ references │  │  │
│  │                               └─────────┘ └─────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Middleware & Services                         │  │
│  │  • CORS (Cross-origin)                                     │  │
│  │  • Multer (File upload)                                    │  │
│  │  • Zod Validation                                          │  │
│  │  • SSE Connection Manager                                  │  │
│  │  • N8N Webhook Client                                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                    │
└──────────────────────────────┼────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────┐    ┌───────────────────┐    ┌──────────────────┐
│  PostgreSQL  │    │   File Storage    │    │   N8N Instance   │
│  Database    │    │   (Local Disk)    │    │  (Automation)    │
│              │    │                   │    │                  │
│ ┌──────────┐ │    │ ┌───────────────┐│    │ ┌──────────────┐ │
│ │companies │ │    │ │/server/uploads││    │ │ Script Gen   │ │
│ │categories│ │    │ │  (Product     ││    │ │ (OpenAI/LLM) │ │
│ │products  │ │    │ │   Images)     ││    │ └──────────────┘ │
│ │generated │ │    │ └───────────────┘│    │ ┌──────────────┐ │
│ │Videos    │ │    │                   │    │ │ Video Gen    │ │
│ │published │ │    │ ┌───────────────┐│    │ │ (AI Video)   │ │
│ │Video     │ │    │ │/generated_    ││    │ └──────────────┘ │
│ │video_    │ │    │ │ videos/       ││    │ ┌──────────────┐ │
│ │references│ │    │ │ (Generated    ││    │ │ Title/Desc/  │ │
│ │analytics │ │    │ │  Videos)      ││    │ │ Tags Gen     │ │
│ └──────────┘ │    │ └───────────────┘│    │ └──────────────┘ │
│              │    │                   │    │ ┌──────────────┐ │
│ Port: 5000   │    │                   │    │ │ Platform     │ │
└──────────────┘    └───────────────────┘    │ │ Upload (YT,  │ │
                                              │ │ FB, TT, IG)  │ │
                                              │ └──────────────┘ │
                                              │                  │
                                              │ Sends callbacks  │
                                              │ to Express       │
                                              └──────────────────┘
```

## Data Flow Diagrams

### 1. Video Creation Flow

```
┌──────────────┐
│   User       │
│ Creates Video│
└──────┬───────┘
       │ 1. POST /api/videos
       │ { prompt, duration, language, product_ids }
       ▼
┌──────────────────┐
│ Express Server   │
├──────────────────┤
│ 1. Create video  │
│    record        │
│ 2. Store refs    │
│ 3. Call N8N      │
└──────┬───────────┘
       │ 2. POST N8N_SCRIPT_WEBHOOK_URL
       │ { video_id, prompt, product_snapshots }
       ▼
┌──────────────────┐
│   N8N Workflow   │
├──────────────────┤
│ 1. Receive data  │
│ 2. Call OpenAI   │
│ 3. Generate      │
│    script        │
└──────┬───────────┘
       │ 3. POST /api/webhooks/n8n/script-callback
       │ { video_id, script }
       ▼
┌──────────────────┐
│ Express Server   │
├──────────────────┤
│ 1. Update video  │
│ 2. Set script    │
│ 3. Status =      │
│    script_gen    │
│ 4. Notify SSE    │
└──────┬───────────┘
       │ 4. SSE Event: script_generated
       ▼
┌──────────────────┐
│ Frontend Updates │
│ Shows script for │
│ user approval    │
└──────────────────┘
```

### 2. Script to Video Generation Flow

```
┌──────────────┐
│   User       │
│Approves Script│
└──────┬───────┘
       │ 1. POST /api/videos/:id/approve-script
       ▼
┌──────────────────┐
│ Express Server   │
├──────────────────┤
│ 1. Update status │
│ 2. Call N8N      │
└──────┬───────────┘
       │ 2. POST N8N_VIDEO_WEBHOOK_URL
       │ { video_id, script, product_snapshots }
       ▼
┌──────────────────┐
│   N8N Workflow   │
├──────────────────┤
│ 1. Receive script│
│ 2. Call Video AI │
│ 3. Generate video│
│ 4. Upload to VPS │
└──────┬───────────┘
       │ 3. POST /api/webhooks/n8n/video-callback
       │ { video_id, preview_url }
       ▼
┌──────────────────┐
│ Express Server   │
├──────────────────┤
│ 1. Download video│
│    from VPS      │
│ 2. Save locally  │
│ 3. Update URL    │
│ 4. Notify SSE    │
└──────┬───────────┘
       │ 4. SSE Event: video_update
       ▼
┌──────────────────┐
│ Frontend Shows   │
│ Video Preview    │
└──────────────────┘
```

### 3. Publishing Flow

```
┌──────────────┐
│   User       │
│ Approves Video│
└──────┬───────┘
       │ 1. POST /api/videos/:id/approve-video
       ▼
┌──────────────────────────────────────────────────┐
│              Title Generation                    │
│ N8N → OpenAI → Callback → Frontend Shows Title  │
└──────┬───────────────────────────────────────────┘
       │ 2. User approves title
       ▼
┌──────────────────────────────────────────────────┐
│              Tags Generation                     │
│ N8N → OpenAI → Callback → Frontend Shows Tags    │
└──────┬───────────────────────────────────────────┘
       │ 3. User approves tags
       ▼
┌──────────────────────────────────────────────────┐
│            Description Generation                │
│ N8N → OpenAI → Callback → Frontend Shows Desc    │
└──────┬───────────────────────────────────────────┘
       │ 4. User approves description + selects platform
       ▼
┌──────────────────┐
│ Express Server   │
├──────────────────┤
│ 1. Duplicate     │
│    record logic  │
│ 2. Call N8N      │
│    upload        │
└──────┬───────────┘
       │ 5. POST N8N_UPLOAD_WEBHOOK_URL
       │ { video_id, title, description, platform }
       ▼
┌──────────────────┐
│   N8N Workflow   │
├──────────────────┤
│ 1. Download video│
│ 2. Upload to     │
│    platform API  │
│ 3. Get video ID  │
│    and URL       │
└──────┬───────────┘
       │ 6. POST /api/webhooks/n8n/upload-callback
       │ { video_id, platform, url, status }
       ▼
┌──────────────────┐
│ Express Server   │
├──────────────────┤
│ 1. Update status │
│ 2. Save URL      │
│ 3. Notify SSE    │
└──────┬───────────┘
       │ 7. SSE Event: upload_update
       ▼
┌──────────────────┐
│ Frontend Shows   │
│ Published Video  │
│ in History       │
└──────────────────┘
```

## Database Relationships

```
┌─────────────┐
│  companies  │
└──────┬──────┘
       │ 1:N
       │
       ▼
┌─────────────┐      ┌─────────────┐
│  categories │      │   products  │◄────┐
└──────┬──────┘      └──────┬──────┘     │
       │ 1:N                │             │
       │                    │ N:M         │
       ▼                    │             │
┌──────────────┐            ▼             │
│subcategories │      ┌──────────────────┐│
└──────┬───────┘      │video_references  ││
       │ 1:N          └─────────┬────────┘│
       │                        │          │
       └────────────────────────┼──────────┘
                                │
                                ▼
                       ┌────────────────┐
                       │generatedVideos │
                       └────────┬───────┘
                                │ 1:N
                                ▼
                       ┌────────────────┐
                       │publishedVideo  │
                       └────────────────┘

┌─────────────┐
│  analytics  │  (Independent table)
└─────────────┘
```

## Component Architecture

### Frontend Component Tree

```
App.tsx
└── Layout.tsx
    ├── Sidebar.tsx
    └── Routes
        ├── AddProduct.tsx
        │   └── Uses: NeonCard, NeonButton, NeonInput, NeonSelect
        ├── CreateVideo.tsx
        │   └── Uses: NeonCard, NeonButton, NeonInput, NeonSelect
        ├── InProgress.tsx
        │   ├── Uses: useSSE hook
        │   └── Uses: framer-motion animations
        ├── GeneratedVideos.tsx
        │   ├── Uses: useSSE hook
        │   └── Uses: framer-motion animations
        ├── UploadedHistory.tsx
        │   ├── Uses: useSSE hook
        │   └── Uses: framer-motion animations
        └── Analytics.tsx
            └── Uses: recharts
```

## API Request/Response Patterns

### Standard Success Response
```json
{
  "id": 123,
  "...": "entity data"
}
```

### Standard Error Response
```json
{
  "error": "error_code",
  "detail": "Error message"
}
```

### SSE Message Format
```
data: {"type":"event_name","data":{...},"timestamp":1234567890}

```

## Security Flow

```
┌─────────────┐
│  N8N Server │
└──────┬──────┘
       │ POST /api/webhooks/n8n/*
       │ Authorization: Bearer {token}
       ▼
┌────────────────────┐
│ Express Middleware │
│ validateN8nToken() │
├────────────────────┤
│ Check header token │
│ vs env variable    │
└──────┬─────────────┘
       │
       ├─── Valid Token ────► Process Request
       │
       └─── Invalid Token ──► 401 Unauthorized
```

## Deployment Considerations

### Production Architecture

```
┌─────────────────────┐
│   Load Balancer     │
│   (Nginx/Caddy)     │
└──────┬──────────────┘
       │
       ├──── Static Files (React Build)
       │
       └──── /api/* ────► Express Server (PM2)
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
            ┌──────────────┐ ┌─────────┐ ┌──────────┐
            │ PostgreSQL   │ │ Redis   │ │ N8N      │
            │ (Managed DB) │ │ (Cache) │ │ (Cloud)  │
            └──────────────┘ └─────────┘ └──────────┘
```

### Recommended Production Setup

1. **Frontend**: Build with `npm run build` → Serve via Nginx
2. **Backend**: Run with PM2 for process management
3. **Database**: Use managed PostgreSQL service
4. **File Storage**: Switch to S3/CloudFlare R2 for uploads
5. **N8N**: Use n8n.cloud or self-hosted on separate server
6. **Monitoring**: Add logging (Winston) + monitoring (Sentry)

## Performance Optimization

### Current Bottlenecks
1. **SSE Connections**: Each client holds a connection
2. **Video Download**: Synchronous download from VPS
3. **Database Queries**: No caching layer

### Recommended Improvements
1. Add Redis for caching analytics and product lists
2. Implement queue system (Bull/BullMQ) for video processing
3. Use CDN for video delivery
4. Add database connection pooling (already using pg.Pool)
5. Implement retry logic for N8N webhooks

---

**Document Version:** 1.0  
**Last Updated:** October 25, 2025

