const GeneratorFeedback = require('../models/GeneratorFeedback');

/** POST /api/feedback – submit generator feedback (public) */
const submitFeedback = async (req, res) => {
  try {
    const { name, message, planUsed } = req.body;
    if (!name || !message || typeof name !== 'string' || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Name and message are required.'
      });
    }
    const trimmedName = name.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName || !trimmedMessage) {
      return res.status(400).json({
        success: false,
        message: 'Name and message are required.'
      });
    }
    if (trimmedMessage.length > 800) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 800 characters.'
      });
    }
    const validPlans = ['1-week', '6-week', '12-week', ''];
    const plan = validPlans.includes(planUsed) ? planUsed : '';

    const feedback = await GeneratorFeedback.create({
      name: trimmedName,
      message: trimmedMessage,
      planUsed: plan,
      approved: true
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback!',
      data: { _id: feedback._id, name: feedback.name, message: feedback.message, planUsed: feedback.planUsed, createdAt: feedback.createdAt }
    });
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback.',
      error: err.message
    });
  }
};

/** GET /api/feedback – list approved feedback (public) */
const getFeedbackList = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const feedbacks = await GeneratorFeedback.find({ approved: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name message planUsed createdAt');

    res.json({
      success: true,
      data: feedbacks
    });
  } catch (err) {
    console.error('Error fetching feedback:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to load feedback.',
      error: err.message
    });
  }
};

module.exports = {
  submitFeedback,
  getFeedbackList
};
