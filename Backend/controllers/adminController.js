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

    // Debug logging (remove in production if needed)
    console.log('🔐 Admin login attempt - Password length:', password?.length, 'Expected length:', expectedPassword?.length);
    
    if (password !== expectedPassword) {
      console.log('❌ Admin password mismatch');
      return res.status(403).json({
        success: false,
        message: 'Invalid admin password'
      });
    }

    console.log('✅ Admin password verified successfully');

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
    
    res.status(200).json({
      success: true,
      hasPassword,
      passwordLength,
      message: hasPassword 
        ? 'ADMIN_PASSWORD is configured' 
        : 'ADMIN_PASSWORD is NOT set in environment variables'
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
