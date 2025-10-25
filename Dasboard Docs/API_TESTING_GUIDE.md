# API Testing Guide - Kissan Ghar Dashboard

Complete guide for testing all API endpoints using Postman, curl, or any HTTP client.

---

## 🌐 Base Configuration

**Base URL:** `http://localhost:4000`

**Common Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**N8N Callback Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer your_secure_token_12345"
}
```

---

## 📦 Products API

### 1. Get All Products

**Endpoint:** `GET /api/products`

**Request:**
```bash
curl http://localhost:4000/api/products
```

**Response:**
```json
[
  {
    "id": 1,
    "company_id": 5,
    "cat_id": 2,
    "subcat_id": 3,
    "pname": "Super Fertilizer",
    "quantity": "1 Liter",
    "sprice": 1500.00,
    "act_price": 1800.00,
    "img": "/uploads/abc123.jpg",
    "company_name": "ABC Company",
    "subcategory_name": "Organic Fertilizers"
  }
]
```

---

### 2. Search Products

**Endpoint:** `GET /api/products?q=fertilizer`

**Request:**
```bash
curl "http://localhost:4000/api/products?q=fertilizer"
```

---

### 3. Get Single Product

**Endpoint:** `GET /api/products/:id`

**Request:**
```bash
curl http://localhost:4000/api/products/1
```

**Response:**
```json
{
  "id": 1,
  "company_id": 5,
  "pname": "Super Fertilizer",
  "sprice": 1500.00
}
```

---

### 4. Create Product

**Endpoint:** `POST /api/products`

**Request:**
```bash
curl -X POST http://localhost:4000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 1,
    "cat_id": 2,
    "subcat_id": 3,
    "pname": "New Product",
    "quantity": "500ml",
    "sprice": 1200.50,
    "act_price": 1500.00,
    "img": "/uploads/image.jpg",
    "detail": "Product description here"
  }'
```

**Response:**
```json
{
  "id": 45,
  "company_id": 1,
  "pname": "New Product",
  "sprice": 1200.50
}
```

---

### 5. Update Product

**Endpoint:** `PUT /api/products/:id`

**Request:**
```bash
curl -X PUT http://localhost:4000/api/products/45 \
  -H "Content-Type: application/json" \
  -d '{
    "pname": "Updated Product Name",
    "sprice": 1300.00
  }'
```

---

### 6. Delete Product

**Endpoint:** `DELETE /api/products/:id`

**Request:**
```bash
curl -X DELETE http://localhost:4000/api/products/45
```

**Response:**
```json
{
  "deleted": 1
}
```

---

### 7. Get Reference Data

**Endpoint:** `GET /api/products/refs/all`

**Request:**
```bash
curl http://localhost:4000/api/products/refs/all
```

**Response:**
```json
{
  "companies": [
    {"id": 1, "name": "ABC Company"}
  ],
  "categories": [
    {"id": 1, "name": "Fertilizers"}
  ],
  "subcategories": [
    {"id": 1, "name": "Organic", "cat_id": 1}
  ]
}
```

---

## 🎥 Videos API

### 1. Create Video (Start Script Generation)

**Endpoint:** `POST /api/videos`

**Request:**
```bash
curl -X POST http://localhost:4000/api/videos \
  -H "Content-Type: application/json" \
  -d '{
    "product_ids": [1, 2, 3],
    "prompt": "Create a promotional video about organic fertilizers",
    "duration_seconds": 90,
    "screen_size": "16:9",
    "language": "Urdu",
    "additional": {
      "notes": "Focus on eco-friendly features"
    }
  }'
```

**Response:**
```json
{
  "video_id": 10,
  "message": "script generation started"
}
```

---

### 2. List Videos

**Endpoint:** `GET /api/videos`

**Query Parameters:**
- `status` (optional): Filter by video_status

**Request:**
```bash
# All videos
curl http://localhost:4000/api/videos

# Filter by status
curl "http://localhost:4000/api/videos?status=script_generated"
```

**Response:**
```json
[
  {
    "id": 10,
    "prompt": "Create a promotional video",
    "duration_seconds": 90,
    "screen_size": "16:9",
    "video_status": "script_generated",
    "script": "Generated script content here...",
    "language": "Urdu",
    "preview_url": null,
    "title": null,
    "description": null
  }
]
```

---

### 3. Get Single Video

**Endpoint:** `GET /api/videos/:id`

**Request:**
```bash
curl http://localhost:4000/api/videos/10
```

---

### 4. Regenerate Script

**Endpoint:** `POST /api/videos/:videoId/regenerate-script`

**Request:**
```bash
curl -X POST http://localhost:4000/api/videos/10/regenerate-script \
  -H "Content-Type: application/json" \
  -d '{
    "language": "English"
  }'
