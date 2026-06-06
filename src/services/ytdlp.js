const { execFile } = require('child_process');

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    const bin = process.env.YTDLP_PATH || 'yt-dlp';
    execFile(bin, args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout.trim());
    });
  });
}

/**
 * Extract full metadata for a reel URL.
 * Returns normalised object.
 */
async function extractInfo(url) {
  const raw = await runYtDlp(['--dump-json', '--no-playlist', url]);
  const d   = JSON.parse(raw);

  return {
    id:          d.id,
    title:       d.title || d.description || '',
    description: d.description || '',
    thumbnail:   d.thumbnail || (d.thumbnails?.[0]?.url) || null,
    duration:    d.duration   || null,
    uploader:    d.uploader   || d.channel || null,
    uploader_id: d.uploader_id || d.channel_id || null,
    view_count:  d.view_count  || null,
    like_count:  d.like_count  || null,
    upload_date: d.upload_date || null,
    webpage_url: d.webpage_url || url,
    ext:         d.ext || 'mp4',
  };
}

/**
 * Return just the raw thumbnail URL from metadata.
 */
async function getRawThumbnailUrl(url) {
  const info = await extractInfo(url);
  if (!info.thumbnail) throw new Error('No thumbnail found in metadata');
  return info.thumbnail;
}

module.exports = { extractInfo, getRawThumbnailUrl };
