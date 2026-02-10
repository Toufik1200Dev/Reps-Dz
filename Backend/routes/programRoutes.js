const express = require('express');
const router = express.Router();
const { generateProgram, generateProgram6Week, generateAndSend6WeekEmail, sendFreeProgramEmail, getFreeLimitStatus, generateBatchPrograms, saveProgram, createPayPalOrderHandler, fulfillPaidProgram, submitCustomizedRequest } = require('../controllers/programController');

// POST /api/programs/generate - Generate single 1-week (free) program
router.post('/generate', generateProgram);
// POST /api/programs/generate-6week - Generate paid 6-week program (auto level, nutrition, 5 days, max test week 6)
router.post('/generate-6week', generateProgram6Week);
// POST /api/programs/send-6week-email - Generate 6-week program and send to user's email (no payment - legacy)
router.post('/send-6week-email', generateAndSend6WeekEmail);
// POST /api/programs/send-free-email - Generate 1-week free program and send to user's email
router.post('/send-free-email', sendFreeProgramEmail);
// GET /api/programs/free-limit?email=... - Get free limit status for email this month
router.get('/free-limit', getFreeLimitStatus);
// POST /api/programs/create-paypal-order - Create PayPal order for 6-week paid plan
router.post('/create-paypal-order', createPayPalOrderHandler);
// POST /api/programs/fulfill-paid - After PayPal approval, capture and send program to email
router.post('/fulfill-paid', fulfillPaidProgram);
// POST /api/programs/submit-customized - Submit customized program request (sends to admin email)
router.post('/submit-customized', submitCustomizedRequest);
// POST /api/programs/save - Save program with userName and deviceId
router.post('/save', saveProgram);

// POST /api/programs/batch - Generate 50 unique programs for a level
router.post('/batch', generateBatchPrograms);

module.exports = router;
