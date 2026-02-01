const express = require('express');
const router = express.Router();
const { generateProgram, generateBatchPrograms, saveProgram } = require('../controllers/programController');

// POST /api/programs/generate - Generate single 4-week program
router.post('/generate', generateProgram);
// POST /api/programs/save - Save program with userName and deviceId
router.post('/save', saveProgram);

// POST /api/programs/batch - Generate 50 unique programs for a level
router.post('/batch', generateBatchPrograms);

module.exports = router;
