const axios = require('axios');
const { sociavault } = require('../config');

/**
 * Fetch reel metadata from SociaVault as fallback.
 * Normalises response to the same shape as yt-dlp extractInfo.
 */
async function fetchInfo(url) {
  if (!sociavault.apiKey) {
    throw new Error('SociaVault API key not configured');
  }

  const response = await axios.get(`${sociavault.baseUrl}/v1/media/info`, {
    params: { url },
    headers: {
      Authorization: `Bearer ${sociavault.apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });

  const d = response.data;

  // Normalise to a consistent shape
  return {
    id: d.id || d.media_id,
    title: d.title || d.caption || '',
    description: d.description || d.caption || '',
    thumbnail: d.thumbnail_url || d.cover_url || null,
    duration: d.duration || null,
    uploader: d.author?.username || d.username || null,
    uploader_id: d.author?.id || d.user_id || null,
    view_count: d.play_count || d.views || null,
    like_count: d.like_count || d.likes || null,
    upload_date: d.taken_at || d.created_at || null,
    webpage_url: url,
    _source: 'sociavault',
  };
}

module.exports = { fetchInfo };
