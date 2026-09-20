const mongoose = require('mongoose');
const { REIMBURSEMENT_STATUS } = require('../config/constants');

const reimbursementSchema = new mongoose.Schema(
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
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpenseReport',
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: Object.values(REIMBURSEMENT_STATUS),
      default: REIMBURSEMENT_STATUS.PENDING,
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

module.exports = mongoose.model('Reimbursement', reimbursementSchema);
