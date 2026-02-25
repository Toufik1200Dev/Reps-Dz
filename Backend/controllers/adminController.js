// Admin Controller
// Handles admin authentication and verification

const CalorieSubmission = require('../models/CalorieSubmission');
const ProgramSave = require('../models/ProgramSave');
const SixWeekRequest = require('../models/SixWeekRequest');
const GeneratorFeedback = require('../models/GeneratorFeedback');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const FreeProgramLimit = require('../models/FreeProgramLimit');
const adminIpWhitelist = require('../middleware/adminIpWhitelist');

/**
 * @desc    Verify admin password
 * @route   POST /api/admin/login
 * @access  Public
 */
const verifyAdminPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedPassword) {
      console.error('❌ ADMIN_PASSWORD environment variable not set');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: ADMIN_PASSWORD not set'
      });
    }

    // Check for whitespace issues - trim both for comparison
    const trimmedPassword = password?.trim();
    const trimmedExpected = expectedPassword?.trim();
    
    // Compare trimmed versions to handle whitespace issues
    if (trimmedPassword !== trimmedExpected) {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin password. Please check for typos or extra spaces.'
      });
    }

    // Password is correct
    res.status(200).json({
      success: true,
      message: 'Admin password verified successfully'
    });

  } catch (error) {
    console.error('Error verifying admin password:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying admin password',
      error: error.message
    });
  }
};

/**
 * @desc    Check admin password status (for debugging)
 * @route   GET /api/admin/status
 * @access  Public
 */
const getAdminStatus = async (req, res) => {
  try {
    const hasPassword = !!process.env.ADMIN_PASSWORD;
    const passwordLength = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.length : 0;
    const passwordStartsWith = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.substring(0, 2) : null;
    const passwordEndsWith = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.substring(passwordLength - 2) : null;
    
    // Check for whitespace
    const hasLeadingSpace = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.startsWith(' ') : false;
    const hasTrailingSpace = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.endsWith(' ') : false;
    
    res.status(200).json({
      success: true,
      hasPassword,
      passwordLength,
      passwordStartsWith,
      passwordEndsWith,
      hasLeadingSpace,
      hasTrailingSpace,
      message: hasPassword 
        ? `ADMIN_PASSWORD is configured (${passwordLength} characters)` 
        : 'ADMIN_PASSWORD is NOT set in environment variables',
      warning: (hasLeadingSpace || hasTrailingSpace) 
        ? '⚠️ WARNING: Password has leading/trailing spaces! Remove them in Render environment variables.' 
        : null,
      hint: hasPassword 
        ? `Expected password: ${passwordStartsWith}***${passwordEndsWith} (${passwordLength} chars)` 
        : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking admin status',
      error: error.message
    });
  }
};

/**
 * @desc    Get calorie stats and all user submissions
 * @route   GET /api/admin/stats/calories
 * @access  Private (Admin)
 */
const getCalorieStatsWithSubmissions = async (req, res) => {
  try {
    const { range = 'all' } = req.query;
    const now = new Date();
    let startDate = null;
    if (range === '7d') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (range === '30d') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const filter = startDate ? { createdAt: { $gte: startDate } } : {};
    const submissions = await CalorieSubmission.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const total = submissions.length;
    const uniqueDevices = new Set(submissions.map(s => s.deviceId).filter(Boolean)).size;
    const avgCalories = total > 0
      ? Math.round(submissions.reduce((sum, s) => sum + (s.calories || 0), 0) / total)
      : 0;
    const avgBMR = total > 0
      ? Math.round(submissions.reduce((sum, s) => sum + (s.bmr || 0), 0) / total)
      : 0;
    const days = range === '7d' ? 7 : range === '30d' ? 30 : Math.max(1, Math.ceil((now - (startDate || new Date(0))) / (24 * 60 * 60 * 1000)));
    const averagePerDay = days > 0 ? (total / days).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalCalculations: total,
          totalUsers: uniqueDevices,
          averageCalories: avgCalories,
          averageBMR: avgBMR,
          averagePerDay,
          peakHour: 'N/A',
          mostCommonGoal: 'N/A'
        },
        submissions
      }
    });
  } catch (error) {
    console.error('Error fetching calorie stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching calorie stats',
      error: error.message
    });
  }
};

