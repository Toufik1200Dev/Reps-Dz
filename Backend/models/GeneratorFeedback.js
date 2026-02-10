const mongoose = require('mongoose');

const generatorFeedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [80, 'Name cannot exceed 80 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [800, 'Message cannot exceed 800 characters']
  },
  planUsed: {
    type: String,
    enum: ['1-week', '6-week', '12-week', ''],
    default: ''
  },
  approved: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

generatorFeedbackSchema.index({ approved: 1, createdAt: -1 });

module.exports = mongoose.model('GeneratorFeedback', generatorFeedbackSchema);
