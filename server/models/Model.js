const mongoose = require('mongoose');

const modelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  modelId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  inputShape: {
    type: [Number],
    required: true,
    default: [64, 64, 1]
  },
  numClasses: {
    type: Number,
    required: true,
    default: 10
  },
  architecture: {
    type: String,
    default: 'CNN+LSTM'
  },
  modelType: {
    type: String,
    default: ''
  },
  layers: {
    type: Array,
    default: []
  },
  layersCount: {
    type: Number,
    default: 0
  },
  totalParams: {
    type: Number,
    default: 0
  },
  trainableParams: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['created', 'training', 'trained', 'error'],
    default: 'created'
  },
  accuracy: {
    type: Number,
    default: 0
  },
  loss: {
    type: Number,
    default: 0
  },
  valAccuracy: {
    type: Number,
    default: 0
  },
  valLoss: {
    type: Number,
    default: 0
  },
  filePath: {
    type: String,
    default: ''
  },
  savePath: {
    type: String,
    default: ''
  },
  compileConfig: {
    type: Object,
    default: null
  },
  expectedFingerprint: {
    type: Object,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  trainedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

modelSchema.index({ userId: 1, name: 1 }, { unique: true });
modelSchema.index({ userId: 1, modelId: 1 }, { unique: true });

module.exports = mongoose.model('Model', modelSchema);
