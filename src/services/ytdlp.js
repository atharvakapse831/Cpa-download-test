const { execFile } = require('child_process');
const path = require('path');
const { TEMP_DIR } = require('../config');
const { v4: uuidv4 } = require('uuid');

/**
 * Run yt-dlp with given args. Returns stdout as string.
 */
function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    execFile('yt-dlp', args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout.trim());
    });
  });
}

/**
 * Extract metadata for a reel URL via yt-dlp --dump-json.
 * Returns parsed JSON object.
 */
async function extractInfo(url) {
  const raw = await runYtDlp(['--dump-json', '--no-playlist', url]);
  return JSON.parse(raw);
}

/**
 * Download reel video to TEMP_DIR.
 * Returns { filePath, filename, info }
 */
async function downloadVideo(url) {
  const id = uuidv4();
  // Output template: tmp/<uuid>.%(ext)s
  const outputTemplate = path.join(TEMP_DIR, `${id}.%(ext)s`);

  // Get info first so we know the final filename
  const info = await extractInfo(url);
  const ext = info.ext || 'mp4';
  const filename = `${id}.${ext}`;
  const filePath = path.join(TEMP_DIR, filename);

  await runYtDlp([
    '--no-playlist',
    '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    '-o', outputTemplate,
    url,
  ]);

  return { filePath, filename, info };
}

/**
 * Get the thumbnail URL from yt-dlp metadata.
 */
async function getThumbnailUrl(url) {
  const info = await extractInfo(url);
  return info.thumbnail || (info.thumbnails && info.thumbnails[0]?.url) || null;
}

module.exports = { extractInfo, downloadVideo, getThumbnailUrl };
