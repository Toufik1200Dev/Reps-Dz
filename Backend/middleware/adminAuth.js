/**
 * Admin Authentication Middleware
 * Validates admin password from x-admin-password header
 * Compares against process.env.ADMIN_PASSWORD
 */
const adminAuth = (req, res, next) => {
  // Express normalizes headers to lowercase
  // Check multiple header name variations
  const password = req.headers['x-admin-password'] || 
                   req.headers.adminpassword;

  // TEMPORARY DEBUG - Remove after fix
  console.log('🔐 [AUTH] Header check:', {
    'x-admin-password': req.headers['x-admin-password'] || 'NOT FOUND',
    'adminpassword': req.headers.adminpassword || 'NOT FOUND',
    receivedPassword: password || 'NONE',
    expectedPassword: process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.substring(0, 2) + '***' + process.env.ADMIN_PASSWORD.substring(process.env.ADMIN_PASSWORD.length - 2) : 'NOT SET',
    match: password && password.trim() === (process.env.ADMIN_PASSWORD || '').trim()
  });

  if (!password || password.trim() !== (process.env.ADMIN_PASSWORD || '').trim()) {
    return res.status(403).json({
      success: false,
      message: 'Invalid admin password. Please log in again.'
    });
  }

  next();
};

module.exports = adminAuth;
