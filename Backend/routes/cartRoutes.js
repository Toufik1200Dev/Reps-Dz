const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const auth = require('../middleware/auth'); // Assuming you have an auth middleware

// All cart routes require authentication
router.use(auth);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.post('/sync', cartController.syncCart);
router.put('/:itemId', cartController.updateCartItem);
router.delete('/:itemId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

module.exports = router;
