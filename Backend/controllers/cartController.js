const User = require('../models/User');
const Product = require('../models/Product');

// Get user cart
exports.getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'cart.product',
      select: 'name price images stock'
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate totals and format
    const cartItems = user.cart.filter(item => item.product).map(item => {
        // Handle images structure (main/gallery or legacy)
        let mainImage = '/placeholder.jpg';
        if (item.product.images) {
            if (item.product.images.main) mainImage = item.product.images.main;
            else if (Array.isArray(item.product.images) && item.product.images.length > 0) mainImage = item.product.images[0].url || item.product.images[0];
        }

        return {
            _id: item._id, // Cart item ID
            productId: item.product._id,
            name: item.product.name,
            price: item.product.price,
            image: mainImage,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            stock: item.product.stock
        };
    });

    res.json(cartItems);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Error fetching cart', error: error.message });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, size, color } = req.body;

    const [user, product] = await Promise.all([
      User.findById(req.user.id),
      Product.findById(productId)
    ]);

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    // Check if item already exists in cart (same product, size, and color)
    const existingItemIndex = user.cart.findIndex(item => 
      item.product.toString() === productId && 
      item.size === size && 
      item.color === color
    );

    if (existingItemIndex > -1) {
      // Update quantity
      user.cart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      user.cart.push({ product: productId, quantity, size, color });
    }

    await user.save();
    
    // Return updated cart
    const populatedUser = await User.findById(req.user.id).populate({
        path: 'cart.product',
        select: 'name price images stock'
    });
    
    // Re-format for response (reuse logic or clean up)
    const cartItems = populatedUser.cart.filter(item => item.product).map(item => {
        let mainImage = '/placeholder.jpg';
        if (item.product.images) {
            if (item.product.images.main) mainImage = item.product.images.main;
            else if (Array.isArray(item.product.images) && item.product.images.length > 0) mainImage = item.product.images[0].url || item.product.images[0];
        }
        return {
             _id: item._id,
             productId: item.product._id,
             name: item.product.name,
             price: item.product.price,
             image: mainImage,
             quantity: item.quantity,
             size: item.size,
             color: item.color,
             stock: item.product.stock
        };
    });

    res.json(cartItems);
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Error adding to cart', error: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;

        const user = await User.findById(req.user.id);
        if(!user) return res.status(404).json({ message: 'User not found' });

        const cartItem = user.cart.id(itemId);
        if(!cartItem) return res.status(404).json({ message: 'Item not found in cart' });

        // Optional: Check stock again here if strictly required
        
        if (quantity > 0) {
            cartItem.quantity = quantity;
        } else {
            // Remove if quantity is 0 or less
            user.cart.pull(itemId);
        }

        await user.save();
        
        // Return updated cart (simplified response, frontend might just need success or full cart)
        // For consistency, let's return the full cart again or just success
        // Returning full cart is safer for sync
        return exports.getCart(req, res); // Reuse query logic
        
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ message: 'Error updating cart item', error: error.message });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.params;
        const user = await User.findById(req.user.id);
        if(!user) return res.status(404).json({ message: 'User not found' });

        user.cart.pull(itemId);
        await user.save();

        return exports.getCart(req, res);
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ message: 'Error removing from cart', error: error.message });
    }
};

exports.clearCart = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if(!user) return res.status(404).json({ message: 'User not found' });

        user.cart = [];
        await user.save();
        res.json([]);
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ message: 'Error clearing cart', error: error.message });
    }
};

exports.syncCart = async (req, res) => {
    try {
        const { items } = req.body; // Expecting array of { productId, quantity, size, color }
        if (!Array.isArray(items)) return res.status(400).json({ message: 'Invalid items format' });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Merge logic: Add items from payload to user cart if not exists, or update quantity?
        // Simple merge: Loop items and add/update
        
        for (const item of items) {
             const existingIndex = user.cart.findIndex(c => 
                 c.product.toString() === item.productId && 
                 c.size === item.size && 
                 c.color === item.color
             );
             
             if (existingIndex > -1) {
                 // Strategy: Max of local vs db? or Sum?
                 // Usually, if user was guest and logs in, we might want to keep the guest quantity or sum it. 
                 // Let's sum it for now or just set it if DB was empty. 
                 // Simple approach: Overwrite with guest cart if user confirms sync? 
                 // Let's just add them.
                 // Actually, common pattern is: Cart Merge.
                 // If item exists, we can ensure quantity is at least what is in the payload.
                 // Let's just create a merged list.
                 
                 // For verify step simplicity: We will just push if not exists, or update if exists.
                 // If sync is "override", we verify logic.
                 // Let's assume this is "Merge Local Cart to Account"
                  user.cart[existingIndex].quantity = Math.max(user.cart[existingIndex].quantity, item.quantity);
             } else {
                 user.cart.push({
                     product: item.productId,
                     quantity: item.quantity,
                     size: item.size,
                     color: item.color
                 });
             }
        }
        
        await user.save();
        return exports.getCart(req, res);

    } catch (error) {
        console.error('Error syncing cart:', error);
        res.status(500).json({ message: 'Error syncing cart', error: error.message });
    }
};
