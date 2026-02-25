const express = require('express');
const router = express.Router();
const { track } = require('../controllers/analyticsController');

router.post('/track', track);

module.exports = router;
