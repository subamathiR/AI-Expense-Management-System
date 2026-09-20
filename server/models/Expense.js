const mongoose = require('mongoose');
const { EXPENSE_STATUS, EXPENSE_TYPE } = require('../config/constants');

const splitSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Receipt',
      default: null,
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpenseReport',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    originalAmount: {
      type: Number,
      default: null,
    },
    originalCurrency: {
      type: String,
      default: null,
    },
    exchangeRate: {
      type: Number,
      default: null,
    },
    conversionDate: {
      type: Date,
      default: null,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'Expense date is required'],
    },
    vendor: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(EXPENSE_STATUS),
      default: EXPENSE_STATUS.DRAFT,
      index: true,
    },
    policyCompliant: {
      type: Boolean,
      default: true,
    },
    policyViolations: {
      type: [String],
      default: [],
    },
    duplicateFlag: {
      type: Boolean,
      default: false,
    },
    duplicateExpenseIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense',
      },
    ],
    anomalyFlag: {
      type: Boolean,
      default: false,
    },
    anomalyDetails: {
      type: String,
      default: '',
    },
    aiCategory: {
      type: String,
      default: '',
    },
    aiConfidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    splits: [splitSchema],
    isSplit: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: Object.values(EXPENSE_TYPE),
      default: EXPENSE_TYPE.REGULAR,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for duplicate detection queries
expenseSchema.index({ userId: 1, vendor: 1, amount: 1, date: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