/**
 * @desc    Get program generator stats and all saved programs
 * @route   GET /api/admin/stats/generator
 * @access  Private (Admin)
 */
const getGeneratorStatsWithSubmissions = async (req, res) => {
  try {
    const { range = 'all' } = req.query;
    const now = new Date();
    let startDate = null;
    if (range === '7d') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (range === '30d') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const filter = startDate ? { createdAt: { $gte: startDate } } : {};
    const submissions = await ProgramSave.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const total = submissions.length;
    const uniqueDevices = new Set(submissions.map(s => s.deviceId).filter(Boolean)).size;
    const days = range === '7d' ? 7 : range === '30d' ? 30 : Math.max(1, Math.ceil((now - (startDate || new Date(0))) / (24 * 60 * 60 * 1000)));
    const averagePerDay = days > 0 ? (total / days).toFixed(1) : 0;

    const beginnerCount = submissions.filter(s => s.level === 'beginner').length;
    const intermediateCount = submissions.filter(s => s.level === 'intermediate').length;
    const advancedCount = submissions.filter(s => s.level === 'advanced').length;

    // Six-week plan requests (paid flow - sent via email)
    const sixWeekFilter = startDate ? { createdAt: { $gte: startDate } } : {};
    const sixWeekRequests = await SixWeekRequest.find(sixWeekFilter)
      .sort({ createdAt: -1 })
      .lean();
    const sixWeekTotal = sixWeekRequests.length;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalGenerations: total,
          totalUsers: uniqueDevices,
          beginnerCount,
          intermediateCount,
          advancedCount,
          averagePerDay,
          peakHour: 'N/A',
          mostPopularExercise: 'N/A',
          sixWeekTotal,
          sixWeekRequests
        },
        submissions
      }
    });
  } catch (error) {
    console.error('Error fetching generator stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching generator stats',
      error: error.message
    });
  }
};

/**
 * @desc    Get all generator feedback (admin) with count
 * @route   GET /api/admin/feedback
 * @access  Private (Admin)
 */
const getFeedbackListAdmin = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const [list, total] = await Promise.all([
      GeneratorFeedback.find().sort({ createdAt: -1 }).limit(limit).lean(),
      GeneratorFeedback.countDocuments()
    ]);
    res.status(200).json({
      success: true,
      data: { feedback: list, total }
    });
  } catch (err) {
    console.error('Error fetching feedback (admin):', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: err.message
    });
  }
};

/**
 * @desc    Delete a feedback (admin)
 * @route   DELETE /api/admin/feedback/:id
 * @access  Private (Admin)
 */
const deleteFeedback = async (req, res) => {
  try {
    const deleted = await GeneratorFeedback.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }
    res.status(200).json({ success: true, message: 'Feedback deleted' });
  } catch (err) {
    console.error('Error deleting feedback:', err);
    res.status(500).json({
      success: false,
      message: 'Error deleting feedback',
      error: err.message
    });
  }
};

/**
 * @desc    Get IP whitelist and current client IP
 * @route   GET /api/admin/settings/ip-whitelist
 * @access  Private (Admin)
 */
const getIpWhitelist = async (req, res) => {
  try {
    const ips = adminIpWhitelist.getWhitelist();
    const currentClientIp = adminIpWhitelist.getClientIp(req);
    res.status(200).json({
      success: true,
      data: { ips, currentClientIp }
    });
  } catch (error) {
    console.error('Error fetching IP whitelist:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching IP whitelist',
      error: error.message
    });
  }
};

/**
 * @desc    Update IP whitelist
 * @route   PUT /api/admin/settings/ip-whitelist
 * @access  Private (Admin)
 */
