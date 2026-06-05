# cpa-media-service

Standalone Node.js/Express microservice for Instagram Reel extraction.

## Stack
- **yt-dlp** — primary extractor (metadata + video download)
- **SociaVault** — fallback metadata when yt-dlp fails
- **Cloudinary** — thumbnail re-hosting
- Runs as a separate **Render** service

## Setup

```bash
cp .env.example .env
# Fill in Cloudinary + SociaVault keys

npm install
npm run dev
```

**Requires `yt-dlp` on PATH:**
```bash
# macOS
brew install yt-dlp

# Linux / Render build
pip install yt-dlp
# or
apt-get install -y yt-dlp
```

## Endpoints

### `GET /health`
```json
{ "status": "ok", "service": "cpa-media-service" }
```

---

### `GET /api/info?url=<reel_url>`
Returns metadata. yt-dlp primary, SociaVault fallback.

```bash
curl "http://localhost:4000/api/info?url=https://www.instagram.com/reel/ABC123/"
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "ABC123",
    "title": "...",
    "description": "...",
    "thumbnail": "https://...",
    "duration": 30,
    "uploader": "some_creator",
    "view_count": 12000,
    "_source": "yt-dlp"
  }
}
```

---

### `POST /api/download`
Downloads reel video to local temp storage.

```bash
curl -X POST http://localhost:4000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/reel/ABC123/"}'
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "filename": "uuid.mp4",
    "filePath": "/tmp/cpa-media/uuid.mp4",
    "sizeBytes": 8492032,
    "sizeMB": "8.10",
    "info": { ... }
  }
}
```

> **Note:** `filePath` exposed for testing only. Strip or gate behind `NODE_ENV` before prod.
> S3 upload will be wired in next iteration.

---

### `GET /api/thumbnail?url=<reel_url>`
Fetches thumbnail and re-hosts it on Cloudinary.

```bash
curl "http://localhost:4000/api/thumbnail?url=https://www.instagram.com/reel/ABC123/"
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "original": "https://instagram.com/...",
    "cloudinary": {
      "url": "https://res.cloudinary.com/your_cloud/image/upload/cpa/thumbnails/...",
      "publicId": "cpa/thumbnails/...",
      "width": 1080,
      "height": 1920,
      "format": "jpg",
      "bytes": 142000
    }
  }
}
```

## Auth

Set `SERVICE_SECRET` in `.env`. Pass as `x-service-secret` header from your backend:
```
x-service-secret: your_secret_here
```
If `SERVICE_SECRET` is not set, all requests pass (dev mode).

## Next steps
- [ ] Wire AWS S3 upload in `POST /download` (`s3Service.js`)
- [ ] Add job queue (Bull/BullMQ) for async downloads
- [ ] Emit webhook/event back to CPA backend on download complete
- [ ] Strip `filePath` from response in production
