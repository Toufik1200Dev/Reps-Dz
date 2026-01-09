const express = require('express');
const multer = require('multer');
const router = express.Router();
const CloudinaryService = require('../services/cloudinaryService');

// Configure multer for memory storage (Cloudinary upload uses buffers)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file?.mimetype?.startsWith('image/')) return cb(null, true);
    console.error('Invalid file type:', file?.mimetype);
    return cb(new Error('Only image files are allowed!'), false);
  },
});

const handleMulterError = (err, req, res, next) => {
  if (!err) return next();

  console.error('Upload error:', err.message || err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: `Unexpected file field: ${err.field}. Expected field name: "image".`,
      });
    }
    return res.status(400).json({ success: false, message: `File upload error: ${err.message}`, code: err.code });
  }

  return res.status(400).json({ success: false, message: `File upload error: ${err.message || 'Unknown error'}` });
};

// Wrap multer so errors are handled as JSON
const uploadSingleImage = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    return next();
  });
};

// POST /api/upload/image
router.post('/image', uploadSingleImage, async (req, res) => {
  try {
    if (!req.file?.buffer?.length) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided. Send multipart/form-data with field name "image".',
      });
    }

    if (!CloudinaryService.isAvailable()) {
      return res.status(500).json({
        success: false,
        message:
          'Image upload service is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
        configStatus: CloudinaryService.getConfigStatus(),
      });
    }

    const result = await CloudinaryService.uploadImage(req.file.buffer, 'titoubarz/products');

    // Validate the result URL is not a placeholder
    if (result?.url && (result.url.includes('via.placeholder') || result.url.startsWith('data:image'))) {
      return res.status(500).json({
        success: false,
        message: 'Image upload failed: Cloudinary configuration error.',
        configStatus: CloudinaryService.getConfigStatus(),
      });
    }

    return res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.size,
      },
    });
  } catch (error) {
    console.error('Image upload error:', error?.message || error);
    const msg = error?.message || 'Failed to upload image';
    return res.status(500).json({ success: false, message: 'Failed to upload image', error: msg });
  }
});

// POST /api/upload/images
router.post('/images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files provided' });
    }

    if (!CloudinaryService.isAvailable()) {
      return res.status(500).json({
        success: false,
        message:
          'Image upload service is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
        configStatus: CloudinaryService.getConfigStatus(),
      });
    }

    const results = await Promise.all(
      req.files.map((f) => CloudinaryService.uploadImage(f.buffer, 'titoubarz/products'))
    );

    return res.json({
      success: true,
      message: `${results.length} images uploaded successfully`,
      data: results.map((r) => ({
        url: r.url,
        publicId: r.publicId,
        width: r.width,
        height: r.height,
        format: r.format,
        size: r.size,
      })),
    });
  } catch (error) {
    console.error('Multiple images upload error:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error?.message || 'Unknown error',
    });
  }
});

// DELETE /api/upload/image/:publicId
router.delete('/image/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    if (!publicId) return res.status(400).json({ success: false, message: 'Public ID is required' });

    await CloudinaryService.deleteImage(publicId);
    return res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Image deletion error:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error?.message || 'Unknown error',
    });
  }
});

module.exports = router;

const express = require('express');
const multer = require('multer');
const router = express.Router();
const CloudinaryService = require('../services/cloudinaryService');

// Configure multer for memory storage (for Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      console.error('Invalid file type:', file.mimetype);
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Error handling middleware for multer - must be after the multer middleware
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error('Multer error:', err.message);
    
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum is 1 file.'
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: `Unexpected file field: ${err.field}. Expected field name: "image".`
        });
      }
      if (err.code === 'LIMIT_PART_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many parts in the multipart form.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message,
        code: err.code
      });
    }
    // Handle file filter errors
    if (err.message && err.message.includes('Only image files')) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + (err.message || 'Unknown error')
    });
  }
  next();
};

// Upload single image to Cloudinary (no auth check - dashboard access is sufficient)
// Wrap Multer in a try-catch to handle errors properly
const uploadMiddleware = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      // Handle Multer errors immediately
      return handleMulterError(err, req, res, next);
    }
    next();
  });
};

router.post('/image', (req, res, next) => {
  next();
}, uploadMiddleware, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No image file provided. Send multipart/form-data with field name "image".'
      });
    }
    
    // Verify file was parsed correctly
    if (!req.file.buffer || req.file.buffer.length === 0) {
      console.error('Invalid file: empty buffer');
      return res.status(400).json({
        success: false,
        message: 'Invalid file: File appears to be empty.'
      });
    }

    // Verify mimetype
    if (!req.file.mimetype || !req.file.mimetype.startsWith('image/')) {
      console.error('Invalid file type:', req.file.mimetype);
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only image files are allowed.'
      });
    }
    
    // Check Cloudinary configuration before attempting upload
    const cloudinaryStatus = CloudinaryService.getConfigStatus();
    if (!CloudinaryService.isAvailable()) {
      return res.status(500).json({
        success: false,
        message: 'Image upload service is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.',
        configStatus: cloudinaryStatus
      });
    }
    
    // Upload to Cloudinary
    const result = await CloudinaryService.uploadImage(req.file.buffer, 'titoubarz/products');
    
    // Validate the result URL is not a placeholder
    if (result.url && (result.url.includes('via.placeholder') || result.url.startsWith('data:image'))) {
      return res.status(500).json({
        success: false,
        message: 'Image upload failed: Cloudinary configuration error. The service returned a placeholder instead of a real image URL.',
        configStatus: cloudinaryStatus
      });
    }
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.size
      }
    });

  } catch (error) {
    console.error('Image upload error:', error.message || error);
    const errorMessage = error.message || 'Failed to upload image';
    
    // Check if it's a Cloudinary configuration error
    if (errorMessage.includes('Cloudinary is not configured')) {
      return res.status(500).json({
        success: false,
        message: errorMessage,
        configStatus: CloudinaryService.getConfigStatus()
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: errorMessage
    });
  }
});

// Upload multiple images to Cloudinary (no auth check - dashboard access is sufficient)
router.post('/images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No image files provided' });
    }

    const uploadPromises = req.files.map(file => 
      CloudinaryService.uploadImage(file.buffer, 'titoubarz/products')
    );

    const results = await Promise.all(uploadPromises);

    const uploadedImages = results.map(result => ({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes
    }));

    res.json({
      success: true,
      message: `${uploadedImages.length} images uploaded successfully`,
      data: uploadedImages
    });

  } catch (error) {
    console.error('Multiple images upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
});

// Delete image from Cloudinary (no auth check - dashboard access is sufficient)
router.delete('/image/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }

    await CloudinaryService.deleteImage(publicId);

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
});

module.exports = router;
