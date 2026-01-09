const Order = require('../models/Order');
const Product = require('../models/Product');

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { customer, products, orderTotal, shippingCost, tax, totalAmount, paymentMethod } = req.body;

    // Validate required fields
    if (!customer || !products || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check stock availability
    const productUpdates = [];
    for (const item of products) {
        // item.product or item.productId based on payload. 
        // Schema uses 'product' in User but 'product' in Order.
        // Payload usually sends 'product' or 'productId'. Let's standardise on input.
        const pId = item.product || item.productId;
        
        const product = await Product.findById(pId);
        if (!product) {
            return res.status(404).json({ success: false, message: `Product not found: ${item.name}` });
        }
        
        if (product.stock < item.quantity) {
             return res.status(400).json({ success: false, message: `Insufficient stock for product: ${product.name}` });
        }
        
        // Prepare bulk update
        productUpdates.push({
            updateOne: {
                filter: { _id: pId },
                update: { $inc: { stock: -item.quantity } }
            }
        });
    }
    
    // Execute stock updates
    if (productUpdates.length > 0) {
        await Product.bulkWrite(productUpdates);
    }

    // Create the order
    const order = new Order({
      customer,
      products: products.map(p => ({
          product: p.product || p.productId,
          name: p.name,
          price: p.price,
          quantity: p.quantity,
          size: p.size,
          color: p.color,
          image: p.image
      })),
      orderTotal,
      shippingCost: shippingCost || 0,
      tax: tax || 0,
      totalAmount,
      paymentMethod: paymentMethod || 'cash_on_delivery'
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order._id,
        orderNumber: order._id.toString().slice(-8).toUpperCase(),
        totalAmount: order.totalAmount,
        status: order.status
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// Get all orders (for admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    const query = {};
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Search by customer name or phone
    if (search) {
      query.$or = [
        { 'customer.fullName': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const orders = await Order.find(query)
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('products.product', 'name image');

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalOrders: total,
          hasNext: skip + orders.length < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id)
      .populate('products.product', 'name image description');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, trackingNumber, estimatedDelivery } = req.body;

    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order fields
    if (status) order.status = status;
    if (notes !== undefined) order.notes = notes;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (estimatedDelivery !== undefined) order.estimatedDelivery = estimatedDelivery;

    await order.save();

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
};

// Delete order (for admin)
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findByIdAndDelete(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    });
  }
};

// Get order statistics
exports.getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    const statusStats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentOrders = await Order.find()
      .sort({ orderDate: -1 })
      .limit(5)
      .select('customer totalAmount status orderDate');

    res.json({
      success: true,
      data: {
        ...stats[0],
        statusBreakdown: statusStats,
        recentOrders
      }
    });

  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: error.message
    });
  }
}; 