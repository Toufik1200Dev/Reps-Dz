const express = require('express');
const router = express.Router();
const { calculateCalories } = require('../controllers/calorieController');

// POST /api/calories/calculate
// Calculate daily calories and macronutrients
router.post('/calculate', calculateCalories);

module.exports = router;
