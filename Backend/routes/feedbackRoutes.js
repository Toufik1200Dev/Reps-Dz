const express = require('express');
const router = express.Router();
const { submitFeedback, getFeedbackList } = require('../controllers/feedbackController');

router.post('/', submitFeedback);
router.get('/', getFeedbackList);

module.exports = router;
