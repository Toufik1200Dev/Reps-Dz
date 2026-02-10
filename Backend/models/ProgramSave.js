const mongoose = require('mongoose');

const programSaveSchema = new mongoose.Schema({
  userName: { type: String, default: 'None', trim: true, maxlength: 100 },
  deviceId: { type: String, trim: true },
  level: { type: String, required: true, enum: ['beginner', 'intermediate', 'advanced'] },
  heightCm: { type: Number, min: 100, max: 250 },
  weightKg: { type: Number, min: 30, max: 300 },
  maxReps: {
    muscleUp: Number,
    pullUps: Number,
    dips: Number,
    pushUps: Number,
    squats: Number,
    legRaises: Number,
    burpees: Number
  },
  program: { type: mongoose.Schema.Types.Mixed, required: true },
  nutrition: {
    bmr: Number,
    tdee: Number,
    proteinG: Number,
    note: String,
    sampleMeals: [{ time: String, name: String, foods: [{ name: String, qty: String }], kcal: Number, protein: Number }]
  }
}, { timestamps: true });

programSaveSchema.index({ deviceId: 1, createdAt: -1 });
programSaveSchema.index({ userName: 1, createdAt: -1 });

module.exports = mongoose.model('ProgramSave', programSaveSchema);
