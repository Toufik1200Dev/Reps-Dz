/**
 * Admin Authentication Middleware
 * Validates admin password from x-admin-password header
 * Compares against process.env.ADMIN_PASSWORD
 */
const adminAuth = (req, res, next) => {
  // Express normalizes headers to lowercase, but also check raw headers
  // Get password from header (might be comma-separated if sent multiple times)
  let password = req.headers['x-admin-password'] || 
                 req.headers.adminpassword ||
                 req.headers['adminpassword'] ||
                 req.rawHeaders?.[req.rawHeaders.indexOf('x-admin-password') + 1] ||
                 req.rawHeaders?.[req.rawHeaders.indexOf('X-Admin-Password') + 1];

  // Debug: Log all headers that might contain the password
  if (!password) {
    console.error('Admin authentication failed: No password header found');
    console.error('Available headers:', Object.keys(req.headers).filter(h => 
      h.toLowerCase().includes('admin') || 
      h.toLowerCase().includes('password') ||
      h.toLowerCase().includes('x-')
    ));
    return res.status(403).json({
      success: false,
      message: 'Invalid admin password. Please log in again.'
    });
  }

  // If password contains commas, it was sent multiple times - take the first one
  if (password && password.includes(',')) {
    password = password.split(',')[0].trim();
  }

  const expectedPassword = process.env.ADMIN_PASSWORD || '';

  if (!password || password.trim() !== expectedPassword.trim()) {
    console.error('Admin authentication failed: Password mismatch');
    return res.status(403).json({
      success: false,
      message: 'Invalid admin password. Please log in again.'
    });
  }

  next();
};

module.exports = adminAuth;
