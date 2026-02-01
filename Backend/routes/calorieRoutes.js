const express = require('express');
const router = express.Router();
const { calculateCalories, saveCalorieSubmission } = require('../controllers/calorieController');

// POST /api/calories/calculate - Calculate daily calories and macronutrients
router.post('/calculate', calculateCalories);
// POST /api/calories/save - Save submission (inputs + results) with userName and deviceId
router.post('/save', saveCalorieSubmission);

module.exports = router;
