// Admin Controller
// Handles admin authentication and verification

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

module.exports = {
  verifyAdminPassword,
  getAdminStatus
};
