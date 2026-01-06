const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: {
    fullName: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    wilaya: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    size: String,
    color: String,
    image: String
  }],
  orderTotal: {
    type: Number,
    required: true
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash_on_delivery', 'bank_transfer', 'online_payment'],
    default: 'cash_on_delivery'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  estimatedDelivery: Date,
  notes: String,
  trackingNumber: String
}, {
  timestamps: true
});

// Add indexes for better query performance
orderSchema.index({ 'customer.fullName': 1 });
orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderDate: -1 });

module.exports = mongoose.model('Order', orderSchema); 