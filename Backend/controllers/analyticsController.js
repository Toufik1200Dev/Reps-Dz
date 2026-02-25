const AnalyticsEvent = require('../models/AnalyticsEvent');

/**
 * @desc    Track a page view or visit (public)
 * @route   POST /api/analytics/track
 * @body    { type: 'page_view'|'visit', path?, pageName?, visitorId? }
 */
const track = async (req, res) => {
  try {
    const { type = 'page_view', path = '/', pageName, visitorId } = req.body;
    const date = new Date().toISOString().split('T')[0];
    await AnalyticsEvent.create({
      type: type === 'visit' ? 'visit' : 'page_view',
      path: path || '/',
      pageName: pageName || path || '',
      date,
      visitorId: visitorId || undefined
    });
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Analytics track error:', err);
    res.status(500).json({ success: false, message: 'Failed to track' });
  }
};

module.exports = { track };
