const adminAuth = (req, res, next) => {
  // Read admin password from x-admin-password header (Express normalizes to lowercase)
  // Also check legacy header names for backward compatibility
  const adminPassword = req.headers['x-admin-password'] || 
                       req.headers['x-admin-password'] ||
                       req.headers.adminpassword || 
                       req.headers['adminpassword'] || 
                       req.headers['admin-password'];
  
  // Debug logging
  console.log('🔐 Admin auth check:', {
    path: req.path,
    method: req.method,
    hasAdminPassword: !!adminPassword,
    adminPasswordLength: adminPassword?.length || 0,
    headerKeys: Object.keys(req.headers).filter(h => h.toLowerCase().includes('admin') || h.toLowerCase().includes('x-admin'))
  });
  
  if (!adminPassword) {
    console.log('❌ Admin auth failed: No password header found');
    console.log('   All header keys:', Object.keys(req.headers));
    return res.status(401).json({
      success: false,
      message: 'Admin password required'
    });
  }

  const expectedPassword = process.env.ADMIN_PASSWORD;
  
  if (!expectedPassword) {
    console.error('❌ ADMIN_PASSWORD environment variable not set');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: ADMIN_PASSWORD not set'
    });
  }

  // Trim both for comparison (handle whitespace issues)
  const trimmedPassword = adminPassword.trim();
  const trimmedExpected = expectedPassword.trim();
  
  if (trimmedPassword !== trimmedExpected) {
    console.log('❌ Admin password mismatch in middleware');
    console.log('   Received password length:', trimmedPassword.length);
    console.log('   Expected password length:', trimmedExpected.length);
    console.log('   Received ends with:', trimmedPassword.substring(trimmedPassword.length - 2));
    console.log('   Expected ends with:', trimmedExpected.substring(trimmedExpected.length - 2));
    return res.status(403).json({
      success: false,
      message: 'Invalid admin password',
      hint: `Expected password length: ${trimmedExpected.length} characters. Please log in again.`
    });
  }
  
  console.log('✅ Admin password verified in middleware');

  next();
};

module.exports = adminAuth;
