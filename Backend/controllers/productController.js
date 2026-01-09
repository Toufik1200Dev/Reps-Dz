const Product = require('../models/Product');
const mongoose = require('mongoose');
const cloudinaryService = require('../services/cloudinaryService');
const fs = require('fs');
const path = require('path');

// Get all products with filtering and pagination
exports.getAllProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      minPrice, 
      maxPrice, 
      search, 
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    if (featured === 'true') {
      filter.featured = true;
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    if (sortBy === 'price') {
      sort.price = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'rating') {
      sort['rating.average'] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts: total,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('âŒ Error fetching products:', error);
    res.status(500).json({ 
      message: 'Failed to fetch products',
      error: error.message 
    });
  }
};

// Get featured products
exports.getFeaturedProducts = async (req, res) => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    res.json(featuredProducts);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ message: 'Error fetching featured products', error: error.message });
  }
};


// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    let product;

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      product = await Product.findById(req.params.id);
    } else {
      product = await Product.findOne({ slug: req.params.id });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};
exports.getProductById = getProductById; // Exporting the function

// Create new product
exports.createProduct = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.name || !req.body.category || !req.body.shortDescription || !req.body.description) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, category, shortDescription, and description are required' 
      });
    }

    if (req.body.price === undefined || req.body.price === null || req.body.price === '') {
      return res.status(400).json({ message: 'Price is required' });
    }

    // Parse complex fields if they are strings (JSON)
    let { variants, specifications, tags } = req.body;
    
    try {
      if (typeof variants === 'string') variants = JSON.parse(variants);
      if (typeof specifications === 'string') specifications = JSON.parse(specifications);
      if (typeof tags === 'string') tags = JSON.parse(tags);
    } catch (e) {
    }

    let mainImage = '';
    let galleryImages = [];
    
    // Handle image uploads
    if (req.files && req.files.length > 0) {
       const uploadedUrls = [];
       
       if (process.env.NODE_ENV === 'production') {
         const results = await cloudinaryService.uploadMultipleImages(req.files, 'titoubarz/products');
         results.forEach(r => uploadedUrls.push(r.url));
       } else {
         req.files.forEach(f => uploadedUrls.push(`/uploads/${f.filename}`));
       }

       if (uploadedUrls.length > 0) {
         mainImage = uploadedUrls[0];
         galleryImages = uploadedUrls.slice(1);
       }
    } else if (req.body.images) {
      if (typeof req.body.images === 'object' && !Array.isArray(req.body.images)) {
        // New structure: { main: 'url', gallery: ['url', 'url'] }
        mainImage = req.body.images.main || mainImage;
        galleryImages = Array.isArray(req.body.images.gallery) ? req.body.images.gallery : [];
      } else if (req.body.mainImage) {
         // Fallback legacy: flat fields
         mainImage = req.body.mainImage;
         if (req.body.galleryImages) {
            galleryImages = Array.isArray(req.body.galleryImages) ? req.body.galleryImages : [req.body.galleryImages];
         }
      } else if (Array.isArray(req.body.images)) {
        // Legacy: Array of URLs
        const urls = req.body.images.filter(url => url && url.trim() !== '');
        if(urls.length > 0) {
           mainImage = urls[0];
           galleryImages = urls.slice(1);
        }
      }
    }

    // Validate that main image exists
    if (!mainImage) {
      return res.status(400).json({ message: 'Main product image is required' });
    }
    
    const productData = {
      ...req.body,
      variants: variants || { sizes: [], colors: [] },
      specifications: specifications || {},
      tags: tags || [],
      images: {
        main: mainImage,
        gallery: galleryImages || []
      },
      // Ensure numeric fields are numbers
      price: Number(req.body.price),
      discount: Number(req.body.discount || 0),
      stock: Number(req.body.stock || 0)
    };

    const product = new Product(productData);
    const savedProduct = await product.save();
    
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('âŒ Error creating product:', error);
    
    // Handle duplicate key error (slug)
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Product with similar name already exists. Please use a different name.',
        error: 'Duplicate slug' 
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors 
      });
    }
    
    res.status(400).json({ message: 'Error creating product', error: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    let { variants, specifications, tags } = req.body;

    try {
      if (typeof variants === 'string') variants = JSON.parse(variants);
      if (typeof specifications === 'string') specifications = JSON.parse(specifications);
      if (typeof tags === 'string') tags = JSON.parse(tags);
    } catch (_) {}

    // Fetch existing product to merge images if needed
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) return res.status(404).json({ message: 'Product not found' });

    let mainImage = existingProduct.images.main;
    let galleryImages = existingProduct.images.gallery;

    // Handle new uploads logic
    // This part is simplified. In a real complex app, we'd delete old images if replaced.
    // For this update, if new files are provided, we append to gallery or replace main?
    // Unified Image Parsing Logic
    if (req.body.images) {
      if (typeof req.body.images === 'object' && !Array.isArray(req.body.images)) {
        // New structure: { main: 'url', gallery: ['url', 'url'] }
        mainImage = req.body.images.main || mainImage;
        galleryImages = Array.isArray(req.body.images.gallery) ? req.body.images.gallery : [];
      } else if (req.body.mainImage) {
         // Fallback legacy: flat fields
         mainImage = req.body.mainImage;
         if (req.body.galleryImages) {
            galleryImages = Array.isArray(req.body.galleryImages) ? req.body.galleryImages : [req.body.galleryImages];
         }
      } else if (Array.isArray(req.body.images)) {
        // Legacy: Array of URLs (assume replace)
        const urls = req.body.images.filter(url => url && url.trim() !== '');
        if(urls.length > 0) {
           mainImage = urls[0];
           galleryImages = urls.slice(1);
        }
      }
    } else {
       // Check for flat fields if req.body.images is missing entirely
       if (req.body.mainImage) mainImage = req.body.mainImage;
       if (req.body.galleryImages) galleryImages = req.body.galleryImages;
    }
    
    if (req.files && req.files.length > 0) {
      const newUrls = [];
      if (process.env.NODE_ENV === 'production') {
         const results = await cloudinaryService.uploadMultipleImages(req.files, 'products');
         results.forEach(r => newUrls.push(r.url));
      } else {
         req.files.forEach(f => newUrls.push(`/uploads/${f.filename}`));
      }
      
      // If we strictly want to support "add to gallery"
      galleryImages = [...galleryImages, ...newUrls];
    }

    const updateData = {
      ...req.body,
      variants: variants || existingProduct.variants,
      specifications: specifications || existingProduct.specifications,
      tags: tags || existingProduct.tags,
      images: {
        main: mainImage,
        gallery: galleryImages
      },
      price: req.body.price ? Number(req.body.price) : existingProduct.price,
      discount: req.body.discount !== undefined ? Number(req.body.discount) : existingProduct.discount,
      stock: req.body.stock !== undefined ? Number(req.body.stock) : existingProduct.stock
    };

    // Use findById + save() instead of findByIdAndUpdate to trigger pre-save hooks
    // This ensures slug uniqueness and finalPrice recalculation
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update product fields
    Object.assign(product, updateData);
    
    // Save to trigger pre-save hooks (slug uniqueness, finalPrice calculation)
    const updatedProduct = await product.save();
    
    res.json(updatedProduct);

  } catch (error) {
    console.error('âŒ Error updating product:', error);
    res.status(400).json({ message: 'Error updating product', error: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Cleanup images (Logic simplified for new schema structure)
    // Main
    // Gallery
    
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category: category }).lean();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ message: 'Error fetching products by category', error: error.message });
  }
};

