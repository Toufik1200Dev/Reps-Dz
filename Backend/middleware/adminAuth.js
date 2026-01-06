const adminAuth = (req, res, next) => {
  const adminPassword = req.headers.adminpassword;
  
  if (!adminPassword) {
    return res.status(401).json({
      success: false,
      message: 'Admin password required'
    });
  }
  
  const expectedPassword = process.env.ADMIN_PASSWORD || 'toUfik99T@';
  
  if (!expectedPassword) {
    console.error('❌ ADMIN_PASSWORD environment variable not set');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error'
    });
  }
  
  if (adminPassword !== expectedPassword) {
    return res.status(403).json({
      success: false,
      message: 'Invalid admin password'
    });
  }
  
  next();
};

module.exports = adminAuth;
