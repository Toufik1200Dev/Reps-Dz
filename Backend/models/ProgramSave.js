const mongoose = require('mongoose');

const programSaveSchema = new mongoose.Schema({
  userName: { type: String, default: 'None', trim: true, maxlength: 100 },
  deviceId: { type: String, trim: true },
  level: { type: String, required: true, enum: ['beginner', 'intermediate', 'advanced'] },
  maxReps: {
    muscleUp: Number,
    pullUps: Number,
    dips: Number,
    pushUps: Number,
    squats: Number,
    legRaises: Number
  },
  program: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

programSaveSchema.index({ deviceId: 1, createdAt: -1 });
programSaveSchema.index({ userName: 1, createdAt: -1 });

module.exports = mongoose.model('ProgramSave', programSaveSchema);
