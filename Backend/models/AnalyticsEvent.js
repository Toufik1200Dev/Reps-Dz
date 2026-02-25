const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['page_view', 'visit'] },
  path: { type: String, default: '/' },
  pageName: { type: String, default: '' },
  date: { type: String, required: true }, // YYYY-MM-DD
  visitorId: { type: String, trim: true }, // optional client-generated id for unique visitor count
}, { timestamps: true });

analyticsEventSchema.index({ date: 1 });
analyticsEventSchema.index({ visitorId: 1, date: 1 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
