const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const adminAuth = require('../middleware/adminAuth');
const { upload } = require('../config/storage');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/best-offers', productController.getBestOffers);
router.get('/categories', productController.getProductCategories);
router.get('/search', productController.searchProducts);
router.get('/category/:category', productController.getProductsByCategory);
router.get('/:id', productController.getProductById);

// Admin routes (protected by admin middleware)
router.post('/', adminAuth, upload.array('images', 5), productController.createProduct);
router.put('/:id', adminAuth, upload.array('images', 5), productController.updateProduct);
router.delete('/:id', adminAuth, productController.deleteProduct);

module.exports = router; 