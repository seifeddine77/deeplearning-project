const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reportType: {
    type: String,
    enum: ['analysis_pdf', 'analysis_email'],
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'Analysis Report'
  },
  dataset: {
    type: String,
    enum: ['test', 'val'],
    default: 'test'
  },
  modelIds: {
    type: [String],
    default: []
  },
  trainingRunId: {
    type: String,
    default: null
  },
  datasetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dataset',
    default: null
  },
  recipients: {
    type: [String],
    default: []
  },
  emailSubject: {
    type: String,
    default: ''
  },
  messageId: {
    type: String,
    default: null
  }
}, { timestamps: true });

reportSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
