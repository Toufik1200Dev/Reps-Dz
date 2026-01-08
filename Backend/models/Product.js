const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  category: {
    type: String, // Keeping as String for flexibility as no separate Category model exists
    required: [true, 'Product category is required'],
    trim: true
  },
  shortDescription: {
    type: String,
    trim: true,
    required: [true, 'Short description is required']
  },
  description: {
    type: String,
    required: [true, 'Full product description is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  finalPrice: {
    type: Number,
    min: 0
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: 0,
    default: 0
  },
  lowStockAlert: {
    type: Number,
    default: 5
  },
  variants: {
    sizes: {
      type: [String],
      default: []
    },
    colors: {
      type: [String],
      default: []
    }
  },
  specifications: {
    material: String,
    weight: Number, // in kg
    maxLoad: Number, // in kg
    usage: {
      type: String,
      enum: ['Indoor', 'Outdoor', 'Both'],
      default: 'Both'
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'All Levels'
    },
    bodyTarget: [String]
  },
  images: {
    main: {
      type: String,
      required: [true, 'Main product image is required']
    },
    gallery: {
      type: [String],
      default: []
    }
  },
  tags: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['Active', 'Draft', 'Hidden', 'Out of stock'],
    default: 'Active'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  // Legacy fields mapping or preservation if needed, otherwise removed
  // Added standard fields
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware to auto-generate slug and finalPrice
productSchema.pre('save', async function(next) {
  try {
    // Generate Slug - ensure uniqueness
    if (this.isModified('name') || !this.slug) {
      let baseSlug = slugify(this.name, { lower: true, strict: true });
      let slug = baseSlug;
      let counter = 1;
      
      // Check if slug exists and make it unique
      while (true) {
        const existingProduct = await this.constructor.findOne({ slug });
        
        // If no existing product or it's the same product (for updates), use this slug
        if (!existingProduct || (this._id && existingProduct._id.toString() === this._id.toString())) {
          break;
        }
        
        // Slug exists for a different product, append counter
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      this.slug = slug;
    }

    // Calculate Final Price
    if (this.isModified('price') || this.isModified('discount')) {
      const discountAmount = (this.price * (this.discount || 0)) / 100;
      this.finalPrice = Math.round((this.price - discountAmount) * 100) / 100;
    }

    // Auto update status if stock is 0
    if (this.stock === 0 && this.status !== 'Draft' && this.status !== 'Hidden') {
      this.status = 'Out of stock';
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ slug: 1 });

module.exports = mongoose.model('Product', productSchema); 