const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense',
      default: null,
    },
    originalFilename: { type: String, required: true },
    filename: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    fileHash: { type: String, index: true },
    extractedText: { type: String, default: '' },
    extractedFields: {
      vendor: { type: String, default: '' },
      date: { type: Date, default: null },
      totalAmount: { type: Number, default: 0 },
      taxAmount: { type: Number, default: 0 },
      subtotalAmount: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
      paymentMethod: { type: String, default: '' },
      suggestedCategory: { type: String, default: 'Other' },
      confidenceScore: { type: Number, default: 0 },
      lineItems: [
        {
          description: { type: String },
          amount: { type: Number },
        },
      ],
    },
    ocrStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Receipt', receiptSchema);