```

**Response:**
```json
{
  "message": "script regeneration started"
}
```

---

### 5. Approve Script (Start Video Generation)

**Endpoint:** `POST /api/videos/:videoId/approve-script`

**Request:**
```bash
curl -X POST http://localhost:4000/api/videos/10/approve-script \
  -H "Content-Type: application/json" \
  -d '{
    "script_content": "Optional edited script content"
  }'
```

**Response:**
```json
{
  "message": "video generation started"
}
```

---

### 6. Regenerate Video

**Endpoint:** `POST /api/videos/:videoId/regenerate-video`

**Request:**
```bash
curl -X POST http://localhost:4000/api/videos/10/regenerate-video
```

---

### 7. Approve Video (Start Title Generation)

**Endpoint:** `POST /api/videos/:videoId/approve-video`

**Request:**
```bash
curl -X POST http://localhost:4000/api/videos/10/approve-video
```

**Response:**
```json
{
  "message": "video approved successfully"
}
```

---

### 8. Generate Title

**Endpoint:** `POST /api/videos/:videoId/generate-title`

**Request:**
```bash
curl -X POST http://localhost:4000/api/videos/10/generate-title \
  -H "Content-Type: application/json" \
  -d '{
    "script": "Optional script override"
  }'
```

---

### 9. Approve Title (Auto-triggers Tags Generation)

**Endpoint:** `POST /api/videos/:videoId/approve-title`

**Request:**
```bash
curl -X POST http://localhost:4000/api/videos/10/approve-title \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Amazing Organic Fertilizer Review"
  }'
```

**Response:**
```json
{
  "message": "title approved and tags generation started"
}
```

---

### 10. Generate Tags

**Endpoint:** `POST /api/videos/:videoId/generate-tags`

**Request:**
```bash
curl -X POST http://localhost:4000/api/videos/10/generate-tags \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Video Title",
    "description": "Video Description"
  }'
```

---

### 11. Approve Tags (Auto-triggers Description Generation)

**Endpoint:** `POST /api/videos/:videoId/approve-tags`

**Request:**
```bash
curl -X POST http://localhost:4000/api/videos/10/approve-tags \
  -H "Content-Type: application/json" \
  -d '{
    "tags": "fertilizer, organic, agriculture, farming"
  }'
```

**Response:**
```json
{
  "message": "tags approved and description generation started"
}
```

---

### 12. Generate Description

**Endpoint:** `POST /api/videos/:videoId/generate-description`

**Request:**
```bash
curl -X POST http://localhost:4000/api/videos/10/generate-description \
  -H "Content-Type: application/json" \
  -d '{
    "script": "Optional script override"
  }'
```

---

### 13. Approve Description

**Endpoint:** `POST /api/videos/:videoId/approve-description`

**Request:**
```bash
curl -X POST http://localhost:4000/api/videos/10/approve-description \
  -H "Content-Type: application/json" \
  -d '{
    "description": "This video showcases the best organic fertilizer..."
  }'
```

---

## 📺 Published Videos API

### 1. List Published Videos

**Endpoint:** `GET /api/published-videos`

**Query Parameters:**
- `status` (optional): Filter by status (pending/uploading/published)

**Request:**
```bash
# All published videos
curl http://localhost:4000/api/published-videos

# Filter by status
curl "http://localhost:4000/api/published-videos?status=pending"
```

**Response:**
```json
[
  {
    "id": 5,
    "generatedvideos_id": 10,
    "title": "Amazing Fertilizer",
    "description": "Description here",
    "tags": "tag1, tag2",
    "platform": "All",
    "status": "pending",
    "preview_url": "http://localhost:4000/generated_videos/10.mp4",
    "title_status": "approved",
    "description_status": "approved",
    "tags_status": "approved"
  }
]
```

---

### 2. Get Single Published Video

**Endpoint:** `GET /api/published-videos/:id`

**Request:**
```bash
curl http://localhost:4000/api/published-videos/5
```

---

### 3. Create Published Video Record

**Endpoint:** `POST /api/published-videos`

**Request:**
```bash
curl -X POST http://localhost:4000/api/published-videos \
  -H "Content-Type: application/json" \
  -d '{
    "generatedVideos_id": 10,
    "title": "Video Title",
    "platform": "youtube",
    "status": "pending"
  }'
