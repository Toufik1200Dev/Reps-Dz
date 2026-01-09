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
