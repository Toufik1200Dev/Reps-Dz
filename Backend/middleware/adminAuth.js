/**
 * Admin Authentication Middleware
 * Validates admin password from x-admin-password header
 * Compares against process.env.ADMIN_PASSWORD
 */
const adminAuth = (req, res, next) => {
  // Express normalizes headers to lowercase
  // Custom headers with hyphens: 'X-Admin-Password' becomes 'x-admin-password'
  // Check all possible variations
  const password = req.headers['x-admin-password'] || 
                   req.headers.adminpassword ||
                   req.headers['adminpassword'];

  // TEMPORARY DEBUG - Remove after fix
  const expectedPassword = process.env.ADMIN_PASSWORD || '';
  console.log('🔐 [AUTH] Request received:', {
    path: req.path,
    method: req.method,
    allHeaderKeys: Object.keys(req.headers).filter(h => 
      h.toLowerCase().includes('admin') || 
      h.toLowerCase().includes('password') ||
      h.toLowerCase().includes('x-')
    ),
    'x-admin-password': req.headers['x-admin-password'] || 'NOT FOUND',
    'adminpassword': req.headers.adminpassword || 'NOT FOUND',
    receivedPassword: password ? password.substring(0, 2) + '***' + password.substring(password.length - 2) : 'NONE',
    receivedLength: password?.length || 0,
    receivedFull: password || 'NONE', // TEMPORARY - Remove after debugging
    expectedPassword: expectedPassword ? expectedPassword.substring(0, 2) + '***' + expectedPassword.substring(expectedPassword.length - 2) : 'NOT SET',
    expectedLength: expectedPassword.length || 0,
    expectedFull: expectedPassword || 'NOT SET', // TEMPORARY - Remove after debugging
    match: password && password.trim() === expectedPassword.trim()
  });

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
