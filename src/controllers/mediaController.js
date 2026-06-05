const path = require('path');
const fs = require('fs');
const { extractInfo, downloadVideo, getThumbnailUrl } = require('../services/ytdlp');
const { fetchInfo: svFetchInfo } = require('../services/sociavault');
const { reHostThumbnail } = require('../services/cloudinary');
const { TEMP_DIR } = require('../config');

// ─── helpers ────────────────────────────────────────────────────────────────

function validateUrl(url) {
  if (!url) throw Object.assign(new Error('Missing url parameter'), { status: 400 });
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
  } catch {
    throw Object.assign(new Error('Invalid URL'), { status: 400 });
  }
}

/** Normalise yt-dlp info to our public shape */
function normaliseYtdlpInfo(info) {
  return {
    id: info.id,
    title: info.title || info.description || '',
    description: info.description || '',
    thumbnail: info.thumbnail || null,
    duration: info.duration || null,
    uploader: info.uploader || info.channel || null,
    uploader_id: info.uploader_id || info.channel_id || null,
    view_count: info.view_count || null,
    like_count: info.like_count || null,
    upload_date: info.upload_date || null,
    webpage_url: info.webpage_url || null,
    ext: info.ext || 'mp4',
    _source: 'yt-dlp',
  };
}

// ─── GET /api/info?url= ──────────────────────────────────────────────────────

async function getInfo(req, res, next) {
  try {
    const { url } = req.query;
    validateUrl(url);

    let info;
    try {
      const raw = await extractInfo(url);
      info = normaliseYtdlpInfo(raw);
    } catch (ytErr) {
      console.warn('[INFO] yt-dlp failed, falling back to SociaVault:', ytErr.message);
      try {
        info = await svFetchInfo(url);
      } catch (svErr) {
        throw Object.assign(
          new Error(`Both extractors failed. yt-dlp: ${ytErr.message} | SociaVault: ${svErr.message}`),
          { status: 502 }
        );
      }
    }

    res.json({ ok: true, data: info });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/download  { url } ────────────────────────────────────────────

async function downloadReel(req, res, next) {
  try {
    const { url } = req.body;
    validateUrl(url);

    const { filePath, filename, info } = await downloadVideo(url);

    const stat = fs.statSync(filePath);
    const host = `${req.protocol}://${req.get('host')}`;

    res.json({
      ok: true,
      data: {
        filename,
        download_url: `${host}/api/file/${filename}`,   // ← direct link
        sizeBytes: stat.size,
        sizeMB: (stat.size / 1024 / 1024).toFixed(2),
        info: normaliseYtdlpInfo(info),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/file/:filename ─────────────────────────────────────────────────

async function serveFile(req, res, next) {
  try {
    const { filename } = req.params;

    // Prevent path traversal attacks
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(TEMP_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found or already deleted' });
    }

    const stat = fs.statSync(filePath);

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Accept-Ranges', 'bytes');

    // Stream the file — no need to load it all into memory
    const stream = fs.createReadStream(filePath);
    stream.on('error', next);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/thumbnail?url= ─────────────────────────────────────────────────

async function getThumbnail(req, res, next) {
  try {
    const { url } = req.query;
    validateUrl(url);

    // 1. Get source thumbnail URL (try yt-dlp first, SociaVault fallback)
    let thumbnailSrc;
    try {
      thumbnailSrc = await getThumbnailUrl(url);
    } catch (ytErr) {
      console.warn('[THUMBNAIL] yt-dlp failed, trying SociaVault:', ytErr.message);
      try {
        const info = await svFetchInfo(url);
        thumbnailSrc = info.thumbnail;
      } catch (svErr) {
        throw Object.assign(new Error('Could not retrieve thumbnail from any source'), { status: 502 });
      }
    }

    if (!thumbnailSrc) {
      return res.status(404).json({ ok: false, error: 'No thumbnail found for this reel' });
    }

    // 2. Re-host on Cloudinary
    const cloudResult = await reHostThumbnail(thumbnailSrc);

    res.json({
      ok: true,
      data: {
        original: thumbnailSrc,
        cloudinary: cloudResult,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getInfo, downloadReel, getThumbnail, serveFile };
