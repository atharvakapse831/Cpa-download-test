const { extractInfo } = require('../services/ytdlp');
const { reHostThumbnail } = require('../services/cloudinary');

function validateUrl(url) {
  if (!url) throw Object.assign(new Error('Missing url parameter'), { status: 400 });
  try {
    const p = new URL(url);
    if (!['http:', 'https:'].includes(p.protocol)) throw new Error();
  } catch {
    throw Object.assign(new Error('Invalid URL'), { status: 400 });
  }
}

// ─── GET /api/info?url= ──────────────────────────────────────────────────────
// Returns metadata + Cloudinary thumbnail in one call.

async function getInfo(req, res, next) {
  try {
    const { url } = req.query;
    validateUrl(url);

    // 1. Extract metadata via yt-dlp
    const info = await extractInfo(url);

    // 2. Re-host thumbnail to Cloudinary immediately
    let thumbnail_url = null;
    if (info.thumbnail) {
      try {
        const cloud = await reHostThumbnail(info.thumbnail);
        thumbnail_url = cloud.url; // stable Cloudinary URL
      } catch (thumbErr) {
        console.warn('[INFO] Cloudinary thumbnail failed:', thumbErr.message);
        thumbnail_url = info.thumbnail; // fallback to raw (may not load in browser)
      }
    }

    res.json({
      ok: true,
      data: {
        ...info,
        thumbnail_url,           // ← Cloudinary URL, works in any browser
        thumbnail_raw: info.thumbnail, // ← original Instagram CDN (for debug)
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/thumbnail?url= ─────────────────────────────────────────────────
// Kept for standalone thumbnail re-hosting if needed separately.

async function getThumbnail(req, res, next) {
  try {
    const { url } = req.query;
    validateUrl(url);

    const info = await extractInfo(url);

    if (!info.thumbnail) {
      return res.status(404).json({ ok: false, error: 'No thumbnail found' });
    }

    const cloud = await reHostThumbnail(info.thumbnail);

    res.json({
      ok: true,
      data: {
        thumbnail_url: cloud.url,
        width:         cloud.width,
        height:        cloud.height,
        format:        cloud.format,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getInfo, getThumbnail };
