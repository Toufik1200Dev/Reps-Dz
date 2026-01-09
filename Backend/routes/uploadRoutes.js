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
    // Log file details
    console.log('📎 Multer file filter:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      encoding: file.encoding
    });
    
    // Check if file is an image
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      console.error('❌ Invalid file type:', file.mimetype);
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error('❌ Multer error:', {
      name: err.name,
      code: err.code,
      message: err.message,
      field: err.field
    });
    
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
router.post('/image', upload.single('image'), handleMulterError, async (req, res) => {
  try {
    // Log request details for debugging
    console.log('📤 Image upload request received:', {
      hasFile: !!req.file,
      fileField: req.file?.fieldname,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      fileMimeType: req.file?.mimetype,
      bufferLength: req.file?.buffer?.length,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length']
    });

    if (!req.file) {
      // Check if multer error occurred (it would be in req.fileError)
      console.error('❌ No file received in request');
      console.error('Request body keys:', Object.keys(req.body));
      console.error('Request files:', req.files);
      return res.status(400).json({ 
        success: false,
        message: 'No image file provided. Please ensure you are uploading a valid image file with the field name "image".' 
      });
    }
    
    // Verify file was parsed correctly
    if (!req.file.buffer || req.file.buffer.length === 0) {
      console.error('❌ File buffer is empty');
      return res.status(400).json({
        success: false,
        message: 'Invalid file: File appears to be empty.'
      });
    }

    // Verify mimetype
    if (!req.file.mimetype || !req.file.mimetype.startsWith('image/')) {
      console.error('❌ Invalid file type:', req.file.mimetype);
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only image files are allowed.'
      });
    }
    
    // Check Cloudinary configuration before attempting upload
    const cloudinaryStatus = CloudinaryService.getConfigStatus();
    if (!CloudinaryService.isAvailable()) {
      console.error('❌ Cloudinary is not configured!', cloudinaryStatus);
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
      console.error('❌ Cloudinary upload returned placeholder URL. Configuration may be incorrect.');
      return res.status(500).json({
        success: false,
        message: 'Image upload failed: Cloudinary configuration error. The service returned a placeholder instead of a real image URL.',
        configStatus: cloudinaryStatus
      });
    }
    
    console.log('✅ Image uploaded successfully:', result.url);
    
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
    console.error('❌ Image upload error:', error);
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
