const express = require('express');
const router = express.Router();
const { generateProgram } = require('../controllers/programController');

// POST /api/programs/generate
router.post('/generate', generateProgram);

module.exports = router;