// Search products
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ products: [] });
    }
    
    const searchLower = q.toLowerCase();
    const results = await Product.find({ $text: { $search: searchLower } }).lean();
    
    res.json({ products: results });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ message: 'Error searching products', error: error.message });
  }
};

// Get product categories
exports.getProductCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// Get best offers (products with discounts or special badges)
exports.getBestOffers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    
    // Find products with discount > 0 or isFeatured
    // We check availability via stock > 0
    const products = await Product.find({ 
        stock: { $gt: 0 },
        $or: [{ discount: { $gt: 0 } }, { isFeatured: true }]
    })
    .sort({ discount: -1 }) // Sort by highest discount
    .limit(limit)
    .lean();
    
    // Map to frontend expectation:
    // Frontend expects: price (current selling price), originalPrice (old price if discounted)
    // Schema has: price (base), discount (%), finalPrice (calculated)
    const mappedProducts = products.map(p => ({
        ...p,
        price: p.finalPrice || p.price,
        originalPrice: p.discount > 0 ? p.price : null,
        badge: p.discount > 0 ? 'sale' : (p.isFeatured ? 'featured' : '')
    }));
    
    res.json(mappedProducts);
  } catch (error) {
    console.error('Error fetching best offers:', error);
    res.status(500).json({ message: 'Error fetching best offers', error: error.message });
  }
}; 

