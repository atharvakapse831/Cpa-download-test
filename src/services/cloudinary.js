const cloudinarySDK = require('cloudinary').v2;
const { cloudinary: cfg } = require('../config');

cloudinarySDK.config({
  cloud_name: cfg.cloud_name,
  api_key:    cfg.api_key,
  api_secret: cfg.api_secret,
  secure:     true,
});

/**
 * Upload Instagram thumbnail URL → Cloudinary.
 * Returns stable Cloudinary URL immediately usable in frontend.
 */
async function reHostThumbnail(sourceUrl) {
  if (!cfg.cloud_name || !cfg.api_key) {
    throw new Error('Cloudinary credentials not configured');
  }

  const result = await cloudinarySDK.uploader.upload(sourceUrl, {
    folder:        'cpa/thumbnails',
    overwrite:     false,          // same URL → same asset, no re-upload
    resource_type: 'image',
    transformation: [
      { width: 1080, height: 1920, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
  });

  return {
    url:      result.secure_url,   // ← this is what frontend uses
    publicId: result.public_id,
    width:    result.width,
    height:   result.height,
    format:   result.format,
    bytes:    result.bytes,
  };
}

module.exports = { reHostThumbnail };
