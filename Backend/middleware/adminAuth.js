const adminAuth = (req, res, next) => {
  // Express normalizes headers to lowercase, so check lowercase version
  // Also check original case variants just in case
  const adminPassword = req.headers.adminpassword || 
                       req.headers['adminpassword'] || 
                       req.headers['admin-password'] || 
                       req.headers['adminpassword'] ||
                       req.headers['AdminPassword'] || 
                       req.headers['Admin-Password'];
  
  // Debug logging
  console.log('🔐 Admin auth check:', {
    path: req.path,
    method: req.method,
    hasAdminPassword: !!adminPassword,
    adminPasswordLength: adminPassword?.length || 0,
    headerKeys: Object.keys(req.headers).filter(h => h.toLowerCase().includes('admin'))
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
    return res.status(403).json({
      success: false,
      message: 'Invalid admin password'
    });
  }

  next();
};

module.exports = adminAuth;
