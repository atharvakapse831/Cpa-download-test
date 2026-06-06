const express = require('express');
const router  = express.Router();
const { getInfo, getThumbnail } = require('../controllers/metaController');

// GET /api/info?url=
router.get('/info', getInfo);

// GET /api/thumbnail?url=
router.get('/thumbnail', getThumbnail);

module.exports = router;
