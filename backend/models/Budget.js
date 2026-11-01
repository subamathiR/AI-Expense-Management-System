const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    period: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual'],
      default: 'monthly',
    },
    fiscalYear: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    month: {
      type: Number,
      min: 1,
      max: 12,
      default: () => new Date().getMonth() + 1,
    },
    budgetAmount: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [0, 'Budget must be non-negative'],
    },
    alertThreshold: {
      type: Number,
      default: 80, // % threshold (e.g. alert when 80% used)
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness per department/category/year/month
budgetSchema.index({ department: 1, category: 1, fiscalYear: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
