/**
 * Admin Authentication Middleware
 * Validates admin password from x-admin-password header
 * Compares against process.env.ADMIN_PASSWORD
 */
const adminAuth = (req, res, next) => {
  // Express normalizes headers to lowercase
  // Custom headers with hyphens: 'x-admin-password' stays as 'x-admin-password'
  // Also check legacy header name
  const password = req.headers['x-admin-password'] || 
                   req.headers['x-admin-password'] ||
                   req.headers.adminpassword;

  if (!password || password.trim() !== (process.env.ADMIN_PASSWORD || '').trim()) {
    return res.status(403).json({
      success: false,
      message: 'Invalid admin password. Please log in again.'
    });
  }

  next();
};

module.exports = adminAuth;