```

---

### 4. Update Published Video

**Endpoint:** `PUT /api/published-videos/:id`

**Request:**
```bash
curl -X PUT http://localhost:4000/api/published-videos/5 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "published",
    "url": "https://youtube.com/watch?v=abc123"
  }'
```

---

### 5. Approve and Upload

**Endpoint:** `POST /api/published-videos/:id/approve-and-upload`

**Request:**
```bash
curl -X POST http://localhost:4000/api/published-videos/5/approve-and-upload \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "youtube",
    "title": "Final Video Title",
    "description": "Final video description",
    "tags": "tag1, tag2, tag3"
  }'
```

**Response:**
```json
{
  "message": "approval and upload started",
  "uploading_video_id": 5,
  "new_pending_video_id": 15
}
```

---

## 📤 Upload API

### 1. Upload Multiple Images

**Endpoint:** `POST /api/upload/images`

**Content-Type:** `multipart/form-data`

**Request (using curl):**
```bash
curl -X POST http://localhost:4000/api/upload/images \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

**Response:**
```json
{
  "success": true,
  "images": [
    "/uploads/uuid1.jpg",
    "/uploads/uuid2.jpg"
  ],
  "count": 2
}
```

**Request (using JavaScript):**
```javascript
const formData = new FormData();
formData.append('images', file1);
formData.append('images', file2);

fetch('http://localhost:4000/api/upload/images', {
  method: 'POST',
  body: formData
});
```

---

### 2. Upload Single Image

**Endpoint:** `POST /api/upload/image`

**Request:**
```bash
curl -X POST http://localhost:4000/api/upload/image \
  -F "image=@/path/to/image.jpg"
```

**Response:**
```json
{
  "success": true,
  "image": "/uploads/uuid.jpg"
}
```

---

## 📊 Analytics API

### 1. Get Analytics Data

**Endpoint:** `GET /api/analytics`

**Request:**
```bash
curl http://localhost:4000/api/analytics
```

**Response:**
```json
[
  {
    "id": 1,
    "date": "2025-10-25",
    "total_products": 150,
    "scripts_generated": 25,
    "videos_generated": 20,
    "videos_published": 15,
    "pending_approvals": 5
  },
  {
    "id": 2,
    "date": "2025-10-24",
    "total_products": 148,
    "scripts_generated": 23,
    "videos_generated": 18,
    "videos_published": 14,
    "pending_approvals": 4
  }
]
```

---

### 2. Upsert Analytics

**Endpoint:** `POST /api/analytics/upsert`

**Request:**
```bash
curl -X POST http://localhost:4000/api/analytics/upsert \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-10-25",
    "total_products": 150,
    "scripts_generated": 25,
    "videos_generated": 20,
    "videos_published": 15,
    "pending_approvals": 5
  }'
```

---

## 🔌 N8N Webhook Callbacks

These endpoints are called by N8N. Require Bearer token authentication.

### 1. Script Callback

**Endpoint:** `POST /api/webhooks/n8n/script-callback`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer your_secure_token_12345"
}
```

**Request:**
```bash
curl -X POST http://localhost:4000/api/webhooks/n8n/script-callback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_secure_token_12345" \
  -d '{
    "video_id": 10,
    "script": "This is the generated script content for the video about organic fertilizers..."
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Script updated successfully"
}
```

---

### 2. Video Callback

**Endpoint:** `POST /api/webhooks/n8n/video-callback`

**Request:**
```bash
curl -X POST http://localhost:4000/api/webhooks/n8n/video-callback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_secure_token_12345" \
  -d '{
    "video_id": 10,
    "preview_url": "https://vps.example.com/videos/video10.mp4",
    "duration_actual_seconds": 95,
    "file_size": 15728640
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Video updated successfully"
}
```

---

### 3. Title Callback

**Endpoint:** `POST /api/webhooks/n8n/title-callback`

**Request:**
```bash
curl -X POST http://localhost:4000/api/webhooks/n8n/title-callback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_secure_token_12345" \
  -d '{
    "video_id": 10,
    "title": "Amazing Organic Fertilizer - Boost Your Crops Naturally!"
  }'
