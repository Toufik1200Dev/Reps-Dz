const mongoose = require('mongoose');

const sixWeekRequestSchema = new mongoose.Schema({
  // Client data
  email: { type: String, required: true, trim: true, lowercase: true },
  userName: { type: String, trim: true, maxlength: 100 },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  maxReps: {
    muscleUp: Number,
    pullUps: Number,
    dips: Number,
    pushUps: Number,
    squats: Number,
    legRaises: Number,
    burpees: Number
  },
  heightCm: { type: Number, min: 100, max: 250 },
  weightKg: { type: Number, min: 30, max: 300 },
  // Payment data (Stripe)
  stripeSessionId: { type: String, trim: true, sparse: true },
  stripePaymentIntentId: { type: String, trim: true },
  stripeCustomerId: { type: String, trim: true },
  amountPaid: { type: Number }, // in cents
  currency: { type: String, default: 'usd' },
  paymentStatus: { type: String, default: 'paid' }
}, { timestamps: true });

sixWeekRequestSchema.index({ createdAt: -1 });
sixWeekRequestSchema.index({ email: 1, createdAt: -1 });
sixWeekRequestSchema.index({ stripeSessionId: 1 });

module.exports = mongoose.model('SixWeekRequest', sixWeekRequestSchema);
