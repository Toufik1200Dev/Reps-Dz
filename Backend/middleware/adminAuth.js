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

  // Trim password if it exists
  if (password) {
    password = password.trim();
  }

  const expectedPassword = (process.env.ADMIN_PASSWORD || '').trim();

  if (!password) {
    console.error('Admin authentication failed: Missing x-admin-password header');
    console.error('Request headers:', Object.keys(req.headers).filter(h => h.includes('admin') || h.includes('password') || h.includes('x-')));
    return res.status(403).json({
      success: false,
      message: 'Invalid admin password. Please log in again.'
    });
  }

  if (password !== expectedPassword) {
    console.error('Admin authentication failed: Password mismatch');
    console.error('Received length:', password.length, 'Expected length:', expectedPassword.length);
    return res.status(403).json({
      success: false,
      message: 'Invalid admin password. Please log in again.'
    });
  }

  next();
};

module.exports = adminAuth;
