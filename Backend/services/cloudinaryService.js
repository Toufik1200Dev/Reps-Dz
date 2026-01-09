const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudinaryService {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.hasCloudinaryConfig = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
  }

  // Upload image to Cloudinary
  async uploadImage(file, folder = 'products') {
    try {
      // Check if Cloudinary is configured
      if (!this.hasCloudinaryConfig) {
        const configStatus = this.getConfigStatus();
        console.error('❌ Cloudinary not configured! Missing environment variables:', {
          cloudName: configStatus.cloudName,
          apiKey: configStatus.apiKey,
          apiSecret: configStatus.apiSecret,
          isProduction: configStatus.isProduction
        });
        console.error('❌ Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment variables.');
        
        // In production, throw an error instead of returning a placeholder
        if (this.isProduction) {
          throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
        }
        
        // In development, return a mock response with a warning
        console.warn('⚠️ Running in development mode without Cloudinary. Returning placeholder URL.');
        return {
          url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DbG91ZGluYXJ5IE5vdCBDb25maWd1cmVkPC90ZXh0Pjwvc3ZnPg==',
          publicId: `mock-${Date.now()}`,
          width: 800,
          height: 600,
          format: 'jpg',
          size: 0
        };
      }

      // Handle both buffer and file object
      let buffer, mimetype;
      if (Buffer.isBuffer(file)) {
        buffer = file;
        mimetype = 'image/jpeg'; // Default mimetype
      } else if (file.buffer && file.mimetype) {
        buffer = file.buffer;
        mimetype = file.mimetype;
      } else {
        throw new Error('Invalid file format');
      }

      // Convert buffer to base64 for Cloudinary
      const base64Image = buffer.toString('base64');
      const dataURI = `data:${mimetype};base64,${base64Image}`;

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: folder,
        public_id: `titoubarz-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
        resource_type: 'auto',
        transformation: [
          { quality: 'auto:good' }, // Optimize quality
          { fetch_format: 'auto' }  // Auto-format (WebP for modern browsers)
        ]
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      };
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      
      // If Cloudinary fails, return a fallback
      if (this.hasCloudinaryConfig) {
        return {
          url: 'https://via.placeholder.com/800x600/ffcccc/cc0000?text=Upload+Failed',
          publicId: `error-${Date.now()}`,
          width: 800,
          height: 600,
          format: 'jpg',
          size: 0
        };
      }
      
      throw new Error('Failed to upload image to Cloudinary');
    }
  }

  // Upload multiple images
  async uploadMultipleImages(files, folder = 'products') {
    try {
      // Ensure folder is a string, not an object
      const folderPath = typeof folder === 'string' ? folder : 'products';
      const uploadPromises = files.map(file => this.uploadImage(file, folderPath));
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('Multiple image upload error:', error);
      throw new Error('Failed to upload multiple images');
    }
  }

  // Delete image from Cloudinary
  async deleteImage(publicId) {
    try {
      if (!this.hasCloudinaryConfig) {
        return { result: 'ok' };
      }

      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error('Cloudinary deletion error:', error);
      throw new Error('Failed to delete image from Cloudinary');
    }
  }

  // Get optimized image URL with transformations
  getOptimizedUrl(publicId, options = {}) {
    try {
      if (!this.hasCloudinaryConfig) {
        return null; // Return null in development
      }

      const defaultOptions = {
        width: 800,
        height: 600,
        crop: 'fill',
        quality: 'auto:good',
        format: 'auto'
      };

      const finalOptions = { ...defaultOptions, ...options };
      
      return cloudinary.url(publicId, finalOptions);
    } catch (error) {
      console.error('Error generating optimized URL:', error);
      return null;
    }
  }

  // Get responsive image URLs for different screen sizes
  getResponsiveUrls(publicId) {
    try {
      if (!this.hasCloudinaryConfig) {
        return null;
      }

      return {
        small: cloudinary.url(publicId, { width: 400, height: 300, crop: 'fill', quality: 'auto:good' }),
        medium: cloudinary.url(publicId, { width: 800, height: 600, crop: 'fill', quality: 'auto:good' }),
        large: cloudinary.url(publicId, { width: 1200, height: 900, crop: 'fill', quality: 'auto:good' }),
        original: cloudinary.url(publicId, { quality: 'auto:best' })
      };
    } catch (error) {
      console.error('Error generating responsive URLs:', error);
      return null;
    }
  }

  // Extract public ID from Cloudinary URL
  extractPublicId(url) {
    try {
      if (!url || !url.includes('cloudinary.com')) {
        return null;
      }

      // Extract public ID from URL like: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/image.jpg
      const urlParts = url.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      
      if (uploadIndex === -1 || uploadIndex + 2 >= urlParts.length) {
        return null;
      }

      // Skip version number and get the rest
      const publicIdParts = urlParts.slice(uploadIndex + 2);
      return publicIdParts.join('/').replace(/\.[^/.]+$/, ''); // Remove file extension
    } catch (error) {
      console.error('Error extracting public ID:', error);
      return null;
    }
  }

  // Get image info
  async getImageInfo(publicId) {
    try {
      if (!this.hasCloudinaryConfig) {
        return null;
      }

      const result = await cloudinary.api.resource(publicId);
      return {
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        createdAt: result.created_at
      };
    } catch (error) {
      console.error('Error getting image info:', error);
      return null;
    }
  }

  // Check if Cloudinary is available
  isAvailable() {
    return this.hasCloudinaryConfig;
  }

  // Get configuration status
  getConfigStatus() {
    return {
      isProduction: this.isProduction,
      hasCloudinaryConfig: this.hasCloudinaryConfig,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
      apiKey: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
      apiSecret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
    };
  }
}

module.exports = new CloudinaryService();
