/**
 * Admin Authentication Middleware
 * Validates admin password from x-admin-password header
 * Compares against process.env.ADMIN_PASSWORD
 */
const adminAuth = (req, res, next) => {
  // Express normalizes headers to lowercase
  // Only check x-admin-password (standardized header)
  let password = req.headers['x-admin-password'];

  // If password contains commas, it was sent multiple times - take the first one
  if (password && typeof password === 'string' && password.includes(',')) {
    password = password.split(',')[0].trim();
  }

  const expectedPassword = (process.env.ADMIN_PASSWORD || '').trim();

  if (!password || password.trim() !== expectedPassword) {
    console.error('Admin authentication failed: Invalid or missing password');
    return res.status(403).json({
      success: false,
      message: 'Invalid admin password. Please log in again.'
    });
  }

  next();
};

module.exports = adminAuth;
