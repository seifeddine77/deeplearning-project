const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  modelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Model',
    required: true
  },
  inputData: {
    type: Array,
    required: true
  },
  prediction: {
    type: Array,
    required: true
  },
  predictedClass: {
    type: Number,
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  processingTime: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['success', 'error'],
    default: 'success'
  },
  error: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Prediction', predictionSchema);
