/**
 * Admin Authentication Middleware
 * Validates admin password from x-admin-password header
 * Compares against process.env.ADMIN_PASSWORD
 */
const adminAuth = (req, res, next) => {
  // Express normalizes headers to lowercase
  // Only check x-admin-password (standardized header)
  let password = req.headers['x-admin-password'];

  // If password contains commas, it was sent multiple times - take the first one
  if (password && typeof password === 'string' && password.includes(',')) {
    password = password.split(',')[0].trim();
  }

  // Trim password if it exists
  if (password && typeof password === 'string') {
    password = password.trim();
  }

  const expectedPassword = (process.env.ADMIN_PASSWORD || '').trim();

  if (!password) {
    console.error('Admin authentication failed: Missing x-admin-password header');
    console.error('Request method:', req.method);
    console.error('Request path:', req.path);
    console.error('Available headers containing "x-", "admin", or "password":', 
      Object.keys(req.headers).filter(h => 
        h.toLowerCase().includes('admin') || 
        h.toLowerCase().includes('password') || 
        h.toLowerCase().startsWith('x-')
      )
    );
    return res.status(403).json({
      success: false,
      message: 'Invalid admin password. Please log in again.'
    });
  }

  if (password !== expectedPassword) {
    console.error('❌ Admin authentication failed: Password mismatch');
    console.error('Request method:', req.method);
    console.error('Request path:', req.path);
    console.error('Received password length:', password.length);
    console.error('Expected password length:', expectedPassword.length);
    console.error('Received password:', password.split('').map((c, i) => i < 2 || i >= password.length - 2 ? c : '*').join(''));
    console.error('Expected password:', expectedPassword.split('').map((c, i) => i < 2 || i >= expectedPassword.length - 2 ? c : '*').join(''));
    console.error('Received starts with:', password.substring(0, 2));
    console.error('Expected starts with:', expectedPassword.substring(0, 2));
    console.error('Received ends with:', password.substring(password.length - 2));
    console.error('Expected ends with:', expectedPassword.substring(expectedPassword.length - 2));
    console.error('Passwords match (exact):', password === expectedPassword);
    console.error('Passwords match (case-insensitive):', password.toLowerCase() === expectedPassword.toLowerCase());
    
    return res.status(403).json({
      success: false,
      message: 'Invalid admin password. Please log in again.'
    });
  }

  next();
};

module.exports = adminAuth;
