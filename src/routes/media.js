const express = require('express');
const router = express.Router();
const { getInfo, downloadReel, getThumbnail, serveFile } = require('../controllers/mediaController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/info', getInfo);
router.post('/download', downloadReel);
router.get('/thumbnail', getThumbnail);
router.get('/file/:filename', serveFile);

module.exports = router;
