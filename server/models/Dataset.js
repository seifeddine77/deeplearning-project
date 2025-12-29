const mongoose = require('mongoose');

const datasetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    default: 0
  },
  fileType: {
    type: String,
    enum: ['csv', 'json', 'image', 'other'],
    default: 'csv'
  },
  datasetType: {
    type: String,
    enum: ['tabular', 'image', 'sequence', 'text', 'audio'],
    default: 'tabular'
  },
  labelFormat: {
    type: String,
    enum: ['one_hot', 'sparse', 'unknown'],
    default: 'unknown'
  },
  inputShape: {
    type: [Number],
    default: []
  },
  totalSamples: {
    type: Number,
    default: 0
  },
  features: {
    type: Number,
    default: 0
  },
  classes: {
    type: Number,
    default: 0
  },
  preprocessed: {
    type: Boolean,
    default: false
  },
  normalizationMethod: {
    type: String,
    enum: ['minmax', 'zscore', 'none'],
    default: 'none'
  },
  augmented: {
    type: Boolean,
    default: false
  },
  augmentationTypes: {
    type: [String],
    default: []
  },
  split: {
    trainRatio: { type: Number, default: 0.7 },
    testRatio: { type: Number, default: 0.2 },
    valRatio: { type: Number, default: 0.1 },
    trainSize: { type: Number, default: 0 },
    testSize: { type: Number, default: 0 },
    valSize: { type: Number, default: 0 }
  },
  statistics: {
    mean: { type: Number, default: 0 },
    std: { type: Number, default: 0 },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'ready', 'error'],
    default: 'uploaded'
  },
  fingerprint: {
    type: Object,
    default: null
  },
  fingerprintHash: {
    type: String,
    default: ''
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

datasetSchema.index({ userId: 1, name: 1 }, { unique: true });
datasetSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Dataset', datasetSchema);
