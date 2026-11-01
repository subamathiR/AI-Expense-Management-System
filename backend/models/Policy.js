const mongoose = require('mongoose');

const policySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    department: {
      type: String,
      default: 'All', // 'All' applies to all departments
    },
    maxAmountPerExpense: {
      type: Number,
      required: true,
      default: 500,
    },
    dailyLimit: {
      type: Number,
      default: 1000,
    },
    monthlyLimit: {
      type: Number,
      default: 5000,
    },
    requiresReceiptAbove: {
      type: Number,
      default: 25,
    },
    managerApprovalThreshold: {
      type: Number,
      default: 250,
    },
    isReceiptMandatory: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Policy', policySchema);
