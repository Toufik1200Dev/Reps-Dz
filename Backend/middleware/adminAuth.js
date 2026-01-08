/**
 * Admin Authentication Middleware
 * Validates admin password from x-admin-password header
 * Compares against process.env.ADMIN_PASSWORD
 */
const adminAuth = (req, res, next) => {
  // Read password from x-admin-password header
  // Express normalizes headers to lowercase and converts hyphens
  // 'x-admin-password' in request becomes 'x-admin-password' in req.headers
  // Try multiple variations to ensure we catch it
  const password = req.headers['x-admin-password'] || 
                   req.headers['x-admin-password'] ||
                   req.headers['xadminpassword'] ||
                   req.headers.adminpassword || // Legacy support
                   req.headers['adminpassword'];
  
  // EXTRA DEBUG: Log specific headers we're looking for
  console.log('🔐 [DEBUG] Header check:', {
    'x-admin-password': req.headers['x-admin-password'] || 'NOT FOUND',
    'adminpassword': req.headers.adminpassword || 'NOT FOUND',
    'xadminpassword': req.headers['xadminpassword'] || 'NOT FOUND',
    allHeaderKeys: Object.keys(req.headers).filter(h => 
      h.toLowerCase().includes('admin') || 
      h.toLowerCase().includes('password') ||
      h.toLowerCase().includes('x-admin')
    )
  });
  
  // TEMPORARY DEBUG LOGS - Remove after fix
  const expectedPassword = process.env.ADMIN_PASSWORD;
  console.log('🔐 [DEBUG] Admin auth check:', {
    path: req.path,
    method: req.method,
    hasPassword: !!password,
    receivedLength: password?.length || 0,
    expectedLength: expectedPassword?.length || 0,
    receivedEndsWith: password ? password.substring(password.length - 2) : 'none',
    expectedEndsWith: expectedPassword ? expectedPassword.substring(expectedPassword.length - 2) : 'none',
    allHeaders: Object.keys(req.headers).filter(h => h.toLowerCase().includes('admin') || h.toLowerCase().includes('x-admin'))
  });
  
  // EXTRA DEBUG: Log the actual values (be careful in production)
  if (password) {
    console.log('🔐 [DEBUG] Received password:', password);
    console.log('🔐 [DEBUG] Received password (trimmed):', password.trim());
  }
  if (expectedPassword) {
    console.log('🔐 [DEBUG] Expected password:', expectedPassword);
    console.log('🔐 [DEBUG] Expected password (trimmed):', expectedPassword.trim());
  }
  
  // Validate password exists
  if (!password) {
    console.log('❌ [DEBUG] No password header found');
    return res.status(403).json({
      success: false,
      message: 'Invalid admin password. Please log in again.'
    });
  }

  // Validate ADMIN_PASSWORD is set
  if (!expectedPassword) {
    console.error('❌ ADMIN_PASSWORD environment variable not set');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: ADMIN_PASSWORD not set'
    });
  }

  // Trim both for comparison (handle whitespace issues)
  const trimmedPassword = password.trim();
  const trimmedExpected = expectedPassword.trim();
  
  // TEMPORARY DEBUG - Remove after fix
  console.log('🔐 [DEBUG] Password comparison:', {
    received: trimmedPassword.substring(0, 2) + '***' + trimmedPassword.substring(trimmedPassword.length - 2),
    expected: trimmedExpected.substring(0, 2) + '***' + trimmedExpected.substring(trimmedExpected.length - 2),
    receivedLength: trimmedPassword.length,
    expectedLength: trimmedExpected.length,
    match: trimmedPassword === trimmedExpected
  });
  
  // Validate exact match
  if (trimmedPassword !== trimmedExpected) {
    console.log('❌ [DEBUG] Password mismatch');
    return res.status(403).json({
      success: false,
      message: 'Invalid admin password. Please log in again.'
    });
  }
  
  // Validate length (log actual length for debugging)
  console.log('🔐 [DEBUG] Password length check:', {
    receivedLength: trimmedPassword.length,
    expectedLength: trimmedExpected.length,
    note: 'Password length can vary, this is just for debugging'
  });

  console.log('✅ [DEBUG] Admin password verified');
  next();
};

module.exports = adminAuth;
