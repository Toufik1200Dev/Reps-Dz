const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

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
const adminRoutes = require('./routes/adminRoutes');

// Import middleware
const adminAuth = require('./middleware/adminAuth');

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
    ? ['https://reps-dz.web.app', 'https://reps-dz.firebaseapp.com']
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'];
  
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
  
  // Allow headers (standardized to x-admin-password only)
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-password');
  
  // Allow credentials (cookies, authorization headers)
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests - MUST respond with 200 and correct headers
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Admin routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin/orders', adminAuth, orderRoutes);

// Error handling middleware (must set CORS headers)
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  // Set CORS headers even on error
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://reps-dz.web.app', 'https://reps-dz.firebaseapp.com']
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'];
  
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
  const apiUrl = process.env.NODE_ENV === 'production' 
    ? `https://reps-dz.onrender.com`
    : `http://localhost:${PORT}`;
  
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔗 API URL: ${apiUrl}`);
  console.log(`📸 Images served from: ${apiUrl}/uploads`);
  console.log(`🗄️  Database: MongoDB connected`);
});

module.exports = app;