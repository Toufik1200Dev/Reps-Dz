const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/database');

// Load environment variables (explicit path so .env loads from Backend folder)
dotenv.config({ path: path.join(__dirname, '.env') });

// Log config status at startup (for debugging - no secrets logged)
const brevoKey = process.env.BREVO_API_KEY;
const brevoSender = process.env.BREVO_SENDER_EMAIL;
if (!brevoKey || !brevoSender) {
  console.warn('[Brevo] Email not configured: Set BREVO_API_KEY and BREVO_SENDER_EMAIL in .env');
} else {
  console.log('[Brevo] Email configured. Sender:', brevoSender);
}
const paypalClient = process.env.PAYPAL_CLIENT_ID;
if (!paypalClient) {
  console.warn('[PayPal] Payment not configured: Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env');
} else {
  console.log('[PayPal] Payment configured');
}
const openRouterKey = process.env.OPENROUTER_API_KEY;
const openRouterModel = (process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini').trim();
if (!openRouterKey) {
  console.warn('[OpenRouter] NOT configured – no AI requests will be made. Add OPENROUTER_API_KEY to .env (get key at openrouter.ai)');
} else {
  console.log('[OpenRouter] Configured – AI will enhance 1-week and 6-week programs. Model:', openRouterModel);
}

// Import routes
const productRoutes = require('./routes/productRoutes');
const contactRoutes = require('./routes/contactRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const programRoutes = require('./routes/programRoutes');
const calorieRoutes = require('./routes/calorieRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Import middleware
const adminAuth = require('./middleware/adminAuth');
const adminIpWhitelist = require('./middleware/adminIpWhitelist');

const app = express();

// Connect to MongoDB
connectDB();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Add CORS middleware to allow frontend requests
app.use((req, res, next) => {
  // Allow requests from your frontend domain
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://reps-dz.web.app', 'https://reps-dz.firebaseapp.com', 'https://localhost:5173', 'http://localhost:5173']
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000', 'https://localhost:5173'];
  
  const origin = req.headers.origin;
  
  // Set CORS headers for ALL requests (including OPTIONS preflight)
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (origin && process.env.NODE_ENV === 'development') {
    // In dev, allow any origin
    res.header('Access-Control-Allow-Origin', origin);
  } else if (origin) {
    // In production, still set header but with null if not allowed (will be rejected by browser)
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  // Allow specific HTTP methods (must include OPTIONS)
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  
  // Allow headers (standardized to x-admin-password, but also allow legacy adminpassword for compatibility)
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-password, adminpassword, X-Admin-Password, AdminPassword');
  
  // Allow credentials (cookies, authorization headers)
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests - MUST respond with 200 and correct headers
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Configure body parser - but exclude multipart/form-data (handled by Multer)
// Configure body parser - exclude upload routes (handled by Multer)
// This ensures bodyParser doesn't interfere with multipart/form-data
app.use((req, res, next) => {
  // Skip body parsing for upload routes (Multer handles multipart/form-data)
  if (req.path.startsWith('/api/upload')) {
    return next();
  }
  // Apply bodyParser for other routes
  bodyParser.json({ limit: '50mb' })(req, res, () => {
    bodyParser.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
  });
});

// Serve uploaded images (for backward compatibility, though we use Cloudinary now)
// This route handles static file serving and provides a helpful message if directory is empty
const uploadsStaticPath = path.join(__dirname, 'uploads');
if (fs.existsSync(uploadsStaticPath)) {
  app.use('/uploads', express.static(uploadsStaticPath, {
    index: false, // Don't show directory listing
    dotfiles: 'deny' // Don't serve dotfiles
  }));
  
  // Handle requests to /uploads/ without a filename
  app.get('/uploads', (req, res) => {
    res.status(404).json({ 
      message: 'No file specified. Images are served from Cloudinary.',
      hint: 'Use /api/upload/image to upload images to Cloudinary'
    });
  });
  
  app.get('/uploads/', (req, res) => {
    res.status(404).json({ 
      message: 'No file specified. Images are served from Cloudinary.',
      hint: 'Use /api/upload/image to upload images to Cloudinary'
    });
  });
} else {
  // If uploads directory doesn't exist, create it and provide handler
  app.get('/uploads', (req, res) => {
    res.status(404).json({ 
      message: 'Uploads directory not available. Images are served from Cloudinary.',
      hint: 'Use /api/upload/image to upload images to Cloudinary'
    });
  });
  
  app.get('/uploads/', (req, res) => {
    res.status(404).json({ 
      message: 'Uploads directory not available. Images are served from Cloudinary.',
      hint: 'Use /api/upload/image to upload images to Cloudinary'
    });
  });
}

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to REPS-DZ API',
    version: '1.0.0',
    status: 'running',
    database: 'MongoDB connected'
  });
});

// Status route to check configuration
app.get('/api/status', (req, res) => {
  try {
    res.json({
      message: 'REPS-DZ API Status',
      version: '1.0.0',
      status: 'running',
      database: 'MongoDB connected',
      cloudinary: {
        isProduction: process.env.NODE_ENV === 'production',
        hasCloudinaryConfig: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
        cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
        apiKey: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
        apiSecret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
      },
      openRouter: {
        hasApiKey: !!process.env.OPENROUTER_API_KEY,
        model: process.env.OPENROUTER_MODEL || 'openai/gpt-oss-120b:free'
      }
    });
  } catch (error) {
    console.error('Status endpoint error:', error);
    res.status(500).json({
      message: 'Status check failed',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/calories', calorieRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);

// Admin routes (IP whitelist applied to all /api/admin/*)
app.use('/api/admin', adminIpWhitelist);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/orders', adminAuth, orderRoutes);

// Error handling middleware (must set CORS headers)
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  // Set CORS headers even on error
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://reps-dz.web.app', 'https://reps-dz.firebaseapp.com', 'https://localhost:5173', 'http://localhost:5173']
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000', 'https://localhost:5173'];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  // Intentionally no startup logs (keep console output to essential errors only)
});

module.exports = app;