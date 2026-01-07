const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Admin login/verification (public route - no auth needed)
router.post('/login', adminController.verifyAdminPassword);
router.get('/status', adminController.getAdminStatus);

module.exports = router;