const updateIpWhitelist = async (req, res) => {
  try {
    const { ips } = req.body;
    const list = Array.isArray(ips) ? ips.map((ip) => String(ip).trim()).filter(Boolean) : [];
    adminIpWhitelist.saveWhitelist(list);
    res.status(200).json({
      success: true,
      message: 'IP whitelist updated',
      data: { ips: list }
    });
  } catch (error) {
    console.error('Error updating IP whitelist:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating IP whitelist',
      error: error.message
    });
  }
};

/**
 * @desc    Get program PDF emails sent with pagination (free 1-week + paid 6/12-week)
 * @route   GET /api/admin/emails-sent?page=1&limit=20
 * @access  Private (Admin)
 */
const getEmailsSent = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [free1WeekCount, paidCount, list] = await Promise.all([
      ProgramSave.countDocuments({ deviceId: { $exists: true, $ne: '' } }),
      SixWeekRequest.countDocuments({}),
      ProgramSave.aggregate([
        {
          $project: {
            email: '$deviceId',
            userName: { $ifNull: ['$userName', '—'] },
            sentAt: '$createdAt',
            type: { $literal: 'free_1week' },
            programSaveId: '$_id',
            level: 1
          }
        },
        { $match: { email: { $exists: true, $ne: '' } } },
        {
          $unionWith: {
            coll: 'sixweekrequests',
            pipeline: [
              {
                $project: {
                  email: 1,
                  userName: { $ifNull: ['$userName', '—'] },
                  sentAt: '$createdAt',
                  type: { $literal: 'paid_6week' },
                  programSaveId: null,
                  level: 1
                }
              }
            ]
          }
        },
        { $sort: { sentAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ])
    ]);

    const totalEmailsSent = free1WeekCount + paidCount;
    const totalPages = Math.max(1, Math.ceil(totalEmailsSent / limit));

    res.status(200).json({
      success: true,
      data: {
        totalEmailsSent,
        free1WeekCount,
        paidCount,
        list,
        pagination: {
          page,
          limit,
          totalPages,
          totalItems: totalEmailsSent,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching emails sent:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching emails sent',
      error: error.message
    });
  }
};

/**
 * @desc    Get all free program limits (freeprogramlimits collection) with pagination
 * @route   GET /api/admin/free-program-limits?page=1&limit=20
 * @access  Private (Admin)
 */
const getFreeProgramLimits = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [totalItems, list] = await Promise.all([
      FreeProgramLimit.countDocuments({}),
      FreeProgramLimit.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    res.status(200).json({
      success: true,
      data: {
        list,
        pagination: {
          page,
          limit,
          totalPages,
          totalItems,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching free program limits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching free program limits',
      error: error.message
    });
  }
};

/**
 * @desc    Get analytics stats (page views, visitors) for dashboard
 * @route   GET /api/admin/stats/analytics
 * @access  Private (Admin)
 */
const getAnalyticsStats = async (req, res) => {
  try {
    const totalPageViews = await AnalyticsEvent.countDocuments({ type: 'page_view' });
    const totalVisits = await AnalyticsEvent.countDocuments({ type: 'visit' });
    const distinctVisitors = await AnalyticsEvent.distinct('visitorId', { visitorId: { $exists: true, $ne: '' } });
    const totalVisitors = distinctVisitors.filter(Boolean).length;
    res.status(200).json({
      success: true,
      data: {
        totalPageViews,
        totalVisitors: totalVisitors > 0 ? totalVisitors : totalPageViews,
        totalVisits
      }
    });
  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics stats',
      error: error.message
    });
  }
};

module.exports = {
  verifyAdminPassword,
  getAdminStatus,
  getCalorieStatsWithSubmissions,
  getGeneratorStatsWithSubmissions,
  getFeedbackListAdmin,
  deleteFeedback,
  getIpWhitelist,
  updateIpWhitelist,
  getAnalyticsStats,
  getEmailsSent,
  getFreeProgramLimits
};
