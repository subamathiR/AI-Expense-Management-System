const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema(
  {
    field: { type: String, required: true },
    operator: { type: String, enum: ['gt', 'gte', 'lt', 'lte', 'eq', 'ne', 'in', 'nin', 'contains'], required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    message: { type: String, required: true },
  },
  { _id: false }
);

const policySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Policy name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    rules: [ruleSchema],
    maxAmount: {
      type: Number,
      default: null,
    },
    maxAmountPeriod: {
      type: String,
      enum: ['per_expense', 'per_day', 'per_month', 'per_year'],
      default: 'per_expense',
    },
    allowedClasses: {
      type: [String],
      default: [],
    },
    requiresReceipt: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Policy', policySchema);
