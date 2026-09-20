const mongoose = require('mongoose');
const { APPROVAL_STATUS } = require('../config/constants');

const approvalSchema = new mongoose.Schema(
  {
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
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    level: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: Object.values(APPROVAL_STATUS),
      default: APPROVAL_STATUS.PENDING,
      index: true,
    },
    comments: {
      type: String,
      default: '',
    },
    decidedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying approvals by approver
approvalSchema.index({ approverId: 1, status: 1 });

module.exports = mongoose.model('Approval', approvalSchema);
