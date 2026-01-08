/**
 * Admin Authentication Middleware
 * Validates admin password from x-admin-password header
 * Compares against process.env.ADMIN_PASSWORD
 */
const adminAuth = (req, res, next) => {
  // Read password from x-admin-password header (Express normalizes headers to lowercase)
  const password = req.headers['x-admin-password'] || 
                   req.headers.adminpassword; // Legacy support
  
  // TEMPORARY DEBUG LOGS - Remove after fix
  const expectedPassword = process.env.ADMIN_PASSWORD;
  console.log('🔐 [DEBUG] Admin auth check:', {
    path: req.path,
    method: req.method,
    hasPassword: !!password,
    receivedLength: password?.length || 0,
    expectedLength: expectedPassword?.length || 0,
    receivedEndsWith: password ? password.substring(password.length - 2) : 'none',
    expectedEndsWith: expectedPassword ? expectedPassword.substring(expectedPassword.length - 2) : 'none'
  });
  
  // Validate password exists
  if (!password) {
    console.log('❌ [DEBUG] No password header found');
    return res.status(403).json({
      success: false,
      message: 'Admin session expired. Please log in again.'
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
      message: 'Admin session expired. Please log in again.'
    });
  }
  
  // Validate length (should be 10 characters)
  if (trimmedExpected.length !== 10) {
    console.warn('⚠️ [DEBUG] Expected password length is not 10:', trimmedExpected.length);
  }

  console.log('✅ [DEBUG] Admin password verified');
  next();
};

module.exports = adminAuth;
