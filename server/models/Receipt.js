const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    qualityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    qualityPassed: {
      type: Boolean,
      default: false,
    },
    qualityIssues: {
      type: [String],
      default: [],
    },
    ocrProvider: {
      type: String,
      enum: ['tesseract', 'google_vision'],
      default: 'tesseract',
    },
    ocrRawText: {
      type: String,
      default: '',
    },
    extractedData: {
      vendor: { type: String, default: '' },
      amount: { type: Number, default: null },
      date: { type: String, default: '' },
      currency: { type: String, default: '' },
      tax: { type: Number, default: null },
      invoiceNumber: { type: String, default: '' },
      lineItems: [
        {
          description: String,
          amount: Number,
          quantity: Number,
        },
      ],
    },
    ocrConfidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Receipt', receiptSchema);
