const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

// Admin login/verification (public route - no auth needed)
router.post('/login', adminController.verifyAdminPassword);
router.get('/status', adminController.getAdminStatus);

// Admin stats (protected - require x-admin-password)
router.get('/stats/calories', adminAuth, adminController.getCalorieStatsWithSubmissions);
router.get('/stats/generator', adminAuth, adminController.getGeneratorStatsWithSubmissions);

module.exports = router;
