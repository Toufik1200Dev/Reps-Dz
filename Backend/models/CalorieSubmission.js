const mongoose = require('mongoose');

const calorieSubmissionSchema = new mongoose.Schema({
  userName: { type: String, default: 'None', trim: true, maxlength: 100 },
  deviceId: { type: String, trim: true },
  // Inputs
  gender: { type: String, required: true, enum: ['male', 'female'] },
  height: { type: Number, required: true },
  weight: { type: Number, required: true },
  age: { type: Number },
  activityLevel: { type: String, default: 'none' },
  // Results
  bmr: { type: Number, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fat: { type: Number, required: true },
  fiber: { type: Number }
}, { timestamps: true });

calorieSubmissionSchema.index({ deviceId: 1, createdAt: -1 });
calorieSubmissionSchema.index({ userName: 1, createdAt: -1 });

module.exports = mongoose.model('CalorieSubmission', calorieSubmissionSchema);
