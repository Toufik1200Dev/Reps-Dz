const adminAuth = (req, res, next) => {
  // Check for admin password in multiple header formats (headers are case-insensitive in Express)
  // Express normalizes headers to lowercase, but check multiple variants just in case
  const adminPassword = req.headers.adminpassword || req.headers['adminpassword'] || req.headers['admin-password'] || req.headers['AdminPassword'] || req.headers['Admin-Password'];
  
  if (!adminPassword) {
    console.log('❌ Admin auth failed: No password header found');
    console.log('   Request headers keys:', Object.keys(req.headers).filter(h => h.toLowerCase().includes('admin')));
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
