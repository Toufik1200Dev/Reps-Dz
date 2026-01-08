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

  // Debug logging
  console.log('🔐 [AUTH] Product route authentication check:', {
    path: req.path,
    method: req.method,
    'x-admin-password': req.headers['x-admin-password'] || 'NOT FOUND',
    'adminpassword': req.headers.adminpassword || 'NOT FOUND',
    receivedPassword: password ? password.substring(0, 2) + '***' + password.substring(password.length - 2) : 'NONE',
    receivedLength: password?.length || 0,
    expectedLength: (process.env.ADMIN_PASSWORD || '').length || 0
  });

  // If password contains commas, it was sent multiple times - take the first one
  if (password && password.includes(',')) {
    password = password.split(',')[0].trim();
  }

  const expectedPassword = process.env.ADMIN_PASSWORD || '';

  if (!password || password.trim() !== expectedPassword.trim()) {
    console.log('❌ [AUTH] Password mismatch - REJECTED');
    return res.status(403).json({
      success: false,
      message: 'Invalid admin password. Please log in again.'
    });
  }

  console.log('✅ [AUTH] Password verified - APPROVED');
  next();
};

module.exports = adminAuth;
