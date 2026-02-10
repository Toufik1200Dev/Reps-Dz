const mongoose = require('mongoose');

const freeProgramLimitSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  yearMonth: { type: String, required: true }, // YYYY-MM
  count: { type: Number, required: true, default: 0 }
}, { timestamps: true });

freeProgramLimitSchema.index({ email: 1, yearMonth: 1 }, { unique: true });

module.exports = mongoose.model('FreeProgramLimit', freeProgramLimitSchema);
