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

  // Debug logging - show ALL headers that might contain password
  console.log('🔐 [AUTH] Product route authentication check:', {
    path: req.path,
    method: req.method,
    'x-admin-password': req.headers['x-admin-password'] || 'NOT FOUND',
    'adminpassword': req.headers.adminpassword || 'NOT FOUND',
    'X-Admin-Password': req.headers['x-admin-password'] || 'NOT FOUND', // Check original case
    allHeaderKeys: Object.keys(req.headers).filter(h => 
      h.toLowerCase().includes('admin') || 
      h.toLowerCase().includes('password') ||
      h.toLowerCase().includes('x-')
    ),
    receivedPassword: password ? password.substring(0, 2) + '***' + password.substring(password.length - 2) : 'NONE',
    receivedLength: password?.length || 0,
    expectedLength: (process.env.ADMIN_PASSWORD || '').length || 0,
    expectedPreview: (process.env.ADMIN_PASSWORD || '').substring(0, 2) + '***' + (process.env.ADMIN_PASSWORD || '').substring((process.env.ADMIN_PASSWORD || '').length - 2)
  });

  // If password contains commas, it was sent multiple times - take the first one
  if (password && password.includes(',')) {
    password = password.split(',')[0].trim();
  }

  const expectedPassword = process.env.ADMIN_PASSWORD || '';

  if (!password || password.trim() !== expectedPassword.trim()) {
    console.log('❌ [AUTH] Password mismatch - REJECTED');
    console.log('   Received:', password ? `"${password.substring(0, 2)}...${password.substring(password.length - 2)}" (length: ${password.length})` : 'NONE');
    console.log('   Expected:', expectedPassword ? `"${expectedPassword.substring(0, 2)}...${expectedPassword.substring(expectedPassword.length - 2)}" (length: ${expectedPassword.length})` : 'NOT SET');
    return res.status(403).json({
      success: false,
      message: 'Invalid admin password. Please log in again.'
    });
  }

  console.log('✅ [AUTH] Password verified - APPROVED');
  next();
};

module.exports = adminAuth;
