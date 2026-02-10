/**
 * Stores PayPal order metadata before capture.
 * Used to associate orderId with user form data (email, maxReps, etc.)
 */
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  userName: { type: String },
  userAge: { type: Number },
  level: { type: String, default: 'intermediate' },
  maxReps: { type: mongoose.Schema.Types.Mixed, required: true },
  heightCm: { type: Number },
  weightKg: { type: Number },
  plan: { type: String, enum: ['6week', '12week'], default: '6week' },
  calisthenicsMainSport: { type: Boolean },
  otherSport: { type: String },
  goals: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // TTL 24h
}, { timestamps: true });

module.exports = mongoose.models.PendingPayPalOrder || mongoose.model('PendingPayPalOrder', schema);
