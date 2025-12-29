const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  trainingRunId: {
    type: String,
    required: true,
    index: true
  },
  modelId: {
    type: String,
    required: true,
    index: true
  },
  datasetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dataset',
    required: false,
    default: null
  },
  epochs: {
    type: Number,
    required: true,
    default: 10
  },
  batchSize: {
    type: Number,
    required: true,
    default: 32
  },
  learningRate: {
    type: Number,
    required: true,
    default: 0.001
  },
  validationSplit: {
    type: Number,
    default: 0.2
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  history: {
    loss: { type: [Number], default: [] },
    accuracy: { type: [Number], default: [] },
    valLoss: { type: [Number], default: [] },
    valAccuracy: { type: [Number], default: [] }
  },
  finalMetrics: {
    loss: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    valLoss: { type: Number, default: 0 },
    valAccuracy: { type: Number, default: 0 }
  },
  evaluationMetrics: {
    accuracy: { type: Number, default: 0 },
    precision: { type: Number, default: 0 },
    recall: { type: Number, default: 0 },
    f1Score: { type: Number, default: 0 },
    confusionMatrix: { type: Array, default: [] }
  },
  predictions: {
    type: Array,
    default: []
  },
  duration: {
    type: Number,
    default: 0
  },
  error: {
    type: String,
    default: ''
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

trainingSchema.index({ userId: 1, createdAt: -1 });
trainingSchema.index({ userId: 1, modelId: 1, createdAt: -1 });
trainingSchema.index({ userId: 1, trainingRunId: 1 }, { unique: true });
trainingSchema.index({ userId: 1, modelId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Training', trainingSchema);
