const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { upload } = require('../config/storage');

// Public routes (specific routes first to avoid conflicts with /:id)
router.get('/', productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/best-offers', productController.getBestOffers);
router.get('/categories', productController.getProductCategories);
router.get('/search', productController.searchProducts);
router.get('/category/:category', productController.getProductsByCategory);

// Admin routes (no auth check - access to admin dashboard is sufficient)
router.post('/', upload.array('images', 5), productController.createProduct);
router.put('/:id', upload.array('images', 5), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

// This must be LAST to avoid matching other routes
router.get('/:id', productController.getProductById);

module.exports = router; 