```

---

### 4. Description Callback

**Endpoint:** `POST /api/webhooks/n8n/description-callback`

**Request:**
```bash
curl -X POST http://localhost:4000/api/webhooks/n8n/description-callback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_secure_token_12345" \
  -d '{
    "video_id": 10,
    "description": "Discover the power of organic fertilizers for sustainable farming. This video explains benefits, application methods, and results you can expect."
  }'
```

---

### 5. Tags Callback

**Endpoint:** `POST /api/webhooks/n8n/tags-callback`

**Request:**
```bash
curl -X POST http://localhost:4000/api/webhooks/n8n/tags-callback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_secure_token_12345" \
  -d '{
    "video_id": 10,
    "tags": "organic farming, fertilizer, agriculture, sustainable farming, crop nutrition"
  }'
```

---

### 6. Upload Callback

**Endpoint:** `POST /api/webhooks/n8n/upload-callback`

**Request:**
```bash
curl -X POST http://localhost:4000/api/webhooks/n8n/upload-callback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_secure_token_12345" \
  -d '{
    "video_id": 10,
    "platform": "youtube",
    "platform_video_id": "dQw4w9WgXcQ",
    "url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "status": "published"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Upload status updated successfully"
}
```

---

## 🔥 SSE (Server-Sent Events)

### Connect to Event Stream

**Endpoint:** `GET /api/stream`

**Request (JavaScript):**
```javascript
const eventSource = new EventSource('http://localhost:4000/api/stream');

eventSource.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  console.log(`Event: ${type}`, data);
};

eventSource.onerror = (error) => {
  console.error('SSE Error:', error);
};
```

**Event Format:**
```
data: {"type":"script_generated","data":{"video_id":10,"script":"..."},"timestamp":1729864800000}

```

**Event Types:**
- `connected` - Initial connection
- `script_generated`
- `video_update`
- `video_approved`
- `title_generated`
- `title_approved`
- `tags_generated`
- `tags_approved`
- `description_generated`
- `description_approved`
- `video_upload_approved`
- `upload_update`

---

## 🧪 Complete End-to-End Test Scenario

### Test: Create and Publish a Video

**Step 1: Create Video**
```bash
curl -X POST http://localhost:4000/api/videos \
  -H "Content-Type: application/json" \
  -d '{
    "product_ids": [1],
    "prompt": "Test video",
    "duration_seconds": 30,
    "screen_size": "16:9",
    "language": "English"
  }'
# Response: {"video_id": 99}
```

**Step 2: Simulate N8N Script Callback**
```bash
curl -X POST http://localhost:4000/api/webhooks/n8n/script-callback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "video_id": 99,
    "script": "Test script content"
  }'
```

**Step 3: Approve Script**
```bash
curl -X POST http://localhost:4000/api/videos/99/approve-script \
  -H "Content-Type: application/json" \
  -d '{"script_content": "Test script content"}'
```

**Step 4: Simulate N8N Video Callback**
```bash
curl -X POST http://localhost:4000/api/webhooks/n8n/video-callback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "video_id": 99,
    "preview_url": "http://localhost:4000/generated_videos/test.mp4"
  }'
```

**Step 5: Approve Video**
```bash
curl -X POST http://localhost:4000/api/videos/99/approve-video
```

**Step 6: Simulate Title Callback**
```bash
curl -X POST http://localhost:4000/api/webhooks/n8n/title-callback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "video_id": 99,
    "title": "Test Video Title"
  }'
```

**Step 7: Approve Title**
```bash
curl -X POST http://localhost:4000/api/videos/99/approve-title \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Video Title"}'
```

**Continue similarly for tags and description...**

---

## 🎯 Postman Collection Setup

### Import Collection

Create a new Postman collection with:

**Variables:**
```
base_url = http://localhost:4000
n8n_token = your_secure_token_12345
video_id = 10
```

**Folders:**
1. Products
2. Videos
3. Published Videos
4. Upload
5. Analytics
6. N8N Webhooks

Add all endpoints above to respective folders.

---

## ✅ Testing Checklist

- [ ] Health check returns `{"ok": true}`
- [ ] Can list all products
- [ ] Can create a product
- [ ] Can upload images
- [ ] Can create a video request
- [ ] Can list videos
- [ ] Can simulate script callback
- [ ] Can approve script
- [ ] Can simulate video callback
- [ ] Can approve video
- [ ] Can get analytics data
- [ ] SSE connection works

---

**Document Version:** 1.0  
**Last Updated:** October 25, 2025  
**Total Endpoints:** 40+

