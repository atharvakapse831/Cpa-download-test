const { extractInfo, getRawThumbnailUrl } = require('../services/ytdlp');
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

async function getInfo(req, res, next) {
  try {
    const { url } = req.query;
    validateUrl(url);

    const info = await extractInfo(url);
    res.json({ ok: true, data: info });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/thumbnail?url= ─────────────────────────────────────────────────

async function getThumbnail(req, res, next) {
  try {
    const { url } = req.query;
    validateUrl(url);

    // 1. Get raw Instagram thumbnail URL via yt-dlp
    const rawUrl = await getRawThumbnailUrl(url);

    // 2. Immediately re-host to Cloudinary — frontend gets stable URL
    const cloudResult = await reHostThumbnail(rawUrl);

    res.json({
      ok: true,
      data: {
        thumbnail_url: cloudResult.url,   // ← use this in frontend directly
        width:         cloudResult.width,
        height:        cloudResult.height,
        format:        cloudResult.format,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getInfo, getThumbnail };
