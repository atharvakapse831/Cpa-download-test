const cloudinarySDK = require('cloudinary').v2;
const { cloudinary: config } = require('../config');

cloudinarySDK.config({
  cloud_name: config.cloud_name,
  api_key: config.api_key,
  api_secret: config.api_secret,
  secure: true,
});

/**
 * Upload a remote thumbnail URL to Cloudinary.
 * Returns the secure Cloudinary URL.
 */
async function reHostThumbnail(sourceUrl, publicId) {
  if (!config.cloud_name || !config.api_key) {
    throw new Error('Cloudinary credentials not configured');
  }

  const result = await cloudinarySDK.uploader.upload(sourceUrl, {
    public_id: publicId || undefined,
    folder: 'cpa/thumbnails',
    overwrite: true,
    resource_type: 'image',
    transformation: [
      { width: 1080, height: 1920, crop: 'limit' }, // cap at 1080x1920 (reel aspect)
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

module.exports = { reHostThumbnail };
