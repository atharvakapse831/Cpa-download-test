const { SERVICE_SECRET } = require('../config');

/**
 * If SERVICE_SECRET is set, require x-service-secret header.
 * If not configured, all requests pass through (dev mode).
 */
function authMiddleware(req, res, next) {
  if (!SERVICE_SECRET) return next();

  const provided = req.headers['x-service-secret'];
  if (!provided || provided !== SERVICE_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = { authMiddleware };
