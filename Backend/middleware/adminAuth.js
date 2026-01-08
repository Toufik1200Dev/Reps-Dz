/**
 * Admin Authentication Middleware
 * Validates admin password from x-admin-password header
 * Compares against process.env.ADMIN_PASSWORD
 */
const adminAuth = (req, res, next) => {
  // Express normalizes headers to lowercase
  // Get password from header (might be comma-separated if sent multiple times)
  let password = req.headers['x-admin-password'] || 
                 req.headers.adminpassword ||
                 req.headers['adminpassword'];

  // If password contains commas, it was sent multiple times - take the first one
  if (password && password.includes(',')) {
    password = password.split(',')[0].trim();
  }

  const expectedPassword = process.env.ADMIN_PASSWORD || '';

  if (!password || password.trim() !== expectedPassword.trim()) {
    console.error('Admin authentication failed: Invalid password');
    return res.status(403).json({
      success: false,
      message: 'Invalid admin password. Please log in again.'
    });
  }

  next();
};

module.exports = adminAuth;
